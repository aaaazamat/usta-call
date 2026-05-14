from __future__ import annotations

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Review, ReviewImage


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ("id", "image", "order_idx")


class ReviewSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "order",
            "client",
            "master",
            "rating",
            "text",
            "master_reply",
            "master_replied_at",
            "images",
            "created_at",
        )
        read_only_fields = ("id", "client", "master", "master_reply", "master_replied_at", "created_at")


class ReviewCreateSerializer(serializers.ModelSerializer):
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Review
        fields = ("order", "rating", "text", "uploaded_images")

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        review = Review.objects.create(**validated_data)
        for idx, img in enumerate(images):
            ReviewImage.objects.create(review=review, image=img, order_idx=idx)
        return review


class MasterReplySerializer(serializers.Serializer):
    text = serializers.CharField(max_length=1000)
