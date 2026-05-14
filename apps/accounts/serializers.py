from __future__ import annotations

import phonenumbers
from rest_framework import serializers

from .models import Role, User


def normalize_phone(raw: str) -> str:
    """+998 90 123 45 67 → +998901234567 (E.164)."""
    try:
        parsed = phonenumbers.parse(raw, "UZ")
    except phonenumbers.NumberParseException as exc:
        raise serializers.ValidationError("Telefon raqami noto'g'ri formatda") from exc
    if not phonenumbers.is_valid_number(parsed):
        raise serializers.ValidationError("Telefon raqami noto'g'ri")
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


class RequestOtpSerializer(serializers.Serializer):
    phone = serializers.CharField()
    role = serializers.ChoiceField(choices=Role.choices, default=Role.CLIENT)

    def validate_phone(self, value: str) -> str:
        return normalize_phone(value)


class VerifyOtpSerializer(serializers.Serializer):
    phone = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate_phone(self, value: str) -> str:
        return normalize_phone(value)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "phone", "full_name", "role", "avatar", "is_verified", "created_at")
        read_only_fields = ("id", "phone", "role", "is_verified", "created_at")


class MeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("full_name", "avatar")
