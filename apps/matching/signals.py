from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.orders.models import Order, OrderStatus

from .tasks import analyze_order


@receiver(post_save, sender=Order)
def trigger_matching(sender, instance: Order, created: bool, **kwargs):
    """Order yaratilganda yoki `published` ga o'tganda AI tahlilini ishga tushiramiz."""
    if instance.ai_processed_at:
        return
    if instance.status != OrderStatus.PUBLISHED:
        return

    # Celery yo'q bo'lsa (CELERY_TASK_ALWAYS_EAGER=False bo'lganda lokal dev'da) — sinxron chaqirsa ham bo'ladi
    try:
        analyze_order.delay(instance.id)
    except Exception:
        # Redis/broker yo'q bo'lsa — sinxron chaqiramiz (dev rejimi uchun)
        analyze_order(instance.id)
