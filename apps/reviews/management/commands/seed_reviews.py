"""Ustalarga realistik o'zbekcha sharhlar (review) generatsiya qiladi.

Har bir sharh uchun yakunlangan buyurtma + soxta mijoz yaratiladi (Review
buyurtmaga OneToOne bog'langan). Reyting ustaning joriy reytingiga yaqin
o'rtachada chiqadi, sanalar oxirgi oylarga taqsimlanadi, ba'zilariga usta
javobi qo'shiladi.

Foydalanish:
    python manage.py seed_reviews                 # mavjud sharhsiz ustalarga
    python manage.py seed_reviews --force          # mavjudni o'chirib qayta
    python manage.py seed_reviews --min 8 --max 25 # reytingsiz ustalar uchun oraliq
"""
from __future__ import annotations

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Avg, Count
from django.utils import timezone

from apps.accounts.models import Role, User
from apps.masters.models import MasterProfile
from apps.orders.models import Order, OrderStatus
from apps.reviews.models import Review

# Soxta mijoz prefiksi — idempotentlik va tozalash uchun
FAKE_CLIENT_PREFIX = "+99890900"

CLIENT_NAMES = [
    "Aziz Karimov", "Dilnoza Yusupova", "Bobur Aliyev", "Malika Tosheva",
    "Jasur Rahimov", "Nilufar Saidova", "Sardor Qodirov", "Gulbahor Ergasheva",
    "Otabek Nazarov", "Zarina Umarova", "Akmal Sobirov", "Sevara Tursunova",
    "Rustam Xolmatov", "Madina Yo'ldosheva", "Davron Islomov", "Kamola Rashidova",
    "Sherzod Mirzayev", "Feruza Abdullayeva", "Ulug'bek Sharipov", "Nodira Ismoilova",
    "Farrux To'xtayev", "Mohira Qosimova", "Sanjar Bekmurodov", "Laylo Hakimova",
    "Islom Yoqubov", "Dilfuza Anvarova", "Temur Boltayev", "Sabina Maxmudova",
]

REVIEWS_5 = [
    "Juda mamnunman! Usta o'z ishini a'lo darajada bajardi. Albatta tavsiya qilaman.",
    "Vaqtida keldi, tez va sifatli ishladi. Katta rahmat!",
    "Professional yondashuv, narxi ham arzon. Yana murojaat qilaman.",
    "Ishini puxta bajardi, hamma narsani tushuntirib berdi.",
    "Zo'r mutaxassis! Muammoni juda tez hal qildi.",
    "Toza ishlaydi, o'zidan keyin tartibli qoldirdi. 5 ball!",
    "Halol va mas'uliyatli usta. Kelishilgan vaqtda yetib keldi.",
    "Hammasi joyida, sifat a'lo. Tanishlarimga ham aytdim.",
    "Tajribali usta ekan, ishni bir zumda bajardi. Tavsiya qilaman!",
    "Juda xushmuomala va ishbilarmon. Natijadan juda xursandman.",
]
REVIEWS_4 = [
    "Yaxshi ishladi, lekin biroz kechikdi. Umuman mamnunman.",
    "Sifatli ish, faqat narxi biroz qimmatroq tuyuldi.",
    "Yaxshi usta, ammo tozalashni unutdi. Qolgani joyida.",
    "Ishidan ko'nglim to'ldi, kichik kamchiliklar bo'ldi xolos.",
    "Umuman yaxshi, keyingi safar ham murojaat qilsa bo'ladi.",
    "Ishni qoyilmaqom qildi, faqat biroz sekinroq edi.",
]
REVIEWS_3 = [
    "O'rtacha. Ish bajarildi, lekin biroz shoshilinch qildi.",
    "Yomon emas, lekin yaxshiroq bo'lishi mumkin edi.",
    "Ish bajarildi, ammo narx-sifat muvozanati o'rtacha.",
]
MASTER_REPLIES = [
    "Bahoyingiz uchun rahmat! Yana xizmatingizdaman.",
    "Mamnunligingiz biz uchun muhim. Rahmat!",
    "Ishonchingiz uchun tashakkur!",
    "Fikringiz uchun rahmat, doim sifatli xizmat ko'rsatamiz.",
]

ORDER_DESCS = [
    "Uy sharoitida bajarilgan ish.",
    "Kichik ta'mirlash ishlari.",
    "Mijoz buyurtmasiga ko'ra bajarildi.",
    "Standart xizmat ko'rsatildi.",
]


