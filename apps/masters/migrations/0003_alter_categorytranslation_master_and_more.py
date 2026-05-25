# State-only noop: 0002 migration'da TranslationsForeignKey o'rniga oddiy
# ForeignKey ishlatildi (parler runtime'da uni o'zi to'g'ri talqin qiladi),
# shu sababli Django har gal makemigrations'da AlterField taklif qiladi.
# Bu migration ushbu farqni "qabul qilingan" deb belgilaydi — DB'da hech
# narsa o'zgartirmaydi, faqat keyingi makemigrations'lar toza chiqsin.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0002_alter_category_options_alter_region_options_and_more'),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
