from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.common.models import TimeStampedModel
from apps.masters.models import MasterProfile
from apps.orders.models import Order


class Review(TimeStampedModel):
    """Mijoz bergan sharh — bitta order uchun bittadan ortiq sharh bo'la olmaydi."""

    order = models.OneToOneField(
        Order, on_delete=models.CASCADE, related_name="review"
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="given_reviews",
    )
    master = models.ForeignKey(
        MasterProfile, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    text = models.TextField(blank=True)

    # Usta o'z javobini berishi mumkin
    master_reply = models.TextField(blank=True)
    master_replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Sharh"
        verbose_name_plural = "Sharhlar"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["master", "-created_at"]),
            models.Index(fields=["-rating"]),
        ]

    def __str__(self) -> str:
        return f"{self.client.phone} → {self.master.user.phone}: {self.rating}/5"


class ReviewImage(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="reviews/")
    order_idx = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("order_idx", "id")
