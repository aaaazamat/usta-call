from __future__ import annotations

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Category, MasterProfile, PortfolioImage, PortfolioItem, Region, Skill


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "icon", "parent", "order", "is_active")


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "slug", "category", "aliases")


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ("id", "name", "slug", "kind", "parent")


class PortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioImage
        fields = ("id", "image", "order")


class PortfolioItemSerializer(serializers.ModelSerializer):
    images = PortfolioImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = PortfolioItem
        fields = ("id", "title", "description", "category", "images", "uploaded_images", "created_at")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        item = PortfolioItem.objects.create(**validated_data)
        for idx, img in enumerate(images):
            PortfolioImage.objects.create(portfolio=item, image=img, order=idx)
        return item


class MasterListSerializer(serializers.ModelSerializer):
    """Katalogda qisqa ko'rinish."""

    user = UserSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)

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


class MasterDetailSerializer(MasterListSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    regions = RegionSerializer(many=True, read_only=True)
    portfolio = PortfolioItemSerializer(many=True, read_only=True)

    class Meta(MasterListSerializer.Meta):
        fields = MasterListSerializer.Meta.fields + ("skills", "regions", "portfolio")


class MasterUpdateSerializer(serializers.ModelSerializer):
    """Usta o'z profilini tahrirlaydi."""

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
