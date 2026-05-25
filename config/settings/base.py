"""
Base settings — barcha muhitlar uchun umumiy.
Muhit-spetsifik qiymatlar dev.py / prod.py da override qilinadi.
"""
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="dev-insecure-change-me")
DEBUG = env.bool("DEBUG", default=False)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

# Applications
DJANGO_APPS = [
    "daphne",  # ASGI server — channels'dan oldin
    # django-unfold MUST django.contrib.admin'dan oldin bo'lishi shart
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "channels",
    "parler",
]

LOCAL_APPS = [
    "apps.common",
    "apps.accounts",
    "apps.masters",
    "apps.orders",
    "apps.matching",
    "apps.reviews",
    "apps.chat",
    "apps.notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise — static fayllarni production'da xizmat qiladi.
    # SecurityMiddleware'dan keyin, lekin boshqalardan oldin bo'lishi shart.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    # LocaleMiddleware — Accept-Language headerni o'qib joriy tilni o'rnatadi.
    # SessionMiddleware'dan keyin, CommonMiddleware'dan oldin bo'lishi shart.
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# Database — DATABASE_URL orqali (dj-database-url)
import dj_database_url  # noqa: E402

DATABASES = {
    "default": dj_database_url.config(
        default=env("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
    )
}

# SQLite uchun WAL mode + boshqa pragma'lar — concurrency va tezlikni oshiradi
if DATABASES["default"]["ENGINE"] == "django.db.backends.sqlite3":
    DATABASES["default"]["OPTIONS"] = {
        "init_command": (
            "PRAGMA journal_mode=WAL;"             # parallel o'qish + yozish
            "PRAGMA synchronous=NORMAL;"            # tezlik vs xavfsizlik balansi
            "PRAGMA cache_size=-64000;"             # 64MB cache (RAM)
            "PRAGMA foreign_keys=ON;"               # FK constraint
            "PRAGMA temp_store=MEMORY;"             # vaqtinchalik jadvallarni RAMda
            "PRAGMA mmap_size=268435456;"           # 256MB memory-mapped I/O
        ),
        "transaction_mode": "IMMEDIATE",            # write lock'ni darrov olish (Django 5.1+)
    }

# Custom user
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Localization
LANGUAGE_CODE = "uz"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

# Qo'llab-quvvatlanadigan tillar: o'zbek, qoraqalpoq, rus
LANGUAGES = [
    ("uz", "Oʻzbekcha"),
    ("kk", "Qaraqalpaqsha"),
    ("ru", "Русский"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

# django-parler — model tarjima konfiguratsiyasi
PARLER_LANGUAGES = {
    None: (
        {"code": "uz"},
        {"code": "kk"},
        {"code": "ru"},
    ),
    "default": {
        "fallback": "uz",
        "fallbacks": ["uz", "ru"],
        "hide_untranslated": False,
    },
}
PARLER_DEFAULT_LANGUAGE_CODE = "uz"

# Static / Media
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "240/min",
        "otp": "5/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("JWT_ACCESS_LIFETIME_MIN", default=60)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("JWT_REFRESH_LIFETIME_DAYS", default=14)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# CORS
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])

# Channels (Redis backed in dev/prod)
REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [REDIS_URL]},
    },
}

# Celery
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TIMEZONE = TIME_ZONE

# AI
AI_PROVIDER = env("AI_PROVIDER", default="gemini")  # gemini|anthropic|openai|keyword
ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY", default="")
OPENAI_API_KEY = env("OPENAI_API_KEY", default="")
GEMINI_API_KEY = env("GEMINI_API_KEY", default="")
AI_MODEL_ANTHROPIC = env("AI_MODEL_ANTHROPIC", default="claude-opus-4-7")
AI_MODEL_OPENAI = env("AI_MODEL_OPENAI", default="gpt-4o-mini")
AI_MODEL_GEMINI = env("AI_MODEL_GEMINI", default="gemini-2.0-flash")

# SMS / OTP (console | telegram | eskiz)
SMS_PROVIDER = env("SMS_PROVIDER", default="console")
ESKIZ_EMAIL = env("ESKIZ_EMAIL", default="")
ESKIZ_PASSWORD = env("ESKIZ_PASSWORD", default="")
ESKIZ_FROM = env("ESKIZ_FROM", default="4546")

# Telegram bot — OTP yetkazib berish va Telegram orqali kirish
TELEGRAM_BOT_TOKEN = env("TELEGRAM_BOT_TOKEN", default="")
TELEGRAM_BOT_USERNAME = env("TELEGRAM_BOT_USERNAME", default="")
TELEGRAM_WEBHOOK_SECRET = env("TELEGRAM_WEBHOOK_SECRET", default="")

