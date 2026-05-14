from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DeviceTokenViewSet, NotificationViewSet

app_name = "notifications"

router = DefaultRouter()
router.register("", NotificationViewSet, basename="notification")
router.register("device-tokens", DeviceTokenViewSet, basename="device-token")

urlpatterns = [
    path("", include(router.urls)),
]
