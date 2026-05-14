from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import ChatRoom, Message


@admin.register(ChatRoom)
class ChatRoomAdmin(ModelAdmin):
    list_display = ("id", "order", "client", "master", "is_active", "updated_at")
    search_fields = ("client__phone", "master__phone")


@admin.register(Message)
class MessageAdmin(ModelAdmin):
    list_display = ("id", "room", "sender", "text", "read_at", "created_at")
    list_filter = ("read_at",)
    search_fields = ("text",)
