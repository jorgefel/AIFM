# ─────────────────────────────────────────────────────────────
# app/services/market_evidence.py — Normalización y lectura de evidencia de mercado
# Regla 5: GET único en Redis, degradación a Postgres, jamás disparar scraping.
# ─────────────────────────────────────────────────────────────
from __future__ import annotations

from datetime import date, datetime, timezone
import json
import re
import unicodedata
import uuid
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis_client
from app.models.market_snapshot import MarketSnapshot
from app.models.property import Property
from app.schemas.competitors import CompetitorSnapshot, CompetitorListing


AMENITY_CANONICAL_MAP = {
    "wifi": "wifi",
    "wi-fi": "wifi",
    "internet": "wifi",
    "inalambrico": "wifi",
    "alberca": "pool",
    "piscina": "pool",
    "pool": "pool",
    "swimming pool": "pool",
    "aire acondicionado": "ac",
    "air conditioning": "ac",
    "ac": "ac",
    "a/c": "ac",
    "clima": "ac",
    "cocina": "kitchen",
    "kitchen": "kitchen",
    "cocineta": "kitchen",
    "estacionamiento": "parking",
    "aparcamiento": "parking",
    "parqueadero": "parking",
    "parking": "parking",
    "cochera": "parking",
    "jacuzzi": "hot_tub",
    "hot tub": "hot_tub",
    "tina de hidromasaje": "hot_tub",
    "gimnasio": "gym",
    "gym": "gym",
    "fitness": "gym",
    "tv": "tv",
    "television": "tv",
    "televisor": "tv",
    "lavadora": "washer",
    "washer": "washer",
    "washing machine": "washer",
    "secadora": "dryer",
    "dryer": "dryer",
    "balcon": "balcony",
    "balcony": "balcony",
    "terraza": "balcony",
    "vista al mar": "ocean_view",
    "ocean view": "ocean_view",
    "sea view": "ocean_view",
}


def normalize_amenity_name(name: str) -> str:
    """Limpia tildes, mayúsculas y espacios para canonicalizar amenidades."""
    if not name or not isinstance(name, str):
        return ""
    text = name.strip().lower()
    text = unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8")
    text = re.sub(r"[^\w\s-]", "", text)
    return AMENITY_CANONICAL_MAP.get(text, text)


def match_equivalent_amenities(
    property_amenities: List[str], comparable_amenities: List[str]
) -> List[str]:
    """Compara amenidades solo cuando exista el dato equivalente en la propiedad propia."""
    if not property_amenities or not comparable_amenities:
        return []
    prop_canonical: Set[str] = {
        normalize_amenity_name(a) for a in property_amenities if a
    }
    prop_canonical.discard("")
    if not prop_canonical:
        return []

    matched: Set[str] = set()
    for comp_a in comparable_amenities:
        canon = normalize_amenity_name(comp_a)
        if canon and canon in prop_canonical:
            matched.add(canon)
    return sorted(list(matched))


def calculate_market_position(
    own_price: Optional[float],
    median_price: Optional[float],
    p25: Optional[float] = None,
    p75: Optional[float] = None,
) -> str:
    """Calcula la posición determinística de la tarifa frente a la mediana y percentiles."""
    if own_price is None or median_price is None:
        return "indeterminado"

    # Redondeo para evitar microdiferencias de flotantes
    diff = round(own_price - median_price, 2)
    if diff == 0:
        return "en la mediana"

    if diff > 0:
        if p75 is not None and own_price >= p75:
            return "por encima de la mediana (rango alto)"
        return "por encima de la mediana"
    else:
        if p25 is not None and own_price <= p25:
            return "por debajo de la mediana (rango bajo)"
        return "por debajo de la mediana"


def normalize_comparable(
    listing: Any, property_: Any
) -> Dict[str, Any]:
    """Normaliza un comparable frente a la propiedad:

    - Capacidad (precio por huésped si la capacidad difiere)
    - Habitaciones, camas, baños
    - Amenidades (solo si la propiedad propia las tiene definidas)
    - Rating (solo si la propiedad propia tiene rating equivalente)
    - Tolerante a campos nulos o faltantes.
    """
    raw_listing = listing if isinstance(listing, dict) else listing.model_dump() if hasattr(listing, "model_dump") else {}
    prop_dict = property_ if isinstance(property_, dict) else property_.__dict__ if hasattr(property_, "__dict__") else {}

    prop_guests = int(prop_dict.get("max_guests") or 1)
    prop_rate = float(prop_dict.get("nightly_rate") or 0.0) if prop_dict.get("nightly_rate") is not None else None
    prop_amenities = prop_dict.get("amenities") or []
    prop_rating = prop_dict.get("rating")  # Nominalmente None en Property

    comp_rate = float(raw_listing.get("nightly_rate") or 0.0) if raw_listing.get("nightly_rate") is not None else None
    comp_guests = int(raw_listing.get("person_capacity") or raw_listing.get("accommodates") or prop_guests)
    comp_amenities = raw_listing.get("amenities") or []
    comp_rating = float(raw_listing.get("rating")) if raw_listing.get("rating") is not None else None

    # Normalización de capacidad
    capacity_ratio = comp_guests / max(prop_guests, 1)
    price_per_guest = (comp_rate / comp_guests) if comp_rate is not None and comp_guests > 0 else None
    normalized_rate = (price_per_guest * prop_guests) if price_per_guest is not None else comp_rate

    # Rating y amenities solo si existen en la propiedad propia
    matched_amenities = match_equivalent_amenities(prop_amenities, comp_amenities) if prop_amenities else []
    rating_comparison = None
    if prop_rating is not None and comp_rating is not None:
        rating_comparison = {
            "own_rating": float(prop_rating),
            "comp_rating": comp_rating,
            "difference": round(comp_rating - float(prop_rating), 2),
        }

    return {
        "id": raw_listing.get("id"),
        "title": raw_listing.get("title"),
        "nightly_rate": comp_rate,
        "normalized_nightly_rate": round(normalized_rate, 2) if normalized_rate is not None else None,
        "capacity": comp_guests,
        "capacity_ratio": round(capacity_ratio, 2),
        "bedrooms": raw_listing.get("bedrooms"),
        "beds": raw_listing.get("beds"),
        "bathrooms": raw_listing.get("bathrooms"),
        "rating_comparison": rating_comparison,
        "matched_amenities": matched_amenities,
    }


