from __future__ import annotations

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer


class ChatRoomViewSet(viewsets.ReadOnlyModelViewSet):
    """Foydalanuvchi o'z chat xonalari ro'yxati va biriga oid xabarlarni o'qiy oladi."""

    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        return (
            ChatRoom.objects.filter(Q(client=u) | Q(master=u))
            .select_related("client", "master", "order")
            .prefetch_related("messages")
        )

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        room = self._get_room(request, pk)

        if request.method == "GET":
            qs = room.messages.select_related("sender").order_by("created_at")
            page = self.paginate_queryset(qs)
            ser = MessageSerializer(page if page is not None else qs, many=True)
            return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

        text = (request.data.get("text") or "").strip()
        attachment = request.data.get("attachment")
        if not text and not attachment:
            return Response({"detail": "Bo'sh xabar"}, status=400)

        msg = Message.objects.create(room=room, sender=request.user, text=text, attachment=attachment)
        room.updated_at = timezone.now()
        room.save(update_fields=["updated_at"])

        # WebSocket orqali real-time push (Redis yo'q bo'lsa o'tib ketamiz)
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer

            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"chat_{room.id}",
                    {"type": "chat.message", "message": MessageSerializer(msg).data},
                )
        except Exception:
            pass  # Redis ishlamasligi xabar saqlanishini to'xtatmasin

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        room = self._get_room(request, pk)
        room.messages.filter(read_at__isnull=True).exclude(sender=request.user).update(
            read_at=timezone.now()
        )
        return Response({"detail": "ok"})

    def _get_room(self, request, pk) -> ChatRoom:
        room = get_object_or_404(ChatRoom, pk=pk)
        if not room.has_participant(request.user.id):
            raise PermissionDenied()
        return room
