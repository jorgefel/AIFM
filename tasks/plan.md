# Implementation Plan: Airbnb market comparison

## Overview

Add a property-level **Comparación** tab that contrasts the user's property
against nearby Airbnb listings. The backend obtains public listings from
`tri_angle/airbnb-scraper`, retains only normalized results in Redis, refreshes
an expired comparison when the user opens it, and also supports a manual
refresh. PostgreSQL remains the source for the user's property and reservations;
no market snapshot is persisted there.

The UI marks an advantage of the user's property in green and a disadvantage in
red. It treats public review count as a review signal only, never as bookings,
occupancy, or revenue. The existing AI flows receive a compact, dated market
summary after the cache contract is working.

## Architecture decisions

- **Cache, not database:** Redis stores the normalized snapshot for 25 hours,
  active job, and a distributed per-property lock.
  This avoids both repeated Apify cost and new PostgreSQL storage.
- **Automatic cadence:** Opening a comparison after its 25-hour cache expires
  starts one refresh. A Redis lock prevents two app instances from refreshing
  the same property at once.
- **Manual refresh:** `POST` creates/reuses an asynchronous job regardless of
  daily freshness. The client polls the existing jobs resource; concurrent
  refreshes for the same property share one job.
- **Boundary validation:** The Apify client is server-only, has a bounded result
  count of 50, validates every listing before caching, and never keeps raw
  provider responses or tokens.
- **Comparable semantics:** Use a median of returned listings. Price lower than
  median is green, price higher is red; capacity, rooms, bathrooms, and
  amenity coverage work in the opposite direction. Values within 5% or missing
  are neutral. Owner rating/review counts remain unavailable until a verified
  Airbnb listing ID/URL is introduced.
- **AI safety:** AI receives only cache aggregates, freshness, and carefully
  labeled public signals. It cannot change the cache, property, finances, or
  infer competitor bookings.

## Dependency graph

```text
Apify input/output validation
        ↓
Redis snapshot cache + refresh lock
        ↓
authenticated API contract + job ownership
        ↓
React Query hook + Comparison tab/table
        ↓
AI market-summary context
```

## Task list

### Phase 1: Provider and cache foundation

#### Task 1: Define and test the Apify market-data boundary

**Description:** Add the server configuration and a small `httpx` client for
`tri_angle/airbnb-scraper`. It builds a comparable query from an owned property,
uses the API token only in server-side headers/parameters, and maps valid actor
records to a strict normalized listing type.

**Acceptance criteria:**

- [ ] `APIFY_TOKEN` is required only when a refresh runs and cannot appear in
  logs, Pydantic responses, or raised user-facing errors.
- [ ] Input includes address/location, property currency, guests, bedrooms,
  bathrooms, `maxResults: 50`, and disables host enrichment.
- [ ] Invalid provider rows are discarded; valid rows expose only the documented
  public comparison fields and `publicReviewCount`.

**Verification:**

- [ ] Tests pass: `cd apps/server; .venv\Scripts\pytest tests/services/test_apify_airbnb.py`
- [ ] Mocked `httpx` tests cover a transient retry, a permanent failure, a
  malformed row, and an empty dataset.

**Dependencies:** None  
**Files likely touched:** `core/config.py`, `services/apify_airbnb.py`,
`schemas/market_snapshot.py`, `tests/services/test_apify_airbnb.py`  
**Estimated scope:** Medium

#### Task 2: Implement Redis snapshot lifecycle and cache-expiry refresher

**Description:** Build cache helpers and the refresh orchestration that obtains
validated listings, calculates aggregates, atomically writes a 25-hour cache
entry, and records/reuses active jobs. An expired comparison view starts a
refresh, guarded by Redis locks.

**Acceptance criteria:**

- [ ] Cache values contain only normalized listings, aggregates, query metadata,
  fetched/expiry times, and safe failure metadata; no raw actor data is cached.
- [ ] An expired comparison view does not call Apify twice for one property within 24
  hours, including across concurrent application instances.
- [ ] An explicit manual refresh can run before the daily due time, but duplicate
  concurrent requests reuse the active job.

**Verification:**

- [ ] Tests pass: `cd apps/server; .venv\Scripts\pytest tests/services/test_market_snapshot_cache.py`
- [ ] With a fake Redis/client, verify TTL, stale-success-on-failure, lock
  release, job deduplication, and 24-hour due calculation.

**Dependencies:** Task 1  
**Files likely touched:** `services/market_snapshot_cache.py`,
`services/job_manager.py`,
`tests/services/test_market_snapshot_cache.py`  
**Estimated scope:** Medium

### Checkpoint: cache foundation

- [ ] Focused provider/cache tests pass.
- [ ] A manual refresh with a test property creates one provider call and a
  second read is served from Redis.
- [ ] No database migration or market table has been added.

### Phase 2: authenticated API and comparison workspace

#### Task 3: Expose the market snapshot through authenticated endpoints

**Description:** Add the latest-snapshot read and manual-refresh routes under a
property, using the existing ownership and Pro-tier guards. Tighten job polling
so a job can only be read by its owner, then wire the new router into API v1.

**Acceptance criteria:**

- [ ] `GET /properties/{id}/market-snapshots/latest` returns `EMPTY`, active,
  `READY`, or `FAILED` cache envelopes with freshness metadata.
- [ ] `POST /properties/{id}/market-snapshots` returns `202` with a new or
  deduplicated job ID and never blocks on Apify.