async def record_market_snapshot(
    db: AsyncSession,
    property_: Property,
    snapshot: CompetitorSnapshot,
) -> MarketSnapshot:
    """Guarda un snapshot de mercado en Postgres con upsert idempotente por propiedad y día."""
    prices = [l.nightly_rate for l in snapshot.listings if l.nightly_rate is not None]
    price_min = min(prices) if prices else None
    price_max = max(prices) if prices else None
    median = snapshot.aggregates.median_nightly_rate if snapshot.aggregates else None
    p25 = snapshot.aggregates.p25_nightly_rate if snapshot.aggregates else None
    p75 = snapshot.aggregates.p75_nightly_rate if snapshot.aggregates else None

    own_price = float(property_.nightly_rate) if property_.nightly_rate is not None else None
    position = calculate_market_position(own_price, median, p25, p75)

    captured_at = snapshot.fetched_at if isinstance(snapshot.fetched_at, datetime) else datetime.now(timezone.utc)
    snapshot_date = captured_at.date()

    stmt = select(MarketSnapshot).where(
        MarketSnapshot.property_id == property_.id,
        MarketSnapshot.snapshot_date == snapshot_date,
    )
    result = await db.execute(stmt)
    existing = result.scalars().first()

    if existing:
        existing.captured_at = captured_at
        existing.comparables_count = (
            snapshot.aggregates.listing_count if snapshot.aggregates else len(snapshot.listings)
        )
        existing.median_price = median
        existing.price_min = price_min
        existing.price_max = price_max
        existing.own_price = own_price
        existing.position = position
        existing.currency = snapshot.currency
        await db.commit()
        await db.refresh(existing)
        return existing

    new_snap = MarketSnapshot(
        property_id=property_.id,
        captured_at=captured_at,
        snapshot_date=snapshot_date,
        comparables_count=(
            snapshot.aggregates.listing_count if snapshot.aggregates else len(snapshot.listings)
        ),
        median_price=median,
        price_min=price_min,
        price_max=price_max,
        own_price=own_price,
        position=position,
        currency=snapshot.currency,
    )
    db.add(new_snap)
    await db.commit()
    await db.refresh(new_snap)
    return new_snap


async def get_market_evidence(
    property_id: uuid.UUID | str,
    db: AsyncSession,
    property_: Optional[Property] = None,
) -> Dict[str, Any]:
    """Lee el snapshot de mercado desde Redis con máximo 1 GET.

    Si la clave no existe, expiró o Redis falla, degrada elegantemente
    al último snapshot registrado en PostgreSQL.
    NUNCA dispara scraping.
    """
    key = f"competitors:{str(property_id)}:fallback:1"
    cached = None

    try:
        # Exactamente un GET hacia Redis
        cached = await redis_client.get(key)
    except Exception:
        cached = None

    if cached:
        try:
            data = json.loads(cached) if isinstance(cached, str) else cached
            fetched_at_raw = data.get("fetched_at")
            fecha_consulta = (
                fetched_at_raw[:10]
                if isinstance(fetched_at_raw, str) and len(fetched_at_raw) >= 10
                else date.today().isoformat()
            )
            aggregates = data.get("aggregates") or {}
            listings = data.get("listings") or []
            prices = [
                float(l["nightly_rate"])
                for l in listings
                if isinstance(l, dict) and l.get("nightly_rate") is not None
            ]
            price_min = min(prices) if prices else None
            price_max = max(prices) if prices else None
            median = aggregates.get("median_nightly_rate")
            p25 = aggregates.get("p25_nightly_rate")
            p75 = aggregates.get("p75_nightly_rate")

            own_price = None
            if property_ and property_.nightly_rate is not None:
                own_price = float(property_.nightly_rate)

            posicion = calculate_market_position(
                own_price,
                float(median) if median is not None else None,
                float(p25) if p25 is not None else None,
                float(p75) if p75 is not None else None,
            )

            return {
                "fecha_consulta": fecha_consulta,
                "n_comparables": aggregates.get("listing_count", len(listings)),
                "mediana_precio": float(median) if median is not None else None,
                "rango": {
                    "min": float(price_min) if price_min is not None else None,
                    "max": float(price_max) if price_max is not None else None,
                },
                "posicion": posicion,
                "currency": data.get("currency", "MXN"),
            }
        except Exception:
            # Si falla el parseo, degradamos al histórico de Postgres
            pass

    # Fallback: consultar el último snapshot registrado en Postgres
    last_snapshot = None
    try:
        stmt = (
            select(MarketSnapshot)
            .where(MarketSnapshot.property_id == uuid.UUID(str(property_id)))
            .order_by(MarketSnapshot.captured_at.desc())
            .limit(1)
        )
        res = await db.execute(stmt)
        last_snapshot = res.scalars().first()
    except Exception:
        last_snapshot = None

    return {
        "estado": "sin_comparacion_vigente",
        "ultima_consulta": (
            last_snapshot.snapshot_date.isoformat()
            if last_snapshot and last_snapshot.snapshot_date
            else None
        ),
    }
