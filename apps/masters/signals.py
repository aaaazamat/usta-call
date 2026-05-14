from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.accounts.models import Role

from .models import MasterProfile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_master_profile(sender, instance, created, **kwargs):
    """User.role='master' bo'lsa, profil mavjudligini ta'minlaymiz.

    Beta sinov rejimida (BETA_AUTO_LOGIN=True) ustalar avtomatik tasdiqlanadi —
    aks holda admin tasdiqigacha katalogda ko'rinmaydi.
    """
    if instance.role != Role.MASTER:
        return

    defaults = {}
    if getattr(settings, "BETA_AUTO_LOGIN", False):
        defaults["is_approved"] = True

    profile, profile_created = MasterProfile.objects.get_or_create(
        user=instance, defaults=defaults
    )
    # Mavjud profil ham beta rejimda tasdiqlansin
    if (
        not profile_created
        and getattr(settings, "BETA_AUTO_LOGIN", False)
        and not profile.is_approved
    ):
        profile.is_approved = True
        profile.save(update_fields=["is_approved", "updated_at"])
