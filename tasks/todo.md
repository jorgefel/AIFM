# Airbnb market comparison tasks

- [ ] Task 1: Define and test the Apify market-data boundary
  - Acceptance: build and normalize a secure 50-result comparable query.
  - Verify: `cd apps/server; .venv\Scripts\pytest tests/services/test_apify_airbnb.py`
  - Files: config, provider service/schema, provider tests.

- [ ] Task 2: Implement Redis snapshot lifecycle and cache-expiry refresher
  - Acceptance: cache-only snapshot, refresh when an expired tab opens, manual refresh, and deduplicated jobs.
  - Verify: `cd apps/server; .venv\Scripts\pytest tests/services/test_market_snapshot_cache.py`
  - Files: cache/job services and tests.

## Checkpoint: cache foundation

- [ ] Provider and cache tests pass; no market PostgreSQL table exists.

- [ ] Task 3: Expose the market snapshot through authenticated endpoints
  - Acceptance: authorized Pro owner can read/refresh; jobs are owner-scoped.
  - Verify: `cd apps/server; .venv\Scripts\pytest tests/api/test_market_snapshots.py tests/api/test_jobs.py`
  - Files: route, API registration, job route/schema, tests.

- [ ] Task 4: Deliver the Comparación tab and comparable-list table
  - Acceptance: ready/empty/failed states, manual refresh, accessible green/red/neutral comparison.
  - Verify: `pnpm --filter @aifm/web type-check; pnpm --filter @aifm/web lint; pnpm --filter @aifm/web build`
  - Files: property page, comparison page, hook, component, types.

## Checkpoint: end-to-end comparison

- [ ] Authorized Pro manual refresh → job polling → cached comparison works without a second provider call.

- [ ] Task 5: Add cached market aggregates to AI recommendations and copilot
  - Acceptance: read-only dated aggregate context with no booking/occupancy inference.
  - Verify: `cd apps/server; .venv\Scripts\pytest tests/agents/test_market_context.py tests/api/test_analysis_dashboard.py`
  - Files: cache service, AI agents/analysis route, tests.

## Checkpoint: complete

- [ ] Focused backend tests, frontend checks, browser verification, and `graphify update .` pass.
