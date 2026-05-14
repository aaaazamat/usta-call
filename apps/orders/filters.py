from django_filters import rest_framework as filters

from .models import Order


class OrderFilter(filters.FilterSet):
    category = filters.NumberFilter(field_name="category_id")
    region = filters.NumberFilter(field_name="region_id")
    status = filters.CharFilter(field_name="status")
    urgency = filters.CharFilter(field_name="urgency")
    min_budget = filters.NumberFilter(field_name="budget_from", lookup_expr="gte")

    class Meta:
        model = Order
        fields = ("category", "region", "status", "urgency", "min_budget")
