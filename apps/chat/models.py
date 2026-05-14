from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.orders.models import Order


class ChatRoom(TimeStampedModel):
    """Order kontekstida ochilgan chat. Mijoz va usta o'rtasida bitta xona."""

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="chat_room")
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="client_chats"
    )
    master = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="master_chats"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Chat xonasi"
        verbose_name_plural = "Chat xonalari"
        ordering = ("-updated_at",)
        indexes = [models.Index(fields=["client", "-updated_at"]), models.Index(fields=["master", "-updated_at"])]

    def __str__(self) -> str:
        return f"Chat order#{self.order_id}: {self.client.phone} ↔ {self.master.phone}"

    def participants(self) -> list[int]:
        return [self.client_id, self.master_id]

    def has_participant(self, user_id: int) -> bool:
        return user_id in self.participants()


class Message(TimeStampedModel):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages"
    )
    text = models.TextField(blank=True)
    attachment = models.FileField(upload_to="chat/", blank=True, null=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [models.Index(fields=["room", "created_at"])]
