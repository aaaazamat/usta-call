from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import Review, ReviewImage


class ReviewImageInline(TabularInline):
    model = ReviewImage
    extra = 0


@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = ("id", "client", "master", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("client__phone", "master__user__phone", "text")
    readonly_fields = ("created_at", "updated_at")
    inlines = [ReviewImageInline]
