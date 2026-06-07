"""AI tahlil — order matnini structured JSON ga aylantiradi.

Claude yoki OpenAI ishlatishi mumkin (settings.AI_PROVIDER).
API kalit yo'q bo'lsa, oddiy keyword-asoslangan fallbackga o'tadi.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Iterable

from django.conf import settings

from apps.masters.models import Category, Skill

logger = logging.getLogger(__name__)


@dataclass
class OrderAnalysis:
    """Order matnidan AI chiqargan strukturali ma'lumot."""

    category_slug: str | None = None
    skill_slugs: list[str] = field(default_factory=list)
    urgency: str = "normal"  # low|normal|high|emergency
    summary: str = ""
    raw: dict | None = None


SYSTEM_PROMPT = """Sen "Usta-Call" marketplace'ining AI yordamchisisan.
Mijozning yozgan matnini tahlil qilib, qaysi turdagi usta kerakligini aniqlaysan.

Mavjud kategoriyalar (slug):
{categories}

Mavjud ko'nikmalar (slug — name — kategoriya):
{skills}

Faqat shu JSON formatda javob ber, boshqa hech narsa yozma:
{{
  "category_slug": "<bitta kategoriya slug>",
  "skill_slugs": ["<eng kerakli 1-4 ko'nikma slug>"],
  "urgency": "low|normal|high|emergency",
  "summary": "<2-3 jumlada qisqa mazmuni o'zbek tilida>"
}}"""


def _build_system_prompt() -> str:
    cats = "\n".join(f"- {c.slug} — {c.name}" for c in Category.objects.filter(is_active=True))
    skills = "\n".join(
        f"- {s.slug} — {s.name} — {s.category.slug}"
        for s in Skill.objects.select_related("category").all()[:200]
    )
    return SYSTEM_PROMPT.format(categories=cats, skills=skills)


def _parse_json_response(text: str) -> dict:
    """LLM ba'zan JSON atrofiga matn qo'shadi — uni tozalaymiz."""
    match = re.search(r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"JSON topilmadi: {text[:200]}")
    return json.loads(match.group())


def _analyze_anthropic(text: str) -> dict:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    resp = client.messages.create(
        model=settings.AI_MODEL_ANTHROPIC,
        max_tokens=500,
        system=_build_system_prompt(),
        messages=[{"role": "user", "content": text}],
    )
    return _parse_json_response(resp.content[0].text)


def _analyze_openai(text: str) -> dict:
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    resp = client.chat.completions.create(
        model=settings.AI_MODEL_OPENAI,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _build_system_prompt()},
            {"role": "user", "content": text},
        ],
    )
    return json.loads(resp.choices[0].message.content)


def _gemini_keys() -> list[str]:
    """Mavjud Gemini kalitlari (bir nechta bo'lsa — navbat bilan ishlatiladi)."""
    keys = list(getattr(settings, "GEMINI_API_KEYS", []) or [])
    if not keys and settings.GEMINI_API_KEY:
        keys = [settings.GEMINI_API_KEY]
    return keys


