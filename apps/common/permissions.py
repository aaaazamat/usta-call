from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Faqat ob'ekt egasi (obj.user yoki obj.client/master) o'zgartira oladi."""

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None) or getattr(obj, "client", None) or getattr(obj, "master", None)
        return owner == request.user


class IsMaster(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "master"


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "client"
