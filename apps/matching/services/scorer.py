"""Usta-order moslik balini hisoblash — 0..100 shkala, KASB birinchi o'rinda.

Vaznlar (jami = 100):
    Kasb (kategoriya) mosligi : 50   ← eng muhim omil
    Ko'nikma (ish turi) mosligi: 25
    Reyting                    : 15
    Hudud                      : 5
    Ish qabul qilishi          : 5

Strategiya: AI tavsifdan kasbni aniqlaydi. Kasb aniqlangan bo'lsa — FAQAT
o'sha kasb ustalari ko'rsatiladi (santexnika ishiga tikuvchi chiqmaydi).
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from django.db.models import Q

from apps.masters.models import MasterProfile
from apps.orders.models import Order

# Vaznlar — jami 100
W_CATEGORY = Decimal("50")
W_SKILL = Decimal("25")
W_RATING = Decimal("15")
W_REGION = Decimal("5")
W_AVAIL = Decimal("5")

_Q1 = Decimal("0.1")


@dataclass
class Scored:
    master: MasterProfile
    score: Decimal
    category: Decimal
    skill: Decimal
    region: Decimal
    rating: Decimal
    availability: Decimal
    reason: str


def _category_score(master: MasterProfile, order: Order) -> Decimal:
    """Usta order kasbiga (kategoriyasiga) ega bo'lsa — to'liq ball."""
    if order.category_id and any(c.id == order.category_id for c in master.categories.all()):
        return W_CATEGORY
    return Decimal("0")


def _skill_score(master: MasterProfile, order: Order) -> tuple[Decimal, int]:
    target_skill_ids = list(order.ai_extracted_skills.values_list("id", flat=True))
    if not target_skill_ids:
        return Decimal("0"), 0
    matched = master.skills.filter(id__in=target_skill_ids).count()
    coverage = Decimal(matched) / Decimal(len(target_skill_ids))
    return (W_SKILL * coverage).quantize(_Q1), matched


def _rating_score(master: MasterProfile) -> Decimal:
    # 5.00 → 15, 0 → 0 (chiziqli)
    return ((master.rating_cache / Decimal("5")) * W_RATING).quantize(_Q1)


def _region_score(master: MasterProfile, order: Order) -> Decimal:
    if not order.region_id:
        return W_REGION  # hudud ko'rsatilmagan — neytral (to'liq)
    if master.regions.filter(id=order.region_id).exists():
        return W_REGION
    parent_id = order.region.parent_id if order.region else None
    if parent_id and master.regions.filter(Q(id=parent_id) | Q(parent_id=parent_id)).exists():
        return (W_REGION / 2).quantize(_Q1)  # bir viloyat ichida boshqa tuman
    return Decimal("0")


def _availability_score(master: MasterProfile) -> Decimal:
    return W_AVAIL if master.is_available else Decimal("0")


def rank_masters_for_order(order: Order, *, limit: int = 10) -> list[Scored]:
    """Order uchun mos ustalarni 0..100 ball bilan reytinglab qaytaradi.

    KASB BIRINCHI: order kategoriyasi aniqlangan bo'lsa, faqat o'sha kasb
    ustalari nomzod bo'ladi. Shunda noto'g'ri kasb ustalari (masalan,
    santexnika ishiga tikuvchi) umuman chiqmaydi.
    """
    target_skill_ids = list(order.ai_extracted_skills.values_list("id", flat=True))

    base = MasterProfile.objects.filter(
        is_approved=True, is_available=True, user__is_active=True
    )

    if order.category_id:
        # Faqat shu kasb ustalari
        candidates_qs = base.filter(categories=order.category_id).distinct()
        # Zaxira: shu kasbda usta topilmasa — ko'nikma bo'yicha
        if not candidates_qs.exists() and target_skill_ids:
            candidates_qs = base.filter(skills__in=target_skill_ids).distinct()
    elif target_skill_ids:
        candidates_qs = base.filter(skills__in=target_skill_ids).distinct()
    else:
        # Hech narsa aniqlanmadi — eng yuqori reytingli ustalar
        candidates_qs = base

    candidates_qs = candidates_qs.select_related("user").prefetch_related(
        "skills", "regions", "categories"
    )[:50]

    scored: list[Scored] = []
    for master in candidates_qs:
        category_s = _category_score(master, order)
        skill_s, matched = _skill_score(master, order)
        rating_s = _rating_score(master)
        region_s = _region_score(master, order)
        avail_s = _availability_score(master)

        total = category_s + skill_s + rating_s + region_s + avail_s
        if total > Decimal("100"):
            total = Decimal("100")
        total = total.quantize(_Q1)

        reason_parts = []
        if category_s > 0:
            reason_parts.append("kasbi mos")
        if matched:
            reason_parts.append(f"{matched} ta ish turi mos")
        if region_s >= W_REGION and order.region_id:
            reason_parts.append("hududi mos")
        if master.rating_cache >= Decimal("4"):
            reason_parts.append(f"yuqori reyting {master.rating_cache:.1f}")
        reason = ", ".join(reason_parts) or "mos usta"

        scored.append(
            Scored(
                master=master,
                score=total,
                category=category_s,
                skill=skill_s,
                region=region_s,
                rating=rating_s,
                availability=avail_s,
                reason=reason,
            )
        )

    scored.sort(key=lambda s: s.score, reverse=True)
    return scored[:limit]
