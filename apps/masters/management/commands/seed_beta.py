"""Beta sinov uchun to'liq ma'lumotlar to'plami.

Foydalanish:
    python manage.py seed_beta

- 25 ta usta (turli toifalarda, ba'zilarida avatar)
- 7 ta test mijoz
- 10 ta turli holatdagi buyurtma
- Mebelchi kategoriyasi qo'shiladi (agar yo'q bo'lsa)

Idempotent — qayta ishga tushirilsa, mavjud ma'lumotlar dublikat bo'lmaydi.
"""
from __future__ import annotations

import logging
import random
from decimal import Decimal
from io import BytesIO

import httpx
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Role, User
from apps.masters.models import Category, MasterProfile, Region, Skill
from apps.orders.models import Order, OrderStatus

logger = logging.getLogger(__name__)


# ───────────────── Mebelchi kategoriyasi (qo'shimcha) ─────────────────
MEBELCHI_SKILLS = [
    "Stol yasash",
    "Shkaf yasash",
    "Yog'och ishlovi",
    "Mebel ta'miri",
    "Duradgorlik",
]


# ───────────────── 25 USTA ─────────────────
# (phone, full_name, categories[], skills[], bio, exp_years, rate_from, rate_to, region, avatar_id)
# avatar_id None bo'lsa, rasm yuklanmaydi
MASTERS_DATA = [
    # Santexniklar (3 ta)
    {
        "phone": "+998901001001", "full_name": "Olimov Sherzod",
        "categories": ["Santexnik"], "skills": ["Kran almashtirish", "Quvur o'rnatish", "Suv isitgich"],
        "bio": "12 yildan beri santexnik bo'lib ishlayman. Hammom va oshxona uchun barcha turdagi ishlarni bajaraman. Kafolat bilan ishlayman.",
        "experience_years": 12, "rate_from": "80000", "rate_to": "200000",
        "region": "Toshkent shahri", "avatar_id": 11,
    },
    {
        "phone": "+998901001002", "full_name": "Karimov Akmal",
        "categories": ["Santexnik"], "skills": ["Kanalizatsiya", "Quvur o'rnatish"],
        "bio": "Kanalizatsiya va sanitariya tizimlari bo'yicha mutaxassis. Tez va sifatli xizmat.",
        "experience_years": 8, "rate_from": "70000", "rate_to": "180000",
        "region": "Toshkent shahri", "avatar_id": 12,
    },
    {
        "phone": "+998901001003", "full_name": "Yusupov Bahodir",
        "categories": ["Santexnik"], "skills": ["Kran almashtirish", "Suv isitgich"],
        "bio": "Avariya holatlarida 24/7 ishlayman. Suv oqishini darhol to'xtatib, ta'mirlash.",
        "experience_years": 6, "rate_from": "60000", "rate_to": "150000",
        "region": "Samarqand viloyati", "avatar_id": None,
    },

    # Elektriklar (3 ta)
    {
        "phone": "+998901002001", "full_name": "Toshpulatov Davron",
        "categories": ["Elektrik"], "skills": ["Sxema tortish", "Lyustra osish", "Rozetka o'rnatish", "Avtomat almashtirish"],
        "bio": "Yangi xonadonlarni to'liq elektr bilan ta'minlash, eski sxemalarni almashtirish. Yevropa standartlari bo'yicha.",
        "experience_years": 15, "rate_from": "100000", "rate_to": "300000",
        "region": "Toshkent shahri", "avatar_id": 13,
    },
    {
        "phone": "+998901002002", "full_name": "Murodov Sardor",
        "categories": ["Elektrik"], "skills": ["Lyustra osish", "Rozetka o'rnatish"],
        "bio": "Lyustra, bra va dekorativ chiroqlarni o'rnataman. Smart home tizimlari.",
        "experience_years": 7, "rate_from": "80000", "rate_to": "200000",
        "region": "Toshkent shahri", "avatar_id": 14,
    },
    {
        "phone": "+998901002003", "full_name": "Sodiqov Jasur",
        "categories": ["Elektrik"], "skills": ["Avtomat almashtirish", "Sxema tortish"],
        "bio": "Sanoat va uy elektr tizimlari. Yer ulanmasi (zazemlenie) o'rnataman.",
        "experience_years": 10, "rate_from": "90000", "rate_to": "250000",
        "region": "Farg'ona viloyati", "avatar_id": None,
    },

    # Quruvchilar (3 ta)
    {
        "phone": "+998901003001", "full_name": "Aliyev Rustam",
        "categories": ["Quruvchi"], "skills": ["G'isht terish", "Suvoq", "Plitka yotqizish"],
        "bio": "Kapital qurilish ishlari. Tashqi va ichki suvoq, plitka. Brigada bilan ishlaymiz.",
        "experience_years": 20, "rate_from": "120000", "rate_to": "350000",
        "region": "Toshkent shahri", "avatar_id": 15,
    },
    {
        "phone": "+998901003002", "full_name": "Xolmatov Bobur",
        "categories": ["Quruvchi"], "skills": ["Plitka yotqizish", "Pol quyish"],
        "bio": "Plitka va laminat bo'yicha mutaxassis. Yevropa va Eron plitkalari bilan ishlayman.",
        "experience_years": 9, "rate_from": "90000", "rate_to": "220000",
        "region": "Buxoro viloyati", "avatar_id": 16,
    },
    {
        "phone": "+998901003003", "full_name": "Nazarov Doniyor",
        "categories": ["Quruvchi"], "skills": ["G'isht terish", "Pol quyish"],
        "bio": "Devor ko'tarish, gips-karton, pol stratifikatsiyasi. Toza ish.",
        "experience_years": 11, "rate_from": "100000", "rate_to": "280000",
        "region": "Toshkent shahri", "avatar_id": None,
    },

    # Bo'yoqchilar (2 ta)
    {
        "phone": "+998901004001", "full_name": "Saidov Farrux",
        "categories": ["Bo'yoqchi"], "skills": ["Devor bo'yash", "Oboy yopishtirish"],
        "bio": "Devor bo'yash, dekorativ bezak, oboy. Toza va aniq ishlayman.",
        "experience_years": 8, "rate_from": "70000", "rate_to": "180000",
        "region": "Toshkent shahri", "avatar_id": 17,
    },
    {
        "phone": "+998901004002", "full_name": "Eshonov Otabek",
        "categories": ["Bo'yoqchi"], "skills": ["Devor bo'yash", "Shift bezash"],
        "bio": "Akrilli bo'yoqlar, dekorativ shift. Italyan materiallari bilan.",
        "experience_years": 6, "rate_from": "80000", "rate_to": "200000",
        "region": "Samarqand viloyati", "avatar_id": 18,
    },

    # Klimatchilar (2 ta)
    {
        "phone": "+998901005001", "full_name": "Rasulov Komron",
        "categories": ["Klimatchi"], "skills": ["Konditsioner o'rnatish", "Konditsioner tozalash"],
        "bio": "Barcha brendlardagi konditsionerlarni o'rnataman va tozalayman. Freon to'ldirish.",
        "experience_years": 7, "rate_from": "100000", "rate_to": "250000",
        "region": "Toshkent shahri", "avatar_id": 19,
    },
    {
        "phone": "+998901005002", "full_name": "Hamidov Sherali",
        "categories": ["Klimatchi"], "skills": ["Ventilyatsiya", "Konditsioner o'rnatish"],
        "bio": "Tijorat va uy ventilyatsiya tizimlari. Loyihalashtirish va o'rnatish.",
        "experience_years": 12, "rate_from": "150000", "rate_to": "400000",
        "region": "Toshkent shahri", "avatar_id": None,
    },

    # Avto-ustalar (2 ta)
    {
        "phone": "+998901006001", "full_name": "Tursunov Zafar",
        "categories": ["Avto-usta"], "skills": ["Dvigatel ta'miri", "Diagnostika"],
        "bio": "Yapon va Koreya mashinalari bo'yicha mutaxassis. Toyota, Hyundai, Kia.",
        "experience_years": 14, "rate_from": "150000", "rate_to": "500000",
        "region": "Toshkent shahri", "avatar_id": 20,
    },
    {
        "phone": "+998901006002", "full_name": "Hasanov Sanjar",
        "categories": ["Avto-usta"], "skills": ["Tormoz ta'miri", "Dvigatel ta'miri"],
        "bio": "Chevrolet va Daewoo ustasi. Tormoz tizimi, dvigatel kapital remont.",
        "experience_years": 9, "rate_from": "120000", "rate_to": "400000",
        "region": "Toshkent viloyati", "avatar_id": 21,
    },

    # Kompyuter ustalari (2 ta)
    {
        "phone": "+998901007001", "full_name": "Mirzaev Ulug'bek",
        "categories": ["Kompyuter ustasi"], "skills": ["Windows o'rnatish", "Virus tozalash", "Apparat ta'miri"],
        "bio": "Kompyuter va noutbuk ta'miri. Ma'lumot tiklash. Tarmoq sozlash.",
        "experience_years": 10, "rate_from": "50000", "rate_to": "200000",
        "region": "Toshkent shahri", "avatar_id": 22,
    },
    {
        "phone": "+998901007002", "full_name": "Yo'ldoshev Asror",
        "categories": ["Kompyuter ustasi"], "skills": ["Apparat ta'miri", "Windows o'rnatish"],
        "bio": "Noutbuk klaviatura, ekran, matritsa almashtirish. Tezkor xizmat.",
        "experience_years": 5, "rate_from": "40000", "rate_to": "150000",
        "region": "Andijon viloyati", "avatar_id": None,
    },

    # Tikuvchilar (2 ta — ayollar)
    {
        "phone": "+998901008001", "full_name": "Yusupova Madina",
        "categories": ["Tikuvchi"], "skills": ["Liboslar tikish", "Tuzatish"],
        "bio": "Ayollar va bolalar uchun zamonaviy liboslar tikaman. Milliy va Yevropa uslubida.",
        "experience_years": 11, "rate_from": "100000", "rate_to": "500000",
        "region": "Toshkent shahri", "avatar_id": 47,
    },
    {
        "phone": "+998901008002", "full_name": "Karimova Gulnoza",
        "categories": ["Tikuvchi"], "skills": ["Mato kesish", "Tuzatish"],
        "bio": "Liboslarni o'zgartirish, tuzatish. Tezkor va sifatli.",
        "experience_years": 7, "rate_from": "30000", "rate_to": "150000",
        "region": "Toshkent shahri", "avatar_id": 48,
    },

    # Tozalash xizmati (2 ta)
    {
        "phone": "+998901009001", "full_name": "Olimova Sevara",
        "categories": ["Tozalash xizmati"], "skills": ["Kvartira tozalash", "Deraza yuvish"],
        "bio": "Kvartira va ofislarni tozalash. Brigada bilan ishlaymiz. Eko-kimyo.",
        "experience_years": 6, "rate_from": "200000", "rate_to": "800000",
        "region": "Toshkent shahri", "avatar_id": 49,
    },
    {
        "phone": "+998901009002", "full_name": "Saidova Dilnoza",
        "categories": ["Tozalash xizmati"], "skills": ["Gilam tozalash"],
        "bio": "Professional gilam va divan tozalash. Maxsus jihozlar bilan.",
        "experience_years": 4, "rate_from": "150000", "rate_to": "500000",
        "region": "Toshkent shahri", "avatar_id": None,
    },

    # Bog'bon (1 ta)
    {
        "phone": "+998901010001", "full_name": "Norboyev Temur",
        "categories": ["Bog'bon"], "skills": ["Daraxt ekish", "Maysazor", "Sug'orish tizimi"],
        "bio": "Hovli va bog'larni dizayn qilish, maysazor, sug'orish tizimlari.",
        "experience_years": 13, "rate_from": "150000", "rate_to": "600000",
        "region": "Toshkent viloyati", "avatar_id": 24,
    },

    # Mebelchi (2 ta — yangi kategoriya)
    {
        "phone": "+998901011001", "full_name": "Razzoqov Murod",
        "categories": ["Mebelchi"], "skills": ["Stol yasash", "Shkaf yasash", "Yog'och ishlovi"],
        "bio": "Buyurtma asosida har qanday mebel — shkaflar, kabinetlar, stollar. Tabiiy yog'och.",
        "experience_years": 16, "rate_from": "200000", "rate_to": "1500000",
        "region": "Toshkent shahri", "avatar_id": 25,
    },
    {
        "phone": "+998901011002", "full_name": "Sobirov Nodir",
        "categories": ["Mebelchi"], "skills": ["Mebel ta'miri", "Duradgorlik"],
        "bio": "Eski mebelni qayta tiklash, ta'mirlash. Antik mebellar bilan ishlayman.",
        "experience_years": 8, "rate_from": "100000", "rate_to": "400000",
        "region": "Buxoro viloyati", "avatar_id": 26,
    },

    # Multi-skill ustalar (3 ta — bir nechta kasb egasi)
    {
        "phone": "+998901012001", "full_name": "Qurbonov Shavkat",
        "categories": ["Elektrik", "Quruvchi"], "skills": ["Sxema tortish", "Plitka yotqizish"],
        "bio": "Universal usta — elektrik ham, quruvchi ham. Hammomni boshidan oxirigacha bitiraman.",
        "experience_years": 18, "rate_from": "150000", "rate_to": "500000",
        "region": "Toshkent shahri", "avatar_id": 33,
    },
    {
        "phone": "+998901012002", "full_name": "Ergashev Xurshid",
        "categories": ["Santexnik", "Bo'yoqchi"], "skills": ["Quvur o'rnatish", "Devor bo'yash"],
        "bio": "Hammom remonti to'liq — santexnika va bo'yoqchilik. Bir martaga butun ish.",
        "experience_years": 10, "rate_from": "120000", "rate_to": "350000",
        "region": "Toshkent shahri", "avatar_id": 34,
    },
    {
        "phone": "+998901012003", "full_name": "Pulatov Bekzod",
        "categories": ["Avto-usta", "Elektrik"], "skills": ["Diagnostika", "Sxema tortish"],
        "bio": "Avto-elektrik. Mashinalar elektronikasi, simlar, akkumulyatorlar.",
        "experience_years": 12, "rate_from": "100000", "rate_to": "400000",
        "region": "Toshkent shahri", "avatar_id": 35,
    },
]


