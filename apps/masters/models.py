from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.text import slugify

from apps.common.models import TimeStampedModel


class Category(TimeStampedModel):
    """Hunar kategoriyasi (santexnik, elektrik, quruvchi...).

    Ierarxiya qo'llab-quvvatlanadi: `parent` orqali subkategoriyalar.
    """

    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    icon = models.ImageField(upload_to="categories/", blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Kategoriya"
        verbose_name_plural = "Kategoriyalar"
        ordering = ("order", "name")
        indexes = [models.Index(fields=["parent", "is_active"])]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:100]
        super().save(*args, **kwargs)


class Skill(TimeStampedModel):
    """Aniq ko'nikma — AI matching algoritmi shu maydon orqali ishlaydi."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="skills")
    aliases = models.JSONField(
        default=list,
        blank=True,
        help_text="Sinonimlar — AI matching uchun (masalan: ['kran', 'jo'mrak'])",
    )

    class Meta:
        verbose_name = "Ko'nikma"
        verbose_name_plural = "Ko'nikmalar"
        ordering = ("category", "name")
        indexes = [models.Index(fields=["category"])]

    def __str__(self) -> str:
        return f"{self.name} ({self.category.name})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:120]
        super().save(*args, **kwargs)


class Region(models.Model):
    """O'zbekiston hududlari — Viloyat → Tuman ierarxiyasi."""

    class Kind(models.TextChoices):
        VILOYAT = "viloyat", "Viloyat"
        TUMAN = "tuman", "Tuman"

    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.TUMAN)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        limit_choices_to={"kind": Kind.VILOYAT},
    )

    class Meta:
        verbose_name = "Hudud"
        verbose_name_plural = "Hududlar"
        ordering = ("kind", "name")
        unique_together = [("name", "parent")]

    def __str__(self) -> str:
        return f"{self.parent.name}, {self.name}" if self.parent else self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.parent.slug}-{self.name}" if self.parent else self.name
            self.slug = slugify(base)[:120]
        super().save(*args, **kwargs)


class MasterProfile(TimeStampedModel):
    """Usta qo'shimcha ma'lumotlari — user.role='master' bo'lganda signal orqali yaratiladi."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="master_profile",
    )
    bio = models.TextField(blank=True)
    experience_years = models.PositiveSmallIntegerField(default=0)
    hourly_rate_from = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    hourly_rate_to = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    categories = models.ManyToManyField(Category, related_name="masters", blank=True)
    skills = models.ManyToManyField(Skill, related_name="masters", blank=True)
    regions = models.ManyToManyField(Region, related_name="masters", blank=True)

    # Denormalized aggregates — sharh/order tugaganda yangilanadi
    rating_cache = models.DecimalField(
        max_digits=3, decimal_places=2, default=Decimal("0.00")
    )
    reviews_count_cache = models.PositiveIntegerField(default=0)
    completed_orders_cache = models.PositiveIntegerField(default=0)

    is_available = models.BooleanField("Ish qabul qiladimi", default=True)
    is_approved = models.BooleanField("Admin tasdiqlagan", default=False)

    class Meta:
        verbose_name = "Usta profili"
        verbose_name_plural = "Ustalar profili"
        indexes = [
            models.Index(fields=["is_available", "is_approved"]),
            models.Index(fields=["-rating_cache"]),
        ]

    def __str__(self) -> str:
        return f"Usta: {self.user.phone}"


class PortfolioItem(TimeStampedModel):
    master = models.ForeignKey(
        MasterProfile, on_delete=models.CASCADE, related_name="portfolio"
    )
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portfolio_items",
    )

    class Meta:
        verbose_name = "Portfolio elementi"
        verbose_name_plural = "Portfolio elementlari"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["master", "-created_at"])]

    def __str__(self) -> str:
        return f"{self.master.user.phone}: {self.title}"


class PortfolioImage(models.Model):
    portfolio = models.ForeignKey(
        PortfolioItem, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="portfolio/")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("order", "id")
