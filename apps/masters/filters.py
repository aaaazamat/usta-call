from django_filters import rest_framework as filters

from .models import MasterProfile


class MasterFilter(filters.FilterSet):
    category = filters.NumberFilter(field_name="categories__id")
    skill = filters.NumberFilter(field_name="skills__id")
    region = filters.NumberFilter(field_name="regions__id")
    min_rating = filters.NumberFilter(field_name="rating_cache", lookup_expr="gte")
    max_rate = filters.NumberFilter(field_name="hourly_rate_from", lookup_expr="lte")
    is_available = filters.BooleanFilter()

    class Meta:
        model = MasterProfile
        fields = ("category", "skill", "region", "min_rating", "max_rate", "is_available")
