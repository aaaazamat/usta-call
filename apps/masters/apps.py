from django.apps import AppConfig


class MastersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.masters"
    label = "masters"

    def ready(self) -> None:
        from . import signals  # noqa: F401
