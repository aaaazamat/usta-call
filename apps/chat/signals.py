"""ChatRoom OrderResponse 'accepted' bo'lganda avto-yaratiladi."""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.orders.models import OrderResponse, OrderResponseStatus

from .models import ChatRoom


@receiver(post_save, sender=OrderResponse)
def open_chat_room(sender, instance: OrderResponse, **kwargs):
    if instance.status != OrderResponseStatus.ACCEPTED:
        return
    order = instance.order
    ChatRoom.objects.get_or_create(
        order=order,
        defaults={
            "client": order.client,
            "master": instance.master.user,
        },
    )
