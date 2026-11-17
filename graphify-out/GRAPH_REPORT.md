# Graph Report - AIFM  (2026-11-17)

## Corpus Check
- 441 files · ~272,601 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: (none) 5, .css 4, .mdc 1)

## Summary
- 3788 nodes · 7675 edges · 209 communities (171 shown, 38 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 415 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3ff1d9c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ReservationDetail.tsx
- routes/auth.py
- datetime
- integrations.py
- routes/billing.py
- metadata.ts
- guests.py
- Hardening Patterns
- User
- scripts
- api.ts
- main.py
- compilerOptions
- worker/package.json
- web/package.json
- react
- build_context
- dependencies
- models.ts
- database/package.json
- tasks
- useCurrency
- test_dashboard_returns_daily_series_for_one_month
- schemas/property.py
- invalidate_summary_cache
- shared/package.json
- request_ai_insights
- devDependencies
- Worked example: Agent Teams for competing-hypothesis debugging
- shared/src/index.ts
- lucide-react
- usePropertyWizard.ts
- compilerOptions
- compilerOptions
- cache.py
- schemas/expense.py
- match_question
- schemas/reservation.py
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
- Property
- next
- MarketComparisonTable.tsx
- test_competitors.py
- postcss.config.mjs
- get_competitors
- Auth & Users (Backend)
- AIFM README
- pydantic
- Test-Driven Development
- test_chatbot.py
- Code Review and Quality
- rules/graphify.md
- workflows/graphify.md
- Chatbot.tsx
- schemas/chat.py
- Test-Driven Development
- route.ts
- Propuesta de Arquitectura: Sistema de Comparación con Alojamientos Cercanos
- routes/analysis.py
- Context Engineering
- Context Engineering
- Performance Checklist
- Git Workflow and Versioning
- create_demo_workspace
- Funciones del sistema
- Optimization Patterns
- _get_property_data
- Beds24Client
- golden_rule.py
- PlanCard.tsx
- test_user_onboarding.py
- FakeSession
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
- pytest
- Airbnb market comparison tasks
- Refinement & Evaluation Criteria
- The Standing Checklist
- Observability Checklist
- The Standing Checklist
- Observability Checklist
- Ideation Frameworks Reference
- Ideation Frameworks Reference
- Contrato y Arquitectura del Modelo Predictivo Financiero
- OWASP Top 10 Prevention Patterns
- OWASP Top 10 Prevention Patterns
- opengraph-image.tsx
- generate_property_forecast
- deterministic_analyzer.py
- schemas/__init__.py
- Hardening Controls
- AGENTS.md
- .agents/skills/idea-refine/scripts/idea-refine.sh
- .cursor/skills/idea-refine/scripts/idea-refine.sh
- Security and Hardening
- send_message
- Ponytail Help
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- Ponytail
- job_manager.py
- ThemeContext.tsx
- export_csv
- Ponytail, lazy senior dev mode
- ponytail-debt/SKILL.md
- Local Development Infrastructure
- test_market_evidence.py
- a1b2c3d4e5f6_add_guests_table_and_reservation_guest_id.py
- Guía de Demostración del Chatbot de Dos Capas y Pronóstico Financiero
- get_fallback_question_id
- Spec: market-snapshot
- app/layout.tsx
- ._run_actor
- auth_user
- Skeleton.tsx
- Button
- config.py
- copilot.py
- list_questions
- schemas/automation.py
- GlassAiDecisions.tsx
- do_run_migrations
- test_chatbot_never_writes_to_redis
- service.py
- plans/page.tsx
- db_session
- PixelBlast.jsx
- routes/competitors.py

## God Nodes (most connected - your core abstractions)
1. `User` - 142 edges
2. `Property` - 113 edges
3. `lucide-react` - 85 edges
4. `react` - 73 edges
5. `useCurrency()` - 65 edges
6. `Reservation` - 62 edges
7. `next` - 55 edges
8. `useAuth()` - 52 edges
9. `Button()` - 49 edges
10. `Expense` - 40 edges

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

## Communities (209 total, 38 thin omitted)

### Community 0 - "ReservationDetail.tsx"
Cohesion: 0.12
Nodes (26): CalendarPage(), MiniCalendar(), MiniCalendarProps, WEEKDAYS, localizer, messages, ReservationCalendar(), ReservationCalendarProps (+18 more)

### Community 1 - "routes/auth.py"
Cohesion: 0.06
Nodes (40): apple_callback(), apple_login(), _complete_oauth_callback(), _frontend_callback_url(), _get_or_create_oauth_user(), google_callback(), google_login(), login() (+32 more)

### Community 2 - "datetime"
Cohesion: 0.08
Nodes (5): run_migrations_offline(), get_db(), get_current_user(), verify_property_access(), verify_refresh_token()

### Community 3 - "integrations.py"
Cohesion: 0.08
Nodes (47): 5. Asesor financiero y Copiloto IA conversacional, _acquire_inventory_sync_slot(), _acquire_sync_lock(), check_beds24_channel_status(), confirm_beds24_channel(), create_beds24_connection(), create_ota_connection(), get_beds24_sync_history() (+39 more)

### Community 4 - "routes/billing.py"
Cohesion: 0.11
Nodes (25): create_checkout_session(), create_portal_session(), _find_user_for_subscription(), _frontend_url(), get_billing_history(), get_billing_status(), _handle_stripe_event(), _latest_subscription() (+17 more)

### Community 5 - "metadata.ts"
Cohesion: 0.08
Nodes (12): metadata, metadata, metadata, metadata, createPageMetadata(), PageMetadataOptions, metadata, metadata (+4 more)

### Community 6 - "guests.py"
Cohesion: 0.20
Nodes (18): create_guest(), delete_guest(), _enrich_guest_read(), get_guest(), get_guests(), update_guest(), Guest, GuestBase (+10 more)

### Community 7 - "Hardening Patterns"
Cohesion: 0.17
Nodes (10): Data Classification, Dependency Audit Triage, Destructive Operations on Derived Paths, File Upload Safety, Hardening Patterns, Input Validation Patterns, LLM Output Handling, Rate Limiting (+2 more)

### Community 8 - "User"
Cohesion: 0.09
Nodes (24): approve_and_execute_automation(), cancel_automation(), create_automation(), list_automations(), scan_automations(), scan_operational_rules(), get_chat_session(), list_chat_sessions() (+16 more)

### Community 9 - "scripts"
Cohesion: 0.10
Nodes (20): devDependencies, concurrently, turbo, engines, node, pnpm, name, packageManager (+12 more)

### Community 10 - "api.ts"
Cohesion: 0.09
Nodes (34): ExpensesPage(), ChatMessage, ExpenseList(), ExpenseListProps, categoryLabels, FinanceOverview(), Overview, MonthlyReportSummary() (+26 more)

### Community 11 - "main.py"
Cohesion: 0.09
Nodes (7): upload_photo(), save_receipt(), upload_property_photo(), health_check(), test_upload_property_photo_invalid_type(), test_upload_property_photo_too_large(), test_upload_property_photo_valid()

### Community 12 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 13 - "worker/package.json"
Cohesion: 0.12
Nodes (15): dependencies, jose, devDependencies, @cloudflare/workers-types, typescript, wrangler, typescript, name (+7 more)

### Community 14 - "web/package.json"
Cohesion: 0.10
Nodes (19): eslintConfig, typescript, name, private, version, eslint, eslint-config-next, react-dom (+11 more)

### Community 15 - "react"
Cohesion: 0.19
Nodes (14): WidgetBase(), WidgetBaseProps, WidgetExpenses(), WidgetIncome(), WidgetNetProfit(), WidgetOccupancy(), WidgetPerformanceChart(), WidgetRecentActivity() (+6 more)

### Community 16 - "build_context"
Cohesion: 0.12
Nodes (12): build_context(), compact_result(), ChatbotAdvice, compute_metric_evolution(), extract_metrics_dict(), get_advice_history(), record_advice_batch(), test_compute_metric_evolution() (+4 more)

### Community 17 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, axios, date-fns, framer-motion, lucide-react, next, postprocessing, react (+10 more)

### Community 19 - "models.ts"
Cohesion: 0.09
Nodes (25): PropertyTableProps, GlassPropertiesProps, PredictiveRecommendationsProps, PropertySummaryGridProps, IncomeFormProps, PropertyWizardProps, PropertyPickerModalProps, buildDemoReservations() (+17 more)

### Community 20 - "database/package.json"
Cohesion: 0.12
Nodes (15): dependencies, @prisma/client, devDependencies, prisma, name, private, scripts, db:generate (+7 more)

### Community 21 - "tasks"
Cohesion: 0.12
Nodes (15): dependsOn, inputs, outputs, cache, persistent, globalEnv, dependsOn, $schema (+7 more)

### Community 22 - "useCurrency"
Cohesion: 0.05
Nodes (83): 4. Modelo predictivo y proyecciones de series temporales (Forecasting), AnalyticsPage(), TabId, TABS, Home(), ChannelTable(), ChartCard(), ChartTooltip() (+75 more)

### Community 23 - "test_dashboard_returns_daily_series_for_one_month"
Cohesion: 0.20
Nodes (7): test_dashboard_accepts_range_query_without_shadowing_builtin(), cache_summary(), cached_summary(), monthly_summary(), property_data(), verify_access(), test_dashboard_returns_daily_series_for_one_month()

### Community 24 - "schemas/property.py"
Cohesion: 0.38
Nodes (7): PropertyBase, PropertyCreate, PropertyRead, PropertyUpdate, test_property_create_accepts_a_complete_profile(), test_property_create_requires_a_published_platform(), test_property_update_rejects_zero_guests()

### Community 25 - "invalidate_summary_cache"
Cohesion: 0.12
Nodes (12): create_expense(), delete_expense(), get_expenses(), update_expense(), upload_expense_receipt(), create_reservation(), delete_reservation(), _ensure_no_overlap() (+4 more)

### Community 26 - "shared/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, exports, typescript, main, name, private, scripts (+3 more)

### Community 27 - "request_ai_insights"
Cohesion: 0.19
Nodes (6): check_global_ai_limit(), check_user_ai_limit(), increment_ai_usage(), request_ai_insights(), _run_ai_analysis_task(), send_chat_message()

### Community 28 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-big-calendar (+4 more)

### Community 29 - "Worked example: Agent Teams for competing-hypothesis debugging"
Cohesion: 0.06
Nodes (31): 1. Direct invocation (no orchestration), 2. Single-persona slash command, 3. Parallel fan-out with merge, 4. Sequential pipeline as user-driven slash commands, 5. Research isolation (context preservation), A. Router persona ("meta-orchestrator"), Anti-pattern in this scenario, Anti-patterns (+23 more)

### Community 30 - "shared/src/index.ts"
Cohesion: 0.20
Nodes (10): ApiResponse, Currency, Expense, ExpenseCategory, MonthlyReport, PaginatedResponse, Property, Reservation (+2 more)

### Community 31 - "lucide-react"
Cohesion: 0.13
Nodes (25): AIReportModal(), AIReportModalProps, ExpenseForm(), ExpenseFormProps, getNights(), IncomeForm(), ChoiceGroup(), PropertyForm() (+17 more)

### Community 32 - "usePropertyWizard.ts"
Cohesion: 0.08
Nodes (47): Fact(), PropertyDetailPage(), NewPropertyPage(), AMENITY_ICONS, getAmenityIcon(), PropertyGallery(), PropertyGalleryProps, PropertyList() (+39 more)

### Community 33 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, esModuleInterop, lib, module, moduleResolution, skipLibCheck, strict, target (+1 more)

### Community 34 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, module, moduleResolution, skipLibCheck, sourceMap, strict (+1 more)

### Community 35 - "cache.py"
Cohesion: 0.33
Nodes (4): get_cached_summary(), set_cached_summary(), _summary_key(), _summary_pattern()

### Community 36 - "schemas/expense.py"
Cohesion: 0.39
Nodes (6): ExpenseBase, ExpenseCreate, ExpenseRead, ExpenseUpdate, test_expense_accepts_supported_category(), test_expense_rejects_non_positive_amount()

### Community 37 - "match_question"
Cohesion: 0.18
Nodes (7): has_consecutive_words(), match_question(), test_match_question_layer1(), test_match_question_layer2(), test_routing_historial_consejos(), test_routing_posicion_mercado(), test_routing_sprint_6_phrases()

### Community 38 - "schemas/reservation.py"
Cohesion: 0.28
Nodes (8): ReservationBase, ReservationCreate, ReservationRead, ReservationUpdate, reservation_payload(), test_reservation_rejects_negative_platform_fee(), test_reservation_requires_checkout_after_checkin(), test_reservation_update_accepts_a_partial_status_change()

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

### Community 50 - "Property"
Cohesion: 0.10
Nodes (36): get_forecast(), build(), handle_cancelaciones_mes(), handle_comparar_mes_anterior(), get_financials(), handle_dias_libres_proximos(), handle_estancia_promedio(), handle_gastos_categoria() (+28 more)

### Community 51 - "next"
Cohesion: 0.04
Nodes (68): nextConfig, AuthCallbackPage(), containerVariants, itemVariants, LoginPage(), containerVariants, itemVariants, RegisterPage() (+60 more)

### Community 52 - "MarketComparisonTable.tsx"
Cohesion: 0.28
Nodes (13): asNumber(), ComparisonHint(), CompetitorCard(), ListingImage(), MarketComparisonTable(), Metric(), number(), NumericValue (+5 more)

### Community 54 - "test_competitors.py"
Cohesion: 0.11
Nodes (11): ProviderQueryError, country_domain(), FakeOmkarProvider, test_country_domain_uses_colombian_domain_and_default(), test_omkar_400_with_airbnb_rejection_raises_provider_unavailable(), test_omkar_falls_back_to_city_only_when_enabled(), test_omkar_search_400_at_both_levels_raises_query_error(), get() (+3 more)

### Community 58 - "get_competitors"
Cohesion: 0.17
Nodes (9): build_competitor_snapshot(), _cache_key(), get_competitors(), _image_url(), _lock_key(), _number(), _quantile(), test_force_refresh_ignores_a_cached_snapshot() (+1 more)

### Community 59 - "Auth & Users (Backend)"
Cohesion: 0.25
Nodes (6): Auth & Users (Backend), Detalles Técnicos, Enlaces, Detalles Técnicos, Edge Cache Worker (@aifm/worker), Enlaces

### Community 72 - "pydantic"
Cohesion: 0.17
Nodes (4): Config, DashboardLayoutRead, DashboardLayoutUpdate, test_alembic_has_one_deployable_head()

### Community 73 - "Test-Driven Development"
Cohesion: 0.07
Nodes (29): Browser Testing with DevTools, Common Rationalizations, DAMP Over DRY in Tests, Decision Guide, Discover the Stack First, Name Tests Descriptively, One Assertion Per Concept, Overview (+21 more)

### Community 74 - "test_chatbot.py"
Cohesion: 0.11
Nodes (22): test_handler_cancelaciones_mes(), test_handler_comparar_mes_anterior(), test_handler_dias_libres_proximos(), test_handler_estancia_promedio(), test_handler_gastos_categoria(), test_handler_gastos_empty(), test_handler_historial_consejos_empty(), test_handler_historial_consejos_with_history() (+14 more)

### Community 75 - "Code Review and Quality"
Cohesion: 0.07
Nodes (29): 1. Correctness, 2. Readability & Simplicity, 3. Architecture, 4. Security, 5. Performance, Change Descriptions, Change Sizing, Code Review and Quality (+21 more)

### Community 78 - "Chatbot.tsx"
Cohesion: 0.17
Nodes (19): Chatbot(), ChatbotMetric, ChatbotProps, ChatbotResult, ChatbotTable, ChatEntry, formatMetricValue(), formatResultAsPlainText() (+11 more)

### Community 79 - "schemas/chat.py"
Cohesion: 0.39
Nodes (7): AIChatMessageBase, AIChatMessageCreate, AIChatMessageRead, AIChatRequest, AIChatSessionBase, AIChatSessionCreate, AIChatSessionRead

### Community 80 - "Test-Driven Development"
Cohesion: 0.07
Nodes (29): Browser Testing with DevTools, Common Rationalizations, DAMP Over DRY in Tests, Decision Guide, Discover the Stack First, Name Tests Descriptively, One Assertion Per Concept, Overview (+21 more)

### Community 81 - "route.ts"
Cohesion: 0.20
Nodes (10): DELETE, dynamic, GET, OPTIONS, PATCH, POST, proxy(), PUT (+2 more)

### Community 82 - "Propuesta de Arquitectura: Sistema de Comparación con Alojamientos Cercanos"
Cohesion: 0.22
Nodes (8): 1. Objetivo, 2. Requerimientos de Datos: Dirección Específica y Geolocalización, 3. Conexión de APIs para Alojamientos Cercanos, 4. Métricas de Comparación a Mostrar en el Dashboard, Campos en Base de Datos (`properties`), Experiencia de Usuario (UI/UX), Propuesta de Arquitectura: Sistema de Comparación con Alojamientos Cercanos, Recomendación de Implementación Fásica (Fase 1 y Fase 2)

### Community 83 - "routes/analysis.py"
Cohesion: 0.24
Nodes (12): calculate_daily_chart_data(), AIInsightRequest, DailyChartPoint, DashboardData, ExpenseBreakdownItem, FinanceOverview, JobStatus, MonthlySummary (+4 more)

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

### Community 88 - "create_demo_workspace"
Cohesion: 0.22
Nodes (5): create_demo_workspace(), delete_expired_demo_workspaces(), run_demo_cleanup_forever(), lifespan(), test_demo_workspaces_are_isolated_and_expire_after_two_hours()

### Community 89 - "Funciones del sistema"
Cohesion: 0.13
Nodes (14): 10. Rendimiento y Caché de Borde (Edge Worker), 1. Gestión de usuarios, sesiones y control de acceso (RBAC / Tiers), 2. Gestión de entidades operativas (Propiedades, Reservas y Gastos), 3. Motor financiero determinístico (Golden Rule), 6. Automatizaciones operativas con aprobación humana (Human-in-the-Loop), 7. Facturación, suscripciones y monetización (Stripe), 8. Integración y sincronización de canales externos (Beds24), 9. Dashboard consolidado, Analíticas y Reportes (+6 more)

### Community 90 - "Optimization Patterns"
Cohesion: 0.07
Nodes (25): Connection Pool Exhaustion, Large Bundle Size, Missing Caching (Backend), Missing Image Optimization (Frontend), N+1 Queries (Backend), Optimization Patterns, Queries That Ignore Their Index, Unbounded Data Fetching (+17 more)

### Community 91 - "_get_property_data"
Cohesion: 0.18
Nodes (9): get_dashboard_data(), get_finance_overview(), get_financial_summary(), get_operational_alerts(), get_portfolio_dashboard(), _get_portfolio_data(), _get_property_data(), request_deterministic_insights() (+1 more)

### Community 92 - "Beds24Client"
Cohesion: 0.07
Nodes (16): check_beds24_connection(), Beds24Client, _as_date(), _as_decimal(), _first(), InventorySyncSummary, normalize_beds24_booking(), normalize_beds24_inventory() (+8 more)

### Community 93 - "golden_rule.py"
Cohesion: 0.12
Nodes (13): calculate_expense_breakdown(), calculate_monthly_summary(), calculate_net_amount(), calculate_occupancy_rate(), calculate_remaining_free_days(), detect_discrepancies(), to_decimal(), test_consolidated_totals_match_sum_of_individual_properties() (+5 more)

### Community 94 - "PlanCard.tsx"
Cohesion: 0.36
Nodes (6): PlanCardProps, Cell(), PlanComparison(), PLAN_FEATURES, PlanFeature, PlanId

### Community 95 - "test_user_onboarding.py"
Cohesion: 0.22
Nodes (7): _missing_onboarding_fields(), update_me(), update_onboarding(), OnboardingProgressUpdate, test_missing_onboarding_fields_only_reports_unset_values(), test_onboarding_progress_accepts_a_partial_draft(), test_onboarding_progress_rejects_an_underage_host()

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

### Community 149 - "pytest"
Cohesion: 0.06
Nodes (15): _normalize_text(), search_all(), _sql_unaccent(), _get_season_multiplier(), main(), _month_year_sub(), seed_demo_data(), test_normalize_text() (+7 more)

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

### Community 158 - "Contrato y Arquitectura del Modelo Predictivo Financiero"
Cohesion: 0.12
Nodes (15): 1. Alcance y Naturaleza del Modelo, 2. Fuentes de Datos Actuales, 3. Requerimientos Faltantes para Modelar Demanda u Ocupación, 4. Contrato de la API de Pronóstico, 5. Modelos Estadísticos y Umbrales de Confianza, 6.1 Justificación Técnica de la Postergación, 6.2 Puerta de Datos Requerida (*Data Gate Checklist*), 6.3 Especificación de Interfaz de Inferencia (Contrato Futuro) (+7 more)

### Community 159 - "OWASP Top 10 Prevention Patterns"
Cohesion: 0.29
Nodes (7): Broken Access Control, Broken Authentication, Cross-Site Scripting (XSS), Injection, OWASP Top 10 Prevention Patterns, Security Misconfiguration, Sensitive Data Exposure

### Community 160 - "OWASP Top 10 Prevention Patterns"
Cohesion: 0.15
Nodes (12): Broken Access Control, Broken Authentication, Cross-Site Scripting (XSS), Injection, OWASP Top 10 Prevention Patterns, Security Misconfiguration, Sensitive Data Exposure, Server-Side Request Forgery (SSRF) (+4 more)

### Community 161 - "opengraph-image.tsx"
Cohesion: 0.40
Nodes (3): alt, contentType, size

### Community 162 - "generate_property_forecast"
Cohesion: 0.08
Nodes (19): MonthForecast, PredictiveRecommendation, PropertyForecastResponse, RecommendationEvidence, compute_backtest_mape(), _fit_and_forecast(), generate_property_forecast(), _next_months() (+11 more)

### Community 163 - "deterministic_analyzer.py"
Cohesion: 0.22
Nodes (6): AnalysisInput, calculate_health_score(), generate_alerts(), generate_deterministic_analysis(), generate_insights(), generate_recommendations()

### Community 164 - "schemas/__init__.py"
Cohesion: 0.42
Nodes (5): UserBase, UserCreate, UserPasswordUpdate, UserProfileUpdate, UserRead

### Community 165 - "Hardening Controls"
Cohesion: 0.17
Nodes (12): AI / LLM features, Authentication and sessions, Dependencies and supply chain, Destructive operations on derived paths, Hardening Controls, Headers, CORS, and responses, Injection, XSS, and access control, Input validation and uploads (+4 more)

### Community 169 - "Security and Hardening"
Cohesion: 0.17
Nodes (12): Always Do (No Exceptions), Ask First (Requires Human Approval), Common Rationalizations, Never Do, Overview, Process: Threat Model First, Red Flags, Review Checklist (+4 more)

### Community 170 - "send_message"
Cohesion: 0.22
Nodes (5): ask_question(), ChatbotAskRequest, ChatbotMessageRequest, get_owned_property(), send_message()

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

### Community 176 - "job_manager.py"
Cohesion: 0.14
Nodes (7): Detalles Técnicos, Enlaces, Motor Engine & IA Agents, get_job_status(), create_job(), get_job(), update_job()

### Community 177 - "ThemeContext.tsx"
Cohesion: 0.15
Nodes (16): AppearanceSection(), OPTIONS, ThemeSelector(), subscribeNoop(), ThemeToggle(), readStoredTheme(), ResolvedTheme, subscribeToSystemTheme() (+8 more)

### Community 179 - "Ponytail, lazy senior dev mode"
Cohesion: 0.50
Nodes (3): Before you write, Ponytail, lazy senior dev mode, The smallest complete change

### Community 180 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 181 - "Local Development Infrastructure"
Cohesion: 0.67
Nodes (3): Local Development Infrastructure, PostgreSQL Service, Redis Service

### Community 184 - "test_market_evidence.py"
Cohesion: 0.11
Nodes (14): CompetitorAggregates, CompetitorListing, CompetitorSnapshot, calculate_market_position(), match_equivalent_amenities(), normalize_amenity_name(), normalize_comparable(), record_market_snapshot() (+6 more)

### Community 186 - "Guía de Demostración del Chatbot de Dos Capas y Pronóstico Financiero"
Cohesion: 0.13
Nodes (14): 1.1 Iniciar Servidores, 1.2 Sembrar Datos de Prueba (24 Meses de Historial), 1. Preparación del Entorno y Datos de Prueba, 2.1 Cómo Interactuar, 2.2 Catálogo de Preguntas y Ejemplos de Prueba, 2. Capa 1: Motor Determinístico ("Cálculo directo"), 3.1 Arquitectura y Privacidad, 3.2 Pasos para Activar la Capa 2 (+6 more)

### Community 187 - "get_fallback_question_id"
Cohesion: 0.29
Nodes (4): get_fallback_question_id(), normalize_words(), stem_matches_word(), test_fallback_question_id()

### Community 188 - "Spec: market-snapshot"
Cohesion: 0.05
Nodes (39): GET(), Assumptions under review, Capability Map: inteligencia competitiva Airbnb, Key product decisions to approve, Sources checked, Boundaries, Code style, Commands (+31 more)

### Community 189 - "app/layout.tsx"
Cohesion: 0.19
Nodes (11): inter, manrope, metadata, RootLayout(), CurrencyProvider(), QueryProvider(), ToastProvider(), persister (+3 more)

### Community 191 - "auth_user"
Cohesion: 0.40
Nodes (3): auth_user(), mock_property(), mock_rate_limiter_redis()

### Community 192 - "Skeleton.tsx"
Cohesion: 0.14
Nodes (15): ActivityList(), ActivityListProps, DashboardCharts(), DashboardChartsProps, DashboardMetrics(), DashboardMetricsProps, IncomeList(), Column (+7 more)

### Community 193 - "Button"
Cohesion: 0.08
Nodes (52): AutomationAction, AutomationPayload, AutomationsPage(), ComparisonPage(), GuestsPage(), IncomePage(), Field(), OnboardingPage() (+44 more)

### Community 194 - "config.py"
Cohesion: 0.14
Nodes (3): Settings, test_production_accepts_overridden_secret_key(), test_production_rejects_default_secret_key()

### Community 195 - "copilot.py"
Cohesion: 0.11
Nodes (10): CopilotContext, run_copilot(), AnalysisInput, run_financial_analysis(), _build_operational_alerts(), _portfolio_summary(), aggregate_monthly_summaries(), test_operational_alerts_include_loss_and_upcoming_checkin() (+2 more)

### Community 198 - "schemas/automation.py"
Cohesion: 0.43
Nodes (6): AuditLogBase, AuditLogRead, AutomationActionBase, AutomationActionCreate, AutomationActionRead, AutomationActionUpdate

### Community 202 - "service.py"
Cohesion: 0.13
Nodes (14): ApifyProvider, OmkarProvider, CompetitorProvider, ProviderConfigurationError, ProviderError, ProviderRateLimitError, ProviderTimeoutError, ProviderUnavailableError (+6 more)

### Community 203 - "plans/page.tsx"
Cohesion: 0.22
Nodes (11): Banner(), BillingStatus, longDate, PlansContent(), PlansPage(), shortDate, Subscription, PlanCard() (+3 more)

### Community 210 - "PixelBlast.jsx"
Cohesion: 0.38
Nodes (6): createLiquidEffect(), createTouchTexture(), PixelBlast(), SHAPE_MAP, postprocessing, three

## Knowledge Gaps
- **1608 isolated node(s):** `idea-refine.sh script`, `idea-refine.sh script`, `eslintConfig`, `nextConfig`, `name` (+1603 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2107 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Funciones del sistema` connect `Funciones del sistema` to `integrations.py`, `useCurrency`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `verify_property_access()` connect `datetime` to `integrations.py`, `routes/competitors.py`, `request_ai_insights`, `User`, `send_message`, `Property`, `routes/analysis.py`, `Funciones del sistema`, `_get_property_data`, `invalidate_summary_cache`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `2. Gestión de entidades operativas (Propiedades, Reservas y Gastos)` connect `Funciones del sistema` to `datetime`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Are the 99 inferred relationships involving `User` (e.g. with `run_copilot()` and `ask_question()`) actually correct?**
  _`User` has 99 INFERRED edges - model-reasoned connections that need verification._
- **Are the 70 inferred relationships involving `Property` (e.g. with `get_owned_property()` and `_build_operational_alerts()`) actually correct?**
  _`Property` has 70 INFERRED edges - model-reasoned connections that need verification._
- **What connects `idea-refine.sh script`, `idea-refine.sh script`, `eslintConfig` to the rest of the system?**
  _1608 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ReservationDetail.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._