# Graph Report - AIFM  (2026-11-02)

## Corpus Check
- 401 files · ~237,757 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: (none) 5, .css 4, .mdc 1)

## Summary
- 3346 nodes · 6221 edges · 194 communities (163 shown, 31 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 254 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ca537f4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- upgrade
- oauth.py
- reservations.py
- routes/billing.py
- metadata.ts
- routes/chat.py
- Hardening Patterns
- Property
- scripts
- test_dashboard_returns_daily_series_for_one_month
- datetime
- compilerOptions
- worker/package.json
- web/package.json
- useCurrency
- register/page.tsx
- dependencies
- AuthContext.tsx
- database/package.json
- tasks
- _get_property_data
- AnalyticsCharts.tsx
- ThemeContext.tsx
- users.py
- shared/package.json
- golden_rule.py
- devDependencies
- Worked example: Agent Teams for competing-hypothesis debugging
- shared/src/index.ts
- Button
- PropertyWizard.tsx
- compilerOptions
- compilerOptions
- calendar/page.tsx
- lucide-react
- expenses.py
- dependencies.py
- @aifm/database
- scripts
- Hardening Controls
- shared/tsconfig.json
- rls_enable_all_tables.py
- Frontend Web (@aifm/web)
- Worked example: Agent Teams for competing-hypothesis debugging
- Gestión Core: Properties, Reservations, Expenses
- Code Review and Quality
- web/README.md
- Security and Hardening
- normalize_beds24_booking
- next
- User
- postcss.config.mjs
- app/layout.tsx
- Auth & Users (Backend)
- AIFM README
- integrations.py
- Test-Driven Development
- copilot.py
- Code Review and Quality
- rules/graphify.md
- workflows/graphify.md
- _complete_oauth_callback
- analytics/page.tsx
- Test-Driven Development
- route.ts
- Propuesta de Arquitectura: Sistema de Comparación con Alojamientos Cercanos
- typing
- Context Engineering
- Context Engineering
- Performance Checklist
- Git Workflow and Versioning
- Settings
- predictions.py
- Optimization Patterns
- Funciones del sistema
- opengraph-image.tsx
- test_expired_demo_user_cannot_access_their_workspace
- models.ts
- test_migration_heads.py
- Skeleton.tsx
- migrate-theme-tokens.mjs
- Performance Checklist
- Git Workflow and Versioning
- Optimization Patterns
- Shipping and Launch
- Shipping and Launch
- API and Interface Design
- Browser Testing with DevTools
- Frontend UI Engineering
- API and Interface Design
- Browser Testing with DevTools
- Frontend UI Engineering
- CI/CD and Automation
- Constraint-Driven Development
- Deprecation and Migration
- CI/CD and Automation
- Constraint-Driven Development
- Deprecation and Migration
- Incremental Implementation
- Incremental Implementation
- Code Simplification
- Debugging and Error Recovery
- Documentation and ADRs
- Code Simplification
- Debugging and Error Recovery
- Documentation and ADRs
- Interview Me
- Planning and Task Breakdown
- Interview Me
- Planning and Task Breakdown
- Security Checklist
- ReOrder: Keep Your Regulars Ordering Direct
- Security Checklist
- ReOrder: Keep Your Regulars Ordering Direct
- Accessibility Checklist
- Accessibility Checklist
- Doubt-Driven Development
- Process
- Doubt-Driven Development
- Process
- Idea Refine
- Using Agent Skills
- Idea Refine
- Using Agent Skills
- Testing Patterns Reference (JavaScript/TypeScript)
- Spec-Driven Development
- Testing Patterns Reference (JavaScript/TypeScript)
- Spec-Driven Development
- Source-Driven Development
- Source-Driven Development
- Refinement & Evaluation Criteria
- Hardening Patterns
- create_demo_workspace
- Airbnb market comparison tasks
- Refinement & Evaluation Criteria
- The Standing Checklist
- Observability Checklist
- The Standing Checklist
- Observability Checklist
- Ideation Frameworks Reference
- Ideation Frameworks Reference
- export.py
- OWASP Top 10 Prevention Patterns
- OWASP Top 10 Prevention Patterns
- automations.py
- deterministic_analyzer.py
- _build_operational_alerts
- Hardening Controls
- AGENTS.md
- .agents/skills/idea-refine/scripts/idea-refine.sh
- .cursor/skills/idea-refine/scripts/idea-refine.sh
- Security and Hardening
- ReservationsTable.tsx
- Ponytail Help
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- Ponytail
- routes/auth.py
- create_access_token
- routes/analysis.py
- Ponytail, lazy senior dev mode
- ponytail-debt/SKILL.md
- Local Development Infrastructure
- PixelBlast.jsx
- metrics.ts
- cache.py
- Property
- Spec: market-snapshot
- RevenueTrendChart.tsx
- RateLimiter
- sqlalchemy_ext_asyncio
- update_job
- verify_property_access

## God Nodes (most connected - your core abstractions)
1. `User` - 107 edges
2. `lucide-react` - 82 edges
3. `react` - 70 edges
4. `useCurrency()` - 59 edges
5. `Property` - 55 edges
6. `next` - 53 edges
7. `useAuth()` - 52 edges
8. `Button()` - 49 edges
9. `DashboardLayout()` - 34 edges
10. `Base` - 32 edges

## Surprising Connections (you probably didn't know these)
- `2. Gestión de entidades operativas (Propiedades, Reservas y Gastos)` --references--> `verify_property_access()`  [INFERRED]
  AIFM-Brain/11-Informe-Tecnico.md → apps/server/app/core/dependencies.py
- `9. Dashboard consolidado, Analíticas y Reportes` --references--> `calculate_expense_breakdown()`  [INFERRED]
  AIFM-Brain/11-Informe-Tecnico.md → apps/server/app/engine/golden_rule.py
- `6. Automatizaciones operativas con aprobación humana (Human-in-the-Loop)` --references--> `AuditLog`  [INFERRED]
  AIFM-Brain/11-Informe-Tecnico.md → apps/server/app/models/automation.py
- `Principios técnicos que definen el producto` --references--> `AuditLog`  [INFERRED]
  AIFM-Brain/11-Informe-Tecnico.md → apps/server/app/models/automation.py
- `7. Facturación, suscripciones y monetización (Stripe)` --references--> `BillingEvent`  [INFERRED]
  AIFM-Brain/11-Informe-Tecnico.md → apps/server/app/models/subscription.py

## Import Cycles
- None detected.

## Communities (194 total, 31 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (53): AutomationAction, AutomationsPage(), Field(), OnboardingPage(), platforms, SecuritySettingsPage(), ChatMessage, Beds24SyncPanel() (+45 more)

### Community 2 - "oauth.py"
Cohesion: 0.15
Nodes (15): _apple_client_secret(), _apple_identity_from_code(), authorization_url(), callback_url(), create_signed_state(), _exchange_code(), _google_identity_from_code(), _identity_from_claims() (+7 more)

### Community 3 - "reservations.py"
Cohesion: 0.15
Nodes (14): create_reservation(), delete_reservation(), _ensure_no_overlap(), get_calendar_reservations(), get_reservations(), update_reservation(), ReservationBase, ReservationCreate (+6 more)

### Community 4 - "routes/billing.py"
Cohesion: 0.11
Nodes (25): create_checkout_session(), create_portal_session(), _find_user_for_subscription(), _frontend_url(), get_billing_history(), get_billing_status(), _handle_stripe_event(), _latest_subscription() (+17 more)

### Community 5 - "metadata.ts"
Cohesion: 0.08
Nodes (12): metadata, metadata, metadata, metadata, createPageMetadata(), PageMetadataOptions, metadata, metadata (+4 more)

### Community 6 - "routes/chat.py"
Cohesion: 0.26
Nodes (9): get_chat_session(), list_chat_sessions(), AIChatMessageBase, AIChatMessageCreate, AIChatMessageRead, AIChatRequest, AIChatSessionBase, AIChatSessionCreate (+1 more)

### Community 7 - "Hardening Patterns"
Cohesion: 0.17
Nodes (10): Data Classification, Dependency Audit Triage, Destructive Operations on Derived Paths, File Upload Safety, Hardening Patterns, Input Validation Patterns, LLM Output Handling, Rate Limiting (+2 more)

### Community 8 - "Property"
Cohesion: 0.12
Nodes (23): 5. Asesor financiero y Copiloto IA conversacional, Base, main(), seed(), AuditLog, AutomationAction, TimestampMixin, UUIDMixin (+15 more)

### Community 9 - "scripts"
Cohesion: 0.10
Nodes (20): devDependencies, concurrently, turbo, engines, node, pnpm, name, packageManager (+12 more)

### Community 10 - "test_dashboard_returns_daily_series_for_one_month"
Cohesion: 0.20
Nodes (7): test_dashboard_accepts_range_query_without_shadowing_builtin(), cache_summary(), cached_summary(), monthly_summary(), property_data(), verify_access(), test_dashboard_returns_daily_series_for_one_month()

### Community 11 - "datetime"
Cohesion: 0.10
Nodes (18): read_competitors(), CompetitorAggregates, CompetitorListing, CompetitorSnapshot, OmkarProvider, ProviderUnavailableError, CompetitorProvider, build_competitor_snapshot() (+10 more)

### Community 12 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "worker/package.json"
Cohesion: 0.12
Nodes (15): dependencies, jose, devDependencies, @cloudflare/workers-types, typescript, wrangler, typescript, name (+7 more)

### Community 14 - "web/package.json"
Cohesion: 0.11
Nodes (17): eslintConfig, typescript, name, private, version, eslint, eslint-config-next, react-grid-layout (+9 more)

### Community 15 - "useCurrency"
Cohesion: 0.17
Nodes (19): GlassIncome(), GlassIncomeProps, GlassKeyMetrics(), GlassKeyMetricsProps, GlassStatCards(), GlassStatCardsProps, WidgetBase(), WidgetBaseProps (+11 more)

### Community 16 - "register/page.tsx"
Cohesion: 0.18
Nodes (14): containerVariants, itemVariants, LoginPage(), containerVariants, itemVariants, RegisterPage(), AuthShowcasePanel(), BAR_PATTERN (+6 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, date-fns, framer-motion, lucide-react, next, postprocessing, react (+10 more)

### Community 19 - "AuthContext.tsx"
Cohesion: 0.17
Nodes (17): AuthCallbackPage(), AuthContext, AuthContextType, AuthProvider(), buildDemoUser(), OnboardingUpdate, ProfileUpdate, readCachedUser() (+9 more)

### Community 20 - "database/package.json"
Cohesion: 0.12
Nodes (15): dependencies, @prisma/client, devDependencies, prisma, name, private, scripts, db:generate (+7 more)

### Community 21 - "tasks"
Cohesion: 0.12
Nodes (15): dependsOn, inputs, outputs, cache, persistent, globalEnv, dependsOn, $schema (+7 more)

### Community 22 - "_get_property_data"
Cohesion: 0.19
Nodes (8): get_finance_overview(), get_financial_summary(), get_operational_alerts(), get_portfolio_dashboard(), _get_portfolio_data(), _get_property_data(), _run_ai_analysis_task(), _shift_month()

### Community 23 - "AnalyticsCharts.tsx"
Cohesion: 0.21
Nodes (15): ChartCard(), ChartTooltip(), ForecastChart(), OccupancyLineChart(), PropertyTableProps, RevenueBarsChart(), RevenueOccupancyChart(), CustomTooltip() (+7 more)

### Community 24 - "ThemeContext.tsx"
Cohesion: 0.18
Nodes (14): AppearanceSection(), OPTIONS, ThemeSelector(), subscribeNoop(), ThemeToggle(), readStoredTheme(), ResolvedTheme, subscribeToSystemTheme() (+6 more)

### Community 25 - "users.py"
Cohesion: 0.16
Nodes (13): get_me(), _missing_onboarding_fields(), update_me(), update_onboarding(), OnboardingProgressUpdate, UserBase, UserCreate, UserPasswordUpdate (+5 more)

### Community 26 - "shared/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, exports, typescript, main, name, private, scripts (+3 more)

### Community 27 - "golden_rule.py"
Cohesion: 0.17
Nodes (11): calculate_expense_breakdown(), calculate_monthly_summary(), calculate_net_amount(), calculate_occupancy_rate(), detect_discrepancies(), to_decimal(), test_expense_breakdown_groups_only_the_requested_month(), test_calculate_monthly_summary() (+3 more)

### Community 28 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-big-calendar (+4 more)

### Community 29 - "Worked example: Agent Teams for competing-hypothesis debugging"
Cohesion: 0.06
Nodes (31): 1. Direct invocation (no orchestration), 2. Single-persona slash command, 3. Parallel fan-out with merge, 4. Sequential pipeline as user-driven slash commands, 5. Research isolation (context preservation), A. Router persona ("meta-orchestrator"), Anti-pattern in this scenario, Anti-patterns (+23 more)

### Community 30 - "shared/src/index.ts"
Cohesion: 0.20
Nodes (10): ApiResponse, Currency, Expense, ExpenseCategory, MonthlyReport, PaginatedResponse, Property, Reservation (+2 more)

### Community 31 - "Button"
Cohesion: 0.10
Nodes (37): Fact(), formatDay(), ReservationDetail(), ReservationDetailProps, STATUS_COLORS, STATUS_LABELS, ExpenseForm(), ExpenseFormProps (+29 more)

### Community 32 - "PropertyWizard.tsx"
Cohesion: 0.09
Nodes (38): Fact(), PropertyDetailPage(), AMENITY_ICONS, getAmenityIcon(), PropertyGallery(), PropertyGalleryProps, PropertyList(), StepProps (+30 more)

### Community 33 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, esModuleInterop, lib, module, moduleResolution, skipLibCheck, strict, target (+1 more)

### Community 34 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, module, moduleResolution, skipLibCheck, sourceMap, strict (+1 more)

### Community 35 - "calendar/page.tsx"
Cohesion: 0.21
Nodes (11): CalendarPage(), MiniCalendar(), MiniCalendarProps, WEEKDAYS, localizer, messages, ReservationCalendar(), ReservationCalendarProps (+3 more)

### Community 36 - "lucide-react"
Cohesion: 0.08
Nodes (39): Banner(), BillingStatus, longDate, PlansContent(), PlansPage(), shortDate, Subscription, NewPropertyPage() (+31 more)

### Community 37 - "expenses.py"
Cohesion: 0.11
Nodes (15): create_expense(), delete_expense(), get_expenses(), update_expense(), upload_expense_receipt(), search_all(), Expense, ExpenseBase (+7 more)

### Community 38 - "dependencies.py"
Cohesion: 0.08
Nodes (7): get_job_status(), get_current_user(), verify_refresh_token(), run_demo_cleanup_forever(), get_job(), health_check(), lifespan()

### Community 39 - "@aifm/database"
Cohesion: 0.40
Nodes (4): @aifm/database, Conexión, Herramientas, Próximo paso

### Community 40 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, type-check

### Community 41 - "Hardening Controls"
Cohesion: 0.17
Nodes (12): AI / LLM features, Authentication and sessions, Dependencies and supply chain, Destructive operations on derived paths, Hardening Controls, Headers, CORS, and responses, Injection, XSS, and access control, Input validation and uploads (+4 more)

### Community 42 - "shared/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, noEmit, extends, include, ./tsconfig.base.json

### Community 44 - "Frontend Web (@aifm/web)"
Cohesion: 0.50
Nodes (3): Detalles Técnicos, Enlaces, Frontend Web (@aifm/web)

### Community 45 - "Worked example: Agent Teams for competing-hypothesis debugging"
Cohesion: 0.06
Nodes (31): 1. Direct invocation (no orchestration), 2. Single-persona slash command, 3. Parallel fan-out with merge, 4. Sequential pipeline as user-driven slash commands, 5. Research isolation (context preservation), A. Router persona ("meta-orchestrator"), Anti-pattern in this scenario, Anti-patterns (+23 more)

### Community 46 - "Gestión Core: Properties, Reservations, Expenses"
Cohesion: 0.50
Nodes (3): Detalles Técnicos, Enlaces, Gestión Core: Properties, Reservations, Expenses

### Community 47 - "Code Review and Quality"
Cohesion: 0.07
Nodes (29): 1. Correctness, 2. Readability & Simplicity, 3. Architecture, 4. Security, 5. Performance, Change Descriptions, Change Sizing, Code Review and Quality (+21 more)

### Community 48 - "web/README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 49 - "Security and Hardening"
Cohesion: 0.17
Nodes (12): Always Do (No Exceptions), Ask First (Requires Human Approval), Common Rationalizations, Never Do, Overview, Process: Threat Model First, Red Flags, Review Checklist (+4 more)

### Community 50 - "normalize_beds24_booking"
Cohesion: 0.23
Nodes (10): _as_date(), _as_decimal(), _first(), normalize_beds24_booking(), normalize_beds24_inventory(), test_invalid_remote_dates_are_rejected(), test_inventory_requires_a_property_identifier(), test_normalizes_daily_inventory_without_retaining_remote_extras() (+2 more)

### Community 51 - "next"
Cohesion: 0.06
Nodes (40): nextConfig, ProtectedRoute(), PUBLIC_PATHS, AIChatCopilot(), ADSENSE_CLIENT_ID, DisplayAd, GoogleAdSenseSlot(), NonInvasiveBottomAd() (+32 more)

### Community 54 - "User"
Cohesion: 0.16
Nodes (14): create_property(), delete_property(), get_properties(), get_property(), update_property(), User, PropertyBase, PropertyCreate (+6 more)

### Community 58 - "app/layout.tsx"
Cohesion: 0.21
Nodes (10): metadata, outfit, RootLayout(), CurrencyProvider(), QueryProvider(), ToastProvider(), persister, queryClient (+2 more)

### Community 59 - "Auth & Users (Backend)"
Cohesion: 0.25
Nodes (6): Auth & Users (Backend), Detalles Técnicos, Enlaces, Detalles Técnicos, Edge Cache Worker (@aifm/worker), Enlaces

### Community 72 - "integrations.py"
Cohesion: 0.06
Nodes (38): _acquire_inventory_sync_slot(), _acquire_sync_lock(), check_beds24_channel_status(), check_beds24_connection(), confirm_beds24_channel(), create_beds24_connection(), create_ota_connection(), get_beds24_sync_history() (+30 more)

### Community 73 - "Test-Driven Development"
Cohesion: 0.07
Nodes (29): Browser Testing with DevTools, Common Rationalizations, DAMP Over DRY in Tests, Decision Guide, Discover the Stack First, Name Tests Descriptively, One Assertion Per Concept, Overview (+21 more)

### Community 74 - "copilot.py"
Cohesion: 0.19
Nodes (4): CopilotContext, run_copilot(), AnalysisInput, run_financial_analysis()

### Community 75 - "Code Review and Quality"
Cohesion: 0.07
Nodes (29): 1. Correctness, 2. Readability & Simplicity, 3. Architecture, 4. Security, 5. Performance, Change Descriptions, Change Sizing, Code Review and Quality (+21 more)

### Community 78 - "_complete_oauth_callback"
Cohesion: 0.19
Nodes (8): apple_callback(), apple_login(), _complete_oauth_callback(), _frontend_callback_url(), _get_or_create_oauth_user(), google_callback(), google_login(), _oauth_state_response()

### Community 79 - "analytics/page.tsx"
Cohesion: 0.14
Nodes (26): 4. Modelo predictivo y proyecciones de series temporales (Forecasting), AnalyticsPage(), TabId, TABS, Home(), ChannelTable(), PropertyTable(), ChannelDonut() (+18 more)

### Community 80 - "Test-Driven Development"
Cohesion: 0.07
Nodes (29): Browser Testing with DevTools, Common Rationalizations, DAMP Over DRY in Tests, Decision Guide, Discover the Stack First, Name Tests Descriptively, One Assertion Per Concept, Overview (+21 more)

### Community 81 - "route.ts"
Cohesion: 0.20
Nodes (10): DELETE, dynamic, GET, OPTIONS, PATCH, POST, proxy(), PUT (+2 more)

### Community 82 - "Propuesta de Arquitectura: Sistema de Comparación con Alojamientos Cercanos"
Cohesion: 0.22
Nodes (8): 1. Objetivo, 2. Requerimientos de Datos: Dirección Específica y Geolocalización, 3. Conexión de APIs para Alojamientos Cercanos, 4. Métricas de Comparación a Mostrar en el Dashboard, Campos en Base de Datos (`properties`), Experiencia de Usuario (UI/UX), Propuesta de Arquitectura: Sistema de Comparación con Alojamientos Cercanos, Recomendación de Implementación Fásica (Fase 1 y Fase 2)

### Community 83 - "typing"
Cohesion: 0.04
Nodes (4): get_dashboard_layout(), update_dashboard_layout(), DashboardLayoutRead, DashboardLayoutUpdate

### Community 84 - "Context Engineering"
Cohesion: 0.07
Nodes (28): Anti-Patterns, Common Rationalizations, Compress before dropping, Confusion Management, Context Budget Management, Context Engineering, Context Packing Strategies, Level 1: Rules Files (+20 more)

### Community 85 - "Context Engineering"
Cohesion: 0.07
Nodes (28): Anti-Patterns, Common Rationalizations, Compress before dropping, Confusion Management, Context Budget Management, Context Engineering, Context Packing Strategies, Level 1: Rules Files (+20 more)

### Community 86 - "Performance Checklist"
Cohesion: 0.07
Nodes (26): API, Backend Checklist, Cache checklist, Caching Strategies, Common Anti-Patterns, Connection pooling, Core Web Vitals Targets, CSS (+18 more)

### Community 87 - "Git Workflow and Versioning"
Cohesion: 0.07
Nodes (26): 1. Commit Early, Commit Often, 2. Atomic Commits, 3. Descriptive Messages, 4. Keep Concerns Separate, 5. Size Your Changes, Branch Naming, Branching Strategy, Change Summaries (+18 more)

### Community 88 - "Settings"
Cohesion: 0.32
Nodes (3): Settings, test_production_accepts_overridden_secret_key(), test_production_rejects_default_secret_key()

### Community 89 - "predictions.py"
Cohesion: 0.15
Nodes (8): get_forecast(), MonthForecast, PropertyForecastResponse, _fit_and_forecast(), generate_property_forecast(), _next_months(), test_forecast_multi_month_trend(), test_forecast_short_history()

### Community 90 - "Optimization Patterns"
Cohesion: 0.07
Nodes (25): Connection Pool Exhaustion, Large Bundle Size, Missing Caching (Backend), Missing Image Optimization (Frontend), N+1 Queries (Backend), Optimization Patterns, Queries That Ignore Their Index, Unbounded Data Fetching (+17 more)

### Community 91 - "Funciones del sistema"
Cohesion: 0.13
Nodes (14): 10. Rendimiento y Caché de Borde (Edge Worker), 1. Gestión de usuarios, sesiones y control de acceso (RBAC / Tiers), 2. Gestión de entidades operativas (Propiedades, Reservas y Gastos), 3. Motor financiero determinístico (Golden Rule), 6. Automatizaciones operativas con aprobación humana (Human-in-the-Loop), 7. Facturación, suscripciones y monetización (Stripe), 8. Integración y sincronización de canales externos (Beds24), 9. Dashboard consolidado, Analíticas y Reportes (+6 more)

### Community 92 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 93 - "test_expired_demo_user_cannot_access_their_workspace"
Cohesion: 0.18
Nodes (3): FakeSession, test_demo_workspaces_are_isolated_and_expire_after_two_hours(), test_expired_demo_user_cannot_access_their_workspace()

### Community 94 - "models.ts"
Cohesion: 0.14
Nodes (21): ExpensesPage(), IncomePage(), ExpenseList(), ExpenseListProps, categoryLabels, FinanceOverview(), Overview, IncomeList() (+13 more)

### Community 96 - "Skeleton.tsx"
Cohesion: 0.19
Nodes (11): ActivityList(), ActivityListProps, DashboardCharts(), DashboardChartsProps, DashboardMetrics(), DashboardMetricsProps, SkeletonCard(), SkeletonChart() (+3 more)

### Community 97 - "migrate-theme-tokens.mjs"
Cohesion: 0.13
Nodes (13): args, changedFiles, counts, escape(), review, REVIEW_PATTERNS, root, rules (+5 more)

### Community 98 - "Performance Checklist"
Cohesion: 0.07
Nodes (26): API, Backend Checklist, Cache checklist, Caching Strategies, Common Anti-Patterns, Connection pooling, Core Web Vitals Targets, CSS (+18 more)

### Community 99 - "Git Workflow and Versioning"
Cohesion: 0.07
Nodes (26): 1. Commit Early, Commit Often, 2. Atomic Commits, 3. Descriptive Messages, 4. Keep Concerns Separate, 5. Size Your Changes, Branch Naming, Branching Strategy, Change Summaries (+18 more)

### Community 100 - "Optimization Patterns"
Cohesion: 0.07
Nodes (25): Connection Pool Exhaustion, Large Bundle Size, Missing Caching (Backend), Missing Image Optimization (Frontend), N+1 Queries (Backend), Optimization Patterns, Queries That Ignore Their Index, Unbounded Data Fetching (+17 more)

### Community 101 - "Shipping and Launch"
Cohesion: 0.08
Nodes (25): Accessibility, Code Quality, Common Rationalizations, Documentation, Error Budget Release Gate, Error Reporting, Feature Flag Strategy, Infrastructure (+17 more)

### Community 102 - "Shipping and Launch"
Cohesion: 0.08
Nodes (25): Accessibility, Code Quality, Common Rationalizations, Documentation, Error Budget Release Gate, Error Reporting, Feature Flag Strategy, Infrastructure (+17 more)

### Community 103 - "API and Interface Design"
Cohesion: 0.08
Nodes (24): 1. Contract First, 2. Consistent Error Semantics, 3. Validate at Boundaries, 4. Prefer Addition Over Modification, 5. Predictable Naming, 6. Honouring an Idempotency Key, API and Interface Design, Common Rationalizations (+16 more)

### Community 104 - "Browser Testing with DevTools"
Cohesion: 0.08
Nodes (24): Accessibility Verification with DevTools, Available Tools, Browser Testing with DevTools, Clean Console Standard, Common Rationalizations, Console Analysis Patterns, Content Boundary Markers, For Network Issues (+16 more)

### Community 105 - "Frontend UI Engineering"
Cohesion: 0.08
Nodes (24): Accessibility (WCAG 2.1 AA), ARIA Labels, Avoid the AI Aesthetic, Color, Common Rationalizations, Component Architecture, Component Patterns, Design System Adherence (+16 more)

### Community 106 - "API and Interface Design"
Cohesion: 0.08
Nodes (24): 1. Contract First, 2. Consistent Error Semantics, 3. Validate at Boundaries, 4. Prefer Addition Over Modification, 5. Predictable Naming, 6. Honouring an Idempotency Key, API and Interface Design, Common Rationalizations (+16 more)

### Community 107 - "Browser Testing with DevTools"
Cohesion: 0.08
Nodes (24): Accessibility Verification with DevTools, Available Tools, Browser Testing with DevTools, Clean Console Standard, Common Rationalizations, Console Analysis Patterns, Content Boundary Markers, For Network Issues (+16 more)

### Community 108 - "Frontend UI Engineering"
Cohesion: 0.08
Nodes (24): Accessibility (WCAG 2.1 AA), ARIA Labels, Avoid the AI Aesthetic, Color, Common Rationalizations, Component Architecture, Component Patterns, Design System Adherence (+16 more)

### Community 109 - "CI/CD and Automation"
Cohesion: 0.08
Nodes (23): Automation Beyond CI, Basic CI Pipeline, Build Cop Role, CI/CD and Automation, CI Optimization, Common Rationalizations, Dependabot / Renovate, Deployment Strategies (+15 more)

### Community 110 - "Constraint-Driven Development"
Cohesion: 0.08
Nodes (22): Adapting it, Contract, Floor guard: reference implementation, Reference (Node, ~stack-agnostic patterns), Common Rationalizations, Constraint-Driven Development, Escalation Path, Loading Constraints (+14 more)

### Community 111 - "Deprecation and Migration"
Cohesion: 0.08
Nodes (23): Adapter Pattern, Code Is a Liability, Common Rationalizations, Compulsory vs Advisory Deprecation, Core Principles, Database Schema Migrations (Expand/Contract), Deprecation and Migration, Deprecation Planning Starts at Design Time (+15 more)

### Community 112 - "CI/CD and Automation"
Cohesion: 0.08
Nodes (23): Automation Beyond CI, Basic CI Pipeline, Build Cop Role, CI/CD and Automation, CI Optimization, Common Rationalizations, Dependabot / Renovate, Deployment Strategies (+15 more)

### Community 113 - "Constraint-Driven Development"
Cohesion: 0.08
Nodes (22): Adapting it, Contract, Floor guard: reference implementation, Reference (Node, ~stack-agnostic patterns), Common Rationalizations, Constraint-Driven Development, Escalation Path, Loading Constraints (+14 more)

### Community 114 - "Deprecation and Migration"
Cohesion: 0.08
Nodes (23): Adapter Pattern, Code Is a Liability, Common Rationalizations, Compulsory vs Advisory Deprecation, Core Principles, Database Schema Migrations (Expand/Contract), Deprecation and Migration, Deprecation Planning Starts at Design Time (+15 more)

### Community 115 - "Incremental Implementation"
Cohesion: 0.09
Nodes (22): Common Rationalizations, Contract-First Slicing, Implementation Rules, Increment Checklist, Incremental Implementation, Overview, Red Flags, Risk-First Slicing (+14 more)

### Community 116 - "Incremental Implementation"
Cohesion: 0.09
Nodes (22): Common Rationalizations, Contract-First Slicing, Implementation Rules, Increment Checklist, Incremental Implementation, Overview, Red Flags, Risk-First Slicing (+14 more)

### Community 117 - "Code Simplification"
Cohesion: 0.09
Nodes (21): 1. Preserve Behavior Exactly, 2. Follow Project Conventions, 3. Prefer Clarity Over Cleverness, 4. Maintain Balance, 5. Scope to What Changed, Code Simplification, Common Rationalizations, Language-Specific Guidance (+13 more)

### Community 118 - "Debugging and Error Recovery"
Cohesion: 0.09
Nodes (21): Build Failure Triage, Common Rationalizations, Debugging and Error Recovery, Error-Specific Patterns, Instrumentation Guidelines, Overview, Red Flags, Runtime Error Triage (+13 more)

### Community 119 - "Documentation and ADRs"
Cohesion: 0.09
Nodes (21): ADR Lifecycle, ADR Template, API Documentation, Architecture Decision Records (ADRs), Changelog Maintenance, Common Rationalizations, Document Known Gotchas, Documentation and ADRs (+13 more)

### Community 120 - "Code Simplification"
Cohesion: 0.09
Nodes (21): 1. Preserve Behavior Exactly, 2. Follow Project Conventions, 3. Prefer Clarity Over Cleverness, 4. Maintain Balance, 5. Scope to What Changed, Code Simplification, Common Rationalizations, Language-Specific Guidance (+13 more)

### Community 121 - "Debugging and Error Recovery"
Cohesion: 0.09
Nodes (21): Build Failure Triage, Common Rationalizations, Debugging and Error Recovery, Error-Specific Patterns, Instrumentation Guidelines, Overview, Red Flags, Runtime Error Triage (+13 more)

### Community 122 - "Documentation and ADRs"
Cohesion: 0.09
Nodes (21): ADR Lifecycle, ADR Template, API Documentation, Architecture Decision Records (ADRs), Changelog Maintenance, Common Rationalizations, Document Known Gotchas, Documentation and ADRs (+13 more)

### Community 123 - "Interview Me"
Cohesion: 0.11
Nodes (18): Common Rationalizations, Example, Interaction with Other Skills, Interview Me, Loading Constraints, Output, Overview, Red Flags (+10 more)

### Community 124 - "Planning and Task Breakdown"
Cohesion: 0.11
Nodes (18): Common Rationalizations, Output Files, Overview, Parallelization Opportunities, Plan Document Template, Planning and Task Breakdown, Red Flags, See Also (+10 more)

### Community 125 - "Interview Me"
Cohesion: 0.11
Nodes (18): Common Rationalizations, Example, Interaction with Other Skills, Interview Me, Loading Constraints, Output, Overview, Red Flags (+10 more)

### Community 126 - "Planning and Task Breakdown"
Cohesion: 0.11
Nodes (18): Common Rationalizations, Output Files, Overview, Parallelization Opportunities, Plan Document Template, Planning and Task Breakdown, Red Flags, See Also (+10 more)

### Community 127 - "Security Checklist"
Cohesion: 0.11
Nodes (17): AI / LLM Security, Authentication, Authorization, CORS Configuration, Data Protection, Dependency Security, Destructive Path Operations, Error Handling (+9 more)

### Community 128 - "ReOrder: Keep Your Regulars Ordering Direct"
Cohesion: 0.11
Nodes (17): Example 1: Vague Early-Stage Concept (Full 3-Phase Session), Example 2: Feature Idea Within an Existing Product (Codebase-Aware), Example 3: Process/Workflow Idea (Non-Product), Ideation Session Examples, Key Assumptions to Validate, MVP Scope, Not Doing (and Why), Open Questions (+9 more)

### Community 129 - "Security Checklist"
Cohesion: 0.11
Nodes (17): AI / LLM Security, Authentication, Authorization, CORS Configuration, Data Protection, Dependency Security, Destructive Path Operations, Error Handling (+9 more)

### Community 130 - "ReOrder: Keep Your Regulars Ordering Direct"
Cohesion: 0.11
Nodes (17): Example 1: Vague Early-Stage Concept (Full 3-Phase Session), Example 2: Feature Idea Within an Existing Product (Codebase-Aware), Example 3: Process/Workflow Idea (Non-Product), Ideation Session Examples, Key Assumptions to Validate, MVP Scope, Not Doing (and Why), Open Questions (+9 more)

### Community 131 - "Accessibility Checklist"
Cohesion: 0.12
Nodes (16): Accessibility Checklist, Accessible Lists, ARIA Roles, Buttons vs. Links, Common Anti-Patterns, Common HTML Patterns, Content, Essential Checks (+8 more)

### Community 132 - "Accessibility Checklist"
Cohesion: 0.12
Nodes (16): Accessibility Checklist, Accessible Lists, ARIA Roles, Buttons vs. Links, Common Anti-Patterns, Common HTML Patterns, Content, Essential Checks (+8 more)

### Community 133 - "Doubt-Driven Development"
Cohesion: 0.12
Nodes (15): Common Rationalizations, Cross-model escalation, Doubt-Driven Development, Interaction with Other Skills, Loading Constraints, Overview, Red Flags, Step 1: CLAIM — Surface what stands (+7 more)

### Community 134 - "Process"
Cohesion: 0.12
Nodes (15): 1. Define "working" before instrumenting, 2. Pick the right signal for each question, 3. Structured logging, 4. Metrics, 5. Distributed tracing, 6. Alerting, 7. Verify the telemetry itself, Common Rationalizations (+7 more)

### Community 135 - "Doubt-Driven Development"
Cohesion: 0.12
Nodes (15): Common Rationalizations, Cross-model escalation, Doubt-Driven Development, Interaction with Other Skills, Loading Constraints, Overview, Red Flags, Step 1: CLAIM — Surface what stands (+7 more)

### Community 136 - "Process"
Cohesion: 0.12
Nodes (15): 1. Define "working" before instrumenting, 2. Pick the right signal for each question, 3. Structured logging, 4. Metrics, 5. Distributed tracing, 6. Alerting, 7. Verify the telemetry itself, Common Rationalizations (+7 more)

### Community 137 - "Idea Refine"
Cohesion: 0.13
Nodes (14): Anti-patterns to Avoid, Detailed Instructions, How It Works, Idea Refine, Output, Phase 1: Understand & Expand (Divergent), Phase 2: Evaluate & Converge, Phase 3: Sharpen & Ship (+6 more)

### Community 138 - "Using Agent Skills"
Cohesion: 0.13
Nodes (14): 1. Surface Assumptions, 2. Manage Confusion Actively, 3. Push Back When Warranted, 4. Enforce Simplicity, 5. Maintain Scope Discipline, 6. Verify, Don't Assume, Core Operating Behaviors, Failure Modes to Avoid (+6 more)

### Community 139 - "Idea Refine"
Cohesion: 0.13
Nodes (14): Anti-patterns to Avoid, Detailed Instructions, How It Works, Idea Refine, Output, Phase 1: Understand & Expand (Divergent), Phase 2: Evaluate & Converge, Phase 3: Sharpen & Ship (+6 more)

### Community 140 - "Using Agent Skills"
Cohesion: 0.13
Nodes (14): 1. Surface Assumptions, 2. Manage Confusion Actively, 3. Push Back When Warranted, 4. Enforce Simplicity, 5. Maintain Scope Discipline, 6. Verify, Don't Assume, Core Operating Behaviors, Failure Modes to Avoid (+6 more)

### Community 141 - "Testing Patterns Reference (JavaScript/TypeScript)"
Cohesion: 0.14
Nodes (13): API / Integration Testing, Common Assertions, E2E Testing (Playwright), Mock at Boundaries Only, Mock Functions, Mock Modules, Mocking Patterns, React/Component Testing (+5 more)

### Community 142 - "Spec-Driven Development"
Cohesion: 0.14
Nodes (13): Common Rationalizations, Keeping the Spec Alive, Overview, Phase 0: Scope Check, Phase 1: Specify, Phase 2: Plan, Phase 3: Tasks, Phase 4: Implement (+5 more)

### Community 143 - "Testing Patterns Reference (JavaScript/TypeScript)"
Cohesion: 0.14
Nodes (13): API / Integration Testing, Common Assertions, E2E Testing (Playwright), Mock at Boundaries Only, Mock Functions, Mock Modules, Mocking Patterns, React/Component Testing (+5 more)

### Community 144 - "Spec-Driven Development"
Cohesion: 0.14
Nodes (13): Common Rationalizations, Keeping the Spec Alive, Overview, Phase 0: Scope Check, Phase 1: Specify, Phase 2: Plan, Phase 3: Tasks, Phase 4: Implement (+5 more)

### Community 145 - "Source-Driven Development"
Cohesion: 0.15
Nodes (12): Common Rationalizations, Overview, Red Flags, Retrieval Safety: Treat Fetched Content as Data, Source-Driven Development, Step 1: Detect Stack and Versions, Step 2: Fetch Official Documentation, Step 3: Implement Following Documented Patterns (+4 more)

### Community 146 - "Source-Driven Development"
Cohesion: 0.15
Nodes (12): Common Rationalizations, Overview, Red Flags, Retrieval Safety: Treat Fetched Content as Data, Source-Driven Development, Step 1: Detect Stack and Versions, Step 2: Fetch Official Documentation, Step 3: Implement Following Documented Patterns (+4 more)

### Community 147 - "Refinement & Evaluation Criteria"
Cohesion: 0.17
Nodes (11): 1. User Value, 2. Feasibility, 3. Differentiation, Assumption Audit, Core Evaluation Dimensions, Decision Framework, Might Be True (Nice to Have), Must Be True (Dealbreakers) (+3 more)

### Community 148 - "Hardening Patterns"
Cohesion: 0.17
Nodes (10): Data Classification, Dependency Audit Triage, Destructive Operations on Derived Paths, File Upload Safety, Hardening Patterns, Input Validation Patterns, LLM Output Handling, Rate Limiting (+2 more)

### Community 150 - "Airbnb market comparison tasks"
Cohesion: 0.40
Nodes (4): Airbnb market comparison tasks, Checkpoint: cache foundation, Checkpoint: complete, Checkpoint: end-to-end comparison

### Community 151 - "Refinement & Evaluation Criteria"
Cohesion: 0.17
Nodes (11): 1. User Value, 2. Feasibility, 3. Differentiation, Assumption Audit, Core Evaluation Dimensions, Decision Framework, Might Be True (Nice to Have), Must Be True (Dealbreakers) (+3 more)

### Community 152 - "The Standing Checklist"
Cohesion: 0.18
Nodes (10): Correctness, Definition of Done, Definition of Done vs. Acceptance Criteria, Documentation, How to Apply, Integration, Quality, Red Flags (+2 more)

### Community 153 - "Observability Checklist"
Cohesion: 0.18
Nodes (10): Alerting, Dashboards, Distributed Tracing, Metrics, Observability Checklist, On-Call Questions (Start Here), Pre-Launch Gate, Structured Logging (+2 more)

### Community 154 - "The Standing Checklist"
Cohesion: 0.18
Nodes (10): Correctness, Definition of Done, Definition of Done vs. Acceptance Criteria, Documentation, How to Apply, Integration, Quality, Red Flags (+2 more)

### Community 155 - "Observability Checklist"
Cohesion: 0.18
Nodes (10): Alerting, Dashboards, Distributed Tracing, Metrics, Observability Checklist, On-Call Questions (Start Here), Pre-Launch Gate, Structured Logging (+2 more)

### Community 156 - "Ideation Frameworks Reference"
Cohesion: 0.22
Nodes (8): Analogous Inspiration, Constraint-Based Ideation, First Principles Thinking, How Might We (HMW), Ideation Frameworks Reference, Jobs to Be Done (JTBD), Pre-mortem, SCAMPER

### Community 157 - "Ideation Frameworks Reference"
Cohesion: 0.22
Nodes (8): Analogous Inspiration, Constraint-Based Ideation, First Principles Thinking, How Might We (HMW), Ideation Frameworks Reference, Jobs to Be Done (JTBD), Pre-mortem, SCAMPER

### Community 158 - "export.py"
Cohesion: 0.16
Nodes (3): export_csv(), get_db(), test_csv_export_rejects_an_inverted_date_range()

### Community 159 - "OWASP Top 10 Prevention Patterns"
Cohesion: 0.29
Nodes (7): Broken Access Control, Broken Authentication, Cross-Site Scripting (XSS), Injection, OWASP Top 10 Prevention Patterns, Security Misconfiguration, Sensitive Data Exposure

### Community 160 - "OWASP Top 10 Prevention Patterns"
Cohesion: 0.15
Nodes (12): Broken Access Control, Broken Authentication, Cross-Site Scripting (XSS), Injection, OWASP Top 10 Prevention Patterns, Security Misconfiguration, Sensitive Data Exposure, Server-Side Request Forgery (SSRF) (+4 more)

### Community 162 - "automations.py"
Cohesion: 0.18
Nodes (10): approve_and_execute_automation(), cancel_automation(), create_automation(), list_automations(), AuditLogBase, AuditLogRead, AutomationActionBase, AutomationActionCreate (+2 more)

### Community 163 - "deterministic_analyzer.py"
Cohesion: 0.22
Nodes (6): AnalysisInput, calculate_health_score(), generate_alerts(), generate_deterministic_analysis(), generate_insights(), generate_recommendations()

### Community 164 - "_build_operational_alerts"
Cohesion: 0.23
Nodes (6): _build_operational_alerts(), _portfolio_summary(), aggregate_monthly_summaries(), test_operational_alerts_include_loss_and_upcoming_checkin(), test_aggregate_monthly_summaries_keeps_occupancy_as_a_property_average(), test_portfolio_summary_returns_a_row_for_each_property()

### Community 165 - "Hardening Controls"
Cohesion: 0.17
Nodes (12): AI / LLM features, Authentication and sessions, Dependencies and supply chain, Destructive operations on derived paths, Hardening Controls, Headers, CORS, and responses, Injection, XSS, and access control, Input validation and uploads (+4 more)

### Community 169 - "Security and Hardening"
Cohesion: 0.17
Nodes (12): Always Do (No Exceptions), Ask First (Requires Human Approval), Common Rationalizations, Never Do, Overview, Process: Threat Model First, Red Flags, Review Checklist (+4 more)

### Community 170 - "ReservationsTable.tsx"
Cohesion: 0.23
Nodes (10): ChannelDonutProps, dateFormatter, formatRange(), initials(), ReservationsTable(), StatusBadge(), CHANNELS, getChannel() (+2 more)

### Community 171 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 172 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Map first, 2. Look for, 3. Check before you report, 4. Output

### Community 173 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 174 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Understand first, 2. Look for, 3. Check before you report, 4. Output

### Community 175 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 176 - "routes/auth.py"
Cohesion: 0.21
Nodes (8): update_password(), get_password_hash(), verify_password(), DemoSessionResponse, LoginPayload, OAuthCallbackResponse, RegisterPayload, Token

### Community 177 - "create_access_token"
Cohesion: 0.35
Nodes (8): login(), logout(), refresh_token(), register(), _set_auth_cookies(), start_demo(), create_access_token(), create_refresh_token()

### Community 178 - "routes/analysis.py"
Cohesion: 0.24
Nodes (12): calculate_daily_chart_data(), AIInsightRequest, DailyChartPoint, DashboardData, ExpenseBreakdownItem, FinanceOverview, JobStatus, MonthlySummary (+4 more)

### Community 179 - "Ponytail, lazy senior dev mode"
Cohesion: 0.50
Nodes (3): Before you write, Ponytail, lazy senior dev mode, The smallest complete change

### Community 180 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 181 - "Local Development Infrastructure"
Cohesion: 0.67
Nodes (3): Local Development Infrastructure, PostgreSQL Service, Redis Service

### Community 184 - "PixelBlast.jsx"
Cohesion: 0.38
Nodes (6): createLiquidEffect(), createTouchTexture(), PixelBlast(), SHAPE_MAP, postprocessing, three

### Community 185 - "metrics.ts"
Cohesion: 0.12
Nodes (28): usePortfolioMetrics(), buildDemoReservations(), FEE_RATES, GUESTS, isoDay(), PLATFORMS, STAYS, computeMetrics() (+20 more)

### Community 186 - "cache.py"
Cohesion: 0.27
Nodes (5): get_dashboard_data(), get_cached_summary(), set_cached_summary(), _summary_key(), _summary_pattern()

### Community 187 - "Property"
Cohesion: 0.12
Nodes (19): ComparisonPage(), PropertyComparisonPage(), EditPropertyPage(), GlassPropertiesProps, IncomeFormProps, MarketComparisonTable(), Position(), Props (+11 more)

### Community 188 - "Spec: market-snapshot"
Cohesion: 0.05
Nodes (39): GET(), Assumptions under review, Capability Map: inteligencia competitiva Airbnb, Key product decisions to approve, Sources checked, Boundaries, Code style, Commands (+31 more)

### Community 189 - "RevenueTrendChart.tsx"
Cohesion: 0.53
Nodes (4): PredictiveRecommendationsProps, RevenueTrendChartProps, MonthPoint, MonthForecast

### Community 191 - "sqlalchemy_ext_asyncio"
Cohesion: 0.10
Nodes (6): do_run_migrations(), run_migrations_offline(), run_migrations_online(), db_session(), event_loop(), test_engine()

### Community 194 - "update_job"
Cohesion: 0.33
Nodes (4): Detalles Técnicos, Enlaces, Motor Engine & IA Agents, update_job()

### Community 196 - "verify_property_access"
Cohesion: 0.13
Nodes (8): check_global_ai_limit(), check_user_ai_limit(), increment_ai_usage(), request_ai_insights(), request_deterministic_insights(), send_chat_message(), verify_property_access(), create_job()

## Knowledge Gaps
- **1577 isolated node(s):** `idea-refine.sh script`, `idea-refine.sh script`, `eslintConfig`, `nextConfig`, `name` (+1572 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1961 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Funciones del sistema` connect `Funciones del sistema` to `Property`, `analytics/page.tsx`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `2. Gestión de entidades operativas (Propiedades, Reservas y Gastos)` connect `Funciones del sistema` to `verify_property_access`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `verify_property_access()` connect `verify_property_access` to `automations.py`, `reservations.py`, `expenses.py`, `routes/chat.py`, `dependencies.py`, `integrations.py`, `Property`, `datetime`, `routes/analysis.py`, `_get_property_data`, `User`, `predictions.py`, `cache.py`, `Funciones del sistema`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 74 inferred relationships involving `User` (e.g. with `run_copilot()` and `get_dashboard_data()`) actually correct?**
  _`User` has 74 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `Property` (e.g. with `_build_operational_alerts()` and `_get_portfolio_data()`) actually correct?**
  _`Property` has 29 INFERRED edges - model-reasoned connections that need verification._
- **What connects `idea-refine.sh script`, `idea-refine.sh script`, `eslintConfig` to the rest of the system?**
  _1577 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06660006660006661 - nodes in this community are weakly interconnected._