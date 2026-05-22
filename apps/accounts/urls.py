from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AddPhoneView,
    GoogleLoginView,
    MeView,
    RequestOtpView,
    SwitchRoleView,
    TelegramLinkPollView,
    TelegramLinkStartView,
    TelegramWebhookView,
    VerifyOtpView,
)

app_name = "accounts"

urlpatterns = [
    # OTP (telefon + SMS / Telegram OTP)
    path("otp/request/", RequestOtpView.as_view(), name="otp-request"),
    path("otp/verify/", VerifyOtpView.as_view(), name="otp-verify"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Me
    path("me/", MeView.as_view(), name="me"),
    path("me/role/", SwitchRoleView.as_view(), name="me-role"),
    path("me/phone/", AddPhoneView.as_view(), name="me-phone"),
    # Telegram bot
    path("telegram/link/start/", TelegramLinkStartView.as_view(), name="tg-link-start"),
    path("telegram/link/poll/", TelegramLinkPollView.as_view(), name="tg-link-poll"),
    path("telegram/webhook/", TelegramWebhookView.as_view(), name="tg-webhook"),
    # Google OAuth
    path("google/", GoogleLoginView.as_view(), name="google-login"),
]
