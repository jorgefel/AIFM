# Capability Map: inteligencia competitiva Airbnb

## Assumptions under review

1. This is a Pro-only, read-only feature scoped to one property owned by the
   authenticated user.
2. The backend calls `tri_angle/airbnb-scraper` with the property's address,
   currency, and comparable capacity filters; the Apify token stays server-side.
3. A comparison is a dated market snapshot, not live inventory. Results are
   cached and refreshable explicitly to control cost and avoid blocking the UI.
4. The actor's `reviewsCount` may be shown as public review volume, but never
   labeled as competitor reservations or occupancy. The actor does not expose
   confirmed reservation counts.
5. Nomora currently stores no rating for the owner's property. Rating comparisons
   therefore require either a verified Airbnb listing URL/ID or an explicit
   owner-entered rating source; they cannot be derived from current reservations.

| Module id | Responsibility | Depends on |
|---|---|---|
| market-snapshot | Validate and run Apify searches, normalize untrusted output, persist a dated owner-scoped snapshot, and expose its read/refresh contract. | — |
| market-comparison | Render the property-versus-market table, freshness/error states, and explicit metric provenance. | market-snapshot |
| market-ai-context | Supply the most recent valid aggregate snapshot to existing read-only AI analysis/copilot prompts without letting the model alter market data. | market-snapshot |

Build order: `market-snapshot` → `market-comparison` and `market-ai-context`.

## Key product decisions to approve

- The initial comparable set is limited to Airbnb listings returned for the
  property's address/location and filtered by guests, bedrooms, and bathrooms.
  We will disclose the query and result count; it is not a guaranteed radius.
- In the first release, green/red is a relative comparison against a median of
  comparable listings. For price, "green" means below median and "red" above
  median; for ratings/review volume and amenities, green means above median and
  red below median. A neutral state covers missing data or values within an
  agreed tolerance.
- Owner-only metrics (actual reservations and occupancy) are displayed beside
  public competitor signals but are never directly compared as though the
  competitor figures were known.
- Snapshot retention/refresh cadence, the maximum number of results, and any
  per-user quota remain open until product approval, because they set Apify cost.

## Sources checked

- The current `Property` model already has address, currency, capacity,
  bedrooms, bathrooms, nightly rate, and amenities.
- The existing analysis API has authenticated property access plus a Redis-backed
  asynchronous job pattern suitable for a remote provider.
- Apify documents that `tri_angle/airbnb-scraper` returns price, rating,
  `reviewsCount`, capacity, location, and amenities in a dataset; the actor has
  no documented reservation-count field.
