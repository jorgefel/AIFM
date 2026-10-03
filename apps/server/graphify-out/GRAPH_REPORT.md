# Graph Report - server  (2026-10-02)

## Corpus Check
- 88 files · ~20,585 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .ini 1, .mako 1)

## Summary
- 638 nodes · 1802 edges · 35 communities (18 shown, 17 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 165 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b0096135`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- get_dashboard_data
- Property
- expenses.py
- routes/auth.py
- users.py
- beds24_sync.py
- golden_rule.py
- sqlalchemy_ext_asyncio
- export.py
- test_dashboard_returns_daily_series_for_one_month
- User
- deterministic_analyzer.py
- schemas/dashboard.py
- financial_advisor.py
- rls_enable_all_tables.py
- integrations.py
- routes/analysis.py
- routes/billing.py
- request_ai_insights
- test_portfolio_summary.py
- test_analysis_dashboard.py

## God Nodes (most connected - your core abstractions)
1. `User` - 82 edges
2. `Property` - 48 edges
3. `Reservation` - 27 edges
4. `Base` - 26 edges
5. `Expense` - 23 edges
6. `UUIDMixin` - 21 edges
7. `verify_property_access()` - 20 edges
8. `TimestampMixin` - 20 edges
9. `ChannelConnection` - 16 edges
10. `_complete_oauth_callback()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `test_engine()` --uses--> `Base`  [INFERRED]
  tests/conftest.py → app/core/database.py
- `test_dashboard_returns_daily_series_for_one_month()` --uses--> `DashboardData`  [INFERRED]
  tests/api/test_analysis_dashboard.py → app/schemas/analysis.py
- `test_portfolio_summary_returns_a_row_for_each_property()` --calls--> `_portfolio_summary()`  [EXTRACTED]
  tests/engine/test_portfolio_summary.py → app/api/v1/routes/analysis.py
- `test_operational_alerts_include_loss_and_upcoming_checkin()` --calls--> `_build_operational_alerts()`  [EXTRACTED]
  tests/engine/test_operational_alerts.py → app/api/v1/routes/analysis.py
- `test_missing_onboarding_fields_only_reports_unset_values()` --calls--> `_missing_onboarding_fields()`  [EXTRACTED]
  tests/schemas/test_user_onboarding.py → app/api/v1/routes/users.py

## Import Cycles
- None detected.

## Communities (35 total, 17 thin omitted)

### Community 0 - "get_dashboard_data"
Cohesion: 0.18
Nodes (9): get_dashboard_data(), get_finance_overview(), get_financial_summary(), get_operational_alerts(), get_portfolio_dashboard(), _get_portfolio_data(), _get_property_data(), _run_ai_analysis_task() (+1 more)

### Community 1 - "Property"
Cohesion: 0.12
Nodes (20): search_all(), Base, main(), seed(), TimestampMixin, UUIDMixin, DashboardLayout, Expense (+12 more)

### Community 2 - "expenses.py"
Cohesion: 0.06
Nodes (28): create_expense(), delete_expense(), get_expenses(), update_expense(), upload_expense_receipt(), Settings, ExpenseBase, ExpenseCreate (+20 more)

### Community 3 - "routes/auth.py"
Cohesion: 0.07
Nodes (36): apple_callback(), apple_login(), _complete_oauth_callback(), _frontend_callback_url(), _get_or_create_oauth_user(), google_callback(), google_login(), login() (+28 more)

### Community 4 - "users.py"
Cohesion: 0.16
Nodes (12): get_me(), _missing_onboarding_fields(), update_me(), update_onboarding(), OnboardingProgressUpdate, UserBase, UserCreate, UserProfileUpdate (+4 more)

### Community 5 - "beds24_sync.py"
Cohesion: 0.08
Nodes (14): check_beds24_connection(), Beds24Client, _as_date(), _as_decimal(), _first(), normalize_beds24_booking(), normalize_beds24_inventory(), sync_beds24_bookings() (+6 more)

### Community 6 - "golden_rule.py"
Cohesion: 0.17
Nodes (11): calculate_expense_breakdown(), calculate_monthly_summary(), calculate_net_amount(), calculate_occupancy_rate(), detect_discrepancies(), to_decimal(), test_expense_breakdown_groups_only_the_requested_month(), test_calculate_monthly_summary() (+3 more)

### Community 7 - "sqlalchemy_ext_asyncio"
Cohesion: 0.09
Nodes (6): do_run_migrations(), run_migrations_offline(), run_migrations_online(), db_session(), event_loop(), test_engine()

### Community 8 - "export.py"
Cohesion: 0.10
Nodes (4): export_csv(), health_check(), lifespan(), test_csv_export_rejects_an_inverted_date_range()

### Community 9 - "test_dashboard_returns_daily_series_for_one_month"
Cohesion: 0.20
Nodes (7): test_dashboard_accepts_range_query_without_shadowing_builtin(), cache_summary(), cached_summary(), monthly_summary(), property_data(), verify_access(), test_dashboard_returns_daily_series_for_one_month()

### Community 11 - "User"
Cohesion: 0.09
Nodes (23): create_property(), delete_property(), get_properties(), get_property(), update_property(), create_reservation(), delete_reservation(), _ensure_no_overlap() (+15 more)

### Community 12 - "deterministic_analyzer.py"
Cohesion: 0.22
Nodes (6): AnalysisInput, calculate_health_score(), generate_alerts(), generate_deterministic_analysis(), generate_insights(), generate_recommendations()

### Community 13 - "schemas/dashboard.py"
Cohesion: 0.33
Nodes (3): Config, DashboardLayoutRead, DashboardLayoutUpdate

### Community 16 - "integrations.py"
Cohesion: 0.13
Nodes (25): _acquire_inventory_sync_slot(), _acquire_sync_lock(), create_beds24_connection(), create_ota_connection(), get_beds24_sync_history(), get_calendar_snapshot(), link_beds24_property(), list_beds24_connections() (+17 more)

### Community 18 - "routes/analysis.py"
Cohesion: 0.16
Nodes (14): get_job_status(), AIInsightRequest, DailyChartPoint, DashboardData, ExpenseBreakdownItem, FinanceOverview, JobStatus, MonthlySummary (+6 more)

### Community 20 - "routes/billing.py"
Cohesion: 0.11
Nodes (23): create_checkout_session(), create_portal_session(), _find_user_for_subscription(), _frontend_url(), get_billing_history(), get_billing_status(), _handle_stripe_event(), _latest_subscription() (+15 more)

### Community 27 - "request_ai_insights"
Cohesion: 0.15
Nodes (5): check_global_ai_limit(), check_user_ai_limit(), increment_ai_usage(), request_ai_insights(), request_deterministic_insights()

### Community 28 - "test_portfolio_summary.py"
Cohesion: 0.23
Nodes (6): _build_operational_alerts(), _portfolio_summary(), aggregate_monthly_summaries(), test_operational_alerts_include_loss_and_upcoming_checkin(), test_aggregate_monthly_summaries_keeps_occupancy_as_a_property_average(), test_portfolio_summary_returns_a_row_for_each_property()

## Knowledge Gaps
- **1 isolated node(s):** `Config`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 207 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `get_dashboard_data`, `Property`, `expenses.py`, `routes/auth.py`, `users.py`, `beds24_sync.py`, `export.py`, `integrations.py`, `routes/analysis.py`, `routes/billing.py`, `request_ai_insights`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **Why does `Property` connect `Property` to `get_dashboard_data`, `expenses.py`, `export.py`, `User`, `integrations.py`, `routes/analysis.py`, `test_portfolio_summary.py`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `Beds24Client` connect `beds24_sync.py` to `integrations.py`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 56 inferred relationships involving `User` (e.g. with `get_dashboard_data()` and `get_finance_overview()`) actually correct?**
  _`User` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `Property` (e.g. with `_build_operational_alerts()` and `_get_portfolio_data()`) actually correct?**
  _`Property` has 26 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Property` be split into smaller, more focused modules?**
  _Cohesion score 0.12374405076679006 - nodes in this community are weakly interconnected._