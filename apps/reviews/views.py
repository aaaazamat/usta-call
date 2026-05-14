from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsClient, IsMaster
from apps.orders.models import OrderStatus

from .models import Review
from .serializers import MasterReplySerializer, ReviewCreateSerializer, ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """Sharhlar.

    - Mijoz: faqat order completed bo'lsa, bir marta sharh qoldira oladi
    - Hamma: master'ning sharhlarini o'qiy oladi (filter: ?master=N)
    - Usta: o'z sharhiga javob bera oladi
    """

    permission_classes = [AllowAny]  # GET uchun. Yozish action'larda kuchaytiriladi.
    serializer_class = ReviewSerializer
    filterset_fields = ("master", "rating")
    ordering_fields = ("created_at", "rating")
    ordering = ("-created_at",)
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return (
            Review.objects.select_related("client", "master__user")
            .prefetch_related("images")
            .all()
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsClient()]
        if self.action == "reply":
            return [IsAuthenticated(), IsMaster()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        ser = ReviewCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        order = ser.validated_data["order"]
        if order.client_id != request.user.id:
            raise PermissionDenied("Faqat buyurtma egasi sharh qoldira oladi")
        if order.status != OrderStatus.COMPLETED:
            raise ValidationError("Sharh faqat yakunlangan buyurtma uchun qo'yiladi")
        if not order.selected_master_id:
            raise ValidationError("Buyurtmaga usta tanlanmagan")
        if Review.objects.filter(order=order).exists():
            raise ValidationError("Bu buyurtma uchun sharh allaqachon mavjud")
        review = ser.save(client=request.user, master_id=order.selected_master_id)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        review = get_object_or_404(Review, pk=pk)
        if review.master.user_id != request.user.id:
            raise PermissionDenied()
        ser = MasterReplySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        review.master_reply = ser.validated_data["text"]
        review.master_replied_at = timezone.now()
        review.save(update_fields=["master_reply", "master_replied_at", "updated_at"])
        return Response(ReviewSerializer(review).data)
