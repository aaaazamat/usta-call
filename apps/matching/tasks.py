"""Celery tasklar — AI tahlil va matching fonda ishlaydi."""
from __future__ import annotations

import logging

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from apps.masters.models import Category, Skill
from apps.orders.models import Order

from .models import OrderMatch
from .services.ai import analyze_order_text
from .services.scorer import rank_masters_for_order

logger = logging.getLogger(__name__)


@shared_task(name="matching.analyze_order")
def analyze_order(order_id: int) -> dict:
    """Order matnini AI bilan tahlil qilib, mos ustalarni topib `OrderMatch`ga yozadi."""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return {"error": "order topilmadi", "order_id": order_id}

    analysis = analyze_order_text(f"{order.title}\n\n{order.description}")
    logger.info("Order %s AI analiz: %s", order_id, analysis.raw)

    with transaction.atomic():
        # Avval ko'nikmalarni yozamiz (kasbni ulardan ham aniqlash uchun kerak)
        matched_skills = []
        if analysis.skill_slugs:
            matched_skills = list(Skill.objects.filter(slug__in=analysis.skill_slugs))
            order.ai_extracted_skills.set(matched_skills)

        # Kategoriya (kasb) — mijoz tanlamagan bo'lsa AI aniqlaydi.
        # 1) AI to'g'ridan-to'g'ri kategoriya bergan bo'lsa — o'shani.
        # 2) Bermasa, lekin ko'nikma topilgan bo'lsa — eng ko'p uchragan
        #    ko'nikmaning kategoriyasini olamiz (kasb deyarli doim aniqlanadi).
        if not order.category_id:
            cat = None
            if analysis.category_slug:
                cat = Category.objects.filter(slug=analysis.category_slug).first()
            if cat is None and matched_skills:
                from collections import Counter

                counter = Counter(s.category_id for s in matched_skills if s.category_id)
                if counter:
                    cat = Category.objects.filter(id=counter.most_common(1)[0][0]).first()
            if cat:
                order.category = cat

        order.ai_summary = analysis.summary
        order.ai_processed_at = timezone.now()
        if analysis.urgency and order.urgency == "normal":
            order.urgency = analysis.urgency
        order.save(update_fields=["category", "ai_summary", "ai_processed_at", "urgency", "updated_at"])

        # Matching — kasb-birinchi, 0..100 ball
        scored = rank_masters_for_order(order)
        OrderMatch.objects.filter(order=order).delete()
        OrderMatch.objects.bulk_create([
            OrderMatch(
                order=order,
                master=s.master,
                score=s.score,
                category_score=s.category,
                skill_score=s.skill,
                region_score=s.region,
                rating_score=s.rating,
                availability_score=s.availability,
                reason=s.reason,
            )
            for s in scored
        ])

    return {
        "order_id": order_id,
        "category": analysis.category_slug,
        "skills": analysis.skill_slugs,
        "matches": len(scored),
    }
