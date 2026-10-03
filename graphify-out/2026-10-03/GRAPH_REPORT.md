# Graph Report - AIFM  (2026-10-03)

## Corpus Check
- 230 files · ~59,975 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: (none) 5, .css 3, .example 1)

## Summary
- 1324 nodes · 3371 edges · 93 communities (69 shown, 24 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 192 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3f8af27`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- expenses/page.tsx
- Button
- routes/auth.py
- copilot.py
- routes/billing.py
- next
- reservations.py
- lucide-react
- Property
- scripts
- routes/analysis.py
- golden_rule.py
- compilerOptions
- worker/package.json
- web/package.json
- useCurrency
- expenses.py
- dependencies
- PixelBlast.jsx
- database/package.json
- tasks
- invalidate_summary_cache
- dependencies.py
- deterministic_analyzer.py
- AuthContext.tsx
- shared/package.json
- Historial y Decisiones
- devDependencies
- User
- shared/src/index.ts
- ExpenseForm.tsx
- Qué Falta (Deuda Técnica)
- compilerOptions
- compilerOptions
- Equipo y Metodología
- app/layout.tsx
- conftest.py
- Glosario
- @aifm/database
- scripts
- normalize_beds24_booking
- shared/tsconfig.json
- rls_enable_all_tables.py
- Frontend Web (@aifm/web)
- schemas/automation.py
- Database
- schemas/dashboard.py
- web/README.md
- verify_property_access
- test_portfolio_summary.py
- useProperties.ts
- react
- AIFM System Overview
- test_user_onboarding.py
- postcss.config.mjs
- Golden Rule
- Auth-Users.md
- AIFM README
- integrations.py
- routes/chat.py
- main.py
- test_reservation_dates.py
- rules/graphify.md
- workflows/graphify.md
- QueryProvider.tsx
- b41746437a05_add_chat_models.py
- schemas/property.py
- test_dashboard_returns_daily_series_for_one_month
- config.py
- properties.py
- schemas/__init__.py
- test_analysis_dashboard.py
- 08-Que-No-Se-Necesita.md
- env.py
- run_financial_analysis
- ExpenseCreate
- search_all
- login/page.tsx

## God Nodes (most connected - your core abstractions)
1. `User` - 92 edges
2. `react` - 51 edges
3. `lucide-react` - 50 edges
4. `Property` - 49 edges
5. `useCurrency()` - 37 edges
6. `next` - 36 edges
7. `Button()` - 36 edges
8. `useAuth()` - 35 edges
9. `Base` - 32 edges
10. `UUIDMixin` - 27 edges

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

## Communities (93 total, 24 thin omitted)

### Community 0 - "expenses/page.tsx"
Cohesion: 0.16
Nodes (19): ExpensesPage(), IncomePage(), PropertiesPage(), ExpenseList(), ExpenseListProps, FinanceOverview(), IncomeList(), IncomeListProps (+11 more)

### Community 1 - "Button"
Cohesion: 0.13
Nodes (32): AutomationAction, AutomationsPage(), Field(), OnboardingPage(), platforms, BillingStatus, PlansContent(), PlansPage() (+24 more)

### Community 2 - "routes/auth.py"
Cohesion: 0.06
Nodes (37): apple_callback(), apple_login(), _complete_oauth_callback(), _frontend_callback_url(), _get_or_create_oauth_user(), google_callback(), google_login(), login() (+29 more)

### Community 3 - "copilot.py"
Cohesion: 0.15
Nodes (6): CopilotContext, get_context_summary(), run_copilot(), _build_operational_alerts(), _get_portfolio_data(), test_operational_alerts_include_loss_and_upcoming_checkin()

### Community 4 - "routes/billing.py"
Cohesion: 0.11
Nodes (23): create_checkout_session(), create_portal_session(), _find_user_for_subscription(), _frontend_url(), get_billing_history(), get_billing_status(), _handle_stripe_event(), _latest_subscription() (+15 more)

### Community 5 - "next"
Cohesion: 0.06
Nodes (16): nextConfig, metadata, metadata, metadata, createPageMetadata(), PageMetadataOptions, alt, contentType (+8 more)

### Community 6 - "reservations.py"
Cohesion: 0.18
Nodes (10): create_reservation(), delete_reservation(), _ensure_no_overlap(), get_calendar_reservations(), get_reservations(), update_reservation(), main(), seed() (+2 more)

### Community 7 - "lucide-react"
Cohesion: 0.15
Nodes (15): PixelBlast, RegisterPage(), ReportsPage(), PasswordStrength(), GlassAiDecisionsProps, MonthlyReportSummary(), ReportCards(), ReportCardsProps (+7 more)

### Community 8 - "Property"
Cohesion: 0.20
Nodes (12): Base, TimestampMixin, UUIDMixin, AIChatMessage, DashboardLayout, Beds24PropertyLink, ChannelConnection, ChannelInventoryDay (+4 more)

### Community 9 - "scripts"
Cohesion: 0.10
Nodes (20): devDependencies, concurrently, turbo, engines, node, pnpm, name, packageManager (+12 more)

### Community 10 - "routes/analysis.py"
Cohesion: 0.18
Nodes (13): get_job_status(), AIInsightRequest, DailyChartPoint, DashboardData, ExpenseBreakdownItem, FinanceOverview, JobStatus, MonthlySummary (+5 more)

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
Nodes (19): eslintConfig, typescript, name, private, version, date-fns, eslint, eslint-config-next (+11 more)

### Community 15 - "useCurrency"
Cohesion: 0.08
Nodes (43): Home(), ActivityList(), ActivityListProps, DashboardCharts(), DashboardChartsProps, DashboardMetrics(), DashboardMetricsProps, GlassIncome() (+35 more)

### Community 16 - "expenses.py"
Cohesion: 0.15
Nodes (9): create_expense(), delete_expense(), get_expenses(), update_expense(), upload_expense_receipt(), Expense, ExpenseRead, ExpenseUpdate (+1 more)

### Community 17 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, axios, date-fns, framer-motion, lucide-react, next, postprocessing, react (+9 more)

### Community 19 - "PixelBlast.jsx"
Cohesion: 0.38
Nodes (6): createLiquidEffect(), createTouchTexture(), PixelBlast(), SHAPE_MAP, postprocessing, three

### Community 20 - "database/package.json"
Cohesion: 0.12
Nodes (15): dependencies, @prisma/client, devDependencies, prisma, name, private, scripts, db:generate (+7 more)

### Community 21 - "tasks"
Cohesion: 0.12
Nodes (15): dependsOn, inputs, outputs, cache, persistent, globalEnv, dependsOn, $schema (+7 more)

### Community 22 - "invalidate_summary_cache"
Cohesion: 0.29
Nodes (5): get_cached_summary(), invalidate_summary_cache(), set_cached_summary(), _summary_key(), _summary_pattern()

### Community 23 - "dependencies.py"
Cohesion: 0.13
Nodes (6): export_csv(), get_me(), get_db(), get_current_user(), verify_refresh_token(), test_csv_export_rejects_an_inverted_date_range()

### Community 24 - "deterministic_analyzer.py"
Cohesion: 0.22
Nodes (6): AnalysisInput, calculate_health_score(), generate_alerts(), generate_deterministic_analysis(), generate_insights(), generate_recommendations()

### Community 25 - "AuthContext.tsx"
Cohesion: 0.15
Nodes (16): AuthCallbackPage(), AuthContext, AuthContextType, AuthProvider(), OnboardingUpdate, ProfileUpdate, shouldStartOnboarding(), SocialProvider (+8 more)

### Community 26 - "shared/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, exports, typescript, main, name, private, scripts (+3 more)

### Community 27 - "Historial y Decisiones"
Cohesion: 0.29
Nodes (7): Cosas Descartadas y por qué, Decisiones Técnicas Importantes, Enlaces, Historial y Decisiones, Línea de Tiempo de Cambios Importantes, ¿Por qué se migró?, Versión Anterior

### Community 28 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+3 more)

### Community 29 - "User"
Cohesion: 0.17
Nodes (10): approve_and_execute_automation(), cancel_automation(), create_automation(), list_automations(), AuditLog, AutomationAction, User, test_boundary_values() (+2 more)

### Community 30 - "shared/src/index.ts"
Cohesion: 0.20
Nodes (10): ApiResponse, Currency, Expense, ExpenseCategory, MonthlyReport, PaginatedResponse, Property, Reservation (+2 more)

### Community 31 - "ExpenseForm.tsx"
Cohesion: 0.20
Nodes (16): AIReportModal(), AIReportModalProps, ExpenseForm(), IncomeForm(), ChoiceGroup(), PropertyForm(), PropertyFormProps, CurrencyInput() (+8 more)

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

### Community 37 - "conftest.py"
Cohesion: 0.18
Nodes (3): db_session(), event_loop(), test_engine()

### Community 38 - "Glosario"
Cohesion: 0.40
Nodes (5): Enlaces, Glosario, Health Score, Regla de Oro, Soft Delete

### Community 39 - "@aifm/database"
Cohesion: 0.40
Nodes (4): @aifm/database, Conexión, Herramientas, Próximo paso

### Community 40 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, type-check

### Community 41 - "normalize_beds24_booking"
Cohesion: 0.19
Nodes (10): _as_date(), _as_decimal(), _first(), normalize_beds24_booking(), normalize_beds24_inventory(), test_invalid_remote_dates_are_rejected(), test_inventory_requires_a_property_identifier(), test_normalizes_daily_inventory_without_retaining_remote_extras() (+2 more)

### Community 42 - "shared/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, extends, include, ./tsconfig.base.json

### Community 44 - "Frontend Web (@aifm/web)"
Cohesion: 0.50
Nodes (3): Detalles Técnicos, Enlaces, Frontend Web (@aifm/web)

### Community 45 - "schemas/automation.py"
Cohesion: 0.43
Nodes (6): AuditLogBase, AuditLogRead, AutomationActionBase, AutomationActionCreate, AutomationActionRead, AutomationActionUpdate

### Community 46 - "Database"
Cohesion: 0.22
Nodes (7): Detalles Técnicos, Enlaces, Gestión Core: Properties, Reservations, Expenses, Database, Local Development Infrastructure, PostgreSQL Service, Redis Service

### Community 47 - "schemas/dashboard.py"
Cohesion: 0.33
Nodes (3): Config, DashboardLayoutRead, DashboardLayoutUpdate

### Community 48 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 49 - "verify_property_access"
Cohesion: 0.16
Nodes (9): get_dashboard_data(), get_finance_overview(), get_financial_summary(), get_operational_alerts(), _get_property_data(), request_ai_insights(), request_deterministic_insights(), _run_ai_analysis_task() (+1 more)

### Community 50 - "test_portfolio_summary.py"
Cohesion: 0.43
Nodes (4): _portfolio_summary(), aggregate_monthly_summaries(), test_aggregate_monthly_summaries_keeps_occupancy_as_a_property_average(), test_portfolio_summary_returns_a_row_for_each_property()

### Community 51 - "useProperties.ts"
Cohesion: 0.12
Nodes (24): CalendarPage(), isoDate(), monthNames, weekDays, PropertyDetailPage(), Stat(), ChatMessage, GlassPropertiesProps (+16 more)

### Community 52 - "react"
Cohesion: 0.13
Nodes (20): ProtectedRoute(), PUBLIC_PATHS, AIChatCopilot(), DashboardLayoutProps, GlassHeader(), GlassHeaderProps, GlassLayout(), GlassLayoutProps (+12 more)

### Community 53 - "AIFM System Overview"
Cohesion: 0.31
Nodes (7): AI Agents, AIFM System Overview, Deterministic Financial Engine, Enlaces, Motor Engine & IA Agents, Deterministic Financial Engine, Financial Advisor Agent

### Community 54 - "test_user_onboarding.py"
Cohesion: 0.22
Nodes (7): _missing_onboarding_fields(), update_me(), update_onboarding(), OnboardingProgressUpdate, test_missing_onboarding_fields_only_reports_unset_values(), test_onboarding_progress_accepts_a_partial_draft(), test_onboarding_progress_rejects_an_underage_host()

### Community 59 - "Auth-Users.md"
Cohesion: 0.25
Nodes (7): Auth & Users (Backend), Detalles Técnicos, Enlaces, Detalles Técnicos, Edge Cache Worker (@aifm/worker), Enlaces, Security

### Community 72 - "integrations.py"
Cohesion: 0.06
Nodes (32): _acquire_inventory_sync_slot(), _acquire_sync_lock(), check_beds24_connection(), create_beds24_connection(), create_ota_connection(), get_beds24_sync_history(), get_calendar_snapshot(), link_beds24_property() (+24 more)

### Community 73 - "routes/chat.py"
Cohesion: 0.16
Nodes (14): check_global_ai_limit(), check_user_ai_limit(), increment_ai_usage(), get_chat_session(), list_chat_sessions(), send_chat_message(), AIChatSession, AIChatMessageBase (+6 more)

### Community 75 - "test_reservation_dates.py"
Cohesion: 0.29
Nodes (7): ReservationBase, ReservationCreate, ReservationUpdate, reservation_payload(), test_reservation_rejects_negative_platform_fee(), test_reservation_requires_checkout_after_checkin(), test_reservation_update_accepts_a_partial_status_change()

### Community 78 - "QueryProvider.tsx"
Cohesion: 0.47
Nodes (4): persister, queryClient, @tanstack/query-sync-storage-persister, @tanstack/react-query-persist-client

### Community 80 - "schemas/property.py"
Cohesion: 0.38
Nodes (7): PropertyBase, PropertyCreate, PropertyRead, PropertyUpdate, test_property_create_accepts_a_complete_profile(), test_property_create_requires_a_published_platform(), test_property_update_rejects_zero_guests()

### Community 81 - "test_dashboard_returns_daily_series_for_one_month"
Cohesion: 0.20
Nodes (7): test_dashboard_accepts_range_query_without_shadowing_builtin(), cache_summary(), cached_summary(), monthly_summary(), property_data(), verify_access(), test_dashboard_returns_daily_series_for_one_month()

### Community 82 - "config.py"
Cohesion: 0.25
Nodes (3): Settings, test_production_accepts_overridden_secret_key(), test_production_rejects_default_secret_key()

### Community 83 - "properties.py"
Cohesion: 0.29
Nodes (5): create_property(), delete_property(), get_properties(), get_property(), update_property()

### Community 84 - "schemas/__init__.py"
Cohesion: 0.42
Nodes (5): UserBase, UserCreate, UserPasswordUpdate, UserProfileUpdate, UserRead

### Community 85 - "test_analysis_dashboard.py"
Cohesion: 0.29
Nodes (4): get_portfolio_dashboard(), _shift_month(), calculate_daily_chart_data(), test_daily_chart_data_includes_every_day_and_aggregates_transactions()

### Community 86 - "08-Que-No-Se-Necesita.md"
Cohesion: 0.40
Nodes (4): Enlaces, Features Descartadas, Qué No Se Necesita (Descartado), Razón

### Community 87 - "env.py"
Cohesion: 0.29
Nodes (3): do_run_migrations(), run_migrations_offline(), run_migrations_online()

### Community 89 - "run_financial_analysis"
Cohesion: 0.29
Nodes (4): Detalles Técnicos, AnalysisInput, run_financial_analysis(), update_job()

### Community 90 - "ExpenseCreate"
Cohesion: 0.47
Nodes (4): ExpenseBase, ExpenseCreate, test_expense_accepts_supported_category(), test_expense_rejects_non_positive_amount()

### Community 92 - "login/page.tsx"
Cohesion: 0.83
Nodes (3): LoginPage(), PixelBlast, RegisterLink

## Knowledge Gaps
- **275 isolated node(s):** `Config`, `eslintConfig`, `nextConfig`, `name`, `version` (+270 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 526 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `User` to `routes/auth.py`, `copilot.py`, `routes/billing.py`, `reservations.py`, `integrations.py`, `routes/chat.py`, `routes/analysis.py`, `Property`, `expenses.py`, `verify_property_access`, `properties.py`, `test_analysis_dashboard.py`, `test_user_onboarding.py`, `dependencies.py`, `search_all`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `Detalles Técnicos` connect `run_financial_analysis` to `golden_rule.py`, `AIFM System Overview`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `Motor Engine & IA Agents` connect `AIFM System Overview` to `run_financial_analysis`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 64 inferred relationships involving `User` (e.g. with `get_dashboard_data()` and `get_finance_overview()`) actually correct?**
  _`User` has 64 INFERRED edges - model-reasoned connections that need verification._
- **Are the 26 inferred relationships involving `Property` (e.g. with `_build_operational_alerts()` and `_get_portfolio_data()`) actually correct?**
  _`Property` has 26 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _275 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Button` be split into smaller, more focused modules?**
  _Cohesion score 0.12560975609756098 - nodes in this community are weakly interconnected._