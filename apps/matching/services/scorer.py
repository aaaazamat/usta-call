"""Usta-order moslik balini hisoblash.

Score = skill_overlap*50 + region_match*20 + rating_score*15 + availability*10 + budget*5
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from django.db.models import Count, Q

from apps.masters.models import MasterProfile
from apps.orders.models import Order


@dataclass
class Scored:
    master: MasterProfile
    score: Decimal
    skill: Decimal
    region: Decimal
    rating: Decimal
    availability: Decimal
    reason: str


def _skill_overlap_score(master: MasterProfile, order: Order) -> tuple[Decimal, int]:
    target_skill_ids = list(order.ai_extracted_skills.values_list("id", flat=True))
    if not target_skill_ids:
        return Decimal("0"), 0
    matched = master.skills.filter(id__in=target_skill_ids).count()
    coverage = matched / len(target_skill_ids)
    return Decimal(str(round(coverage * 50, 2))), matched


def _region_score(master: MasterProfile, order: Order) -> Decimal:
    if not order.region_id:
        return Decimal("10")  # neutral
    if master.regions.filter(id=order.region_id).exists():
        return Decimal("20")
    # Bitta viloyat ichida boshqa tuman ham qisman mos
    parent_id = order.region.parent_id if order.region else None
    if parent_id and master.regions.filter(Q(id=parent_id) | Q(parent_id=parent_id)).exists():
        return Decimal("10")
    return Decimal("0")


def _rating_score(master: MasterProfile) -> Decimal:
    # 5.00 → 15, 0 → 0 (chiziqli)
    return (master.rating_cache / Decimal("5")) * Decimal("15")


def _availability_score(master: MasterProfile) -> Decimal:
    return Decimal("10") if master.is_available else Decimal("0")


def rank_masters_for_order(order: Order, *, limit: int = 10) -> list[Scored]:
    """Order uchun mos ustalarni reytinglab qaytaradi (eng yaxshisi birinchi).

    Filterlash strategiyasi:
      - Kategoriya YOKI ko'nikma mos kelsa, usta nomzodlar ro'yxatiga kiradi
      - Skills bo'sh bo'lgan, lekin kategoriyasi mos usta ham chiqadi (faqat score pastroqroq)
      - Bu usta o'z profilini to'liq to'ldirmagan bo'lsa-da, mijoz uchun ko'rinadi
    """
    target_skill_ids = list(order.ai_extracted_skills.values_list("id", flat=True))

    candidates_qs = MasterProfile.objects.filter(
        is_approved=True, is_available=True, user__is_active=True
    )

    # Kategoriya VA/YOKI ko'nikma bo'yicha kandidatlarni tanlash (OR logikasi)
    if order.category_id and target_skill_ids:
        candidates_qs = candidates_qs.filter(
            Q(categories=order.category_id) | Q(skills__in=target_skill_ids)
        ).distinct()
    elif order.category_id:
        candidates_qs = candidates_qs.filter(categories=order.category_id).distinct()
    elif target_skill_ids:
        candidates_qs = candidates_qs.filter(skills__in=target_skill_ids).distinct()

    candidates_qs = candidates_qs.select_related("user").prefetch_related(
        "skills", "regions", "categories"
    )[:50]

    scored: list[Scored] = []
    for master in candidates_qs:
        skill_s, matched = _skill_overlap_score(master, order)
        region_s = _region_score(master, order)
        rating_s = _rating_score(master)
        avail_s = _availability_score(master)

        # Kategoriya bonusi — agar usta order kategoriyasiga ega bo'lsa
        category_s = Decimal("0")
        if order.category_id and any(
            c.id == order.category_id for c in master.categories.all()
        ):
            category_s = Decimal("15")

        total = skill_s + region_s + rating_s + avail_s + category_s

        reason_parts = []
        if matched:
            reason_parts.append(f"{matched} ta ko'nikma mos")
        elif category_s > 0:
            reason_parts.append("kasbi mos")
        if region_s >= 20:
            reason_parts.append("aynan shu hududda")
        if master.rating_cache >= 4:
            reason_parts.append(f"reyting {master.rating_cache}")

        scored.append(
            Scored(
                master=master,
                score=total,
                skill=skill_s,
                region=region_s,
                rating=rating_s,
                availability=avail_s,
                reason=", ".join(reason_parts) or "kategoriya mos",
            )
        )

    scored.sort(key=lambda s: s.score, reverse=True)
    return scored[:limit]
