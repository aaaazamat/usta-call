from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ChatRoomViewSet

app_name = "chat"

router = DefaultRouter()
router.register("rooms", ChatRoomViewSet, basename="room")

urlpatterns = [
    path("", include(router.urls)),
]
