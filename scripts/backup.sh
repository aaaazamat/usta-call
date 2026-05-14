#!/bin/bash
# usta-call SQLite avto-backup — cron'dan ishga tushadi.
#
# O'rnatish:
#   sudo chmod +x /opt/usta-call/scripts/backup.sh
#   crontab -e ga qo'shing:
#     # Har soat boshida backup
#     0 * * * * /opt/usta-call/scripts/backup.sh >> /var/log/usta-backup.log 2>&1
#     # Yoki har 6 soatda S3 ga yuklash bilan
#     0 */6 * * * UPLOAD_S3=1 /opt/usta-call/scripts/backup.sh >> /var/log/usta-backup.log 2>&1

set -euo pipefail

# --- Sozlamalar ---
APP_DIR="${APP_DIR:-/opt/usta-call}"
VENV_PYTHON="${VENV_PYTHON:-$APP_DIR/venv/bin/python}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-30}"
UPLOAD_S3="${UPLOAD_S3:-0}"

# --- Logging ---
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Backup boshlandi"

# --- Pre-flight ---
if [[ ! -x "$VENV_PYTHON" ]]; then
    echo "[$TIMESTAMP] XATO: Python topilmadi: $VENV_PYTHON" >&2
    exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
    echo "[$TIMESTAMP] XATO: Loyiha papkasi topilmadi: $APP_DIR" >&2
    exit 1
fi

# --- Backup ---
cd "$APP_DIR"

ARGS=(backup_db --output "$BACKUP_DIR" --keep "$KEEP_DAYS" --quiet)
if [[ "$UPLOAD_S3" == "1" ]]; then
    ARGS+=(--upload-s3)
fi

if BACKUP_PATH=$("$VENV_PYTHON" manage.py "${ARGS[@]}"); then
    echo "[$TIMESTAMP] [OK] Backup tayyor: $BACKUP_PATH"
    exit 0
else
    EXIT_CODE=$?
    echo "[$TIMESTAMP] [ERR] Backup xatosi (exit $EXIT_CODE)" >&2
    # Sentry'ga xabar yuborish (ixtiyoriy) — agar sentry-cli o'rnatilgan bo'lsa
    # sentry-cli send-event -m "Backup failed" -l error
    exit $EXIT_CODE
fi