def _analyze_gemini(text: str) -> dict:
    """Google Gemini API — bir nechta kalit bilan.

    Bitta kalit limitga (429 — quota tugadi) yoki 403 (yaroqsiz) ga uchrasa,
    avtomatik keyingi kalitga o'tadi. Barcha kalitlar tugasa — xato (keyword
    fallback'ga o'tadi).
    """
    import httpx

    model = settings.AI_MODEL_GEMINI
    body = {
        "system_instruction": {"parts": [{"text": _build_system_prompt()}]},
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
            "maxOutputTokens": 2000,
            # Gemini 2.5 "thinking" — javobni soda bo'lishi uchun o'chirib qo'yamiz
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    keys = _gemini_keys()
    if not keys:
        raise RuntimeError("Gemini kaliti yo'q")

    last_exc: Exception | None = None
    for idx, key in enumerate(keys, start=1):
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
            f":generateContent?key={key}"
        )
        try:
            with httpx.Client(timeout=20) as client:
                resp = client.post(url, json=body)
            # 429 = limit/quota tugadi, 403 = yaroqsiz/bloklangan → keyingi kalit
            if resp.status_code in (429, 403):
                logger.warning(
                    "Gemini kalit #%s ishlamadi (HTTP %s) — keyingi kalitga o'tamiz",
                    idx, resp.status_code,
                )
                last_exc = httpx.HTTPStatusError(
                    f"status {resp.status_code}", request=resp.request, response=resp
                )
                continue
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return _parse_json_response(raw_text)
        except Exception as exc:  # noqa: BLE001 — keyingi kalitni sinaymiz
            last_exc = exc
            logger.warning("Gemini kalit #%s xatosi: %s — keyingisini sinaymiz", idx, exc)
            continue

    raise last_exc or RuntimeError("Barcha Gemini kalitlari ishlamadi")


# Kasb (kategoriya slug) → o'zbekcha/ruscha keng tarqalgan kalit so'zlar.
# Gemini ishlamay qolsa ham kasbni matndan aniqlash uchun himoya qatlami.
CATEGORY_HINTS: dict[str, list[str]] = {
    "santexnik": [
        "santexnik", "jomrak", "kran", "quvur", "truba", "suv", "kanalizatsiya",
        "vannaxona", "smesitel", "unitaz", "rakovina", "kanalizatsiya", "oqava",
        "isitish", "radiator", "vodoprovod",
    ],
    "elektrik": [
        "elektrik", "elektr", "simchi", "rozetka", "lyustra", "avtomat", "provod",
        "sim", "vyklyuchatel", "vikluchatel", "svet", "lampa", "shchitok", "shitok",
        "elektr toki", "elektr montaj", "provodka",
    ],
    "quruvchi": [
        "quruvchi", "qurilish", "gisht", "g'isht", "beton", "suvoq", "shtukaturka",
        "pol", "plitka", "kafel", "devor", "fundament", "styajka", "remont",
        "tamirlash", "ta'mirlash",
    ],
    "boyoqchi": [
        "boyoqchi", "bo'yoq", "boyoq", "oboy", "malyar", "pokraska", "shpaklyovka",
        "devor bo'yash", "oq qilash", "oqlash", "bezak",
    ],
    "klimatchi": [
        "klimatchi", "konditsioner", "kondizioner", "klimat", "ventilyatsiya",
        "sovutkich", "split", "muzlatkich",
    ],
    "avto-usta": [
        "avto", "mashina", "avtomobil", "dvigatel", "mator", "tormoz", "moy",
        "diagnostika", "remont avto", "avtoservis", "matarist",
    ],
    "kompyuter-ustasi": [
        "kompyuter", "komputer", "noutbuk", "noutbuk", "windows", "virus",
        "dastur", "pc", "monitor", "klaviatura", "tizim",
    ],
    "tikuvchi": [
        "tikuvchi", "tikuv", "tikish", "libos", "kiyim", "mato", "ko'ylak",
        "shim", "tuzatish", "atelye",
    ],
    "tozalash-xizmati": [
        "tozalash", "tozalik", "yuvish", "uborka", "kvartira tozalash",
        "deraza yuvish", "gilam tozalash",
    ],
    "bogbon": [
        "bog'bon", "bogbon", "bog'", "daraxt", "maysa", "sug'orish", "gul",
        "o'simlik", "landshaft",
    ],
    "mebelchi": [
        "mebel", "mebelchi", "shkaf", "stol", "stul", "yog'och", "divan",
        "garderob", "kuxnya mebel",
    ],
}