# Google OAuth (1 bosishda kirish)
GOOGLE_OAUTH_CLIENT_ID = env("GOOGLE_OAUTH_CLIENT_ID", default="")
GOOGLE_OAUTH_CLIENT_SECRET = env("GOOGLE_OAUTH_CLIENT_SECRET", default="")

# Beta mode — OTP tekshiruvini o'tkazib yuboradi va telefondan to'g'ridan-to'g'ri tokenlar beradi.
# DIQQAT: Faqat sinov uchun! Production'da hech qachon True qilmang.
BETA_AUTO_LOGIN = env.bool("BETA_AUTO_LOGIN", default=False)

# ─────────────────── Django Unfold (admin interfeysi) ───────────────────
# Frontend uslubiga mos zamonaviy Tailwind asosidagi admin tema.
UNFOLD = {
    "SITE_TITLE": "usta-call admin",
    "SITE_HEADER": "usta-call",
    "SITE_SUBHEADER": "Ustalar va mijozlar platformasi",
    "SITE_URL": "/",
    "SITE_SYMBOL": "construction",  # Material Symbol — wrench/usta belgisi
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "SHOW_BACK_BUTTON": True,
    "BORDER_RADIUS": "8px",
    # Frontend bilan bir xil ranglar (oxlabs slate + blue primary)
    "COLORS": {
        "base": {
            "50": "248 250 252",
            "100": "241 245 249",
            "200": "226 232 240",
            "300": "203 213 225",
            "400": "148 163 184",
            "500": "100 116 139",
            "600": "71 85 105",
            "700": "51 65 85",
            "800": "30 41 59",
            "900": "15 23 42",
            "950": "2 6 23",
        },
        "primary": {
            "50": "239 246 255",
            "100": "219 234 254",
            "200": "191 219 254",
            "300": "147 197 253",
            "400": "96 165 250",
            "500": "59 130 246",
            "600": "37 99 235",
            "700": "29 78 216",
            "800": "30 64 175",
            "900": "30 58 138",
            "950": "23 37 84",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Foydalanuvchilar",
                "separator": True,
                "items": [
                    {
                        "title": "Foydalanuvchilar",
                        "icon": "person",
                        "link": "/admin/accounts/user/",
                    },
                    {
                        "title": "OTP kodlar",
                        "icon": "vpn_key",
                        "link": "/admin/accounts/otpcode/",
                    },
                ],
            },
            {
                "title": "Ustalar va katalog",
                "separator": True,
                "items": [
                    {
                        "title": "Usta profillari",
                        "icon": "engineering",
                        "link": "/admin/masters/masterprofile/",
                    },
                    {
                        "title": "Kategoriyalar",
                        "icon": "category",
                        "link": "/admin/masters/category/",
                    },
                    {
                        "title": "Ko'nikmalar",
                        "icon": "psychology",
                        "link": "/admin/masters/skill/",
                    },
                    {
                        "title": "Hududlar",
                        "icon": "map",
                        "link": "/admin/masters/region/",
                    },
                    {
                        "title": "Portfolio",
                        "icon": "photo_library",
                        "link": "/admin/masters/portfolioitem/",
                    },
                ],
            },
            {
                "title": "Buyurtmalar va so'rovlar",
                "separator": True,
                "items": [
                    {
                        "title": "Buyurtmalar",
                        "icon": "assignment",
                        "link": "/admin/orders/order/",
                    },
                    {
                        "title": "Band qilish so'rovlari",
                        "icon": "bookmark",
                        "link": "/admin/orders/bookingrequest/",
                    },
                    {
                        "title": "Ustalar takliflari",
                        "icon": "local_offer",
                        "link": "/admin/orders/orderresponse/",
                    },
                ],
            },
            {
                "title": "Aloqa va sharhlar",
                "separator": True,
                "items": [
                    {
                        "title": "Chat xonalari",
                        "icon": "chat",
                        "link": "/admin/chat/chatroom/",
                    },
                    {
                        "title": "Xabarlar",
                        "icon": "message",
                        "link": "/admin/chat/message/",
                    },
                    {
                        "title": "Sharhlar",
                        "icon": "star_rate",
                        "link": "/admin/reviews/review/",
                    },
                ],
            },
            {
                "title": "AI va boshqalar",
                "separator": True,
                "items": [
                    {
                        "title": "AI matching natijalari",
                        "icon": "psychology_alt",
                        "link": "/admin/matching/ordermatch/",
                    },
                    {
                        "title": "Bildirishnomalar",
                        "icon": "notifications",
                        "link": "/admin/notifications/notification/",
                    },
                    {
                        "title": "Guruhlar",
                        "icon": "group",
                        "link": "/admin/auth/group/",
                    },
                ],
            },
        ],
    },
}
