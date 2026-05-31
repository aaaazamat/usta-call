from __future__ import annotations

import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OtpCode, Role, TelegramLinkToken, User
from .serializers import (
    MeUpdateSerializer,
    RequestOtpSerializer,
    UserSerializer,
    VerifyOtpSerializer,
    normalize_phone,
)
from .services.sms import TelegramNotLinkedError, send_otp_sms

logger = logging.getLogger(__name__)


def _tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RequestOtpView(APIView):
    """Telefon raqami uchun OTP yuborish — ro'yxat ham, login ham shu endpoint orqali."""

    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        ser = RequestOtpSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        phone = ser.validated_data["phone"]
        role = ser.validated_data["role"]

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                phone=phone,
                defaults={"role": role},
            )

            # Beta rejim: OTP qadamini o'tkazib yuborib darhol tokenlarni qaytaradi.
            if getattr(settings, "BETA_AUTO_LOGIN", False):
                if not user.is_verified:
                    user.is_verified = True
                    user.save(update_fields=["is_verified", "updated_at"])
                return Response(
                    {
                        "detail": "Beta rejim — to'g'ridan-to'g'ri kirish",
                        "is_new_user": created,
                        "auto_login": True,
                        "user": UserSerializer(user).data,
                        "tokens": _tokens_for(user),
                    },
                    status=status.HTTP_200_OK,
                )

            OtpCode.objects.filter(phone=phone, consumed_at__isnull=True).update(
                consumed_at=timezone.now()
            )
            otp = OtpCode.objects.create(phone=phone, purpose="login")

        try:
            send_otp_sms(phone, otp.code)
        except TelegramNotLinkedError:
            # Foydalanuvchi botni hali ulamagan — deep link qaytaramiz.
            # OTP DB'da saqlanib turadi: foydalanuvchi botda kontaktini ulashganda,
            # bot aynan shu pending kodni o'sha yerga yuboradi (telegram_bot.handle_update).
            bot = (getattr(settings, "TELEGRAM_BOT_USERNAME", "") or "").lstrip("@")
            deep_link = f"https://t.me/{bot}?start=otp" if bot else ""
            return Response(
                {
                    "detail": "Telegram bot orqali kod yuboriladi",
                    "needs_telegram_link": True,
                    "telegram_bot_username": bot,
                    "deep_link": deep_link,
                    "is_new_user": created,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"detail": "Kod yuborildi", "is_new_user": created},
            status=status.HTTP_200_OK,
        )


