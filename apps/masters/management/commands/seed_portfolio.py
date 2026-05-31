"""Har bir ustaga kasbiga mos internetdan portfolio rasmlarini biriktiradi.

Rasmlar LoremFlickr (https://loremflickr.com) orqali kalit so'z bo'yicha olinadi —
bepul, API kalitsiz, hotlink qilinadi (fayl saqlash shart emas, Render'da yo'qolmaydi).
`lock` parametri har bir rasmni barqaror (o'zgarmas) qiladi.

Foydalanish:
    python manage.py seed_portfolio
    python manage.py seed_portfolio --count 6 --force
    python manage.py seed_portfolio --only santexnik,elektrik
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.masters.models import MasterProfile, PortfolioImage, PortfolioItem

# Kategoriya slug → LoremFlickr kalit so'zlari (inglizcha — Flickr teglariga mos)
CATEGORY_KEYWORDS = {
    "santexnik": "plumbing,plumber,pipe-repair",
    "elektrik": "electrician,electrical-wiring",
    "quruvchi": "construction,bricklaying,building-site",
    "boyoqchi": "wall-painting,house-painting,renovation",
    "klimatchi": "air-conditioner,hvac-installation",
    "avto-usta": "car-repair,auto-mechanic,garage",
    "kompyuter-ustasi": "computer-repair,laptop-repair",
    "tikuvchi": "sewing,tailor,clothing",
    "tozalash-xizmati": "house-cleaning,cleaning-service",
    "bogbon": "gardening,landscaping,garden",
    "mebelchi": "furniture,carpentry,woodworking",
}
DEFAULT_KEYWORDS = "handyman,tools,home-repair"

# PortfolioItem sarlavhasi/tavsifi (ko'p tilli — parler)
TITLE = {
    "uz": "Bajarilgan ishlar namunasi",
    "ru": "Примеры выполненных работ",
    "kk": "Орындалған жұмыстар үлгісі",
}
DESCRIPTION = {
    "uz": "Mijozlar uchun bajargan ishlarimdan namunalar.",
    "ru": "Примеры моих работ, выполненных для клиентов.",
    "kk": "Тапсырыс берушілерге орындаған жұмыстарымның үлгілері.",
}


def _image_url(keywords: str, seed: int) -> str:
    # 800x600, kalit so'z bo'yicha, lock — barqaror rasm
    return f"https://loremflickr.com/800/600/{keywords}?lock={seed}"


class Command(BaseCommand):
    help = "Ustalarga kasbiga mos internet portfolio rasmlarini biriktiradi (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count", "-c", type=int, default=6,
            help="Har bir ustaga nechta rasm (default: 6)",
        )
        parser.add_argument(
            "--force", "-f", action="store_true",
            help="Portfolio mavjud bo'lsa ham qayta yaratish (avval o'chiriladi)",
        )
        parser.add_argument(
            "--only", default="",
            help="Faqat shu kategoriya slug'lari (vergul bilan): santexnik,elektrik",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        count = max(1, min(opts["count"], 10))
        force = opts["force"]
        only = {s.strip() for s in opts["only"].split(",") if s.strip()}

        masters = (
            MasterProfile.objects.select_related("user")
            .prefetch_related("categories")
            .all()
        )

        created_items = 0
        created_images = 0
        skipped = 0

        for master in masters:
            cats = list(master.categories.all())
            cat_slugs = {c.slug for c in cats}

            if only and not (cat_slugs & only):
                continue

            # Allaqachon portfolio bor — idempotent
            if master.portfolio.exists():
                if not force:
                    skipped += 1
                    continue
                master.portfolio.all().delete()

            # Kasbga mos kalit so'z (birinchi mos kategoriya), bo'lmasa default
            keywords = DEFAULT_KEYWORDS
            primary_cat = None
            for c in cats:
                if c.slug in CATEGORY_KEYWORDS:
                    keywords = CATEGORY_KEYWORDS[c.slug]
                    primary_cat = c
                    break
            if primary_cat is None and cats:
                primary_cat = cats[0]

            # PortfolioItem (parler) yaratish — uz/ru/kk tarjimalari bilan
            item = PortfolioItem(master=master, category=primary_cat)
            item.set_current_language("uz")
            item.title = TITLE["uz"]
            item.description = DESCRIPTION["uz"]
            item.save()
            for lang in ("ru", "kk"):
                item.create_translation(
                    lang, title=TITLE[lang], description=DESCRIPTION[lang]
                )
            created_items += 1

            # Rasmlar — har usta uchun har xil (master.id bo'yicha seed siljitiladi)
            base = master.id * 10
            bulk = [
                PortfolioImage(
                    portfolio=item,
                    external_url=_image_url(keywords, base + n),
                    order=n,
                )
                for n in range(1, count + 1)
            ]
            PortfolioImage.objects.bulk_create(bulk)
            created_images += len(bulk)

        self.stdout.write(
            self.style.SUCCESS(
                f"Tayyor: {created_items} ta portfolio elementi, "
                f"{created_images} ta rasm. O'tkazib yuborildi: {skipped} usta "
                f"(portfolio mavjud — --force bilan qayta yarating)."
            )
        )
