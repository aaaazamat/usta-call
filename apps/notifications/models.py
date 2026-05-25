from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimeStampedModel


class NotificationType(models.TextChoices):
    NEW_ORDER_MATCH = "new_order_match", _("Yangi mos buyurtma")
    NEW_RESPONSE = "new_response", _("Yangi taklif")
    RESPONSE_ACCEPTED = "response_accepted", _("Sizning taklifingiz qabul qilindi")
    ORDER_COMPLETED = "order_completed", _("Buyurtma yakunlandi")
    NEW_REVIEW = "new_review", _("Yangi sharh")
    NEW_MESSAGE = "new_message", _("Yangi xabar")
    PROFILE_APPROVED = "profile_approved", _("Profil tasdiqlandi")
    SYSTEM = "system", _("Tizim")


class Notification(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)

    # Polimorfizmsiz — qaysi obyektga taalluqli ekanini JSON da saqlaymiz
    payload = models.JSONField(default=dict, blank=True)

    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.phone}: {self.title}"


class DeviceToken(TimeStampedModel):
    """Push-notification uchun device token (FCM/APNS)."""

    class Platform(models.TextChoices):
        ANDROID = "android", _("Android")
        IOS = "ios", _("iOS")
        WEB = "web", _("Web (Web Push)")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens"
    )
    token = models.CharField(max_length=300, unique=True)
    platform = models.CharField(max_length=10, choices=Platform.choices)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["user", "is_active"])]
