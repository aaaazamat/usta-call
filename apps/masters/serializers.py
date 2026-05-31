from __future__ import annotations

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Category, MasterProfile, PortfolioImage, PortfolioItem, Region, Skill


# ── Parler bilan ishlovchi yordamchi metodlar ────────────────────────────────
def _translated(obj, field: str) -> str:
    """Joriy til (LocaleMiddleware tomonidan o'rnatilgan) uchun tarjima.
    Yo'q bo'lsa fallback (uz → ru) ishlaydi (PARLER_LANGUAGES'da sozlangan)."""
    return obj.safe_translation_getter(field, any_language=True) or ""


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "icon", "parent", "order", "is_active")

    def get_name(self, obj) -> str:
        return _translated(obj, "name")


class SkillSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = ("id", "name", "slug", "category", "aliases")

    def get_name(self, obj) -> str:
        return _translated(obj, "name")


class RegionSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Region
        fields = ("id", "name", "slug", "kind", "parent")

    def get_name(self, obj) -> str:
        return _translated(obj, "name")


class PortfolioImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioImage
        fields = ("id", "image", "order")

    def get_image(self, obj) -> str:
        """Tashqi havola yoki yuklangan faylning to'liq URL'i."""
        if obj.external_url:
            return obj.external_url
        if obj.image:
            request = self.context.get("request")
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return ""


class PortfolioItemSerializer(serializers.ModelSerializer):
    images = PortfolioImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    title = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PortfolioItem
        fields = ("id", "title", "description", "category", "images", "uploaded_images", "created_at")
        read_only_fields = ("id", "created_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["title"] = _translated(instance, "title")
        data["description"] = _translated(instance, "description")
        return data

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        title = validated_data.pop("title", "")
        description = validated_data.pop("description", "")
        item = PortfolioItem.objects.create(**validated_data)
        # Joriy tilga bog'lab tarjimani saqlash
        item.set_current_language(self._current_language())
        item.title = title
        item.description = description
        item.save()
        for idx, img in enumerate(images):
            PortfolioImage.objects.create(portfolio=item, image=img, order=idx)
        return item

    def update(self, instance, validated_data):
        title = validated_data.pop("title", None)
        description = validated_data.pop("description", None)
        validated_data.pop("uploaded_images", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if title is not None or description is not None:
            instance.set_current_language(self._current_language())
            if title is not None:
                instance.title = title
            if description is not None:
                instance.description = description
        instance.save()
        return instance

    def _current_language(self) -> str:
        from django.utils import translation
        return translation.get_language() or "uz"


class MasterListSerializer(serializers.ModelSerializer):
    """Katalogda qisqa ko'rinish."""

    user = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    bio = serializers.SerializerMethodField()

    class Meta:
        model = MasterProfile
        fields = (
            "id",
            "user",
            "bio",
            "experience_years",
            "hourly_rate_from",
            "hourly_rate_to",
            "categories",
            "rating_cache",
            "reviews_count_cache",
            "completed_orders_cache",
            "is_available",
        )

    def get_bio(self, obj) -> str:
        return _translated(obj, "bio")


class MasterDetailSerializer(MasterListSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    regions = RegionSerializer(many=True, read_only=True)
    portfolio = PortfolioItemSerializer(many=True, read_only=True)

    class Meta(MasterListSerializer.Meta):
        fields = MasterListSerializer.Meta.fields + ("skills", "regions", "portfolio")


class MasterUpdateSerializer(serializers.ModelSerializer):
    """Usta o'z profilini tahrirlaydi.

    `bio` joriy til (Accept-Language header) ga saqlanadi.
    """

    bio = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = MasterProfile
        fields = (
            "bio",
            "experience_years",
            "hourly_rate_from",
            "hourly_rate_to",
            "categories",
            "skills",
            "regions",
            "is_available",
        )

    def update(self, instance, validated_data):
        bio = validated_data.pop("bio", None)
        m2m = {}
        for f in ("categories", "skills", "regions"):
            if f in validated_data:
                m2m[f] = validated_data.pop(f)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if bio is not None:
            from django.utils import translation
            instance.set_current_language(translation.get_language() or "uz")
            instance.bio = bio
        instance.save()
        for f, value in m2m.items():
            getattr(instance, f).set(value)
        return instance
