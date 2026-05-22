"""SMS / OTP yetkazib berish — provider abstraksiyasi.

Dev: konsolga chiqaradi.
Prod: Telegram bot (bepul, asosiy) yoki Eskiz.uz (pulli).
"""
from __future__ import annotations

import logging
from typing import Protocol

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


class TelegramNotLinkedError(Exception):
    """Foydalanuvchi Telegram botni hali ulamagan."""


class SmsProvider(Protocol):
    def send(self, phone: str, message: str) -> None: ...


class ConsoleSmsProvider:
    """Dev rejimi — kodni terminalda ko'rsatadi."""

    def send(self, phone: str, message: str) -> None:
        logger.warning("[SMS:console] -> %s: %s", phone, message)
        print(f"\n[SMS] {phone}: {message}\n")


class TelegramSmsProvider:
    """Telegram bot orqali OTP kodini yuboradi.

    Foydalanuvchi avval botni /start qilib, kontaktini ulashishi kerak —
    `User.telegram_chat_id` orqali topiladi.
    """

    def __init__(self, bot_token: str) -> None:
        if not bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN sozlanmagan")
        self.bot_token = bot_token
        self.api_url = f"https://api.telegram.org/bot{bot_token}"

    def send(self, phone: str, message: str) -> None:
        from apps.accounts.models import User

        user = User.objects.filter(phone=phone).first()
        if not user or not user.telegram_chat_id:
            raise TelegramNotLinkedError(
                "Telegram bot bilan ulanmagansiz. "
                f"@{getattr(__import__('django.conf').conf.settings, 'TELEGRAM_BOT_USERNAME', 'bot')} "
                "ga /start bosing."
            )

        try:
            resp = httpx.post(
                f"{self.api_url}/sendMessage",
                json={
                    "chat_id": user.telegram_chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                },
                timeout=10,
            )
            if resp.status_code >= 400:
                logger.error(
                    "Telegram SMS xatosi: %s %s", resp.status_code, resp.text
                )
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            logger.exception("Telegram sendMessage xatosi: %s", exc)
            raise


class EskizSmsProvider:
    """Eskiz.uz — O'zbekistondagi mashhur SMS provider."""

    BASE_URL = "https://notify.eskiz.uz/api"

    def __init__(self, email: str, password: str, sender: str = "4546") -> None:
        self.email = email
        self.password = password
        self.sender = sender
        self._token: str | None = None

    def _authenticate(self) -> str:
        if self._token:
            return self._token
        resp = httpx.post(
            f"{self.BASE_URL}/auth/login",
            data={"email": self.email, "password": self.password},
            timeout=10,
        )
        resp.raise_for_status()
        self._token = resp.json()["data"]["token"]
        return self._token

    def send(self, phone: str, message: str) -> None:
        token = self._authenticate()
        normalized = phone.lstrip("+")
        resp = httpx.post(
            f"{self.BASE_URL}/message/sms/send",
            headers={"Authorization": f"Bearer {token}"},
            data={"mobile_phone": normalized, "message": message, "from": self.sender},
            timeout=10,
        )
        if resp.status_code >= 400:
            logger.error("Eskiz SMS xatosi: %s %s", resp.status_code, resp.text)
            resp.raise_for_status()


def get_sms_provider() -> SmsProvider:
    provider = settings.SMS_PROVIDER
    if provider == "telegram" and getattr(settings, "TELEGRAM_BOT_TOKEN", ""):
        return TelegramSmsProvider(bot_token=settings.TELEGRAM_BOT_TOKEN)
    if provider == "eskiz" and getattr(settings, "ESKIZ_EMAIL", ""):
        return EskizSmsProvider(
            email=settings.ESKIZ_EMAIL,
            password=settings.ESKIZ_PASSWORD,
            sender=settings.ESKIZ_FROM,
        )
    return ConsoleSmsProvider()


def send_otp_sms(phone: str, code: str) -> None:
    message = (
        f"<b>usta-call</b> tasdiq kodi: <b>{code}</b>\n\n"
        "Hech kimga aytmang. Kod 5 daqiqa amal qiladi."
    )
    get_sms_provider().send(phone, message)
