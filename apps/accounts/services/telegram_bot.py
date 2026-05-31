"""Telegram bot webhook va deep-link logikasi.

Foydalanuvchi flow:
  1. Sayt yangi `TelegramLinkToken` yaratadi va deep link beradi:
       https://t.me/<bot>?start=<token>
  2. Foydalanuvchi botda /start <token> bosadi → bot kontakt so'raydi
  3. Foydalanuvchi kontaktni ulashadi → bot phone va chat_id ni oladi
  4. Bot User'ni topadi (yoki yaratadi), telegram_chat_id'ni saqlaydi,
     TelegramLinkToken ni shu User'ga bog'laydi.
  5. Sayt polling orqali link tasdiqlandimi tekshiradi va JWT oladi.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx
from django.conf import settings
from django.utils import timezone
from phonenumbers import NumberParseException, format_number, is_valid_number, parse
from phonenumbers import PhoneNumberFormat

from apps.accounts.models import Role, TelegramLinkToken, User

logger = logging.getLogger(__name__)


def _normalize(phone: str) -> str | None:
    """Telegram'dan kelgan phone'ni E.164 ga keltirish (`+998901234567`)."""
    try:
        # Telegram'dan kelgan phone "998901234567" yoki "+998901234567"
        clean = phone if phone.startswith("+") else f"+{phone}"
        parsed = parse(clean, None)
        if not is_valid_number(parsed):
            return None
        return format_number(parsed, PhoneNumberFormat.E164)
    except NumberParseException:
        return None


def _api(method: str, body: dict[str, Any]) -> dict[str, Any]:
    """Telegram Bot API ga so'rov yuborish."""
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN sozlanmagan")
    resp = httpx.post(
        f"https://api.telegram.org/bot{token}/{method}",
        json=body,
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def send_message(chat_id: int, text: str, **extra: Any) -> None:
    _api("sendMessage", {"chat_id": chat_id, "text": text, "parse_mode": "HTML", **extra})


def request_contact(chat_id: int) -> None:
    """Foydalanuvchidan telefon kontaktini ulashishni so'raydi."""
    send_message(
        chat_id,
        "Salom! 👋\n\n"
        "<b>usta-call</b>'ga xush kelibsiz. Sizni telefoningiz bo'yicha "
        "tanish va keyinchalik OTP kodlari yuborish uchun "
        "<b>kontaktingizni ulashing</b>.",
        reply_markup={
            "keyboard": [
                [
                    {
                        "text": "📱 Telefonimni ulashish",
                        "request_contact": True,
                    }
                ]
            ],
            "resize_keyboard": True,
            "one_time_keyboard": True,
        },
    )


def handle_update(update: dict[str, Any]) -> None:
    """Telegram dan kelgan webhook update'ni qayta ishlash."""
    message = update.get("message") or {}
    chat = message.get("chat") or {}
    from_user = message.get("from") or {}
    chat_id = chat.get("id")
    if not chat_id:
        return

    text = (message.get("text") or "").strip()

    # /start [token]
    if text.startswith("/start"):
        parts = text.split(maxsplit=1)
        link_token = parts[1].strip() if len(parts) > 1 else ""

        # Linkni context'da saqlash uchun chat_id ga bog'laymiz (vaqtinchalik xotirada).
        # Eng oddiy yo'l — tokenni darhol qabul qilib, kontakt so'raymiz.
        if link_token:
            # Token mavjudligini tekshiramiz
            tlt = TelegramLinkToken.objects.filter(token=link_token).first()
            if tlt and tlt.is_valid():
                # Token'ni chat_id bilan "bog'lash" — keyin kontakt kelganda User'ga
                # ulanadi. Bu yerda biz tokenni saqlaymiz xotirada,
                # lekin oddiyroq yo'l — kontakt kelganda eng yangi pending token'ni topish.
                pass

        request_contact(chat_id)
        return

    # Kontakt ulashildi
    contact = message.get("contact") or {}
    if contact:
        raw_phone = contact.get("phone_number", "")
        normalized = _normalize(raw_phone)
        if not normalized:
            send_message(chat_id, "⚠️ Telefon raqami noto'g'ri formatda.")
            return

        # User'ni topish/yaratish
        user, created = User.objects.get_or_create(
            phone=normalized,
            defaults={"role": Role.CLIENT, "is_verified": True},
        )
        user.telegram_chat_id = chat_id
        user.telegram_username = from_user.get("username", "") or ""
        if not user.full_name:
            full_name = " ".join(
                filter(
                    None,
                    [from_user.get("first_name"), from_user.get("last_name")],
                )
            ).strip()
            if full_name:
                user.full_name = full_name
        if not user.is_verified:
            user.is_verified = True
        user.save()

        # Saytda kutilayotgan OTP kodi bo'lsa — endi chat_id ma'lum, kodni shu yerga yuboramiz.
        # Bu "saytda raqam → botga kod → saytda kod" oqimining yangi user uchun ishlashini ta'minlaydi.
        from apps.accounts.models import OtpCode

        pending_otp = (
            OtpCode.objects.filter(phone=normalized, consumed_at__isnull=True)
            .order_by("-created_at")
            .first()
        )
        sent_code = False
        if pending_otp and pending_otp.is_valid():
            send_message(
                chat_id,
                "🔐 <b>usta-call</b> saytiga kirish kodi:\n\n"
                f"<code>{pending_otp.code}</code>\n\n"
                "Kodni saytdagi maydonga kiriting. 5 daqiqa amal qiladi.",
                reply_markup={"remove_keyboard": True},
            )
            sent_code = True

        # Eski polling oqimi uchun: pending link token bo'lsa shu user'ga bog'laymiz
        tlt = (
            TelegramLinkToken.objects.filter(consumed_at__isnull=True, user__isnull=True)
            .order_by("-created_at")
            .first()
        )
        if tlt and tlt.is_valid():
            tlt.user = user
            tlt.consumed_at = timezone.now()
            tlt.save(update_fields=["user", "consumed_at", "updated_at"])

        if not sent_code:
            send_message(
                chat_id,
                "✅ Telefon raqamingiz ulandi.\n\n"
                "Endi saytda raqamingizni kiriting — kirish kodi shu yerga keladi.",
                reply_markup={"remove_keyboard": True},
            )
        return

    # Boshqa xabar
    send_message(
        chat_id,
        "Buyruqlar:\n"
        "/start — ro'yxatdan o'tish/kirish\n\n"
        "Saytga qaytib ro'yxatdan o'ting: https://usta-call.vercel.app",
    )


def set_webhook(webhook_url: str) -> dict[str, Any]:
    """Telegram'ga webhook URL'ni o'rnatish. Bir marta deploy'dan keyin chaqiriladi."""
    return _api(
        "setWebhook",
        {
            "url": webhook_url,
            "allowed_updates": ["message"],
            "drop_pending_updates": True,
        },
    )
