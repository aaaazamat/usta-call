from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsMaster

from .filters import MasterFilter
from .models import Category, MasterProfile, PortfolioItem, Region, Skill
from .serializers import (
    CategorySerializer,
    MasterDetailSerializer,
    MasterListSerializer,
    MasterUpdateSerializer,
    PortfolioItemSerializer,
    RegionSerializer,
    SkillSerializer,
)


class CategoryViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    pagination_class = None


class SkillViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Skill.objects.select_related("category")
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]
    filterset_fields = ("category",)
    search_fields = ("name", "aliases")


class RegionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Region.objects.select_related("parent")
    serializer_class = RegionSerializer
    permission_classes = [AllowAny]
    filterset_fields = ("kind", "parent")
    pagination_class = None


class MasterViewSet(viewsets.ReadOnlyModelViewSet):
    """Ustalar katalogi — list va detail. Faqat tasdiqlangan ustalar ko'rinadi."""

    permission_classes = [AllowAny]
    filterset_class = MasterFilter
    search_fields = ("user__full_name", "bio", "skills__name", "categories__name")
    ordering_fields = ("rating_cache", "reviews_count_cache", "completed_orders_cache", "created_at")
    ordering = ("-rating_cache", "-reviews_count_cache")

    def get_queryset(self):
        qs = (
            MasterProfile.objects.filter(is_approved=True, user__is_active=True)
            .select_related("user")
            .prefetch_related("categories", "skills", "regions")
        )
        if self.action == "retrieve":
            qs = qs.prefetch_related("portfolio__images")
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return MasterDetailSerializer
        return MasterListSerializer

    @action(detail=True, methods=["get"], url_path="portfolio")
    def portfolio(self, request, pk=None):
        master = self.get_object()
        items = master.portfolio.prefetch_related("images").all()
        return Response(PortfolioItemSerializer(items, many=True).data)


class MeMasterView(viewsets.ViewSet):
    """Usta o'z profili va portfoliosini boshqaradi."""

    permission_classes = [IsAuthenticated, IsMaster]

    def _profile(self, user) -> MasterProfile:
        profile, _ = MasterProfile.objects.get_or_create(user=user)
        return profile

    def retrieve(self, request):
        return Response(MasterDetailSerializer(self._profile(request.user)).data)

    def partial_update(self, request):
        profile = self._profile(request.user)
        ser = MasterUpdateSerializer(profile, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(MasterDetailSerializer(profile).data)

    def portfolio_list(self, request):
        profile = self._profile(request.user)
        items = profile.portfolio.prefetch_related("images").all()
        return Response(PortfolioItemSerializer(items, many=True).data)

    def portfolio_create(self, request):
        profile = self._profile(request.user)
        ser = PortfolioItemSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(master=profile)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    def portfolio_delete(self, request, item_id=None):
        profile = self._profile(request.user)
        item = get_object_or_404(PortfolioItem, id=item_id, master=profile)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
