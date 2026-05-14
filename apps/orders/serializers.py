from __future__ import annotations

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.masters.serializers import (
    CategorySerializer,
    MasterListSerializer,
    RegionSerializer,
    SkillSerializer,
)

from .models import BookingRequest, Order, OrderImage, OrderResponse


class OrderImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderImage
        fields = ("id", "image", "order_idx")


class OrderListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    region = RegionSerializer(read_only=True)
    cover_image = serializers.SerializerMethodField()
    responses_count = serializers.IntegerField(source="responses.count", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "title",
            "description",
            "address",
            "region",
            "category",
            "urgency",
            "budget_from",
            "budget_to",
            "status",
            "cover_image",
            "responses_count",
            "created_at",
        )

    def get_cover_image(self, obj):
        img = obj.images.first()
        if not img:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(img.image.url) if request else img.image.url


class OrderDetailSerializer(OrderListSerializer):
    client = UserSerializer(read_only=True)
    images = OrderImageSerializer(many=True, read_only=True)
    ai_extracted_skills = SkillSerializer(many=True, read_only=True)
    selected_master = MasterListSerializer(read_only=True)

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + (
            "client",
            "latitude",
            "longitude",
            "images",
            "ai_extracted_skills",
            "ai_summary",
            "selected_master",
        )


class OrderCreateSerializer(serializers.ModelSerializer):
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "title",
            "description",
            "address",
            "region",
            "latitude",
            "longitude",
            "category",
            "budget_from",
            "budget_to",
            "urgency",
            "status",
            "created_at",
            "uploaded_images",
        )
        read_only_fields = ("id", "status", "created_at")

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        order = Order.objects.create(**validated_data)
        for idx, img in enumerate(images):
            OrderImage.objects.create(order=order, image=img, order_idx=idx)
        return order


class OrderResponseSerializer(serializers.ModelSerializer):
    master = MasterListSerializer(read_only=True)

    class Meta:
        model = OrderResponse
        fields = (
            "id",
            "order",
            "master",
            "price_offer",
            "message",
            "eta_hours",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "order", "master", "status", "created_at")


class OrderResponseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderResponse
        fields = ("price_offer", "message", "eta_hours")


class OrderShortSerializer(serializers.ModelSerializer):
    """Order'ning qisqa ko'rinishi — BookingRequest ichida ishlatiladi."""
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Order
        fields = ("id", "title", "description", "address", "category", "urgency", "created_at")


class BookingRequestSerializer(serializers.ModelSerializer):
    """Mijozdan ustaga yuborilgan band qilish so'rovi (o'qish uchun)."""
    order = OrderShortSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    master = MasterListSerializer(read_only=True)

    class Meta:
        model = BookingRequest
        fields = (
            "id",
            "order",
            "client",
            "master",
            "status",
            "note",
            "accepted_at",
            "completed_at",
            "cancelled_at",
            "created_at",
        )
        read_only_fields = fields


class BookingRequestCreateSerializer(serializers.ModelSerializer):
    """Mijoz tomonidan yangi so'rov yaratish."""

    class Meta:
        model = BookingRequest
        fields = ("order", "master", "note")
