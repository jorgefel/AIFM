# Spec: market-snapshot

Module id: `market-snapshot`  
Depends on: none  
Capability map: [market-intelligence-capability-map.md](./market-intelligence-capability-map.md)

## Objective

Give a Pro user a safe, reproducible snapshot of publicly listed Airbnb
competitors near one of their Nomora properties. The snapshot is the sole data
source for subsequent comparison UI and AI context modules.

Nomora derives the query from the stored address, currency, guests, bedrooms,
and bathrooms; runs `tri_angle/airbnb-scraper` only from the backend; validates
and normalizes its untrusted dataset; and saves the dated result in Redis. The
client can poll the existing jobs API and later read the cached snapshot. There
is no market-snapshot database table or migration.

### MVP acceptance criteria

1. Only a Pro owner of the selected active property can create or read its
   snapshots. A request for another user's property returns the existing
   authorization/not-found behavior.
2. `APIFY_TOKEN` is server-only; it is absent from API responses, logs, jobs,
   browser bundles, migrations, and test fixtures.
3. A refresh sends the actor a location query based on the property's address,
   its ISO currency, and matching guests/bedrooms/bathrooms. It requests at
   most 50 listings.
4. The completed snapshot contains only validated, normalized public fields:
   Airbnb listing ID, title, public URL, coordinates, nightly price/currency,
   rating, public review count, capacity, bedrooms/bathrooms/beds where
   available, room type, superhost flag, and amenity labels.
5. Invalid individual actor records are discarded and counted; a malformed
   provider response never reaches persistence or the UI raw.
6. Snapshot aggregates include count, median nightly price, median rating,
   median public review count, and amenity-frequency data. A median appears
   only when enough valid values exist; otherwise it is `null`.
7. Opening the comparison after its cached result expires starts at most one
   automatic refresh per property every 24 hours. A duplicate automatic refresh
   or concurrent request reuses the in-flight job rather than starting another
   billable actor run. A user can explicitly request a refresh outside that cadence.
8. Provider failure or no results leaves the previous cached success readable
   until its cache TTL expires, records a safe error state, and exposes a
   Spanish message without provider tokens or raw response bodies.
9. No field is named or inferred as competitor reservation count, occupancy,
   or revenue. `reviewsCount` is named `publicReviewCount` everywhere.

## Tech stack

- FastAPI + Pydantic 2 + SQLAlchemy async + PostgreSQL.
- Redis-backed `job_manager`, snapshot cache, and distributed refresh lock. The
  cache is local server infrastructure, not browser storage and not PostgreSQL.
- `httpx` (already installed) for Apify REST API; no new SDK dependency.
- Alembic for the persistent snapshot schema.
- Next.js + React Query consumes the typed REST response in later modules.

## Commands

```powershell
# Backend tests (uses an isolated PostgreSQL configured in TEST_DATABASE_URL)
cd apps/server; .venv\Scripts\pytest tests/services/test_market_snapshot.py tests/api/test_market_snapshots.py

# Database migration validation against the configured development database
cd apps/server; .venv\Scripts\alembic upgrade head

# Frontend type/lint/build checks when the next module is implemented
pnpm --filter @aifm/web type-check
pnpm --filter @aifm/web lint
pnpm --filter @aifm/web build
```

## Project structure

```text
apps/server/app/core/config.py                 # APIFY_TOKEN configuration
apps/server/app/services/apify_airbnb.py       # provider client + response parsing
apps/server/app/schemas/market_snapshot.py     # request/response boundary schemas
apps/server/app/api/v1/routes/market_snapshots.py
apps/server/app/services/market_snapshot_cache.py # Redis keys, TTL, locking
apps/server/tests/services/test_apify_airbnb.py
apps/server/tests/api/test_market_snapshots.py
```

The later `market-comparison` module owns property-page components and hooks;
the later `market-ai-context` module owns prompt/context changes. This module
does not change either surface.

## Data and API contract

### Redis cache

The cache value holds normalized data, never the raw actor dataset:

- `market-comparison:{property_id}`: `state`, `fetched_at`, `expires_at`,
  provider/query metadata, normalized `listings`, aggregates, and bounded safe
  failure metadata.
- `market-comparison:active-job:{property_id}`: short-lived in-flight job ID
  used to deduplicate concurrent refreshes.
- `market-comparison:lock:{property_id}`: atomic distributed lock.

The successful snapshot TTL is 25 hours so a transient failed daily refresh can
continue serving the previous result for a bounded grace period. Refresh state
uses a shorter TTL. No raw provider response, host profile, guest information,
or actor token is cached. Listing URLs are public source attribution.

### REST surface

```text
GET  /api/v1/properties/{propertyId}/market-snapshots/latest
POST /api/v1/properties/{propertyId}/market-snapshots
```

