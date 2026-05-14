from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import Category, MasterProfile, PortfolioImage, PortfolioItem, Region, Skill


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ("name", "slug", "parent", "order", "is_active")
    list_filter = ("is_active", "parent")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("order", "is_active")


@admin.register(Skill)
class SkillAdmin(ModelAdmin):
    list_display = ("name", "category", "slug")
    list_filter = ("category",)
    search_fields = ("name", "aliases")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Region)
class RegionAdmin(ModelAdmin):
    list_display = ("name", "kind", "parent")
    list_filter = ("kind", "parent")
    search_fields = ("name",)


class PortfolioImageInline(TabularInline):
    model = PortfolioImage
    extra = 1


@admin.register(PortfolioItem)
class PortfolioItemAdmin(ModelAdmin):
    list_display = ("title", "master", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("title", "master__user__phone")
    inlines = [PortfolioImageInline]


@admin.register(MasterProfile)
class MasterProfileAdmin(ModelAdmin):
    list_display = (
        "user",
        "is_approved",
        "is_available",
        "experience_years",
        "rating_cache",
        "reviews_count_cache",
    )
    list_filter = ("is_approved", "is_available")
    search_fields = ("user__phone", "user__full_name", "bio")
    filter_horizontal = ("categories", "skills", "regions")
    list_editable = ("is_approved", "is_available")
    readonly_fields = ("rating_cache", "reviews_count_cache", "completed_orders_cache")
