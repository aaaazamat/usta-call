#!/usr/bin/env bash
# Render.com tomonidan har bir deploy oldidan ishga tushiriladi.
# Vazifa: paketlarni o'rnatish, static fayllarni yig'ish, DB migratsiyalarini qo'llash,
# tarjima (.po → .mo) fayllarini kompilyatsiya qilish.

set -o errexit  # birinchi xatoda to'xtaydi

echo "==> Paketlarni o'rnatish..."
pip install -r requirements/prod.txt

echo "==> Static fayllarni yig'ish..."
python manage.py collectstatic --no-input

echo "==> Tarjima fayllarini kompilyatsiya qilish (.po -> .mo)..."
# Render image'da gettext oldindan o'rnatilgan emas — Python babel orqali qilamiz.
python -c "
from babel.messages.mofile import write_mo
from babel.messages.pofile import read_po
import os
for lang in ['uz', 'kk', 'ru']:
    po = f'locale/{lang}/LC_MESSAGES/django.po'
    mo = f'locale/{lang}/LC_MESSAGES/django.mo'
    if not os.path.exists(po):
        print(f'  skip {lang} (no .po)')
        continue
    with open(po, 'rb') as f:
        catalog = read_po(f)
    with open(mo, 'wb') as f:
        write_mo(f, catalog)
    print(f'  ok {lang}')
"

echo "==> Database migratsiyalari..."
python manage.py migrate --noinput

echo "==> Boshlang'ich katalog (kategoriyalar, hududlar)..."
python manage.py seed_catalog || echo "seed_catalog skipped"

echo "==> Ustalar portfolio rasmlari (internet, idempotent)..."
python manage.py seed_portfolio || echo "seed_portfolio skipped"

echo "==> AI orqali katalog tarjimasi (uz -> ru, kk)..."
# Faqat tarjimasiz yozuvlar uchun ishlaydi (skip if already translated).
# Gemini API xatosi bo'lsa ham deploy davom etadi (|| true).
python manage.py translate_existing_data --target=all || echo "translate_existing_data skipped (API yo'q yoki xato)"

echo "==> Build tugadi (multilang ready)"