def _category_from_keywords(text_low: str) -> str | None:
    """Matndagi kalit so'zlar bo'yicha eng mos kasb slug'ini topadi."""
    best_slug, best_hits = None, 0
    for slug, words in CATEGORY_HINTS.items():
        hits = sum(1 for w in words if w in text_low)
        if hits > best_hits:
            best_slug, best_hits = slug, hits
    return best_slug


def _analyze_keyword_fallback(text: str) -> dict:
    """API kalit/aloqasi yo'q bo'lsa — kalit so'z bo'yicha kasb va ko'nikma aniqlash."""
    text_low = text.lower()

    # 1) Ko'nikmalar — nom, slug va aliaslar bo'yicha
    matched_skills: list[Skill] = []
    for skill in Skill.objects.select_related("category"):
        name = (skill.safe_translation_getter("name", any_language=True) or "").lower()
        terms = [name, skill.slug] + [a.lower() for a in (skill.aliases or [])]
        if any(t and t in text_low for t in terms):
            matched_skills.append(skill)

    # 2) Kasb (kategoriya): avval kalit so'z lug'ati, bo'lmasa ko'nikmaning kasbi
    category = None
    slug = _category_from_keywords(text_low)
    if slug:
        category = Category.objects.filter(slug=slug).first()
    if category is None and matched_skills:
        from collections import Counter

        counter = Counter(s.category_id for s in matched_skills if s.category_id)
        if counter:
            category = Category.objects.filter(id=counter.most_common(1)[0][0]).first()

    urgency_map = [
        ("zudlik", "emergency"), ("favqulodda", "emergency"),
        ("tez", "high"), ("hozir", "high"), ("shoshilinch emas", "low"),
    ]
    urgency = "normal"
    for kw, level in urgency_map:
        if kw in text_low:
            urgency = level
            break

    return {
        "category_slug": category.slug if category else None,
        "skill_slugs": [s.slug for s in matched_skills[:4]],
        "urgency": urgency,
        "summary": text[:200],
    }


def _pick_provider() -> str:
    """Tanlash logikasi: AI_PROVIDER sozlamasi bo'yicha tegishli kalit borligini tekshiradi.
    Agar konfiguratsiya qilingan provayder kalitsiz qolsa, mavjud kalitlar orasidan tanlaydi.
    Hech qaysi kalit yo'q bo'lsa — keyword fallback.
    """
    preferred = (settings.AI_PROVIDER or "").lower()
    gemini_key = ",".join(_gemini_keys())  # bironta kalit bo'lsa — truthy
    candidates: list[tuple[str, str]] = [
        ("gemini", gemini_key),
        ("anthropic", settings.ANTHROPIC_API_KEY),
        ("openai", settings.OPENAI_API_KEY),
    ]

    # Avvalo afzal ko'rilgan provayderni tekshiramiz
    for name, key in candidates:
        if name == preferred and key:
            return name

    # Aks holda mavjud bo'lgan birinchi kalitni ishlatamiz
    for name, key in candidates:
        if key:
            return name

    return "keyword"


def analyze_order_text(text: str) -> OrderAnalysis:
    """Order matnini tahlil qilib, OrderAnalysis qaytaradi."""
    provider = _pick_provider()
    logger.info("AI provider: %s", provider)

    try:
        if provider == "gemini":
            raw = _analyze_gemini(text)
        elif provider == "anthropic":
            raw = _analyze_anthropic(text)
        elif provider == "openai":
            raw = _analyze_openai(text)
        else:
            logger.info("AI kaliti yo'q — keyword fallback ishlatilmoqda")
            raw = _analyze_keyword_fallback(text)
    except Exception as exc:
        logger.exception("AI tahlil xatosi, fallback'ga o'tdik: %s", exc)
        raw = _analyze_keyword_fallback(text)

    return OrderAnalysis(
        category_slug=raw.get("category_slug"),
        skill_slugs=list(raw.get("skill_slugs", [])),
        urgency=raw.get("urgency", "normal"),
        summary=raw.get("summary", ""),
        raw=raw,
    )
