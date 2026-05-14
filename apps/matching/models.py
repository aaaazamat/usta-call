from __future__ import annotations

from django.db import models

from apps.common.models import TimeStampedModel
from apps.masters.models import MasterProfile
from apps.orders.models import Order


class OrderMatch(TimeStampedModel):
    """AI matching natijasi — bitta order uchun bitta usta to'g'ri kelishi (score bilan).

    `score`: 0..100 (100 — eng yaxshi mos)
    `reason`: matching algoritmi nima uchun shu ustani tavsiya etganini tushuntiruvchi qisqa matn
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="matches")
    master = models.ForeignKey(MasterProfile, on_delete=models.CASCADE, related_name="matches")
    score = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.CharField(max_length=300, blank=True)

    # Breakdown — debug uchun
    skill_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    region_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    rating_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    availability_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    is_shown_to_client = models.BooleanField(default=False)

    class Meta:
        unique_together = [("order", "master")]
        ordering = ("-score",)
        indexes = [models.Index(fields=["order", "-score"])]

    def __str__(self) -> str:
        return f"Match order#{self.order_id} → master#{self.master_id} ({self.score})"