# ───────────────── TEST MIJOZLAR ─────────────────
CLIENTS_DATA = [
    {"phone": "+998901100001", "full_name": "Karimov Aziz", "avatar_id": 51},
    {"phone": "+998901100002", "full_name": "Saidov Bobur", "avatar_id": 52},
    {"phone": "+998901100003", "full_name": "Olimova Munisa", "avatar_id": 53},
    {"phone": "+998901100004", "full_name": "Tashkulov Davron", "avatar_id": None},
    {"phone": "+998901100005", "full_name": "Rashidova Nargiza", "avatar_id": 54},
    {"phone": "+998901100006", "full_name": "Yo'ldoshev Sherzod", "avatar_id": None},
    {"phone": "+998901100007", "full_name": "Yusupov Doniyor", "avatar_id": 55},
]


# ───────────────── TEST BUYURTMALAR ─────────────────
ORDERS_DATA = [
    {
        "client_idx": 0,
        "title": "Hammomda jo'mrak almashtirish kerak",
        "description": "Hammomdagi eski qo'l yuvgich jo'mragidan suv tomchilab oqib qoldi. Yangi sifatli jo'mrak olib o'rnatish kerak. Quvurlarni ham tekshirib chiqsa yaxshi bo'lardi.",
        "address": "Toshkent, Yunusobod tumani, Bog'ishamol ko'chasi 7",
        "category": "Santexnik", "urgency": "high",
        "budget_from": "150000", "budget_to": "300000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 1,
        "title": "Yangi xonadonga lyustra va rozetkalar",
        "description": "Yangi xonadon, 4 ta xona. Har bir xonaga lyustra osish, qo'shimcha rozetkalar o'rnatish kerak. Kuchli zo'ravon usta bo'lsin.",
        "address": "Toshkent, Mirzo Ulug'bek tumani, Buyuk Ipak yo'li ko'chasi 12",
        "category": "Elektrik", "urgency": "normal",
        "budget_from": "500000", "budget_to": "1500000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 2,
        "title": "Mehmonxonaga plitka yotqizish",
        "description": "Mehmonxonadagi pol — taxminan 35 m². Yaxshi sifatli usta kerak, materiallarni o'zim olaman. Tezkor emas.",
        "address": "Toshkent, Chilonzor 17-mavze, 5-uy 23-xonadon",
        "category": "Quruvchi", "urgency": "low",
        "budget_from": "800000", "budget_to": "1200000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 3,
        "title": "Konditsionerni boshqa joyga ko'chirish",
        "description": "Mavjud konditsionerni eski uydan yangi xonadonga ko'chirib o'rnatish kerak. Freon ham qo'shib berish.",
        "address": "Toshkent, Sergeli tumani, Yangi Sergeli 4-mavze",
        "category": "Klimatchi", "urgency": "high",
        "budget_from": "400000", "budget_to": "800000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 4,
        "title": "Mashina dvigateli ishlamayapti",
        "description": "Toyota Camry, 2018-yil. Dvigatel ishlamayapti, diagnostika qilib, sabab topib ta'mirlash kerak.",
        "address": "Toshkent, Yashnobod tumani, Mustaqillik ko'chasi 45",
        "category": "Avto-usta", "urgency": "emergency",
        "budget_from": "500000", "budget_to": "2000000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 5,
        "title": "Devorlarni bo'yash (oshxona va dahliz)",
        "description": "Oshxona va dahliz devorlarini oq rangga bo'yash kerak. Maydoni ~25 m². Boyoq materiallari bor.",
        "address": "Toshkent, Yakkasaroy tumani, Shota Rustaveli 18",
        "category": "Bo'yoqchi", "urgency": "normal",
        "budget_from": "500000", "budget_to": "800000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 6,
        "title": "Bolalar xonasiga mebel yasash",
        "description": "Bolalar xonasi uchun yog'ochdan 1 ta yozuv stoli, 2 ta stulcha va kichik kitob shkafi yasash kerak. Oq rangga bo'yalgan.",
        "address": "Toshkent, Shayxontohur tumani",
        "category": "Mebelchi", "urgency": "low",
        "budget_from": "1500000", "budget_to": "2500000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 0,
        "title": "Noutbuk yuklanmayapti, virus bo'lsa kerak",
        "description": "Asus noutbuk. Yuklanish vaqtida ko'p sekin ishlaydi va g'alati reklamalar chiqyapti. Tozalab Windows qayta o'rnatib bering.",
        "address": "Toshkent, Yunusobod, Bog'ishamol 7",
        "category": "Kompyuter ustasi", "urgency": "normal",
        "budget_from": "100000", "budget_to": "250000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 1,
        "title": "Bayram uchun libos tikish",
        "description": "Ayolga atlas matodan milliy uslubdagi libos tikish kerak. O'lchamlarni o'zim aytaman. 2 hafta ichida tayyor bo'lishi shart.",
        "address": "Toshkent, Mirzo Ulug'bek",
        "category": "Tikuvchi", "urgency": "high",
        "budget_from": "300000", "budget_to": "700000",
        "region": "Toshkent shahri",
    },
    {
        "client_idx": 2,
        "title": "3 xonali kvartira generalniy tozalash",
        "description": "Remont keyin generalniy tozalash. 3 xonali kvartira, 90 m². Derazalar, devorlar, polni hammasini tozalash.",
        "address": "Toshkent, Chilonzor 17-mavze",
        "category": "Tozalash xizmati", "urgency": "normal",
        "budget_from": "500000", "budget_to": "1000000",
        "region": "Toshkent shahri",
    },
]


