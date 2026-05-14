from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import OtpCode, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin, ModelAdmin):
    # Unfold formlarini ulaymiz
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = (
        "phone",
        "full_name",
        "role",
        "is_verified",
        "is_active",
        "created_at",
    )
    list_filter = ("role", "is_verified", "is_active", "is_staff")
    search_fields = ("phone", "full_name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Profil", {"fields": ("full_name", "role", "avatar")}),
        ("Holat", {"fields": ("is_verified", "is_active", "last_seen_at")}),
        (
            "Ruxsatlar",
            {
                "fields": (
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone",
                    "full_name",
                    "role",
                    "password1",
                    "password2",
                ),
            },
        ),
    )


@admin.register(OtpCode)
class OtpCodeAdmin(ModelAdmin):
    list_display = ("phone", "code", "purpose", "expires_at", "consumed_at", "attempts")
    list_filter = ("purpose",)
    search_fields = ("phone",)
    readonly_fields = (
        "code",
        "phone",
        "expires_at",
        "consumed_at",
        "attempts",
        "created_at",
    )
