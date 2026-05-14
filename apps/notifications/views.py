from __future__ import annotations

from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import DeviceToken, Notification
from .serializers import DeviceTokenSerializer, NotificationSerializer


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Foydalanuvchi notifikatsiyalari."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, read_at__isnull=True).count()
        return Response({"count": count})

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        Notification.objects.filter(user=request.user, read_at__isnull=True).update(
            read_at=timezone.now()
        )
        return Response({"detail": "ok"})

    @action(detail=True, methods=["post"], url_path="read")
    def read_one(self, request, pk=None):
        Notification.objects.filter(user=request.user, id=pk).update(read_at=timezone.now())
        return Response({"detail": "ok"})


class DeviceTokenViewSet(
    mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    """Push uchun device tokenlarni ro'yxatga olish."""

    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        obj, _ = DeviceToken.objects.update_or_create(
            token=ser.validated_data["token"],
            defaults={
                "user": request.user,
                "platform": ser.validated_data["platform"],
                "is_active": True,
            },
        )
        return Response(DeviceTokenSerializer(obj).data, status=status.HTTP_201_CREATED)
