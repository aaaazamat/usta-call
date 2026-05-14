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
        # Kategoriya — agar mijoz tanlamagan bo'lsa
        if not order.category_id and analysis.category_slug:
            cat = Category.objects.filter(slug=analysis.category_slug).first()
            if cat:
                order.category = cat

        order.ai_summary = analysis.summary
        order.ai_processed_at = timezone.now()
        if analysis.urgency and order.urgency == "normal":
            order.urgency = analysis.urgency
        order.save(update_fields=["category", "ai_summary", "ai_processed_at", "urgency", "updated_at"])

        if analysis.skill_slugs:
            skills = Skill.objects.filter(slug__in=analysis.skill_slugs)
            order.ai_extracted_skills.set(skills)

        # Matching
        scored = rank_masters_for_order(order)
        OrderMatch.objects.filter(order=order).delete()
        OrderMatch.objects.bulk_create([
            OrderMatch(
                order=order,
                master=s.master,
                score=s.score,
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
