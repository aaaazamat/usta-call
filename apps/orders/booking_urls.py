"""Band qilish so'rovlari uchun alohida URL routing.

`/api/v1/bookings/` ostida joylashadi.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BookingRequestViewSet

app_name = "bookings"

router = DefaultRouter()
router.register("", BookingRequestViewSet, basename="booking")

urlpatterns = [
    path("", include(router.urls)),
]
