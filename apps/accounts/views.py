from __future__ import annotations

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OtpCode, Role, User
from .serializers import (
    MeUpdateSerializer,
    RequestOtpSerializer,
    UserSerializer,
    VerifyOtpSerializer,
)
from .services.sms import send_otp_sms


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

        send_otp_sms(phone, otp.code)
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


class SwitchRoleView(APIView):
    """Mijozdan ustaga (yoki aksincha) o'tish.

    Eslatma: usta ekanligini tasdiqlash uchun admin moderatsiya talab qilinishi mumkin —
    hozircha self-service, lekin keyin `MasterProfile.is_approved` orqali nazorat qilinadi.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_role = request.data.get("role")
        if new_role not in {Role.CLIENT, Role.MASTER}:
            return Response({"detail": "role noto'g'ri"}, status=400)
        request.user.role = new_role
        request.user.save(update_fields=["role", "updated_at"])
        return Response(UserSerializer(request.user).data)
