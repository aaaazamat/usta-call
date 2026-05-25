"""Mavjud Category/Skill/Region/PortfolioItem ma'lumotlarini uz dan ru/kk ga
AI orqali avtomatik tarjima qilish.

Foydalanish:
    python manage.py translate_existing_data --target=ru
    python manage.py translate_existing_data --target=kk
    python manage.py translate_existing_data --target=all          # ru + kk
    python manage.py translate_existing_data --target=ru --dry-run  # faqat ko'rsatadi, saqlamaydi

Gemini API (settings.AI_PROVIDER='gemini') ishlatadi — eng arzon va tezkor.
API kalit bo'lmasa, xato beradi (tarjimani transliteratsiyaga aylantirib qo'ymaslik uchun).
"""

from __future__ import annotations

import json
import time
from typing import Iterable

import httpx
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.masters.models import Category, PortfolioItem, Region, Skill

LANGUAGE_NAMES = {
    "ru": "Russian",
    "kk": "Karakalpak (Latin script, as spoken in Karakalpakstan, Uzbekistan)",
}


class Command(BaseCommand):
    help = "Mavjud katalog ma'lumotlarini uz dan boshqa tillarga avtomatik tarjima qiladi"

    def add_arguments(self, parser):
        parser.add_argument("--target", required=True, choices=("ru", "kk", "all"))
        parser.add_argument("--dry-run", action="store_true", help="Saqlamasdan ko'rsatish")
        parser.add_argument(
            "--batch-size", type=int, default=20,
            help="Bitta API so'rovida nechta string tarjima qilinsin (default: 20)",
        )
        parser.add_argument(
            "--overwrite", action="store_true",
            help="Mavjud tarjimalarni qayta yozish (default: skip)",
        )

    def handle(self, *args, **opts):
        targets = ["ru", "kk"] if opts["target"] == "all" else [opts["target"]]
        if not settings.GEMINI_API_KEY:
            raise CommandError(
                "GEMINI_API_KEY o'rnatilmagan. .env ga qo'shing yoki "
                "--dry-run bilan ishlatib ko'ring (lekin saqlanmaydi)."
            )
        for target in targets:
            self.stdout.write(self.style.WARNING(f"\n=== Til: {target} ==="))
            self._translate_model(Category, ["name"], "uz", target, opts)
            self._translate_model(Skill, ["name"], "uz", target, opts)
            self._translate_model(Region, ["name"], "uz", target, opts)
            self._translate_model(PortfolioItem, ["title", "description"], "uz", target, opts)
        self.stdout.write(self.style.SUCCESS("\n✓ Tugadi"))

    # ────────────────────────────────────────────────────────────────────
    def _translate_model(self, Model, fields: list[str], src: str, tgt: str, opts: dict):
        qs = Model.objects.all()
        self.stdout.write(f"\n  {Model.__name__}: {qs.count()} yozuv")
        items_to_translate: list[tuple[Model, str, str]] = []  # (obj, field, source_text)
        for obj in qs:
            for f in fields:
                # Mavjud target tarjimasi
                obj.set_current_language(tgt)
                existing = obj.safe_translation_getter(f, language_code=tgt) or ""
                if existing and not opts["overwrite"]:
                    continue
                obj.set_current_language(src)
                source_text = obj.safe_translation_getter(f, language_code=src) or ""
                if not source_text:
                    continue
                items_to_translate.append((obj, f, source_text))

        if not items_to_translate:
            self.stdout.write("    (tarjima qilinadigan narsa yo'q)")
            return

        self.stdout.write(f"    {len(items_to_translate)} ta string tarjima qilinmoqda...")

        # Batch'lar bilan tarjima qilish
        batch_size = opts["batch_size"]
        for i in range(0, len(items_to_translate), batch_size):
            batch = items_to_translate[i: i + batch_size]
            source_texts = [text for _, _, text in batch]
            translated = self._gemini_translate_batch(source_texts, tgt)

            if len(translated) != len(batch):
                self.stderr.write(self.style.ERROR(
                    f"    Xato: kutilgan {len(batch)} ta tarjima, kelgan {len(translated)} ta"
                ))
                continue

            for (obj, f, src_text), tgt_text in zip(batch, translated):
                self.stdout.write(f"    {src_text!r} → {tgt_text!r}")
                if not opts["dry_run"]:
                    obj.set_current_language(tgt)
                    setattr(obj, f, tgt_text)
                    obj.save()

            # Rate-limit (Gemini: daqiqada ~15 so'rov bepul tier)
            time.sleep(4.0)

    # ────────────────────────────────────────────────────────────────────
    def _gemini_translate_batch(self, texts: list[str], target_lang: str) -> list[str]:
        """Bir so'rovda bir necha string tarjima qiladi (xarajatni kamaytirish uchun)."""
        target_name = LANGUAGE_NAMES[target_lang]
        prompt = (
            f"You are translating skill/category names and short descriptions "
            f"for a service marketplace (handymen, plumbers, electricians). "
            f"Source language: Uzbek. Target language: {target_name}.\n\n"
            f"Translate each line below. Keep them short and natural. "
            f"Return ONLY a JSON array of strings in the same order, no explanation.\n\n"
            f"Input:\n" + "\n".join(f"{i+1}. {t}" for i, t in enumerate(texts))
        )

        model = settings.AI_MODEL_GEMINI
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            f"?key={settings.GEMINI_API_KEY}"
        )
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2,
                "maxOutputTokens": 4000,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        with httpx.Client(timeout=30) as client:
            resp = client.post(url, json=body)
            resp.raise_for_status()
            data = resp.json()
        raw = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            raise CommandError(f"Gemini noto'g'ri javob: {raw[:200]}")
        return [str(x) for x in parsed]
