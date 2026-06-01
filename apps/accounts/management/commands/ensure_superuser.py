"""Env-o'zgaruvchilardan admin (superuser) yaratadi yoki parolini yangilaydi.

Render free tier'da Shell yo'q — shuning uchun admin'ni deploy paytida
env orqali yaratamiz. Idempotent: mavjud bo'lsa parolini yangilaydi.

Kerakli env:
    DJANGO_SUPERUSER_PHONE      — telefon (login), masalan +998901234567
    DJANGO_SUPERUSER_PASSWORD   — parol

Ixtiyoriy:
    DJANGO_SUPERUSER_NAME       — to'liq ism

build.sh'da chaqiriladi. Env yo'q bo'lsa — jim o'tib ketadi (xato bermaydi).
"""
from __future__ import annotations

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Env'dan superuser yaratadi yoki parolini yangilaydi (idempotent)."

    def handle(self, *args, **opts):
        phone = (os.environ.get("DJANGO_SUPERUSER_PHONE") or "").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD") or ""
        full_name = (os.environ.get("DJANGO_SUPERUSER_NAME") or "").strip()

        if not phone or not password:
            self.stdout.write(
                "DJANGO_SUPERUSER_PHONE/PASSWORD yo'q — ensure_superuser o'tkazib yuborildi."
            )
            return

        user, created = User.objects.get_or_create(phone=phone)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        if hasattr(user, "is_verified"):
            user.is_verified = True
        if full_name and not user.full_name:
            user.full_name = full_name
        user.set_password(password)
        user.save()

        action = "yaratildi" if created else "parol yangilandi"
        self.stdout.write(
            self.style.SUCCESS(f"[OK] Superuser {action}: {phone}")
        )
