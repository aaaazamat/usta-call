from __future__ import annotations

import secrets
from datetime import timedelta

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class Role(models.TextChoices):
    CLIENT = "client", "Mijoz"
    MASTER = "master", "Usta"
    ADMIN = "admin", "Admin"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(
        self,
        phone: str | None,
        password: str | None,
        email: str | None = None,
        **extra,
    ):
        if not phone and not email:
            raise ValueError("Telefon yoki email majburiy")
        user = self.model(phone=phone, email=email, **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, phone: str | None = None, password: str | None = None, **extra):
        extra.setdefault("role", Role.CLIENT)
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._create_user(phone, password, **extra)

    def create_superuser(self, phone: str, password: str, **extra):
        extra.setdefault("role", Role.ADMIN)
        extra["is_staff"] = True
        extra["is_superuser"] = True
        extra["is_verified"] = True
        return self._create_user(phone, password, **extra)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Tizim foydalanuvchisi — mijoz, usta yoki admin.

    Autentifikatsiya 3 xil yo'l bilan mumkin:
      - Telefon + OTP (asosiy)
      - Telegram bot orqali OTP yetkazib berish
      - Google OAuth (email asosida)
    """

    # Telefon endi nullable — Google orqali kirgan foydalanuvchida bo'sh bo'lishi mumkin.
    # Lekin xizmat ko'rsatish uchun majburiy (modal orqali so'raymiz).
    phone = models.CharField(
        "Telefon", max_length=20, unique=True, null=True, blank=True, db_index=True
    )
    full_name = models.CharField("F.I.Sh.", max_length=120, blank=True)
    role = models.CharField("Rol", max_length=10, choices=Role.choices, default=Role.CLIENT)
    avatar = models.ImageField("Avatar", upload_to="avatars/", blank=True, null=True)

    # ── Google OAuth ──
    email = models.EmailField(
        "Email", blank=True, null=True, unique=True, db_index=True
    )
    google_id = models.CharField(
        "Google ID", max_length=80, blank=True, null=True, unique=True, db_index=True
    )

    # ── Telegram bot ──
    telegram_chat_id = models.BigIntegerField(
        "Telegram chat ID", blank=True, null=True, unique=True, db_index=True
    )
    telegram_username = models.CharField(
        "Telegram username", max_length=64, blank=True
    )

    is_verified = models.BooleanField("Telefon tasdiqlangan", default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(blank=True, null=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS: list[str] = []

    objects = UserManager()

    class Meta:
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"
        indexes = [models.Index(fields=["role"])]

    def __str__(self) -> str:
        identifier = self.phone or self.email or f"id={self.pk}"
        return f"{identifier} ({self.get_role_display()})"

    @property
    def is_master(self) -> bool:
        return self.role == Role.MASTER

    @property
    def is_client(self) -> bool:
        return self.role == Role.CLIENT

    @property
    def needs_phone(self) -> bool:
        """Google orqali kirgan, lekin telefon hali kiritmagan foydalanuvchi."""
        return not self.phone


def _otp_code() -> str:
    return f"{secrets.randbelow(10**6):06d}"


def _otp_expiry() -> "timezone.datetime":
    return timezone.now() + timedelta(minutes=5)


class OtpCode(TimeStampedModel):
    """SMS yoki Telegram orqali yuborilgan bir martalik kod.

    Eski kodlar yangisi yuborilganda bekor qilinadi.
    """

    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6, default=_otp_code)
    purpose = models.CharField(max_length=20, default="login")  # login, register, reset
    expires_at = models.DateTimeField(default=_otp_expiry)
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        indexes = [models.Index(fields=["phone", "consumed_at"])]
        ordering = ("-created_at",)

    def is_valid(self) -> bool:
        return self.consumed_at is None and self.expires_at > timezone.now() and self.attempts < 5

    def mark_consumed(self) -> None:
        self.consumed_at = timezone.now()
        self.save(update_fields=["consumed_at", "updated_at"])


class TelegramLinkToken(TimeStampedModel):
    """Telegram bot bilan ulanish uchun vaqtinchalik token.

    Saytda foydalanuvchi "Telegram bilan kirish" bossa, backend bu tokenni yaratadi.
    Token deep link orqali botga uzatiladi: t.me/<bot>?start=<token>.
    Foydalanuvchi botda kontaktni ulashganda, token User'ga bog'lanadi va
    frontend polling orqali login holatini biladi.
    """

    token = models.CharField(max_length=48, unique=True, db_index=True, default=secrets.token_urlsafe)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="telegram_links",
        null=True,
        blank=True,
    )
    consumed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(default=_otp_expiry)

    class Meta:
        indexes = [models.Index(fields=["token", "consumed_at"])]

    def is_valid(self) -> bool:
        return self.consumed_at is None and self.expires_at > timezone.now()
