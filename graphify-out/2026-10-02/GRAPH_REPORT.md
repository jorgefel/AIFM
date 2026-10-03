# Graph Report - AIFM  (2026-10-02)

## Corpus Check
- 223 files · ~57,400 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 4, .css 3, .example 1)

## Summary
- 1281 nodes · 3225 edges · 92 communities (66 shown, 26 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 177 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b0096135`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useCurrency
- fetcher
- routes/auth.py
- copilot.py
- routes/billing.py
- metadata.ts
- update_property
- job_manager.py
- Property
- scripts
- routes/analysis.py
- golden_rule.py
- compilerOptions
- worker/package.json
- web/package.json
- ReferenceDashboard.tsx
- expenses/page.tsx
- dependencies
- register/page.tsx
- database/package.json
- tasks
- cache.py
- User
- schemas/expense.py
- AuthContext.tsx
- shared/package.json
- Historial y Decisiones
- devDependencies
- Settings
- shared/src/index.ts
- react
- Qué Falta (Deuda Técnica)
- compilerOptions
- compilerOptions
- Equipo y Metodología
- app/layout.tsx
- main.py
- Glosario
- @aifm/database
- scripts
- request_deterministic_insights
- shared/tsconfig.json
- rls_enable_all_tables.py
- Frontend Web (@aifm/web)
- 08-Que-No-Se-Necesita.md
- Database
- conftest.py
- web/README.md
- get_dashboard_data
- test_portfolio_summary.py
- lucide-react
- next
- AIFM System Overview
- export_csv
- postcss.config.mjs
- Golden Rule
- Auth-Users.md
- AIFM README
- integrations.py
- routes/chat.py
- schemas/chat.py
- test_user_onboarding.py
- rules/graphify.md
- workflows/graphify.md
- QueryProvider.tsx
- schemas/__init__.py
- test_dashboard_returns_daily_series_for_one_month
- test_reservation_dates.py
- PropertyCreate
- opengraph-image.tsx
- do_run_migrations
- search_all
- eslint.config.mjs
- Button
- typing
- GlassAiDecisions.tsx

## God Nodes (most connected - your core abstractions)
1. `User` - 86 edges
2. `react` - 50 edges
3. `Property` - 49 edges
4. `lucide-react` - 48 edges
5. `useCurrency()` - 37 edges
6. `next` - 36 edges
7. `Button()` - 33 edges
8. `useAuth()` - 31 edges
9. `Base` - 29 edges
10. `Reservation` - 27 edges

## Surprising Connections (you probably didn't know these)
- `Detalles Técnicos` --references--> `calculate_monthly_summary()`  [INFERRED]
  AIFM-Brain/01-Modulos/Motor-Engine-IA-Agents.md → apps/server/app/engine/golden_rule.py
- `Detalles Técnicos` --references--> `run_financial_analysis()`  [INFERRED]
  AIFM-Brain/01-Modulos/Motor-Engine-IA-Agents.md → apps/server/app/agents/financial_advisor.py
- `Detalles Técnicos` --references--> `update_job()`  [INFERRED]
  AIFM-Brain/01-Modulos/Motor-Engine-IA-Agents.md → apps/server/app/services/job_manager.py
- `PostgreSQL Service` --conceptually_related_to--> `Database`  [EXTRACTED]
  docker-compose.yml → AIFM-Brain/05-Base-de-Datos.md
- `_get_property_data()` --uses--> `Expense`  [INFERRED]
  apps/server/app/api/v1/routes/analysis.py → apps/server/app/models/expense.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Hybrid Financial Analysis** — aifm_brain_02_motor_financiero_motor_financiero, aifm_brain_03_agentes_ia_financial_advisor, aifm_brain_02_motor_financiero_golden_rule [EXTRACTED 1.00]

## Communities (92 total, 26 thin omitted)

### Community 0 - "useCurrency"
Cohesion: 0.10
Nodes (35): ActivityList(), ActivityListProps, DashboardCharts(), DashboardChartsProps, DashboardMetrics(), DashboardMetricsProps, GlassIncome(), GlassIncomeProps (+27 more)

### Community 1 - "fetcher"
Cohesion: 0.13
Nodes (28): PropertyDetailPage(), Stat(), OtaSetupPage(), OtaStatus, IntegrationsPage(), Beds24SyncPanel(), Connection, ConnectionCard() (+20 more)

### Community 2 - "routes/auth.py"
Cohesion: 0.06
Nodes (36): apple_callback(), apple_login(), _complete_oauth_callback(), _frontend_callback_url(), _get_or_create_oauth_user(), google_callback(), google_login(), login() (+28 more)

### Community 3 - "copilot.py"
Cohesion: 0.16
Nodes (5): CopilotContext, get_context_summary(), run_copilot(), _build_operational_alerts(), test_operational_alerts_include_loss_and_upcoming_checkin()

### Community 4 - "routes/billing.py"
Cohesion: 0.11
Nodes (24): create_checkout_session(), create_portal_session(), _find_user_for_subscription(), _frontend_url(), get_billing_history(), get_billing_status(), _handle_stripe_event(), _latest_subscription() (+16 more)

### Community 5 - "metadata.ts"
Cohesion: 0.11
Nodes (9): metadata, metadata, metadata, createPageMetadata(), PageMetadataOptions, metadata, metadata, metadata (+1 more)

### Community 6 - "update_property"
Cohesion: 0.24
Nodes (5): create_property(), delete_property(), get_properties(), get_property(), update_property()

### Community 7 - "job_manager.py"
Cohesion: 0.14
Nodes (7): Detalles Técnicos, AnalysisInput, run_financial_analysis(), get_job_status(), create_job(), get_job(), update_job()

### Community 8 - "Property"
Cohesion: 0.12
Nodes (21): list_ota_connections(), Base, main(), seed(), TimestampMixin, UUIDMixin, AIChatMessage, AIChatSession (+13 more)

### Community 9 - "scripts"
Cohesion: 0.10
Nodes (20): devDependencies, concurrently, turbo, engines, node, pnpm, name, packageManager (+12 more)

### Community 10 - "routes/analysis.py"
Cohesion: 0.24
Nodes (12): calculate_daily_chart_data(), AIInsightRequest, DailyChartPoint, DashboardData, ExpenseBreakdownItem, FinanceOverview, JobStatus, MonthlySummary (+4 more)

### Community 11 - "golden_rule.py"
Cohesion: 0.17
Nodes (11): calculate_expense_breakdown(), calculate_monthly_summary(), calculate_net_amount(), calculate_occupancy_rate(), detect_discrepancies(), to_decimal(), test_expense_breakdown_groups_only_the_requested_month(), test_calculate_monthly_summary() (+3 more)

### Community 12 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "worker/package.json"
Cohesion: 0.10
Nodes (18): dependencies, jose, devDependencies, @cloudflare/workers-types, typescript, wrangler, typescript, name (+10 more)

### Community 14 - "web/package.json"
Cohesion: 0.10
Nodes (19): typescript, name, private, version, axios, date-fns, postprocessing, react-dom (+11 more)

### Community 15 - "ReferenceDashboard.tsx"
Cohesion: 0.27
Nodes (8): Home(), money(), navigation, PropertyCard(), propertyInitials(), propertyPalettes, rangeOptions, ReferenceDashboard()

### Community 16 - "expenses/page.tsx"
Cohesion: 0.10
Nodes (24): CalendarPage(), isoDate(), monthNames, weekDays, ExpensesPage(), GlassPropertiesProps, ExpenseFormProps, ExpenseList() (+16 more)

### Community 17 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, axios, date-fns, framer-motion, lucide-react, next, postprocessing, react (+9 more)

### Community 19 - "register/page.tsx"
Cohesion: 0.24
Nodes (10): LoginPage(), PixelBlast, RegisterLink, PixelBlast, RegisterPage(), PasswordStrength(), createLiquidEffect(), createTouchTexture() (+2 more)

### Community 20 - "database/package.json"
Cohesion: 0.12
Nodes (15): dependencies, @prisma/client, devDependencies, prisma, name, private, scripts, db:generate (+7 more)

### Community 21 - "tasks"
Cohesion: 0.12
Nodes (15): dependsOn, inputs, outputs, cache, persistent, globalEnv, dependsOn, $schema (+7 more)

### Community 22 - "cache.py"
Cohesion: 0.33
Nodes (4): get_cached_summary(), set_cached_summary(), _summary_key(), _summary_pattern()

### Community 23 - "User"
Cohesion: 0.10
Nodes (18): create_expense(), delete_expense(), get_expenses(), update_expense(), upload_expense_receipt(), create_reservation(), delete_reservation(), _ensure_no_overlap() (+10 more)

### Community 24 - "schemas/expense.py"
Cohesion: 0.39
Nodes (6): ExpenseBase, ExpenseCreate, ExpenseRead, ExpenseUpdate, test_expense_accepts_supported_category(), test_expense_rejects_non_positive_amount()

### Community 25 - "AuthContext.tsx"
Cohesion: 0.16
Nodes (15): AuthCallbackPage(), AuthContext, AuthContextType, AuthProvider(), OnboardingUpdate, ProfileUpdate, shouldStartOnboarding(), SocialProvider (+7 more)

### Community 26 - "shared/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, exports, typescript, main, name, private, scripts (+3 more)

### Community 27 - "Historial y Decisiones"
Cohesion: 0.29
Nodes (7): Cosas Descartadas y por qué, Decisiones Técnicas Importantes, Enlaces, Historial y Decisiones, Línea de Tiempo de Cambios Importantes, ¿Por qué se migró?, Versión Anterior

### Community 28 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+3 more)

### Community 29 - "Settings"
Cohesion: 0.32
Nodes (3): Settings, test_production_accepts_overridden_secret_key(), test_production_rejects_default_secret_key()

### Community 30 - "shared/src/index.ts"
Cohesion: 0.20
Nodes (10): ApiResponse, Currency, Expense, ExpenseCategory, MonthlyReport, PaginatedResponse, Property, Reservation (+2 more)

### Community 31 - "react"
Cohesion: 0.18
Nodes (18): AIReportModal(), AIReportModalProps, ExpenseForm(), IncomeForm(), ChoiceGroup(), PropertyForm(), PropertyFormProps, ButtonProps (+10 more)

### Community 32 - "Qué Falta (Deuda Técnica)"
Cohesion: 0.40
Nodes (5): Deuda Técnica, Enlaces, Funcionalidades Pendientes, Qué Falta (Deuda Técnica), Riesgos

### Community 33 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, esModuleInterop, lib, module, moduleResolution, skipLibCheck, strict, target (+1 more)

### Community 34 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, module, moduleResolution, skipLibCheck, sourceMap, strict (+1 more)

### Community 35 - "Equipo y Metodología"
Cohesion: 0.40
Nodes (4): Enlaces, Equipo y Metodología, Metodología, Roles

### Community 36 - "app/layout.tsx"
Cohesion: 0.36
Nodes (6): metadata, outfit, RootLayout(), CurrencyProvider(), QueryProvider(), ToastProvider()

### Community 37 - "main.py"
Cohesion: 0.14
Nodes (3): save_receipt(), health_check(), lifespan()

### Community 38 - "Glosario"
Cohesion: 0.40
Nodes (5): Enlaces, Glosario, Health Score, Regla de Oro, Soft Delete

### Community 39 - "@aifm/database"
Cohesion: 0.40
Nodes (4): @aifm/database, Conexión, Herramientas, Próximo paso

### Community 40 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, type-check

### Community 41 - "request_deterministic_insights"
Cohesion: 0.17
Nodes (7): request_deterministic_insights(), AnalysisInput, calculate_health_score(), generate_alerts(), generate_deterministic_analysis(), generate_insights(), generate_recommendations()

### Community 42 - "shared/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, extends, include, ./tsconfig.base.json

### Community 44 - "Frontend Web (@aifm/web)"
Cohesion: 0.50
Nodes (3): Detalles Técnicos, Enlaces, Frontend Web (@aifm/web)

### Community 45 - "08-Que-No-Se-Necesita.md"
Cohesion: 0.40
Nodes (4): Enlaces, Features Descartadas, Qué No Se Necesita (Descartado), Razón

### Community 46 - "Database"
Cohesion: 0.22
Nodes (7): Detalles Técnicos, Enlaces, Gestión Core: Properties, Reservations, Expenses, Database, Local Development Infrastructure, PostgreSQL Service, Redis Service

### Community 47 - "conftest.py"
Cohesion: 0.18
Nodes (3): db_session(), event_loop(), test_engine()

### Community 48 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 49 - "get_dashboard_data"
Cohesion: 0.18
Nodes (9): get_dashboard_data(), get_finance_overview(), get_financial_summary(), get_operational_alerts(), get_portfolio_dashboard(), _get_portfolio_data(), _get_property_data(), _run_ai_analysis_task() (+1 more)

### Community 50 - "test_portfolio_summary.py"
Cohesion: 0.53
Nodes (4): _portfolio_summary(), aggregate_monthly_summaries(), test_aggregate_monthly_summaries_keeps_occupancy_as_a_property_average(), test_portfolio_summary_returns_a_row_for_each_property()

### Community 51 - "lucide-react"
Cohesion: 0.16
Nodes (11): ReportsPage(), NAV_ITEMS, SidebarProps, MonthlyReportSummary(), Summary, ReportCards(), ReportCardsProps, ReportModal() (+3 more)

### Community 52 - "next"
Cohesion: 0.09
Nodes (25): nextConfig, Field(), OnboardingPage(), platforms, ProtectedRoute(), PUBLIC_PATHS, AIChatCopilot(), ChatMessage (+17 more)

### Community 53 - "AIFM System Overview"
Cohesion: 0.31
Nodes (7): AI Agents, AIFM System Overview, Deterministic Financial Engine, Enlaces, Motor Engine & IA Agents, Deterministic Financial Engine, Financial Advisor Agent

### Community 59 - "Auth-Users.md"
Cohesion: 0.25
Nodes (7): Auth & Users (Backend), Detalles Técnicos, Enlaces, Detalles Técnicos, Edge Cache Worker (@aifm/worker), Enlaces, Security

### Community 72 - "integrations.py"
Cohesion: 0.05
Nodes (38): _acquire_inventory_sync_slot(), _acquire_sync_lock(), check_beds24_connection(), create_beds24_connection(), create_ota_connection(), get_beds24_sync_history(), get_calendar_snapshot(), link_beds24_property() (+30 more)

### Community 73 - "routes/chat.py"
Cohesion: 0.11
Nodes (9): run_migrations_offline(), check_global_ai_limit(), check_user_ai_limit(), increment_ai_usage(), request_ai_insights(), get_chat_session(), list_chat_sessions(), send_chat_message() (+1 more)

### Community 74 - "schemas/chat.py"
Cohesion: 0.43
Nodes (6): AIChatMessageBase, AIChatMessageCreate, AIChatMessageRead, AIChatSessionBase, AIChatSessionCreate, AIChatSessionRead

### Community 75 - "test_user_onboarding.py"
Cohesion: 0.20
Nodes (7): _missing_onboarding_fields(), update_me(), update_onboarding(), OnboardingProgressUpdate, test_missing_onboarding_fields_only_reports_unset_values(), test_onboarding_progress_accepts_a_partial_draft(), test_onboarding_progress_rejects_an_underage_host()

### Community 78 - "QueryProvider.tsx"
Cohesion: 0.47
Nodes (4): persister, queryClient, @tanstack/query-sync-storage-persister, @tanstack/react-query-persist-client

### Community 80 - "schemas/__init__.py"
Cohesion: 0.46
Nodes (4): UserBase, UserCreate, UserProfileUpdate, UserRead

### Community 81 - "test_dashboard_returns_daily_series_for_one_month"
Cohesion: 0.20
Nodes (7): test_dashboard_accepts_range_query_without_shadowing_builtin(), cache_summary(), cached_summary(), monthly_summary(), property_data(), verify_access(), test_dashboard_returns_daily_series_for_one_month()

### Community 82 - "test_reservation_dates.py"
Cohesion: 0.43
Nodes (6): ReservationCreate, ReservationUpdate, reservation_payload(), test_reservation_rejects_negative_platform_fee(), test_reservation_requires_checkout_after_checkin(), test_reservation_update_accepts_a_partial_status_change()

### Community 83 - "PropertyCreate"
Cohesion: 0.43
Nodes (5): PropertyCreate, PropertyUpdate, test_property_create_accepts_a_complete_profile(), test_property_create_requires_a_published_platform(), test_property_update_rejects_zero_guests()

### Community 84 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 88 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 90 - "Button"
Cohesion: 0.23
Nodes (16): IncomePage(), BillingStatus, PlansContent(), PlansPage(), Subscription, PropertiesPage(), SettingsPage(), IncomeList() (+8 more)

### Community 91 - "typing"
Cohesion: 0.05
Nodes (7): Config, DashboardLayoutRead, DashboardLayoutUpdate, PropertyBase, PropertyRead, ReservationBase, ReservationRead

## Knowledge Gaps
- **274 isolated node(s):** `Config`, `eslintConfig`, `nextConfig`, `name`, `version` (+269 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 514 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `routes/auth.py`, `routes/billing.py`, `update_property`, `Property`, `routes/chat.py`, `routes/analysis.py`, `request_deterministic_insights`, `integrations.py`, `test_user_onboarding.py`, `get_dashboard_data`, `export_csv`, `search_all`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `Detalles Técnicos` connect `job_manager.py` to `golden_rule.py`, `AIFM System Overview`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `Motor Engine & IA Agents` connect `AIFM System Overview` to `job_manager.py`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 59 inferred relationships involving `User` (e.g. with `get_dashboard_data()` and `get_finance_overview()`) actually correct?**
  _`User` has 59 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `Property` (e.g. with `_build_operational_alerts()` and `_get_portfolio_data()`) actually correct?**
  _`Property` has 26 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _274 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useCurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.09647058823529411 - nodes in this community are weakly interconnected._