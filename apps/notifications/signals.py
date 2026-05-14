"""Loyiha hodisalariga bog'langan notifikatsiyalar.

Eslatma: bu signal'lar `notifications` app'da turibdi, sababi — har bir kontekst app'i
notifikatsiyani o'zi import qilmasligi kerak (bir tomonlama bog'liqlik).
"""
from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.chat.models import Message
from apps.matching.models import OrderMatch
from apps.orders.models import Order, OrderResponse, OrderResponseStatus, OrderStatus
from apps.reviews.models import Review

from .models import NotificationType
from .services import notify


@receiver(post_save, sender=OrderResponse)
def on_response(sender, instance: OrderResponse, created, **kwargs):
    if created:
        notify(
            instance.order.client,
            type=NotificationType.NEW_RESPONSE,
            title="Yangi taklif keldi",
            body=f"{instance.master.user.full_name or instance.master.user.phone}: {instance.price_offer} so'm",
            payload={"order_id": instance.order_id, "response_id": instance.id},
        )
    elif instance.status == OrderResponseStatus.ACCEPTED:
        notify(
            instance.master.user,
            type=NotificationType.RESPONSE_ACCEPTED,
            title="Taklifingiz qabul qilindi",
            body=f"#{instance.order_id} buyurtma — siz tanlandingiz",
            payload={"order_id": instance.order_id},
        )


@receiver(post_save, sender=Order)
def on_order_status(sender, instance: Order, created, **kwargs):
    if not created and instance.status == OrderStatus.COMPLETED and instance.selected_master_id:
        notify(
            instance.selected_master.user,
            type=NotificationType.ORDER_COMPLETED,
            title="Buyurtma yakunlandi",
            body=instance.title,
            payload={"order_id": instance.id},
        )


@receiver(post_save, sender=Review)
def on_review(sender, instance: Review, created, **kwargs):
    if created:
        notify(
            instance.master.user,
            type=NotificationType.NEW_REVIEW,
            title=f"Yangi {instance.rating}/5 sharh",
            body=instance.text[:140],
            payload={"review_id": instance.id, "rating": instance.rating},
        )


@receiver(post_save, sender=OrderMatch)
def on_match(sender, instance: OrderMatch, created, **kwargs):
    if created and instance.score >= 50:
        notify(
            instance.master.user,
            type=NotificationType.NEW_ORDER_MATCH,
            title="Sizga mos buyurtma",
            body=f"#{instance.order_id}: {instance.order.title}",
            payload={"order_id": instance.order_id, "score": str(instance.score)},
            push=False,  # match juda ko'p bo'lishi mumkin — faqat in-app
        )


@receiver(post_save, sender=Message)
def on_message(sender, instance: Message, created, **kwargs):
    if not created:
        return
    room = instance.room
    recipient = room.master if instance.sender_id == room.client_id else room.client
    notify(
        recipient,
        type=NotificationType.NEW_MESSAGE,
        title=f"Yangi xabar — {instance.sender.full_name or instance.sender.phone}",
        body=instance.text[:120],
        payload={"room_id": room.id, "message_id": instance.id},
        push=True,
    )
