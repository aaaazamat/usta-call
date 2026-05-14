"""Backup'dan SQLite bazasini tiklash.

Foydalanish:
    python manage.py restore_db /path/to/db_20260513_120000.sqlite3.gz
    python manage.py restore_db backups/db_20260513_120000.sqlite3.gz --force

XAVFLI: joriy bazaning ustiga yozadi! Avval mavjud DB'ni `.before-restore` deb saqlaydi.
"""
from __future__ import annotations

import gzip
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Backup faylidan SQLite bazasini tiklash (xavfli — joriy bazani almashtiradi!)"

    def add_arguments(self, parser):
        parser.add_argument("backup_path", help="Backup fayl yo'li (.sqlite3 yoki .sqlite3.gz)")
        parser.add_argument(
            "--force", "-f",
            action="store_true",
            help="Tasdiqsiz davom etish",
        )
        parser.add_argument(
            "--no-safety-copy",
            action="store_true",
            help="Joriy DB'ning .before-restore nusxasini olmaslik (tavsiya etilmaydi)",
        )

    def handle(self, *args, **opts):
        db_settings = settings.DATABASES["default"]
        if db_settings["ENGINE"] != "django.db.backends.sqlite3":
            raise CommandError("Bu komanda faqat SQLite uchun")

        db_path = Path(db_settings["NAME"])
        backup_path = Path(opts["backup_path"]).resolve()

        if not backup_path.exists():
            raise CommandError(f"Backup fayl topilmadi: {backup_path}")

        # Backup faylni tekshirish — gzip yoki to'g'ridan-to'g'ri sqlite?
        is_gzipped = backup_path.suffix == ".gz"

        self.stdout.write(self.style.WARNING("[!] DIQQAT — tiklash amaliyoti"))
        self.stdout.write(f"  Backup:  {backup_path}")
        self.stdout.write(f"  Target:  {db_path}")
        if db_path.exists():
            self.stdout.write(f"  Joriy DB hajmi: {_humansize(db_path.stat().st_size)}")

        if not opts["force"]:
            confirm = input("\nDavom etamizmi? Joriy baza ALMASHTIRILADI [yes/NO]: ").strip().lower()
            if confirm not in ("yes", "y", "ha"):
                self.stdout.write("Bekor qilindi.")
                return

        # 1. Joriy DB'ni xavfsiz nusxalash
        if not opts["no_safety_copy"] and db_path.exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safety_path = db_path.with_suffix(f".before-restore-{timestamp}.sqlite3")
            shutil.copy2(db_path, safety_path)
            # WAL/SHM ham
            for suffix in ("-wal", "-shm"):
                aux = Path(str(db_path) + suffix)
                if aux.exists():
                    shutil.copy2(aux, str(safety_path) + suffix)
            self.stdout.write(f"  Xavfsizlik nusxasi: {safety_path}")

        # 2. WAL/SHM eski fayllarni o'chirish (yangi DB bilan ziddiyat bo'lmasin)
        for suffix in ("-wal", "-shm", "-journal"):
            aux = Path(str(db_path) + suffix)
            if aux.exists():
                aux.unlink()

        # 3. Backupni ochish va yozish
        try:
            if is_gzipped:
                self._gunzip(backup_path, db_path)
            else:
                shutil.copy2(backup_path, db_path)
        except Exception as exc:
            raise CommandError(f"Tiklash xatosi: {exc}") from exc

        # 4. Yangi DB'ning yaroqliligini tekshirish
        try:
            con = sqlite3.connect(str(db_path))
            cur = con.cursor()
            cur.execute("PRAGMA integrity_check")
            result = cur.fetchone()[0]
            con.close()
            if result != "ok":
                raise CommandError(f"Tiklangan DB buzilgan: {result}")
        except Exception as exc:
            raise CommandError(f"DB tekshirish xatosi: {exc}") from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"\n[OK] Tiklash muvaffaqiyatli. DB hajmi: {_humansize(db_path.stat().st_size)}"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                "  Eslatma: Django serveri qayta ishga tushirilishi tavsiya etiladi"
            )
        )

    def _gunzip(self, src: Path, dst: Path) -> None:
        with gzip.open(src, "rb") as fin, dst.open("wb") as fout:
            shutil.copyfileobj(fin, fout, length=1024 * 1024)


def _humansize(num: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num < 1024:
            return f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} TB"
