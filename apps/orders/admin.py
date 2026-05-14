from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import BookingRequest, Order, OrderImage, OrderResponse


class OrderImageInline(TabularInline):
    model = OrderImage
    extra = 0


class OrderResponseInline(TabularInline):
    model = OrderResponse
    extra = 0
    readonly_fields = (
        "master",
        "price_offer",
        "message",
        "eta_hours",
        "status",
        "created_at",
    )


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = (
        "id",
        "title",
        "client",
        "status",
        "category",
        "urgency",
        "selected_master",
        "created_at",
    )
    list_filter = ("status", "urgency", "category")
    search_fields = ("title", "description", "address", "client__phone")
    readonly_fields = ("ai_summary", "ai_processed_at", "created_at", "updated_at")
    filter_horizontal = ("ai_extracted_skills",)
    inlines = [OrderImageInline, OrderResponseInline]


@admin.register(OrderResponse)
class OrderResponseAdmin(ModelAdmin):
    list_display = ("id", "order", "master", "price_offer", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("order__title", "master__user__phone")


@admin.register(BookingRequest)
class BookingRequestAdmin(ModelAdmin):
    list_display = (
        "id",
        "order",
        "client",
        "master",
        "status",
        "created_at",
        "accepted_at",
        "completed_at",
    )
    list_filter = ("status",)
    search_fields = (
        "order__title",
        "client__phone",
        "master__user__phone",
        "note",
    )
    readonly_fields = (
        "order",
        "client",
        "master",
        "accepted_at",
        "completed_at",
        "cancelled_at",
        "created_at",
        "updated_at",
    )
