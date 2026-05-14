"""Notifikatsiya yuborish servisi.

In-app: Notification DB ga yoziladi
Push: FCM/APNS — hozircha hook (kelajakda Celery task)
WebSocket: foydalanuvchi ulangan bo'lsa real-time
"""
from __future__ import annotations

import logging
from typing import Any

from django.db import transaction

from .models import Notification, NotificationType

logger = logging.getLogger(__name__)


def notify(
    user,
    *,
    type: str,
    title: str,
    body: str = "",
    payload: dict[str, Any] | None = None,
    push: bool = True,
) -> Notification:
    """Foydalanuvchiga bildirishnoma yuborish — DB + push + WS."""
    payload = payload or {}

    with transaction.atomic():
        notif = Notification.objects.create(
            user=user, type=type, title=title, body=body, payload=payload
        )

    # WebSocket push (foydalanuvchining shaxsiy kanaliga)
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        layer = get_channel_layer()
        if layer:
            async_to_sync(layer.group_send)(
                f"user_{user.id}",
                {
                    "type": "notification.message",
                    "data": {
                        "id": notif.id,
                        "type": notif.type,
                        "title": notif.title,
                        "body": notif.body,
                        "payload": notif.payload,
                        "created_at": notif.created_at.isoformat(),
                    },
                },
            )
    except Exception as exc:
        logger.debug("WS push skipped: %s", exc)

    # Push (FCM) — kelajakda
    if push:
        _send_push(notif)

    return notif


def _send_push(notif: Notification) -> None:
    """FCM/APNS ga push yuborish. Hozircha log, kelajakda Celery task."""
    tokens = list(notif.user.device_tokens.filter(is_active=True).values_list("token", flat=True))
    if not tokens:
        return
    logger.info("[PUSH stub] %s tokens for %s: %s", len(tokens), notif.user.phone, notif.title)