- [ ] Other users cannot read the cache or its jobs; non-Pro users cannot
  create refreshes.

**Verification:**

- [ ] Tests pass: `cd apps/server; .venv\Scripts\pytest tests/api/test_market_snapshots.py tests/api/test_jobs.py`
- [ ] Integration tests cover `EMPTY`, ownership denial, tier denial, active-job
  reuse, completed response, and safe provider failure.

**Dependencies:** Task 2  
**Files likely touched:** `routes/market_snapshots.py`, `api.py`,
`routes/jobs.py`, `schemas/market_snapshot.py`, `tests/api/test_market_snapshots.py`  
**Estimated scope:** Medium

#### Task 4: Deliver the Comparación tab and comparable-list table

**Description:** Add a property-detail tab named **Comparación**, a typed React
Query hook, refresh action/polling state, and an accessible comparison table.
Show the user's property first followed by the cached competitor list, with
source/freshness disclosure and clear empty/loading/error states.

**Acceptance criteria:**

- [ ] The property detail screen links to `/properties/{id}/comparison` and the
  new page has an explicit “Comparación” tab label.
- [ ] The table uses green for user advantages and red for disadvantages;
  neutral/missing values have no positive/negative color. It does not show
  competitor reservations, occupancy, or revenue.
- [ ] The user can request a refresh, sees progress while the job is pending,
  and sees cached results after completion without page reload.

**Verification:**

- [ ] Checks pass: `pnpm --filter @aifm/web type-check; pnpm --filter @aifm/web lint; pnpm --filter @aifm/web build`
- [ ] Browser check: open a ready, empty, and failed cache state; verify keyboard
  table navigation, color labels are not the only carrier of meaning, and no
  console/network errors occur.

**Dependencies:** Task 3  
**Files likely touched:** `app/properties/[id]/page.tsx`,
`app/properties/[id]/comparison/page.tsx`, `hooks/useMarketComparison.ts`,
`components/properties/MarketComparisonTable.tsx`, `types/marketComparison.ts`  
**Estimated scope:** Medium

### Checkpoint: end-to-end comparison

- [ ] Backend focused tests and frontend build/type/lint checks pass.
- [ ] An authorized Pro user can manually refresh, poll, and view a cached
  comparison; a second visit makes no Apify request.
- [ ] A stale/failed provider result shows provenance and a safe Spanish state.

### Phase 3: read-only AI context

#### Task 5: Add cached market aggregates to AI recommendations and copilot

**Description:** Read the latest ready Redis snapshot when generating financial
analysis or property-scoped copilot context. Supply only freshness, sample size,
medians, and position labels, with explicit instructions that public review
counts are not reservations and recommendations are advisory.

**Acceptance criteria:**

- [ ] AI responses identify the snapshot date and say when no valid market cache
  is available rather than inventing market facts.
- [ ] Prompts include no competitor host/guest data, raw listing payloads, or
  API credentials.
- [ ] The AI integration remains read-only and cannot trigger a refresh.

**Verification:**

- [ ] Tests pass: `cd apps/server; .venv\Scripts\pytest tests/agents/test_market_context.py tests/api/test_analysis_dashboard.py`
- [ ] Unit tests assert the unavailable/stale/ready context text and that
  `publicReviewCount` is not described as bookings or occupancy.

**Dependencies:** Task 2, Task 3  
**Files likely touched:** `services/market_snapshot_cache.py`,
`agents/financial_advisor.py`, `agents/copilot.py`, `routes/analysis.py`,
`tests/agents/test_market_context.py`  
**Estimated scope:** Medium

### Checkpoint: complete

- [ ] All acceptance criteria in [SPEC-market-snapshot.md](../docs/SPEC-market-snapshot.md) pass.
- [ ] Backend focused tests, frontend type/lint/build, and browser verification
  are documented in the implementation handoff.
- [ ] `graphify update .` completes after code changes.
- [ ] Review the final diff for secret leakage, misleading public metrics, and
  scope creep before merge.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Apify changes fields or returns partial data | Medium | Strict normalization, discard invalid rows, show sample count/freshness, never cache raw data. |
| Manual refreshes increase cost | Medium | Keep a visible manual action and active-job deduplication; monitor/cache timestamps; add a quota only after product approval. |
| Multiple API instances read an expired comparison | High | Redis distributed property lock makes refresh idempotent across instances. |
| Redis eviction/loss | Medium | Return `EMPTY` and let the next automatic or manual refresh rebuild the cache; do not fall back to invented data. |
| Address query is broader than a neighborhood | Medium | Disclose query criteria and result count; do not claim a radius. |
| Color alone misleads or excludes users | Medium | Add directional text/icon and accessible labels alongside green/red colors. |
| Job ID exposure leaks cached data | High | Bind job status reads to the authenticated owner before returning result. |

## Parallelization

Tasks 1–3 are sequential because they establish the external, cache, and API
contracts. Once Task 3 is merged, Task 4 (UI) and Task 5 (AI context) can run
in parallel against the approved snapshot schema.

## Out of scope

- Persisting historical competitor snapshots in PostgreSQL.
- Estimating competitor reservations, occupancy, revenue, or demand.
- Matching the user's own Airbnb rating/review count without a verified Airbnb
  listing URL or ID.
- Geographic-radius guarantees, competitor price automation, or data writes.
