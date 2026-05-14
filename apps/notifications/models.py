from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class NotificationType(models.TextChoices):
    NEW_ORDER_MATCH = "new_order_match", "Yangi mos buyurtma"
    NEW_RESPONSE = "new_response", "Yangi taklif"
    RESPONSE_ACCEPTED = "response_accepted", "Sizning taklifingiz qabul qilindi"
    ORDER_COMPLETED = "order_completed", "Buyurtma yakunlandi"
    NEW_REVIEW = "new_review", "Yangi sharh"
    NEW_MESSAGE = "new_message", "Yangi xabar"
    PROFILE_APPROVED = "profile_approved", "Profil tasdiqlandi"
    SYSTEM = "system", "Tizim"


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
        ANDROID = "android", "Android"
        IOS = "ios", "iOS"
        WEB = "web", "Web (Web Push)"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="device_tokens"
    )
    token = models.CharField(max_length=300, unique=True)
    platform = models.CharField(max_length=10, choices=Platform.choices)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["user", "is_active"])]
