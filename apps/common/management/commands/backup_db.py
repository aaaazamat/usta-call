"""SQLite hot backup — DB ishlayotgan paytda ham xavfsiz nusxa oladi.

Foydalanish:
    python manage.py backup_db
    python manage.py backup_db --keep 30 --compress
    python manage.py backup_db --no-compress --output /custom/path/

Xususiyatlari:
    - SQLite ".backup" API — write lock'ni qisqa vaqt ushlaydi (millisekundlar)
    - WAL va SHM fayllar avtomatik to'g'ri ko'chiriladi
    - Gzip compression (5-10x kichikroq fayl)
    - Eski backuplarni avtomatik o'chirish (rotation)
    - S3 upload (USE_S3=True bo'lsa)
    - Cron'dan ishga tushirsa bo'ladi
"""
from __future__ import annotations

import gzip
import shutil
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "SQLite bazasining hot backup'ini oladi (DB ishlayotgan paytda xavfsiz)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output", "-o",
            default=None,
            help="Backup papkasi (default: BASE_DIR/backups/)",
        )
        parser.add_argument(
            "--keep", "-k",
            type=int, default=30,
            help="Necha kunlik backup'larni saqlash (default: 30)",
        )
        parser.add_argument(
            "--no-compress",
            action="store_true",
            help="Gzip compression'ni o'chirish (kattaroq fayl, tez)",
        )
        parser.add_argument(
            "--upload-s3",
            action="store_true",
            help="Backup'ni S3 ga yuklash (settings.USE_S3=True bo'lishi kerak)",
        )
        parser.add_argument(
            "--quiet", "-q",
            action="store_true",
            help="Faqat xatolarni ko'rsatish (cron uchun)",
        )

    def handle(self, *args, **opts):
        db_settings = settings.DATABASES["default"]
        if db_settings["ENGINE"] != "django.db.backends.sqlite3":
            raise CommandError(
                "Bu komanda faqat SQLite uchun. Sizning DB engine: " + db_settings["ENGINE"]
            )

        db_path = Path(db_settings["NAME"])
        if not db_path.exists():
            raise CommandError(f"DB fayl topilmadi: {db_path}")

        backup_dir = Path(opts["output"]) if opts["output"] else Path(settings.BASE_DIR) / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)

        compress = not opts["no_compress"]
        quiet = opts["quiet"]

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = ".sqlite3.gz" if compress else ".sqlite3"
        backup_path = backup_dir / f"db_{timestamp}{ext}"

        if not quiet:
            self.stdout.write(f"DB:     {db_path} ({_humansize(db_path.stat().st_size)})")
            self.stdout.write(f"Target: {backup_path}")

        # 1. Hot backup — SQLite ".backup" API orqali
        temp_path = backup_dir / f".tmp_{timestamp}.sqlite3"
        try:
            self._sqlite_backup(db_path, temp_path)
        except Exception as exc:
            temp_path.unlink(missing_ok=True)
            raise CommandError(f"Backup xatosi: {exc}") from exc

        # 2. Compression
        if compress:
            self._gzip_file(temp_path, backup_path)
            temp_path.unlink()
        else:
            temp_path.rename(backup_path)

        size = backup_path.stat().st_size
        if not quiet:
            self.stdout.write(self.style.SUCCESS(f"[OK] Backup tayyor: {_humansize(size)}"))

        # 3. S3 upload (ixtiyoriy)
        if opts["upload_s3"]:
            if not getattr(settings, "USE_S3", False):
                self.stderr.write("[!] USE_S3=False — S3 upload o'tkazib yuborildi")
            else:
                self._upload_to_s3(backup_path, quiet=quiet)

        # 4. Rotation — eski backuplarni o'chirish
        deleted = self._rotate_old_backups(backup_dir, opts["keep"])
        if deleted and not quiet:
            self.stdout.write(f"  Eski backuplar o'chirildi: {deleted} ta")

        if quiet:
            # Cron'da silent — faqat path ni chiqarish (log uchun)
            sys.stdout.write(str(backup_path) + "\n")

    # ---------- Internal ----------
    def _sqlite_backup(self, src: Path, dst: Path) -> None:
        """SQLite C-level .backup API — WAL bilan ham xavfsiz."""
        source = sqlite3.connect(str(src))
        target = sqlite3.connect(str(dst))
        try:
            with target:
                source.backup(target, pages=0)  # 0 = hammasini bir martada
        finally:
            target.close()
            source.close()

    def _gzip_file(self, src: Path, dst: Path) -> None:
        with src.open("rb") as fin, gzip.open(dst, "wb", compresslevel=6) as fout:
            shutil.copyfileobj(fin, fout, length=1024 * 1024)

    def _rotate_old_backups(self, backup_dir: Path, keep_days: int) -> int:
        cutoff = datetime.now() - timedelta(days=keep_days)
        deleted = 0
        for f in backup_dir.glob("db_*.sqlite3*"):
            mtime = datetime.fromtimestamp(f.stat().st_mtime)
            if mtime < cutoff:
                f.unlink()
                deleted += 1
        return deleted

    def _upload_to_s3(self, path: Path, quiet: bool = False) -> None:
        import boto3

        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=getattr(settings, "AWS_S3_REGION_NAME", "us-east-1"),
            endpoint_url=getattr(settings, "AWS_S3_ENDPOINT_URL", None),
        )
        bucket = settings.AWS_STORAGE_BUCKET_NAME
        key = f"backups/{path.name}"
        s3.upload_file(str(path), bucket, key)
        if not quiet:
            self.stdout.write(self.style.SUCCESS(f"[OK] S3 ga yuklandi: s3://{bucket}/{key}"))


def _humansize(num: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if num < 1024:
            return f"{num:.1f} {unit}"
        num /= 1024
    return f"{num:.1f} TB"