def fetch_avatar(avatar_id: int) -> bytes | None:
    """Pravatar.cc dan rasm yuklab oladi."""
    url = f"https://i.pravatar.cc/300?img={avatar_id}"
    try:
        with httpx.Client(timeout=10, follow_redirects=True) as client:
            resp = client.get(url)
            if resp.status_code == 200 and resp.content:
                return resp.content
    except Exception as exc:
        logger.warning("Avatar yuklab olishda xato (id=%s): %s", avatar_id, exc)
    return None


class Command(BaseCommand):
    help = "Beta sinov uchun 25 ta usta, mijozlar va buyurtmalarni qo'shadi."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-avatars",
            action="store_true",
            help="Avatarlar yuklanmaydi (tezroq ishlash uchun)",
        )

    def handle(self, *args, **opts):
        load_avatars = not opts["no_avatars"]
        random.seed(42)  # bir xil reyting/order uchun

        # 1) Avval katalog mavjudligini ta'minlaymiz
        self._ensure_catalog()

        # 2) Mijozlar
        clients = self._create_clients(load_avatars)
        self.stdout.write(self.style.SUCCESS(f"Mijozlar: {len(clients)} ta"))

        # 3) Ustalar
        masters = self._create_masters(load_avatars)
        self.stdout.write(self.style.SUCCESS(f"Ustalar: {len(masters)} ta"))

        # 4) Buyurtmalar
        orders_created = self._create_orders(clients)
        self.stdout.write(self.style.SUCCESS(f"Buyurtmalar: {orders_created} ta"))

        self.stdout.write(self.style.SUCCESS("\nTayyor! Endi http://localhost:3000 ga kiring."))

    def _ensure_catalog(self):
        """Mebelchi kategoriyasi yo'q bo'lsa qo'shamiz."""
        mebelchi, created = Category.objects.get_or_create(
            name="Mebelchi", defaults={"order": 10}
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Mebelchi kategoriyasi qo'shildi"))
        for skill_name in MEBELCHI_SKILLS:
            Skill.objects.get_or_create(name=skill_name, defaults={"category": mebelchi})

    @transaction.atomic
    def _create_clients(self, load_avatars: bool):
        created = []
        for data in CLIENTS_DATA:
            user, was_new = User.objects.get_or_create(
                phone=data["phone"],
                defaults={
                    "role": Role.CLIENT,
                    "full_name": data["full_name"],
                    "is_verified": True,
                },
            )
            if not was_new and not user.full_name:
                user.full_name = data["full_name"]
                user.save(update_fields=["full_name"])

            if load_avatars and data.get("avatar_id") and not user.avatar:
                content = fetch_avatar(data["avatar_id"])
                if content:
                    user.avatar.save(
                        f"client_{data['avatar_id']}.jpg",
                        ContentFile(content),
                        save=True,
                    )
            created.append(user)
        return created

    @transaction.atomic
    def _create_masters(self, load_avatars: bool):
        created = []
        for data in MASTERS_DATA:
            user, was_new = User.objects.get_or_create(
                phone=data["phone"],
                defaults={
                    "role": Role.MASTER,
                    "full_name": data["full_name"],
                    "is_verified": True,
                },
            )
            if not was_new:
                # role va ismni yangilab qo'yamiz
                if user.role != Role.MASTER or not user.full_name:
                    user.role = Role.MASTER
                    user.full_name = data["full_name"]
                    user.save(update_fields=["role", "full_name"])

            # Avatar
            if load_avatars and data.get("avatar_id") and not user.avatar:
                content = fetch_avatar(data["avatar_id"])
                if content:
                    user.avatar.save(
                        f"master_{data['avatar_id']}.jpg",
                        ContentFile(content),
                        save=True,
                    )

            # MasterProfile (signal orqali yaratilgan bo'lishi mumkin)
            profile, _ = MasterProfile.objects.get_or_create(user=user)
            profile.bio = data["bio"]
            profile.experience_years = data["experience_years"]
            profile.hourly_rate_from = Decimal(data["rate_from"])
            profile.hourly_rate_to = Decimal(data["rate_to"])
            profile.is_available = True
            profile.is_approved = True

            # Random reyting (4.0 dan 5.0 gacha)
            profile.rating_cache = Decimal(f"{random.uniform(4.0, 5.0):.2f}")
            profile.reviews_count_cache = random.randint(3, 50)
            profile.completed_orders_cache = random.randint(5, 80)
            profile.save()

            # Kategoriyalar va ko'nikmalar
            cats = Category.objects.filter(name__in=data["categories"])
            profile.categories.set(cats)

            skills = Skill.objects.filter(name__in=data["skills"])
            profile.skills.set(skills)

            # Hudud
            region = Region.objects.filter(
                name=data["region"], kind=Region.Kind.VILOYAT
            ).first()
            if region:
                profile.regions.set([region])

            created.append(profile)
        return created

    @transaction.atomic
    def _create_orders(self, clients):
        count = 0
        for data in ORDERS_DATA:
            client = clients[data["client_idx"] % len(clients)]
            # Mavjud bo'lsa o'tkazib yuboramiz
            if Order.objects.filter(title=data["title"], client=client).exists():
                continue

            category = Category.objects.filter(name=data["category"]).first()
            region = Region.objects.filter(name=data["region"], kind=Region.Kind.VILOYAT).first()

            Order.objects.create(
                client=client,
                title=data["title"],
                description=data["description"],
                address=data["address"],
                category=category,
                region=region,
                urgency=data["urgency"],
                budget_from=Decimal(data["budget_from"]),
                budget_to=Decimal(data["budget_to"]),
                status=OrderStatus.PUBLISHED,
            )
            count += 1
        return count
