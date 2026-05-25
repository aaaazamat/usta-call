from django.contrib import admin
from parler.admin import TranslatableAdmin
from unfold.admin import ModelAdmin, TabularInline

from .models import Category, MasterProfile, PortfolioImage, PortfolioItem, Region, Skill


# Unfold + parler kombinatsiyasi — har ikkala parent kerak.
class UnfoldTranslatableAdmin(TranslatableAdmin, ModelAdmin):
    pass


@admin.register(Category)
class CategoryAdmin(UnfoldTranslatableAdmin):
    list_display = ("name", "slug", "parent", "order", "is_active")
    list_filter = ("is_active", "parent")
    search_fields = ("translations__name",)
    list_editable = ("order", "is_active")


@admin.register(Skill)
class SkillAdmin(UnfoldTranslatableAdmin):
    list_display = ("name", "category", "slug")
    list_filter = ("category",)
    search_fields = ("translations__name", "aliases")


@admin.register(Region)
class RegionAdmin(UnfoldTranslatableAdmin):
    list_display = ("name", "kind", "parent")
    list_filter = ("kind", "parent")
    search_fields = ("translations__name",)


class PortfolioImageInline(TabularInline):
    model = PortfolioImage
    extra = 1


@admin.register(PortfolioItem)
class PortfolioItemAdmin(UnfoldTranslatableAdmin):
    list_display = ("title", "master", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("translations__title", "master__user__phone")
    inlines = [PortfolioImageInline]


@admin.register(MasterProfile)
class MasterProfileAdmin(UnfoldTranslatableAdmin):
    list_display = (
        "user",
        "is_approved",
        "is_available",
        "experience_years",
        "rating_cache",
        "reviews_count_cache",
    )
    list_filter = ("is_approved", "is_available")
    search_fields = ("user__phone", "user__full_name", "translations__bio")
    filter_horizontal = ("categories", "skills", "regions")
    list_editable = ("is_approved", "is_available")
    readonly_fields = ("rating_cache", "reviews_count_cache", "completed_orders_cache")
