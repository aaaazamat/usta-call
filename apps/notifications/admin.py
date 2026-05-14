from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import DeviceToken, Notification


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ("id", "user", "type", "title", "read_at", "created_at")
    list_filter = ("type", "read_at")
    search_fields = ("user__phone", "title", "body")


@admin.register(DeviceToken)
class DeviceTokenAdmin(ModelAdmin):
    list_display = ("id", "user", "platform", "is_active", "created_at")
    list_filter = ("platform", "is_active")
    search_fields = ("user__phone", "token")
