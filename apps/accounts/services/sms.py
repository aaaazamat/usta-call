"""SMS yuborish — provider abstraksiyasi.

Dev: konsolga chiqaradi.
Prod: Eskiz.uz API (yoki boshqa provider) orqali yuboradi.
"""
from __future__ import annotations

import logging
from typing import Protocol

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


class SmsProvider(Protocol):
    def send(self, phone: str, message: str) -> None: ...


class ConsoleSmsProvider:
    """Dev rejimi — kodni terminalda ko'rsatadi."""

    def send(self, phone: str, message: str) -> None:
        logger.warning("[SMS:console] -> %s: %s", phone, message)
        print(f"\n[SMS] {phone}: {message}\n")


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
    if provider == "eskiz":
        return EskizSmsProvider(
            email=settings.ESKIZ_EMAIL,
            password=settings.ESKIZ_PASSWORD,
            sender=settings.ESKIZ_FROM,
        )
    return ConsoleSmsProvider()


def send_otp_sms(phone: str, code: str) -> None:
    message = f"Usta-Call tasdiq kodi: {code}. Hech kimga aytmang."
    get_sms_provider().send(phone, message)
