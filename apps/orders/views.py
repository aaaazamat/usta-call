from __future__ import annotations

from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsClient, IsMaster
from apps.masters.models import MasterProfile

from .filters import OrderFilter
from .models import (
    BookingRequest,
    BookingStatus,
    Order,
    OrderResponse,
    OrderResponseStatus,
    OrderStatus,
)
from .serializers import (
    BookingRequestCreateSerializer,
    BookingRequestSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderResponseCreateSerializer,
    OrderResponseSerializer,
)


class OrderViewSet(viewsets.ModelViewSet):
    """Buyurtmalar — mijoz CRUD qiladi, usta o'qiydi (feed).

    Asosiy actionlar:
      POST   /api/v1/orders/                        - mijoz yangi order yaratadi
      GET    /api/v1/orders/me/                     - mijozning buyurtmalari
      GET    /api/v1/orders/feed/                   - usta feed
      GET    /api/v1/orders/{id}/                   - detal
      GET    /api/v1/orders/{id}/responses/         - mijoz: kelgan takliflar
      POST   /api/v1/orders/{id}/respond/           - usta: taklif yuboradi
      POST   /api/v1/orders/{id}/accept/{rid}/      - mijoz: ustani tanlaydi
      POST   /api/v1/orders/{id}/complete/          - mijoz: yakunlanganini tasdiqlaydi
      POST   /api/v1/orders/{id}/cancel/            - mijoz: bekor qiladi
    """

    permission_classes = [IsAuthenticated]
    filterset_class = OrderFilter
    search_fields = ("title", "description", "address")
    ordering_fields = ("created_at", "urgency")
    ordering = ("-created_at",)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "retrieve":
            return OrderDetailSerializer
        return OrderListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.select_related(
            "client", "region", "category", "selected_master__user"
        )
        if self.action == "list" and not user.is_staff:
            return qs.filter(client=user)
        return qs

    def perform_create(self, serializer):
        if not self.request.user.is_client:
            raise PermissionDenied("Faqat mijozlar buyurtma berishi mumkin")
        serializer.save(client=self.request.user)

    # ---------- Mijoz ----------
    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated, IsClient])
    def my_orders(self, request):
        qs = self.filter_queryset(
            Order.objects.filter(client=request.user)
            .select_related("category", "region", "selected_master__user")
            .prefetch_related("images", "responses")
        )
        page = self.paginate_queryset(qs)
        ser = OrderListSerializer(page if page is not None else qs, many=True, context={"request": request})
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @action(detail=True, methods=["post"], url_path="cancel", permission_classes=[IsAuthenticated, IsClient])
    def cancel(self, request, pk=None):
        order = self._get_my_order(request, pk)
        if order.status in (OrderStatus.COMPLETED, OrderStatus.CANCELLED):
            raise ValidationError("Buyurtmani bu holatda bekor qilib bo'lmaydi")
        order.status = OrderStatus.CANCELLED
        order.cancelled_at = timezone.now()
        order.save(update_fields=["status", "cancelled_at", "updated_at"])
        return Response(OrderDetailSerializer(order, context={"request": request}).data)

    @action(
        detail=True,
        methods=["post"],
        url_path=r"accept/(?P<response_id>\d+)",
        permission_classes=[IsAuthenticated, IsClient],
    )
    def accept_response(self, request, pk=None, response_id=None):
        order = self._get_my_order(request, pk)
        if order.status not in (OrderStatus.PUBLISHED, OrderStatus.MATCHED):
            raise ValidationError("Bu buyurtma uchun usta tanlash mumkin emas")

        response = get_object_or_404(OrderResponse, id=response_id, order=order)

        with transaction.atomic():
            response.status = OrderResponseStatus.ACCEPTED
            response.save(update_fields=["status", "updated_at"])
            OrderResponse.objects.filter(order=order).exclude(id=response.id).update(
                status=OrderResponseStatus.REJECTED
            )
            order.selected_master = response.master
            order.status = OrderStatus.MATCHED
            order.save(update_fields=["selected_master", "status", "updated_at"])

        return Response(OrderDetailSerializer(order, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="complete", permission_classes=[IsAuthenticated, IsClient])
    def complete(self, request, pk=None):
        order = self._get_my_order(request, pk)
        if order.status not in (OrderStatus.MATCHED, OrderStatus.IN_PROGRESS):
            raise ValidationError("Buyurtma yakunlanishi uchun avval usta tanlangan bo'lishi kerak")
        order.status = OrderStatus.COMPLETED
        order.completed_at = timezone.now()
        order.save(update_fields=["status", "completed_at", "updated_at"])

        if order.selected_master_id:
            MasterProfile.objects.filter(id=order.selected_master_id).update(
                completed_orders_cache=F("completed_orders_cache") + 1
            )
        return Response(OrderDetailSerializer(order, context={"request": request}).data)

    @action(detail=True, methods=["get"], url_path="responses")
    def responses(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        if order.client != request.user and not request.user.is_staff:
            raise PermissionDenied()
        qs = order.responses.select_related("master__user").all()
        return Response(OrderResponseSerializer(qs, many=True).data)

    # ---------- Usta ----------
    @action(detail=False, methods=["get"], url_path="feed", permission_classes=[IsAuthenticated, IsMaster])
    def feed(self, request):
        """Usta uchun aktiv orderlar ro'yxati — AI matching score bo'yicha tartibga solingan."""
        from apps.matching.models import OrderMatch

        profile = getattr(request.user, "master_profile", None)
        if not profile:
            return Response([])

        matched_orders = (
            OrderMatch.objects.filter(master=profile, order__status=OrderStatus.PUBLISHED)
            .select_related("order__category", "order__region", "order__client")
            .order_by("-score")
        )
        order_ids = list(matched_orders.values_list("order_id", flat=True))

        # Fallback: matching natijasi yo'q bo'lsa, eski usul (kategoriya bo'yicha)
        if not order_ids:
            qs = (
                Order.objects.filter(status=OrderStatus.PUBLISHED)
                .filter(category__in=profile.categories.all())
                .select_related("category", "region", "client")
                .prefetch_related("images")
                .order_by("-created_at")
            )
        else:
            qs = (
                Order.objects.filter(id__in=order_ids)
                .select_related("category", "region", "client")
                .prefetch_related("images")
            )
            # Score bo'yicha tartibni saqlash
            preserved_order = {oid: idx for idx, oid in enumerate(order_ids)}
            qs = sorted(qs, key=lambda o: preserved_order.get(o.id, 999))

        page = self.paginate_queryset(qs)
        ser = OrderListSerializer(page if page is not None else qs, many=True, context={"request": request})
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @action(detail=True, methods=["get"], url_path="matches", permission_classes=[IsAuthenticated, IsClient])
    def matches(self, request, pk=None):
        """Mijoz: AI tavsiya etgan ustalar ro'yxati."""
        from apps.matching.models import OrderMatch
        from apps.masters.serializers import MasterListSerializer

        order = self._get_my_order(request, pk)
        matches = (
            OrderMatch.objects.filter(order=order)
            .select_related("master__user")
            .prefetch_related("master__categories")
            .order_by("-score")
        )
        OrderMatch.objects.filter(order=order, is_shown_to_client=False).update(is_shown_to_client=True)
        return Response([
            {
                "master": MasterListSerializer(m.master).data,
                "score": str(m.score),
                "reason": m.reason,
            }
            for m in matches
        ])

    @action(
        detail=True,
        methods=["post", "get"],
        url_path="respond",
        permission_classes=[IsAuthenticated, IsMaster],
    )
    def respond(self, request, pk=None):
        order = get_object_or_404(Order, pk=pk)
        profile = getattr(request.user, "master_profile", None)
        if not profile:
            raise PermissionDenied("Usta profili topilmadi")

        if request.method == "GET":
            resp = OrderResponse.objects.filter(order=order, master=profile).first()
            return Response(OrderResponseSerializer(resp).data if resp else None)

        if order.status != OrderStatus.PUBLISHED:
            raise ValidationError("Bu order endi javob qabul qilmaydi")

        ser = OrderResponseCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        resp, created = OrderResponse.objects.update_or_create(
            order=order, master=profile, defaults=ser.validated_data
        )
        return Response(
            OrderResponseSerializer(resp).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    # ---------- Util ----------
    def _get_my_order(self, request, pk) -> Order:
        order = get_object_or_404(Order, pk=pk)
        if order.client != request.user:
            raise PermissionDenied()
        return order


class BookingRequestViewSet(viewsets.ModelViewSet):
    """Mijoz tomonidan ustaga yuborilgan band qilish so'rovlari.

    Mijoz: yaratadi, ko'radi, bekor qiladi.
    Usta: o'ziga kelganlarini ko'radi, qabul qiladi yoki rad etadi.
        Qabul qilganda is_available=False bo'ladi.
        complete'ga bosganda is_available=True ga qaytadi.
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = (
            BookingRequest.objects.select_related(
                "order__category", "client", "master__user"
            )
            .prefetch_related("master__categories")
            .all()
        )
        if user.is_staff:
            return qs
        # Foydalanuvchi faqat o'ziga taalluqli so'rovlarni ko'radi
        return qs.filter(client=user) | qs.filter(master__user=user)

    def get_serializer_class(self):
        if self.action == "create":
            return BookingRequestCreateSerializer
        return BookingRequestSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.is_client:
            raise PermissionDenied("Faqat mijozlar band qilishi mumkin")

        ser = BookingRequestCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        order = ser.validated_data["order"]
        master = ser.validated_data["master"]

        if order.client_id != request.user.id:
            raise PermissionDenied("Faqat o'z buyurtmangizga so'rov yuborishingiz mumkin")

        if BookingRequest.objects.filter(order=order, master=master).exists():
            raise ValidationError("Bu ustaga so'rov allaqachon yuborilgan")

        booking = ser.save(client=request.user, status=BookingStatus.PENDING)
        return Response(
            BookingRequestSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )

    # ---------- Mijoz ----------
    @action(detail=False, methods=["get"], url_path="my-sent", permission_classes=[IsAuthenticated, IsClient])
    def my_sent(self, request):
        """Mijoz: men yuborgan so'rovlar."""
        qs = (
            BookingRequest.objects.filter(client=request.user)
            .select_related("order__category", "master__user")
            .prefetch_related("master__categories")
            .order_by("-created_at")
        )
        return Response(BookingRequestSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="cancel", permission_classes=[IsAuthenticated, IsClient])
    def cancel(self, request, pk=None):
        booking = get_object_or_404(BookingRequest, pk=pk)
        if booking.client_id != request.user.id:
            raise PermissionDenied()
        if booking.status not in (BookingStatus.PENDING, BookingStatus.ACCEPTED):
            raise ValidationError("Bu so'rovni bekor qilib bo'lmaydi")
        booking.status = BookingStatus.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.save(update_fields=["status", "cancelled_at", "updated_at"])
        return Response(BookingRequestSerializer(booking).data)

    # ---------- Usta ----------
    @action(detail=False, methods=["get"], url_path="my-received", permission_classes=[IsAuthenticated, IsMaster])
    def my_received(self, request):
        """Usta: menga kelgan so'rovlar."""
        profile = getattr(request.user, "master_profile", None)
        if not profile:
            return Response([])
        qs = (
            BookingRequest.objects.filter(master=profile)
            .select_related("order__category", "client")
            .order_by("-created_at")
        )
        return Response(BookingRequestSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], url_path="accept", permission_classes=[IsAuthenticated, IsMaster])
    def accept(self, request, pk=None):
        """Usta so'rovni qabul qiladi:
          - Bookingni 'accepted' holatiga o'tkazadi
          - Ustani 'band' (is_available=False) qiladi
          - Buyurtmaga selected_master o'rnatadi va status='matched'
          - Shu buyurtma uchun boshqa kutilayotgan so'rovlarni 'declined' qiladi
          - Buyurtma boshqa ustalarning feed'ida ko'rinmaydi.
        """
        booking = get_object_or_404(BookingRequest, pk=pk)
        if booking.master.user_id != request.user.id:
            raise PermissionDenied()
        if booking.status != BookingStatus.PENDING:
            raise ValidationError("So'rov holati noto'g'ri")

        # Buyurtma allaqachon boshqa ustaga band bo'lib qolgan bo'lmasin
        if booking.order.status in (OrderStatus.MATCHED, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED):
            raise ValidationError("Bu buyurtma allaqachon boshqa ustaga band qilingan")

        with transaction.atomic():
            booking.status = BookingStatus.ACCEPTED
            booking.accepted_at = timezone.now()
            booking.save(update_fields=["status", "accepted_at", "updated_at"])

            # Ustani band qilamiz — boshqa mijozlarga ko'rinmaydi
            MasterProfile.objects.filter(id=booking.master_id).update(is_available=False)

            # Buyurtmani ham 'matched' qilamiz va shu ustani tanlanganlar ro'yxatiga olamiz —
            # endi buyurtma boshqa ustalarning katalogida ko'rinmaydi.
            booking.order.status = OrderStatus.MATCHED
            booking.order.selected_master_id = booking.master_id
            booking.order.save(
                update_fields=["status", "selected_master", "updated_at"]
            )

            # Shu buyurtma uchun boshqa kutilayotgan so'rovlarni avtomatik rad etamiz
            BookingRequest.objects.filter(
                order=booking.order, status=BookingStatus.PENDING
            ).exclude(id=booking.id).update(status=BookingStatus.DECLINED)

        return Response(BookingRequestSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="decline", permission_classes=[IsAuthenticated, IsMaster])
    def decline(self, request, pk=None):
        booking = get_object_or_404(BookingRequest, pk=pk)
        if booking.master.user_id != request.user.id:
            raise PermissionDenied()
        if booking.status != BookingStatus.PENDING:
            raise ValidationError("So'rov holati noto'g'ri")
        booking.status = BookingStatus.DECLINED
        booking.save(update_fields=["status", "updated_at"])
        return Response(BookingRequestSerializer(booking).data)

    @action(detail=True, methods=["post"], url_path="complete", permission_classes=[IsAuthenticated, IsMaster])
    def complete(self, request, pk=None):
        """Usta ish bajarilganini belgilaydi va aktiv holatga qaytadi."""
        booking = get_object_or_404(BookingRequest, pk=pk)
        if booking.master.user_id != request.user.id:
            raise PermissionDenied()
        if booking.status != BookingStatus.ACCEPTED:
            raise ValidationError("Faqat qabul qilingan so'rovni yakunlash mumkin")

        with transaction.atomic():
            booking.status = BookingStatus.COMPLETED
            booking.completed_at = timezone.now()
            booking.save(update_fields=["status", "completed_at", "updated_at"])

            # Ustani yana aktiv qilamiz
            MasterProfile.objects.filter(id=booking.master_id).update(
                is_available=True,
                completed_orders_cache=F("completed_orders_cache") + 1,
            )

            # Buyurtmani ham yakunlangan deb belgilash
            booking.order.status = OrderStatus.COMPLETED
            booking.order.completed_at = timezone.now()
            booking.order.selected_master_id = booking.master_id
            booking.order.save(
                update_fields=["status", "completed_at", "selected_master", "updated_at"]
            )

        return Response(BookingRequestSerializer(booking).data)
