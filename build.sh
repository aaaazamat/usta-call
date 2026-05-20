#!/usr/bin/env bash
# Render.com tomonidan har bir deploy oldidan ishga tushiriladi.
# Vazifa: paketlarni o'rnatish, static fayllarni yig'ish, DB migratsiyalarini qo'llash.

set -o errexit  # birinchi xatoda to'xtaydi

echo "==> Paketlarni o'rnatish..."
pip install -r requirements/prod.txt

echo "==> Static fayllarni yig'ish..."
python manage.py collectstatic --no-input

echo "==> Database migratsiyalari..."
python manage.py migrate --noinput

echo "==> Boshlang'ich katalog (kategoriyalar, hududlar)..."
python manage.py seed_catalog || echo "seed_catalog skipped"

echo "==> Build tugadi ✓"
