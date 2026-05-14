"""Sharh yaratilganda/o'zgarganda usta'ning rating_cache va reviews_count yangilanadi."""
from decimal import Decimal

from django.db.models import Avg, Count
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.masters.models import MasterProfile

from .models import Review


def _recalc_master(master_id: int) -> None:
    agg = Review.objects.filter(master_id=master_id).aggregate(
        avg=Avg("rating"), cnt=Count("id")
    )
    MasterProfile.objects.filter(id=master_id).update(
        rating_cache=Decimal(str(round(agg["avg"] or 0, 2))),
        reviews_count_cache=agg["cnt"] or 0,
    )


@receiver(post_save, sender=Review)
def review_saved(sender, instance: Review, **kwargs):
    _recalc_master(instance.master_id)


@receiver(post_delete, sender=Review)
def review_deleted(sender, instance: Review, **kwargs):
    _recalc_master(instance.master_id)
