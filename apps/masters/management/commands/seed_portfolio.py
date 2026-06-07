"""Har bir ustaga kasbiga mos, yuqori sifatli internet portfolio rasmlarini biriktiradi.

Rasmlar Wikimedia Commons'dan oldindan tanlab olingan (kasb fotolari - sarlavha
bo'yicha filtrlangan, yuklanishi tekshirilgan). external_url sifatida saqlanadi -
fayl saqlash shart emas, Render'da yo'qolmaydi. Kategoriyada rasm yetmasa,
LoremFlickr kalit so'z bo'yicha zaxira ishlatiladi.

Foydalanish:
    python manage.py seed_portfolio --force      # mavjudni o'chirib qayta
    python manage.py seed_portfolio --count 6
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.masters.models import MasterProfile, PortfolioImage, PortfolioItem

# Kasb (kategoriya slug) -> tanlangan yuqori sifatli foto URL'lar (Wikimedia Commons)
CATEGORY_IMAGE_URLS = {
    "santexnik": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Flickr_-_USCapitol_-_AOC_Pipefitters_at_Work.jpg/960px-Flickr_-_USCapitol_-_AOC_Pipefitters_at_Work.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Maintaining_the_Drain.jpg/960px-Maintaining_the_Drain.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Mechanical_Contracting_and_Plumbing_January-December_1909_%281909%29_%2814597518007%29.jpg/960px-Mechanical_Contracting_and_Plumbing_January-December_1909_%281909%29_%2814597518007%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mechanical_Contracting_and_Plumbing_January-December_1909_%281909%29_%2814780734631%29.jpg/960px-Mechanical_Contracting_and_Plumbing_January-December_1909_%281909%29_%2814780734631%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Plumber_01.jpg/960px-Plumber_01.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Plumber_in_Alberton%28GN10871%29.jpg/960px-Plumber_in_Alberton%28GN10871%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Plumbers_Trade_School_Students_Working_on_Pipes%28GN08936%29.jpg/960px-Plumbers_Trade_School_Students_Working_on_Pipes%28GN08936%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Workshop_at_Plumbers_Trade_School%28GN08896%29.jpg/960px-Workshop_at_Plumbers_Trade_School%28GN08896%29.jpg",
    ],
    "elektrik": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Car_Electrician_2.jpg/960px-Car_Electrician_2.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Car_electrician_05.jpg/960px-Car_electrician_05.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Car_electrician_4.jpg/960px-Car_electrician_4.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Electrician_%284208021017%29.jpg/960px-Electrician_%284208021017%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Electrician_Working.jpg/960px-Electrician_Working.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Electricians_at_work.jpg/960px-Electricians_at_work.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Electricians_working.jpg/960px-Electricians_working.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Electricians_working_on_systems_equipment_in_the_back_of_house_area_of_the_future_LIRR_concourse._10-03-2019_%2848844065291%29.jpg/960px-Electricians_working_on_systems_equipment_in_the_back_of_house_area_of_the_future_LIRR_concourse._10-03-2019_%2848844065291%29.jpg",
    ],
    "quruvchi": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/A_bricklayer.jpg/960px-A_bricklayer.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Bricklayer_J4.jpg/960px-Bricklayer_J4.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Bricklayer_at_work.jpg/960px-Bricklayer_at_work.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bricklayer_at_work_1963_%28JOKAUAS2_11103-1%29.tif/lossy-page1-960px-Bricklayer_at_work_1963_%28JOKAUAS2_11103-1%29.tif.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Bricklayer_at_work_1963_%28JOKAUAS2_11103-2%29.tif/lossy-page1-960px-Bricklayer_at_work_1963_%28JOKAUAS2_11103-2%29.tif.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Bricklayer_taking_measurements.jpg/960px-Bricklayer_taking_measurements.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Bricklayers_at_Alumni_Library_construction_site_1909_%283200524918%29.jpg/960px-Bricklayers_at_Alumni_Library_construction_site_1909_%283200524918%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Close_wing_position_of_Pithauria_stramineipennis_Wood-Mason_%26_de_Nic%C3%A9ville%2C_1886_%E2%80%93_Light_Straw_Ace_WLB_DSC_1125.jpg/960px-Close_wing_position_of_Pithauria_stramineipennis_Wood-Mason_%26_de_Nic%C3%A9ville%2C_1886_%E2%80%93_Light_Straw_Ace_WLB_DSC_1125.jpg",
    ],
    "boyoqchi": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/A_home_painter_at_work.jpg/960px-A_home_painter_at_work.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/A_painter_at_work_on_a_house_wall_%28SM_1658%29.png/960px-A_painter_at_work_on_a_house_wall_%28SM_1658%29.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/House_painters_in_Capri_%28cropped%29.jpg/960px-House_painters_in_Capri_%28cropped%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Painter_of_London_D_12_ARV_963_96_women_at_home_%2801%29.jpg/960px-Painter_of_London_D_12_ARV_963_96_women_at_home_%2801%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Painter_of_London_D_12_ARV_963_96_women_at_home_%2802%29.jpg/960px-Painter_of_London_D_12_ARV_963_96_women_at_home_%2802%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Painter_of_London_D_12_ARV_963_96_women_at_home_%2803%29.jpg/960px-Painter_of_London_D_12_ARV_963_96_women_at_home_%2803%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/9/9e/Painters_on_Ladders.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Painters_working_in_Magistrate%27s_house_%2811310425586%29.jpg/960px-Painters_working_in_Magistrate%27s_house_%2811310425586%29.jpg",
    ],
    "klimatchi": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/5085Installation_of_air_conditioners_in_the_Philippines_01.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_01.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/5085Installation_of_air_conditioners_in_the_Philippines_02.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_02.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/5085Installation_of_air_conditioners_in_the_Philippines_03.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_03.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/5085Installation_of_air_conditioners_in_the_Philippines_04.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_04.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/5085Installation_of_air_conditioners_in_the_Philippines_05.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_05.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/5085Installation_of_air_conditioners_in_the_Philippines_06.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_06.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/5085Installation_of_air_conditioners_in_the_Philippines_07.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_07.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/5085Installation_of_air_conditioners_in_the_Philippines_08.jpg/960px-5085Installation_of_air_conditioners_in_the_Philippines_08.jpg",
    ],
    "avto-usta": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/A_nigerian_mechanic_at_work.jpg/960px-A_nigerian_mechanic_at_work.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/2/24/An_Auto-_Mechanic.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/7/74/An_Auto_Mechanic.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/e/eb/An_Auto_Mechanic_working_on_the_arm_of_a_car.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Auto_mechanic_01.jpg/960px-Auto_mechanic_01.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Car_Restoration_Workshop_%28Unsplash%29.jpg/960px-Car_Restoration_Workshop_%28Unsplash%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Car_Talk_%288249544%29.jpg/960px-Car_Talk_%288249544%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Car_engine_01.jpg/960px-Car_engine_01.jpg",
    ],
    "kompyuter-ustasi": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Computer_repair_in_progress.jpg/960px-Computer_repair_in_progress.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/6/68/Crashed_computer.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_34-40.png/960px-DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_34-40.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_36-50.png/960px-DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_36-50.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_40-9.png/960px-DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_40-9.png",
        "https://upload.wikimedia.org/wikipedia/commons/f/ff/DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_40-9_%28cropped%29.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_and_Joe_Grand_24-2.png/960px-DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_and_Joe_Grand_24-2.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_and_Joe_Grand_55-22.png/960px-DEF_CON_30_Right_to_Repair_-_Louis_Rossmann_and_Joe_Grand_55-22.png",
    ],
    "tikuvchi": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/A_Tailor_Sewing_Clothes_in_Her_Shop.jpg/960px-A_Tailor_Sewing_Clothes_in_Her_Shop.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/A_tailor_at_her_workshop.jpg/960px-A_tailor_at_her_workshop.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/0/01/A_tailor_doing_sewing.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/7/72/A_tailor_sewing_emir_cloth.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/A_tailor_sewing_native_clothes_in_northern_Nigeria.jpg/960px-A_tailor_sewing_native_clothes_in_northern_Nigeria.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/African_Tailor_sewing_cloths_%281%29.jpg/960px-African_Tailor_sewing_cloths_%281%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/African_Tailor_sewing_cloths_%282%29.jpg/960px-African_Tailor_sewing_cloths_%282%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/African_Tailor_sewing_cloths_%283%29.jpg/960px-African_Tailor_sewing_cloths_%283%29.jpg",
    ],
    "tozalash-xizmati": [
        "https://upload.wikimedia.org/wikipedia/commons/e/e5/A_house_that_was_swept_clean_off_its_foundation_from_the_2002_La_Plata_tornado.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Boy_Scouts_cleaning_up_White_%28...%29_LCCN2016845365.jpg/960px-Boy_Scouts_cleaning_up_White_%28...%29_LCCN2016845365.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/CARPET_CLEANING.jpg/960px-CARPET_CLEANING.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Cleaning_White_House_LCCN2016828908.jpg/960px-Cleaning_White_House_LCCN2016828908.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522590.jpg/960px-Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522590.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522590.tif/lossy-page1-960px-Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522590.tif.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522591.jpg/960px-Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522591.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522591.tif/lossy-page1-960px-Coosa_Valley%2C_Alabama._Newly_completed_bunk_house_over_dry_cleaning_establishment_at_Childersburg._-_NARA_-_522591.tif.jpg",
    ],
    "bogbon": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/2010-06-04_Working_at_Terrace_Gardens.jpg/960px-2010-06-04_Working_at_Terrace_Gardens.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/A_gardener_working_in_Chittagong_War_Cemetery.JPG/960px-A_gardener_working_in_Chittagong_War_Cemetery.JPG",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Bashkir_and_Russian_working_mans_in_The_Ziya_Nuriev_Garden.jpg/960px-Bashkir_and_Russian_working_mans_in_The_Ziya_Nuriev_Garden.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Children_of_model_school_working_gardens.png/960px-Children_of_model_school_working_gardens.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/GARDEN_OF_A_WORKING_CLASS_NEIGHBORHOOD_-_NARA_-_547203.jpg/960px-GARDEN_OF_A_WORKING_CLASS_NEIGHBORHOOD_-_NARA_-_547203.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Gardeners%27_hard-working_for_the_beauties_of_Sissi_Garden.jpg/960px-Gardeners%27_hard-working_for_the_beauties_of_Sissi_Garden.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Gardeners_working_in_a_park_PK-T-AW-1400%2C_PK-1940-T-5.tiff/lossy-page1-960px-Gardeners_working_in_a_park_PK-T-AW-1400%2C_PK-1940-T-5.tiff.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Happy_middle-aged_woman_with_curly_hair_working_on_laptop_in_the_garden.jpg/960px-Happy_middle-aged_woman_with_curly_hair_working_on_laptop_in_the_garden.jpg",
    ],
    "mebelchi": [
        "https://upload.wikimedia.org/wikipedia/commons/9/90/%28gold_leaf_23k%29_Topmast_Studio_%28WORKSHOP%29_Custom_House%2C_%28built%2C_1805%29_at_8_Central_St%2C_Salem%2C_MA_01970_%28pic1o4%29.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Carpenter_at_working.jpg/960px-Carpenter_at_working.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Carpenter_bee_at_work.jpg/960px-Carpenter_bee_at_work.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Carpentering.jpg/960px-Carpentering.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Carpenters_Working_at_Ggaba_Landing_Site%2C_Uganda.jpg/960px-Carpenters_Working_at_Ggaba_Landing_Site%2C_Uganda.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/f/fa/Carpentry.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/9/91/Jacksonville_Concrete_Shipyard_carpenter_shop_and_mold_loft%2C_Jacksonville%2C_Florida%2C_1918_-_DPLA_-_48331dcdbde6206a743b0d77ec50658c.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/1/1c/JapanHomes027_CARPENTER%27S_TOOLS_IN_COMMON_USE.jpg",
    ],
}

# Zaxira: kategoriyada yetarli rasm bo'lmasa - LoremFlickr kalit so'z bo'yicha
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

TITLE = {"uz": "Bajarilgan ishlar namunasi", "ru": "Примеры выполненных работ", "kk": "Орындалған жұмыстар үлгісі"}
DESCRIPTION = {"uz": "Mijozlar uchun bajargan ishlarimdan namunalar.", "ru": "Примеры моих работ, выполненных для клиентов.", "kk": "Тапсырыс берушілерге орындаған жұмыстарымның үлгілері."}


def _flickr_url(keywords, seed):
    return f"https://loremflickr.com/800/600/{keywords}?lock={seed}"


def _urls_for(master, cat_slug, count):
    """Kasbga mos rasm URL'lari. Har ustaga turli boshlanish nuqtasi (xilma-xillik)."""
    pool = CATEGORY_IMAGE_URLS.get(cat_slug or "", [])
    if len(pool) >= count:
        start = (master.id * 2) % len(pool)
        return [pool[(start + k) % len(pool)] for k in range(count)]
    kw = CATEGORY_KEYWORDS.get(cat_slug or "", DEFAULT_KEYWORDS)
    base = master.id * 10
    return [_flickr_url(kw, base + n) for n in range(1, count + 1)]


