# Graph Report - server  (2026-10-02)

## Corpus Check
- 73 files · ~15,104 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .ini 1, .mako 1)

## Summary
- 490 nodes · 1313 edges · 27 communities (12 shown, 15 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40b0221d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routes/analysis.py
- User
- reservations.py
- routes/auth.py
- properties.py
- Settings
- golden_rule.py
- conftest.py
- FastAPI
- test_dashboard_returns_daily_series_for_one_month
- dependencies.py
- deterministic_analyzer.py
- schemas/dashboard.py
- financial_advisor.py
- rls_enable_all_tables.py
- do_run_migrations
- require_tier

## God Nodes (most connected - your core abstractions)
1. `User` - 59 edges
2. `Property` - 41 edges
3. `Reservation` - 25 edges
4. `Expense` - 23 edges
5. `Base` - 17 edges
6. `verify_property_access()` - 17 edges
7. `_complete_oauth_callback()` - 15 edges
8. `calculate_monthly_summary()` - 15 edges
9. `get_db()` - 13 edges
10. `OAuthError` - 13 edges

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

## Communities (27 total, 15 thin omitted)

### Community 0 - "routes/analysis.py"
Cohesion: 0.07
Nodes (30): run_financial_analysis(), check_global_ai_limit(), check_user_ai_limit(), increment_ai_usage(), get_dashboard_data(), get_finance_overview(), get_financial_summary(), get_operational_alerts() (+22 more)

### Community 1 - "User"
Cohesion: 0.09
Nodes (22): run_migrations_offline(), create_expense(), delete_expense(), get_expenses(), update_expense(), upload_expense_receipt(), search_all(), Base (+14 more)

### Community 2 - "reservations.py"
Cohesion: 0.10
Nodes (19): create_reservation(), delete_reservation(), _ensure_no_overlap(), get_calendar_reservations(), get_reservations(), update_reservation(), ReservationBase, ReservationCreate (+11 more)

### Community 3 - "routes/auth.py"
Cohesion: 0.07
Nodes (32): apple_callback(), apple_login(), _complete_oauth_callback(), _frontend_callback_url(), _get_or_create_oauth_user(), google_callback(), google_login(), login() (+24 more)

### Community 4 - "properties.py"
Cohesion: 0.07
Nodes (34): create_property(), delete_property(), get_properties(), get_property(), update_property(), get_me(), _missing_onboarding_fields(), update_me() (+26 more)

### Community 5 - "Settings"
Cohesion: 0.32
Nodes (3): Settings, test_production_accepts_overridden_secret_key(), test_production_rejects_default_secret_key()

### Community 6 - "golden_rule.py"
Cohesion: 0.10
Nodes (17): _build_operational_alerts(), _portfolio_summary(), aggregate_monthly_summaries(), calculate_expense_breakdown(), calculate_monthly_summary(), calculate_net_amount(), calculate_occupancy_rate(), detect_discrepancies() (+9 more)

### Community 7 - "conftest.py"
Cohesion: 0.08
Nodes (5): export_csv(), test_csv_export_rejects_an_inverted_date_range(), db_session(), event_loop(), test_engine()

### Community 8 - "FastAPI"
Cohesion: 0.11
Nodes (5): get_job_status(), get_job(), save_receipt(), health_check(), lifespan()

### Community 9 - "test_dashboard_returns_daily_series_for_one_month"
Cohesion: 0.20
Nodes (7): test_dashboard_accepts_range_query_without_shadowing_builtin(), cache_summary(), cached_summary(), monthly_summary(), property_data(), verify_access(), test_dashboard_returns_daily_series_for_one_month()

### Community 12 - "deterministic_analyzer.py"
Cohesion: 0.22
Nodes (6): AnalysisInput, calculate_health_score(), generate_alerts(), generate_deterministic_analysis(), generate_insights(), generate_recommendations()

### Community 13 - "schemas/dashboard.py"
Cohesion: 0.33
Nodes (3): Config, DashboardLayoutRead, DashboardLayoutUpdate

## Knowledge Gaps
- **1 isolated node(s):** `Config`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `routes/analysis.py`, `reservations.py`, `routes/auth.py`, `properties.py`, `conftest.py`, `dependencies.py`, `require_tier`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `Property` connect `User` to `routes/analysis.py`, `reservations.py`, `properties.py`, `golden_rule.py`, `conftest.py`, `dependencies.py`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `test_dashboard_returns_daily_series_for_one_month()` connect `test_dashboard_returns_daily_series_for_one_month` to `routes/analysis.py`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 36 inferred relationships involving `User` (e.g. with `get_dashboard_data()` and `get_finance_overview()`) actually correct?**
  _`User` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `Property` (e.g. with `_build_operational_alerts()` and `_get_portfolio_data()`) actually correct?**
  _`Property` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Reservation` (e.g. with `_get_portfolio_data()` and `_get_property_data()`) actually correct?**
  _`Reservation` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._