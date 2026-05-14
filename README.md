# usta-call

Ustalar va foydalanuvchilarni bog'laydigan marketplace. Django REST API + Next.js frontend + AI matching.

## Stack

- **Backend:** Django 5, DRF, Channels (WebSocket), Celery, PostgreSQL, Redis
- **AI:** Claude / OpenAI API (order tahlili va matching)
- **Frontend (alohida repo):** Next.js
- **Storage:** S3-compatible (media), Redis (cache + pub/sub)

## Loyiha tuzilmasi

```
config/                 # Django proyekt — settings (base/dev/prod), urls, asgi, wsgi, celery
apps/
  common/               # Umumiy modellar, permissions, utils
  accounts/             # Custom User, telefon/OTP auth (Sprint 1)
  masters/              # Usta profili, kategoriya, portfolio (Sprint 2)
  orders/               # Order va javoblar (Sprint 3)
  matching/             # AI matching service (Sprint 4)
  reviews/              # Sharhlar va reyting (Sprint 5)
  chat/                 # WebSocket chat (Sprint 6)
  notifications/        # In-app + push (Sprint 7)
requirements/
  base.txt              # Umumiy paketlar
  dev.txt               # + test, linter, debug toolbar
  prod.txt              # + gunicorn, whitenoise
```

## Boshlash (lokal)

```powershell
# 1. Virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Paketlar
pip install -r requirements/dev.txt

# 3. .env
Copy-Item .env.example .env

# 4. Migration va run
python manage.py migrate
python manage.py runserver
```

## Docker bilan

```bash
docker compose up --build
```

API: http://localhost:8000/api/v1/
Admin: http://localhost:8000/admin/

## API endpoint'lar (asosiy)

| Method | URL | Tavsif |
|---|---|---|
| POST | `/api/v1/auth/register/` | Telefon raqami orqali ro'yxat (OTP) |
| POST | `/api/v1/auth/verify/` | OTP tasdiq → JWT |
| GET | `/api/v1/masters/` | Ustalar ro'yxati (filter, search) |
| POST | `/api/v1/orders/` | Order yaratish (rasmlar bilan) |
| GET | `/api/v1/orders/{id}/matches/` | AI tavsiya etgan ustalar |
| POST | `/api/v1/reviews/` | Sharh qoldirish |
| WS | `/ws/chat/{room_id}/` | Real-time chat |

To'liq ro'yxat har bir app'ning `urls.py` faylida.
