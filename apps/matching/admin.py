from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import OrderMatch


@admin.register(OrderMatch)
class OrderMatchAdmin(ModelAdmin):
    list_display = (
        "order",
        "master",
        "score",
        "skill_score",
        "region_score",
        "rating_score",
    )
    list_filter = ("is_shown_to_client",)
    search_fields = ("order__title", "master__user__phone")
    readonly_fields = (
        "order",
        "master",
        "score",
        "skill_score",
        "region_score",
        "rating_score",
        "availability_score",
        "reason",
        "created_at",
    )
