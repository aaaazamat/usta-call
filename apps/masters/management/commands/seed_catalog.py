"""Boshlang'ich katalog ma'lumotlari — O'zbekiston viloyatlari va asosiy kategoriyalar."""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.masters.models import Category, Region, Skill

VILOYATS = [
    "Toshkent shahri",
    "Toshkent viloyati",
    "Samarqand viloyati",
    "Buxoro viloyati",
    "Andijon viloyati",
    "Farg'ona viloyati",
    "Namangan viloyati",
    "Qashqadaryo viloyati",
    "Surxondaryo viloyati",
    "Jizzax viloyati",
    "Sirdaryo viloyati",
    "Navoiy viloyati",
    "Xorazm viloyati",
    "Qoraqalpog'iston Respublikasi",
]

CATEGORIES = [
    ("Santexnik", ["Kran almashtirish", "Quvur o'rnatish", "Suv isitgich", "Kanalizatsiya"]),
    ("Elektrik", ["Rozetka o'rnatish", "Lyustra osish", "Avtomat almashtirish", "Sxema tortish"]),
    ("Quruvchi", ["G'isht terish", "Plitka yotqizish", "Suvoq", "Pol quyish"]),
    ("Bo'yoqchi", ["Devor bo'yash", "Oboy yopishtirish", "Shift bezash"]),
    ("Klimatchi", ["Konditsioner o'rnatish", "Konditsioner tozalash", "Ventilyatsiya"]),
    ("Avto-usta", ["Dvigatel ta'miri", "Tormoz ta'miri", "Diagnostika"]),
    ("Kompyuter ustasi", ["Windows o'rnatish", "Virus tozalash", "Apparat ta'miri"]),
    ("Tikuvchi", ["Liboslar tikish", "Mato kesish", "Tuzatish"]),
    ("Tozalash xizmati", ["Kvartira tozalash", "Deraza yuvish", "Gilam tozalash"]),
    ("Bog'bon", ["Daraxt ekish", "Maysazor", "Sug'orish tizimi"]),
]


class Command(BaseCommand):
    help = "Boshlang'ich kategoriya, ko'nikma va hududlarni yaratadi (idempotent)."

    @transaction.atomic
    def handle(self, *args, **opts):
        for name in VILOYATS:
            Region.objects.get_or_create(name=name, parent=None, defaults={"kind": Region.Kind.VILOYAT})
        self.stdout.write(self.style.SUCCESS(f"Viloyatlar: {Region.objects.filter(kind='viloyat').count()}"))

        for order, (cat_name, skills) in enumerate(CATEGORIES):
            cat, _ = Category.objects.get_or_create(name=cat_name, defaults={"order": order})
            for skill_name in skills:
                Skill.objects.get_or_create(name=skill_name, defaults={"category": cat})

        self.stdout.write(
            self.style.SUCCESS(
                f"Kategoriyalar: {Category.objects.count()}, Ko'nikmalar: {Skill.objects.count()}"
            )
        )
