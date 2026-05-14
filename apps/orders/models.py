from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from apps.masters.models import Category, MasterProfile, Region, Skill


class OrderStatus(models.TextChoices):
    DRAFT = "draft", "Qoralama"
    PUBLISHED = "published", "Aktiv (e'lon qilingan)"
    MATCHED = "matched", "Usta tanlangan"
    IN_PROGRESS = "in_progress", "Ish davom etyapti"
    COMPLETED = "completed", "Yakunlangan"
    CANCELLED = "cancelled", "Bekor qilingan"


class Urgency(models.TextChoices):
    LOW = "low", "Shoshilinch emas"
    NORMAL = "normal", "Oddiy"
    HIGH = "high", "Tezkor"
    EMERGENCY = "emergency", "Favqulodda"


class Order(TimeStampedModel):
    """Mijoz tashlagan ish e'loni."""

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    title = models.CharField(max_length=180)
    description = models.TextField()

    address = models.CharField(max_length=250)
    region = models.ForeignKey(
        Region, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders"
    )
    budget_from = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    budget_to = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    urgency = models.CharField(max_length=12, choices=Urgency.choices, default=Urgency.NORMAL)

    status = models.CharField(max_length=15, choices=OrderStatus.choices, default=OrderStatus.PUBLISHED)
    selected_master = models.ForeignKey(
        MasterProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="selected_orders",
    )

    # AI tahlili (Sprint 4 da to'ldiriladi)
    ai_extracted_skills = models.ManyToManyField(Skill, blank=True, related_name="ai_orders")
    ai_summary = models.TextField(blank=True)
    ai_processed_at = models.DateTimeField(null=True, blank=True)

    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Buyurtma"
        verbose_name_plural = "Buyurtmalar"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["client", "-created_at"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self) -> str:
        return f"#{self.pk} — {self.title}"


class OrderImage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="orders/")
    order_idx = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("order_idx", "id")


class OrderResponseStatus(models.TextChoices):
    PENDING = "pending", "Kutilmoqda"
    ACCEPTED = "accepted", "Tanlangan"
    REJECTED = "rejected", "Rad etilgan"
    WITHDRAWN = "withdrawn", "Usta o'z taklifini qaytarib oldi"


class OrderResponse(TimeStampedModel):
    """Ustaning order ga javobi — taklif narxi va xabar.

    Mijoz tanlasa, status='accepted' bo'ladi. Boshqalari avtomatik 'rejected'.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="responses")
    master = models.ForeignKey(
        MasterProfile, on_delete=models.CASCADE, related_name="responses"
    )
    price_offer = models.DecimalField(max_digits=12, decimal_places=2)
    message = models.TextField(blank=True)
    eta_hours = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Necha soatda bajariladi"
    )

    status = models.CharField(
        max_length=12, choices=OrderResponseStatus.choices, default=OrderResponseStatus.PENDING
    )

    class Meta:
        unique_together = [("order", "master")]
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["master", "status"]),
        ]

    def __str__(self) -> str:
        return f"Response {self.pk} order#{self.order_id} master={self.master_id}"


class BookingStatus(models.TextChoices):
    """Band qilish so'rovi holati."""
    PENDING = "pending", "Yuborildi"           # Mijoz yubordi, usta hali ko'rmadi/hal qilmadi
    ACCEPTED = "accepted", "Qabul qilindi"     # Usta ishni oldi
    DECLINED = "declined", "Rad etildi"        # Usta rad etdi
    COMPLETED = "completed", "Yakunlandi"      # Ish bajarildi
    CANCELLED = "cancelled", "Bekor qilindi"   # Mijoz bekor qildi


class BookingRequest(TimeStampedModel):
    """Mijoz ustani 'band qilish' so'rovi.

    Bitta buyurtma uchun mijoz bir nechta ustaga so'rov yuborishi mumkin.
    Usta o'z so'rovlarini ko'radi, qo'ng'iroq qilib kelishadi, biriga 'qabul qildim' bosadi.
    Usta qabul qilganda is_available=False bo'lib, ish tugashi bilan True ga qaytadi.
    """

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="booking_requests"
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_bookings",
    )
    master = models.ForeignKey(
        MasterProfile, on_delete=models.CASCADE, related_name="received_bookings"
    )
    status = models.CharField(
        max_length=12, choices=BookingStatus.choices, default=BookingStatus.PENDING
    )

    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Mijoz qisqa eslatma yozishi mumkin (ixtiyoriy)
    note = models.TextField(blank=True)

    class Meta:
        verbose_name = "Band qilish so'rovi"
        verbose_name_plural = "Band qilish so'rovlari"
        unique_together = [("order", "master")]
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["master", "status", "-created_at"]),
            models.Index(fields=["client", "-created_at"]),
            models.Index(fields=["order", "status"]),
        ]

    def __str__(self) -> str:
        return f"Booking #{self.pk}: order#{self.order_id} → master#{self.master_id} ({self.status})"
