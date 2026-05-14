"""Mavjud backup fayllarini ko'rsatish.

Foydalanish:
    python manage.py list_backups
    python manage.py list_backups --dir /custom/path/
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Backup papkasidagi mavjud backuplarni ko'rsatish"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dir", "-d",
            default=None,
            help="Backup papkasi (default: BASE_DIR/backups/)",
        )

    def handle(self, *args, **opts):
        backup_dir = Path(opts["dir"]) if opts["dir"] else Path(settings.BASE_DIR) / "backups"

        if not backup_dir.exists():
            self.stdout.write(self.style.WARNING(f"Papka mavjud emas: {backup_dir}"))
            return

        files = sorted(backup_dir.glob("db_*.sqlite3*"), reverse=True)

        if not files:
            self.stdout.write("Backup topilmadi")
            return

        self.stdout.write(f"\n{backup_dir}:\n")
        self.stdout.write(f"  {'Fayl':<45} {'Hajm':>10}  {'Yaratilgan':<20}")
        self.stdout.write("  " + "-" * 80)

        total = 0
        for f in files:
            size = f.stat().st_size
            total += size
            mtime = datetime.fromtimestamp(f.stat().st_mtime)
            self.stdout.write(
                f"  {f.name:<45} {_humansize(size):>10}  {mtime:%Y-%m-%d %H:%M:%S}"
            )

        self.stdout.write("  " + "-" * 80)
        self.stdout.write(f"  Jami: {len(files)} ta fayl, {_humansize(total)}\n")


def _humansize(num: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num < 1024:
            return f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} TB"