`GET` returns a typed envelope with `status` (`EMPTY`, `PENDING`, `PROCESSING`,
`READY`, `FAILED`), `snapshot`, and a `canRefreshAt` timestamp. A missing
snapshot is a valid `200 EMPTY` response, not an error.

`POST` returns `202` with `{ jobId, status }` for a new run; it returns the
existing active job for an in-flight duplicate. It uses the existing jobs
endpoint for polling. A manual request is allowed even if the automatic daily
refresh already ran. It returns `403` for an insufficient plan and `422` when
the property cannot form a valid location/comparable query.

All Pydantic request and external-response schemas are strict at their
respective boundaries. Actor response parsing accepts only documented optional
fields and rejects/sanitizes unexpected types before mapping them into the
normalized listing schema.

### Provider behavior

The service uses the Apify actor endpoint for `tri_angle/airbnb-scraper`. It
sets `locationQueries`, `currency`, `adults`, `minBedrooms`, `minBathrooms`,
and `maxResults: 50`; it does not enrich host profiles. The run is tracked by
Apify run ID and fetched from its default dataset after completion. Transient
network, 429, and 5xx errors retry with bounded exponential backoff; permanent
4xx validation failures do not retry.

Provider data is a public market signal, not a system of record. The response
includes `source`, `fetchedAt`, `expiresAt`, matched listing count, and the
normalized query criteria so later UI can disclose provenance and freshness.

## Comparison semantics supplied by this module

This module emits raw normalized data and aggregates, not green/red colors.
The consumer module applies display colors using these fixed rules:

| Metric | Subject value | Benchmark | Favorable direction |
|---|---|---|---|
| Nightly price | Nomora `nightly_rate` | comparable median | lower |
| Capacity / rooms / bathrooms | Nomora property fields | comparable median | higher |
| Amenity coverage | matching amenity count | market frequency | higher |
| Rating | unavailable in MVP | comparable median | n/a |
| Public reviews | unavailable in MVP | comparable median | n/a |
| Reservations / occupancy | actual Nomora data only | unavailable | never compared |

A value is neutral when its source is absent or it differs by no more than 5%
from the comparable median. “Favorable” describes positioning, not guaranteed
booking or revenue impact.

## Code style

Use typed boundary models, keep provider concerns in the service, and make
routes orchestration-only. Follow existing async SQLAlchemy/`httpx` patterns.

```python
async def get_latest_snapshot(
    property_id: uuid.UUID,
    db: AsyncSession,
    current_user: User,
) -> MarketSnapshotEnvelope:
    await verify_property_access(property_id, current_user, db)
    snapshot = await market_snapshot_service.latest(property_id, db)
    return MarketSnapshotEnvelope.from_snapshot(snapshot)
```

- `snake_case` for Python and JSON fields, except API schemas already using
  Pydantic aliases; enums use uppercase values.
- Do not log request headers, actor URLs containing a token, or raw datasets.
- Services raise typed domain/provider exceptions; the route maps them to the
  project's existing FastAPI error format.
- Provider results are cache entries. A refresh atomically replaces the cached
  normalized snapshot after it completes; no historical comparison data is kept
  in PostgreSQL.

## Testing strategy

- Unit-test Apify input construction, response validation, normalization,
  median/frequency calculation, null/missing fields, and retry classification
  with mocked `httpx.AsyncClient`.
- API integration-test ownership, Pro access, `EMPTY`, deduplicated active
  refreshes, 24-hour throttling, successful job completion, provider failure,
  and absence of token leakage.
- Migration test: upgrade from the current head and confirm latest-snapshot and
  active-run indexes exist.
- Contract test fixture: preserve a representative actor dataset including
  malformed rows, but never a production token or personally sensitive data.

## Boundaries

- Always: authorize property access; validate user and provider input at the
  boundary; normalize currency/number types; preserve last success on failure;
  disclose freshness and source; run focused tests before committing.
- Ask first: add a dependency; change Apify Actor/provider; change cache TTL,
  result cap, manual-refresh quota, or subscription gating; add own-rating
  fields or a property listing URL; write raw provider payloads; change any AI
  prompt.
- Never: expose `APIFY_TOKEN`; call Apify from the browser; represent reviews
  as reservations/occupancy; scrape private host/guest data; overwrite Nomora
  financial data; silently fabricate a comparison when the actor returns none.

## Open questions / decisions proposed for approval

1. Approved: cache-only snapshots; a refresh when a comparison cache expires
   (at most once per 24 hours) plus explicit user-triggered refreshes.
2. MVP excludes owner-rating and owner-public-review comparisons because no
   verified owner Airbnb listing URL/ID exists in the current data model.
3. The actor query is address/location-based and comparability-filtered; it is
   not marketed as a precise geographic-radius search.