class VerifyOtpView(APIView):
    """OTP ni tekshirib, JWT tokenlarni qaytaradi."""

    permission_classes = [AllowAny]
    throttle_scope = "otp"

    def post(self, request):
        ser = VerifyOtpSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        phone = ser.validated_data["phone"]
        code = ser.validated_data["code"]

        otp = (
            OtpCode.objects.filter(phone=phone, consumed_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        if not otp or not otp.is_valid():
            return Response({"detail": "Kod yaroqsiz yoki muddati o'tgan"}, status=400)

        if otp.code != code:
            otp.attempts += 1
            otp.save(update_fields=["attempts", "updated_at"])
            return Response({"detail": "Kod noto'g'ri"}, status=400)

        otp.mark_consumed()
        user = User.objects.get(phone=phone)
        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=["is_verified", "updated_at"])

        return Response({"user": UserSerializer(user).data, "tokens": _tokens_for(user)})


class MeView(APIView):
    """Joriy foydalanuvchi — profil ko'rish va yangilash."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        ser = MeUpdateSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(UserSerializer(request.user).data)


class AddPhoneView(APIView):
    """Google orqali kirgan foydalanuvchi keyinroq telefon raqamini qo'shadi."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone_raw = (request.data.get("phone") or "").strip()
        if not phone_raw:
            return Response({"detail": "Telefon kiritilmagan"}, status=400)
        try:
            phone = normalize_phone(phone_raw)
        except Exception:
            return Response({"detail": "Telefon noto'g'ri formatda"}, status=400)

        # Telefon boshqa foydalanuvchida band emasligini tekshirish
        if User.objects.filter(phone=phone).exclude(pk=request.user.pk).exists():
            return Response(
                {"detail": "Bu raqam boshqa foydalanuvchida ro'yxatdan o'tgan"},
                status=400,
            )

        request.user.phone = phone
        request.user.is_verified = False  # OTP tasdiqlanguncha
        request.user.save(update_fields=["phone", "is_verified", "updated_at"])
        return Response(UserSerializer(request.user).data)


class SwitchRoleView(APIView):
    """Mijozdan ustaga (yoki aksincha) o'tish."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_role = request.data.get("role")
        if new_role not in {Role.CLIENT, Role.MASTER}:
            return Response({"detail": "role noto'g'ri"}, status=400)
        request.user.role = new_role
        request.user.save(update_fields=["role", "updated_at"])
        return Response(UserSerializer(request.user).data)


# ────────────────────── Telegram bot ──────────────────────


class TelegramLinkStartView(APIView):
    """Foydalanuvchi 'Telegram bilan kirish' bossa — bot deep link qaytaradi.

    Foydalanuvchi botda /start <token> qiladi va kontaktini ulashadi.
    Frontend polling orqali tasdiqlanishni kutadi.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        if not getattr(settings, "TELEGRAM_BOT_USERNAME", ""):
            return Response({"detail": "Telegram bot sozlanmagan"}, status=503)
        link = TelegramLinkToken.objects.create()
        bot_username = settings.TELEGRAM_BOT_USERNAME.lstrip("@")
        return Response(
            {
                "token": link.token,
                "deep_link": f"https://t.me/{bot_username}?start={link.token}",
            }
        )


class TelegramLinkPollView(APIView):
    """Frontend polling: link tasdiqlandimi va foydalanuvchi kirdimi?"""

    permission_classes = [AllowAny]

    def post(self, request):
        token = (request.data.get("token") or "").strip()
        if not token:
            return Response({"detail": "Token kerak"}, status=400)
        link = TelegramLinkToken.objects.filter(token=token).first()
        if not link:
            return Response({"detail": "Token topilmadi"}, status=404)
        if not link.user:
            return Response({"status": "pending"})
        return Response(
            {
                "status": "linked",
                "user": UserSerializer(link.user).data,
                "tokens": _tokens_for(link.user),
            }
        )


class TelegramWebhookView(APIView):
    """Telegram bot Update webhook — sayt domeniga POST keladi."""

    permission_classes = [AllowAny]
    authentication_classes: list = []  # Telegram CSRF/JWT bilan kelmaydi

    def post(self, request):
        # Secret token validatsiyasi (Telegram setWebhook secret_token bilan)
        expected_secret = getattr(settings, "TELEGRAM_WEBHOOK_SECRET", "")
        if expected_secret:
            received = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
            if received != expected_secret:
                return Response({"detail": "forbidden"}, status=403)

        try:
            from .services.telegram_bot import handle_update

            handle_update(request.data)
        except Exception as exc:
            logger.exception("Telegram webhook xatosi: %s", exc)
        return Response({"ok": True})


# ────────────────────── Google OAuth ──────────────────────


def _google_info_from_id_token(id_token_str: str, client_id: str) -> dict:
    """ID token'ni Google bilan tekshirib, {sub, email, name} qaytaradi."""
    from google.auth.transport import requests as g_requests
    from google.oauth2 import id_token as g_id_token

    info = g_id_token.verify_oauth2_token(
        id_token_str, g_requests.Request(), client_id
    )
    return {
        "sub": info.get("sub"),
        "email": info.get("email") or "",
        "name": info.get("name") or "",
    }


def _google_info_from_access_token(access_token: str, client_id: str) -> dict:
    """Access token'ni Google tokeninfo orqali tekshiradi (aud == bizning client_id).

    `useGoogleLogin` (implicit oqim) custom tugmada ID token emas, access token
    qaytaradi. Token bizning ilova uchun berilganini tasdiqlash uchun `aud`/`azp`
    ni client_id bilan solishtiramiz (token-substitution hujumini oldini olish).
    """
    import httpx

    resp = httpx.get(
        "https://oauth2.googleapis.com/tokeninfo",
        params={"access_token": access_token},
        timeout=10,
    )
    if resp.status_code != 200:
        raise ValueError(f"tokeninfo xatosi: {resp.status_code}")
    data = resp.json()

    audiences = {data.get("aud"), data.get("azp")}
    if client_id not in audiences:
        raise ValueError("access token boshqa ilova uchun berilgan (aud mos emas)")

    name = ""
    try:
        u = httpx.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if u.status_code == 200:
            name = u.json().get("name") or ""
    except Exception:  # noqa: BLE001 — name ixtiyoriy
        pass

    return {
        "sub": data.get("sub"),
        "email": data.get("email") or "",
        "name": name,
    }


class GoogleLoginView(APIView):
    """Frontend Google'dan olgan token'ni tekshirib, JWT qaytaradi.

    Ikki xil token qo'llab-quvvatlanadi:
      - `id_token`     — Google'ning rasmiy tugmasidan (GoogleLogin komponenti)
      - `access_token` — custom tugmadan (useGoogleLogin implicit oqimi)

    Foydalanuvchi google_id bo'yicha qidiriladi, yo'q bo'lsa yaratiladi.
    Birinchi marta kirgan foydalanuvchida `needs_phone: true` qaytariladi —
    frontend telefon kiritish modalini ochadi.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        id_token_str = (request.data.get("id_token") or "").strip()
        access_token_str = (request.data.get("access_token") or "").strip()
        if not id_token_str and not access_token_str:
            return Response({"detail": "id_token yoki access_token kerak"}, status=400)

        # Birinchi marta ro'yxatdan o'tganida tanlangan rol (default: mijoz)
        requested_role = request.data.get("role") or Role.CLIENT
        if requested_role not in (Role.CLIENT, Role.MASTER):
            requested_role = Role.CLIENT

        client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")
        if not client_id:
            return Response({"detail": "Google OAuth sozlanmagan"}, status=503)

        try:
            if id_token_str:
                info = _google_info_from_id_token(id_token_str, client_id)
            else:
                info = _google_info_from_access_token(access_token_str, client_id)
        except Exception as exc:
            logger.warning("Google token tekshiruv xatosi: %s", exc)
            return Response({"detail": "Google token noto'g'ri"}, status=400)

        google_id = info.get("sub")
        email = (info.get("email") or "").lower()
        if not google_id or not email:
            return Response({"detail": "Google ma'lumotlari to'liq emas"}, status=400)

        full_name = info.get("name") or ""

        with transaction.atomic():
            # Google_id bo'yicha qidirish
            user = User.objects.filter(google_id=google_id).first()
            if not user:
                # Email bo'yicha qidirish (ehtimol foydalanuvchi avval boshqa yo'l bilan kirgan)
                user = User.objects.filter(email=email).first()

            created = False
            if not user:
                user = User.objects.create(
                    email=email,
                    google_id=google_id,
                    full_name=full_name,
                    role=requested_role,
                    is_verified=False,  # phone yo'qligida verified emas
                )
                user.set_unusable_password()
                user.save()
                created = True
            else:
                # Mavjud foydalanuvchini Google bilan bog'lash
                changed = False
                if not user.google_id:
                    user.google_id = google_id
                    changed = True
                if not user.email:
                    user.email = email
                    changed = True
                if not user.full_name and full_name:
                    user.full_name = full_name
                    changed = True
                if changed:
                    user.save()

        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": _tokens_for(user),
                "needs_phone": user.needs_phone,
                "is_new_user": created,
            }
        )
