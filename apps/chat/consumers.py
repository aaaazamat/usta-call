"""Channels consumer — chat xonasi uchun real-time xabar almashish."""
from __future__ import annotations

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone

from .models import ChatRoom, Message
from .serializers import MessageSerializer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """`/ws/chat/{room_id}/` — JWT orqali autentifikatsiya, ishtirokchilarga xabarlar.

    Frontend tomondan WS query string yoki sub-protocol orqali tokenni yuborish kerak
    (auth middleware'da bu logika qo'shilishi mumkin — hozir AuthMiddlewareStack
    session-based bo'lganligi sababli, alohida JWT middleware tavsiya etiladi).
    """

    async def connect(self):
        self.room_id = int(self.scope["url_route"]["kwargs"]["room_id"])
        self.user = self.scope.get("user")
        if not self.user or self.user.is_anonymous:
            await self.close(code=4001)
            return

        room = await self._get_room(self.room_id, self.user.id)
        if not room:
            await self.close(code=4003)
            return

        self.group_name = f"chat_{self.room_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")
        if action == "send":
            text = (content.get("text") or "").strip()
            if not text:
                return
            msg = await self._save_message(self.room_id, self.user.id, text)
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "chat.message", "message": msg},
            )
        elif action == "read":
            await self._mark_read(self.room_id, self.user.id)

    async def chat_message(self, event):
        await self.send_json({"type": "message", "message": event["message"]})

    @database_sync_to_async
    def _get_room(self, room_id: int, user_id: int) -> ChatRoom | None:
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return None
        return room if room.has_participant(user_id) else None

    @database_sync_to_async
    def _save_message(self, room_id: int, sender_id: int, text: str) -> dict:
        msg = Message.objects.create(room_id=room_id, sender_id=sender_id, text=text)
        ChatRoom.objects.filter(id=room_id).update(updated_at=timezone.now())
        return MessageSerializer(msg).data

    @database_sync_to_async
    def _mark_read(self, room_id: int, user_id: int) -> None:
        Message.objects.filter(room_id=room_id, read_at__isnull=True).exclude(
            sender_id=user_id
        ).update(read_at=timezone.now())
