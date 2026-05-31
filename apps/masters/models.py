from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields

from apps.common.models import TimeStampedModel


class Category(TranslatableModel, TimeStampedModel):
    """Hunar kategoriyasi (santexnik, elektrik, quruvchi...).

    Ierarxiya qo'llab-quvvatlanadi: `parent` orqali subkategoriyalar.
    `name` maydoni django-parler orqali uz/kk/ru tilida tarjima qilinadi.
    """

    translations = TranslatedFields(
        name=models.CharField(_("Nomi"), max_length=80),
    )
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
        verbose_name = _("Kategoriya")
        verbose_name_plural = _("Kategoriyalar")
        ordering = ("order",)
        indexes = [models.Index(fields=["parent", "is_active"])]

    def __str__(self) -> str:
        return self.safe_translation_getter("name", any_language=True) or f"Category #{self.pk}"

    def save(self, *args, **kwargs):
        # slugify uchun joriy tildagi nomni olishga harakat qilamiz,
        # bo'lmasa istalgan tarjimadan foydalanamiz.
        if not self.slug:
            name = self.safe_translation_getter("name", any_language=True) or ""
            if name:
                self.slug = slugify(name)[:100]
        super().save(*args, **kwargs)


class Skill(TranslatableModel, TimeStampedModel):
    """Aniq ko'nikma — AI matching algoritmi shu maydon orqali ishlaydi.

    `name` django-parler orqali ko'p tilli.
    """

    translations = TranslatedFields(
        name=models.CharField(_("Nomi"), max_length=100),
    )
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="skills")
    aliases = models.JSONField(
        default=list,
        blank=True,
        help_text=_("Sinonimlar — AI matching uchun (masalan: ['kran', 'jo'mrak'])"),
    )

    class Meta:
        verbose_name = _("Ko'nikma")
        verbose_name_plural = _("Ko'nikmalar")
        ordering = ("category",)
        indexes = [models.Index(fields=["category"])]

    def __str__(self) -> str:
        name = self.safe_translation_getter("name", any_language=True) or f"Skill #{self.pk}"
        return f"{name} ({self.category})"

    def save(self, *args, **kwargs):
        if not self.slug:
            name = self.safe_translation_getter("name", any_language=True) or ""
            if name:
                self.slug = slugify(name)[:120]
        super().save(*args, **kwargs)


class Region(TranslatableModel):
    """O'zbekiston hududlari — Viloyat → Tuman ierarxiyasi."""

    class Kind(models.TextChoices):
        VILOYAT = "viloyat", _("Viloyat")
        TUMAN = "tuman", _("Tuman")

    translations = TranslatedFields(
        name=models.CharField(_("Nomi"), max_length=80),
    )
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
        verbose_name = _("Hudud")
        verbose_name_plural = _("Hududlar")
        ordering = ("kind",)

    def __str__(self) -> str:
        name = self.safe_translation_getter("name", any_language=True) or f"Region #{self.pk}"
        if self.parent_id:
            parent_name = self.parent.safe_translation_getter("name", any_language=True) or ""
            return f"{parent_name}, {name}" if parent_name else name
        return name

    def save(self, *args, **kwargs):
        if not self.slug:
            name = self.safe_translation_getter("name", any_language=True) or ""
            if name:
                base = f"{self.parent.slug}-{name}" if self.parent_id and self.parent.slug else name
                self.slug = slugify(base)[:120]
        super().save(*args, **kwargs)


class MasterProfile(TranslatableModel, TimeStampedModel):
    """Usta qo'shimcha ma'lumotlari — user.role='master' bo'lganda signal orqali yaratiladi.

    `bio` ko'p tilli — usta o'zi haqida har xil tilda yozishi mumkin.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="master_profile",
    )
    translations = TranslatedFields(
        bio=models.TextField(_("O'zi haqida"), blank=True),
    )
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

    is_available = models.BooleanField(_("Ish qabul qiladimi"), default=True)
    is_approved = models.BooleanField(_("Admin tasdiqlagan"), default=False)

    class Meta:
        verbose_name = _("Usta profili")
        verbose_name_plural = _("Ustalar profili")
        indexes = [
            models.Index(fields=["is_available", "is_approved"]),
            models.Index(fields=["-rating_cache"]),
        ]

    def __str__(self) -> str:
        return f"Usta: {self.user.phone}"


class PortfolioItem(TranslatableModel, TimeStampedModel):
    """Usta portfeli — `title` va `description` ko'p tilli."""

    master = models.ForeignKey(
        MasterProfile, on_delete=models.CASCADE, related_name="portfolio"
    )
    translations = TranslatedFields(
        title=models.CharField(_("Sarlavha"), max_length=160),
        description=models.TextField(_("Tavsif"), blank=True),
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="portfolio_items",
    )

    class Meta:
        verbose_name = _("Portfolio elementi")
        verbose_name_plural = _("Portfolio elementlari")
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["master", "-created_at"])]

    def __str__(self) -> str:
        title = self.safe_translation_getter("title", any_language=True) or f"#{self.pk}"
        return f"{self.master.user.phone}: {title}"


class PortfolioImage(models.Model):
    portfolio = models.ForeignKey(
        PortfolioItem, on_delete=models.CASCADE, related_name="images"
    )
    # Usta yuklagan fayl (media). Render free'da restartda yo'qoladi.
    image = models.ImageField(upload_to="portfolio/", blank=True, null=True)
    # Tashqi rasm havolasi (internet CDN). Fayl saqlash shart emas, yo'qolmaydi.
    external_url = models.URLField(_("Tashqi rasm havolasi"), max_length=500, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("order", "id")

    @property
    def display_url(self) -> str:
        """Ko'rsatish uchun URL — avval tashqi havola, bo'lmasa yuklangan fayl."""
        if self.external_url:
            return self.external_url
        if self.image:
            try:
                return self.image.url
            except ValueError:
                return ""
        return ""