def _review_text(rating: int) -> str:
    if rating >= 5:
        return random.choice(REVIEWS_5)
    if rating == 4:
        return random.choice(REVIEWS_4)
    return random.choice(REVIEWS_3)


def _sample_rating(target: float) -> int:
    return max(3, min(5, round(random.gauss(target, 0.45))))


class Command(BaseCommand):
    help = "Ustalarga realistik o'zbekcha sharhlar generatsiya qiladi (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--force", "-f", action="store_true",
                            help="Mavjud (seed) sharhlarni o'chirib qayta yaratish")
        parser.add_argument("--min", type=int, default=6,
                            help="Reytingsiz usta uchun minimal sharh soni")
        parser.add_argument("--max", type=int, default=22,
                            help="Reytingsiz usta uchun maksimal sharh soni")

    @transaction.atomic
    def handle(self, *args, **opts):
        force = opts["force"]
        n_min, n_max = opts["min"], opts["max"]

        clients = self._ensure_clients()
        masters = MasterProfile.objects.select_related("user").all()

        total_reviews = 0
        touched_masters = 0

        for master in masters:
            existing = master.reviews.count()
            if existing > 0 and not force:
                continue
            if force and existing:
                # Seed sharhlar va ularning soxta buyurtmalarini o'chiramiz
                order_ids = list(master.reviews.values_list("order_id", flat=True))
                master.reviews.all().delete()
                Order.objects.filter(id__in=order_ids,
                                     client__phone__startswith=FAKE_CLIENT_PREFIX).delete()

            target_rating = float(master.rating_cache) if master.rating_cache and master.rating_cache > 0 else random.uniform(4.2, 4.9)
            count = master.reviews_count_cache if master.reviews_count_cache and master.reviews_count_cache > 0 else random.randint(n_min, n_max)
            count = min(count, 40)

            cat = master.categories.first()
            cat_name = cat.safe_translation_getter("name", any_language=True) if cat else "Usta"

            now = timezone.now()
            for i in range(count):
                client = random.choice(clients)
                rating = _sample_rating(target_rating)
                created = now - timedelta(days=random.randint(1, 200), hours=random.randint(0, 23))

                order = Order.objects.create(
                    client=client,
                    title=f"{cat_name} xizmati",
                    description=random.choice(ORDER_DESCS),
                    address="Toshkent",
                    status=OrderStatus.COMPLETED,
                    selected_master=master,
                    completed_at=created,
                )
                review = Review.objects.create(
                    order=order,
                    client=client,
                    master=master,
                    rating=rating,
                    text=_review_text(rating),
                    master_reply=random.choice(MASTER_REPLIES) if random.random() < 0.3 else "",
                    master_replied_at=created + timedelta(hours=2) if random.random() < 0.3 else None,
                )
                # Sanalarni o'tmishga taqsimlash (auto_now_add'ni chetlab o'tish)
                Review.objects.filter(pk=review.pk).update(created_at=created)
                Order.objects.filter(pk=order.pk).update(created_at=created)
                total_reviews += 1

            self._recalc(master)
            touched_masters += 1

        self.stdout.write(self.style.SUCCESS(
            f"[OK] {touched_masters} ustaga jami {total_reviews} ta sharh qo'shildi."
        ))

    def _ensure_clients(self) -> list[User]:
        """Soxta mijozlar pulini yaratadi (qayta ishlatiladi)."""
        clients = []
        for idx, name in enumerate(CLIENT_NAMES, start=1):
            phone = f"{FAKE_CLIENT_PREFIX}{idx:03d}"
            user, _ = User.objects.get_or_create(
                phone=phone,
                defaults={"role": Role.CLIENT, "full_name": name, "is_verified": True},
            )
            clients.append(user)
        return clients

    def _recalc(self, master: MasterProfile) -> None:
        agg = master.reviews.aggregate(avg=Avg("rating"), cnt=Count("id"))
        master.rating_cache = round(agg["avg"] or 0, 2)
        master.reviews_count_cache = agg["cnt"] or 0
        if (agg["cnt"] or 0) > master.completed_orders_cache:
            master.completed_orders_cache = agg["cnt"]
        master.save(update_fields=["rating_cache", "reviews_count_cache", "completed_orders_cache", "updated_at"])