class Command(BaseCommand):
    help = "Ustalarga kasbiga mos yuqori sifatli portfolio rasmlarini biriktiradi (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument("--count", "-c", type=int, default=6)
        parser.add_argument("--force", "-f", action="store_true")
        parser.add_argument("--only", default="")

    @transaction.atomic
    def handle(self, *args, **opts):
        count = max(1, min(opts["count"], 8))
        force = opts["force"]
        only = {s.strip() for s in opts["only"].split(",") if s.strip()}

        masters = MasterProfile.objects.select_related("user").prefetch_related("categories").all()
        created_items = created_images = skipped = 0

        for master in masters:
            cats = list(master.categories.all())
            cat_slugs = {c.slug for c in cats}
            if only and not (cat_slugs & only):
                continue

            if master.portfolio.exists():
                # Eski LoremFlickr rasmlarini avtomatik yangilaymiz (build.sh --force'siz
                # chaqirsa ham). Yangi Wikimedia rasmlar bo'lsa — o'tkazib yuboramiz.
                has_old = PortfolioImage.objects.filter(
                    portfolio__master=master, external_url__icontains="loremflickr"
                ).exists()
                if not force and not has_old:
                    skipped += 1
                    continue
                master.portfolio.all().delete()

            primary_cat = None
            for c in cats:
                if c.slug in CATEGORY_IMAGE_URLS or c.slug in CATEGORY_KEYWORDS:
                    primary_cat = c
                    break
            if primary_cat is None and cats:
                primary_cat = cats[0]
            cat_slug = primary_cat.slug if primary_cat else ""

            item = PortfolioItem(master=master, category=primary_cat)
            item.set_current_language("uz")
            item.title = TITLE["uz"]
            item.description = DESCRIPTION["uz"]
            item.save()
            for lang in ("ru", "kk"):
                item.create_translation(lang, title=TITLE[lang], description=DESCRIPTION[lang])
            created_items += 1

            urls = _urls_for(master, cat_slug, count)
            PortfolioImage.objects.bulk_create([
                PortfolioImage(portfolio=item, external_url=u, order=n)
                for n, u in enumerate(urls, start=1)
            ])
            created_images += len(urls)

        self.stdout.write(self.style.SUCCESS(
            f"Tayyor: {created_items} ta portfolio, {created_images} ta rasm. "
            f"O'tkazib yuborildi: {skipped} (--force bilan qayta yarating)."
        ))
