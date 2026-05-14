"""Celery konfiguratsiyasi — AI matching, notifikatsiyalar, og'ir tasklar uchun."""
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("usta_call")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
