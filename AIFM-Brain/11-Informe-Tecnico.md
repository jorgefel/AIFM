---
tags: [aifm, informe, arquitectura, tecnico]
---
# Informe técnico — AIFM (Nomora)

**AIFM (Airbnb Intelligent Finance & Management / Nomora)** es una plataforma web para la gestión operativa y financiera de propiedades de alquiler de corta estancia (Airbnb, PMS/OTAs). Centraliza propiedades, reservas y gastos, calcula indicadores financieros de forma determinística, proyecta el desempeño futuro mediante modelos predictivos estadísticos, ejecuta automatizaciones con control humano y presenta recomendaciones operativas asistidas por IA.

> **Estado del producto:** desarrollo activo y funcional. Cuenta con motor determinístico, motor de series temporales en memoria, integración externa (Beds24), copiloto IA multi-sesión, automatizaciones con log de auditoría y facturación Stripe por suscripciones.

## Arquitectura del sistema

```text
Usuario → Web Next.js (App Router + Tailwind + Recharts)
              │
              ├─ Cloudflare Worker (Edge Cache: JWT HS256, TTL 2m para /users/me y /properties/)
              │
              └─ API REST FastAPI (Python 3.11+)
                    ├─ PostgreSQL: transacciones, propiedades, reservas, gastos, auditoría y chat
                    ├─ Redis: caché de resúmenes (TTL 60s), rate limiting y trabajos asíncronos (Jobs)
                    ├─ Motor determinístico (Golden Rule): aritmética decimal exacta y alertas
                    ├─ Motor predictivo (Forecasting): Holt-Winters / Holt lineal en Python puro (<512MB RAM)
                    ├─ Asesor IA & Copilot: ChatOpenAI con contexto inyectado de solo lectura
                    ├─ Automatizaciones: flujo draft/approval con AuditLog
                    └─ Facturación: Stripe Checkout, portal de cliente y webhooks verificados
```

El repositorio es un monorepo gestionado con **Turborepo** y **pnpm**:
- `apps/web`: Frontend en Next.js 14+ (App Router), React, TypeScript, TanStack Query, Tailwind CSS, Framer Motion y Recharts.
- `apps/server`: Backend en FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 y Redis.
- `apps/worker`: Edge worker en Cloudflare Workers (TypeScript) para caché perimetral de baja latencia con validación criptográfica de sesión.

---

## Funciones del sistema

### 1. Gestión de usuarios, sesiones y control de acceso (RBAC / Tiers)

**Qué hace.** Gestiona registro, autenticación, revocación de sesiones, perfiles y restricción de funcionalidades según el nivel de suscripción (`free` vs `pro`).

**Cómo lo hace.** 
- Endpoints REST `/auth/register`, `/auth/login`, `/auth/refresh` y `/auth/logout`.
- Tokens JWT (access y refresh) almacenados en cookies seguras `HttpOnly`, `SameSite=Lax`. Contraseñas con hash `bcrypt`.
- Protección contra fuerza bruta mediante Redis y `fastapi-limiter`.
- Dependencia declarativa `require_tier("pro")` en FastAPI para blindar rutas premium (copiloto IA avanzado, automatizaciones y ciertas métricas de cartera).
- En el cliente web, control de sesión pasiva con cierre automático por inactividad (`useAutoLogout`).

**Dónde se utiliza.** 
- Backend: [`apps/server/app/api/v1/routes/auth.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/auth.py), [`users.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/users.py), [`security.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/core/security.py) y dependencias en [`dependencies.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/core/dependencies.py).
- Frontend: `src/context/AuthContext.tsx` y hooks asociados.

---

### 2. Gestión de entidades operativas (Propiedades, Reservas y Gastos)

**Qué hace.** CRUD y ciclo de vida de los activos inmobiliarios, estancias de huéspedes y costos de operación.

**Cómo lo hace.**
- Modelo relacional: `User 1:N Property 1:N Reservation / Expense`.
- Todo acceso exige validación de pertenencia (`verify_property_access`), aislando estrictamente la información por propietario (`owner_id`).
- Borrado lógico (`is_deleted`) en gastos y entidades contables para preservar integridad histórica y auditoría.
- Clasificación de reservas por estado (`confirmed`, `pending`, `cancelled`, `completed`) y desglose de tarifas (`total_amount`, `platform_fee`, `net_amount`).
- Clasificación de gastos por categorías (`cleaning`, `maintenance`, `utilities`, `supplies`, `other`).

**Dónde se utiliza.**
- Backend: [`apps/server/app/api/v1/routes/properties.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/properties.py), [`reservations.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/reservations.py), [`expenses.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/expenses.py).
- Frontend: Páginas y formularios en `src/app/properties`, `src/app/reservations`, `src/app/income` y `src/app/expenses`.

---

### 3. Motor financiero determinístico (Golden Rule)

**Qué hace.** Constituye la fuente de verdad matemática inmutable para las métricas contables del negocio, libre de alucinaciones de IA.

**Cómo lo hace.**
- Cálculos exclusivamente en el servidor con tipos `Decimal` para evitar imprecisiones de coma flotante binaria.
- **Regla de oro contable:** `net_amount = total_amount - platform_fee`.
- Detección de ocupación por conteo de días únicos ocupados en el mes objetivo, evitando sobreconteo por solapamiento de fechas.
- Fórmulas determinísticas principales:
  - $\text{occupancy\_rate} = \frac{\text{occupied\_days}}{\text{days\_in\_month}}$
  - $\text{net\_profit} = \text{net\_income} - \text{total\_expenses}$
  - $\text{profit\_margin} = \frac{\text{net\_profit}}{\text{net\_income}}$
  - **Health Score (0 a 100):** ponderación balanceada entre tasa de ocupación, margen neto y ratio de gastos operativos.
- Detección automática de discrepancias y alertas operativas de severidad alta/media (pérdidas netas, baja ocupación $<30\%$, check-ins inminentes).
- Almacenamiento en caché de resúmenes mensuales con Redis (TTL de 60 segundos).

**Dónde se utiliza.**
- Backend: [`apps/server/app/engine/golden_rule.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/engine/golden_rule.py), [`deterministic_analyzer.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/engine/deterministic_analyzer.py), [`analysis.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/analysis.py).

---

### 4. Modelo predictivo y proyecciones de series temporales (Forecasting)

**Qué hace.** Proyecta ingresos brutos (`gross_income`) y beneficio neto (`net_profit`) para los próximos 1 a 12 meses (por defecto 3 meses), acompañados de intervalos de confianza al 80%.

**Cómo lo hace.**
- **Motor en Python puro (Memory-Efficient):** Implementado en [`apps/server/app/services/forecast.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/services/forecast.py) sin dependencias estadísticas pesadas (`scipy`, `statsmodels`, `pandas`), garantizando un consumo de RAM muy inferior al umbral de 512 MB de Render y arranques inmediatos.
- **Estrategia adaptativa escalonada según historial mensual ($n$):**
  1. **$n < 4$ meses (Historial insuficiente):** Promedio móvil ponderado (*Moving Average*) con varianza muestral y desviación estándar de arranque.
  2. **Serie constante:** Proyección fija sobre la línea base.
  3. **$n \ge 24$ meses (2 años o más):** Suavizado exponencial **Holt-Winters** con estacionalidad aditiva anual ($m=12$, $\alpha=0.2$, $\beta=0.1$, $\gamma=0.3$), capturando estacionalidad de temporada alta/baja de alquiler vacacional.
  4. **$4 \le n < 24$ meses:** Suavizado exponencial doble **Holt Lineal** ($\alpha=0.3$, $\beta=0.1$) para captar niveles y tendencias de crecimiento o declive.
- **Intervalos de confianza:** Basados en residuos históricos con $Z = 1.28$ (~80% de confianza), proyectados con dispersión incremental por horizonte $h$: $\sigma_{\text{resid}} \cdot \sqrt{h}$.
- **Restricciones de dominio:** `clip_zero=True` para ingreso bruto (no puede ser negativo); beneficio neto permite valores negativos para predecir meses en pérdida.
- **Garantía analítica:** La respuesta incluye `is_forecast: True`, `confidence_level: 0.80` y `disclaimer`. Son proyecciones estadísticas preventivas que **no mutan** los registros de base de datos ni la contabilidad real.

**Dónde se utiliza.**
- Backend: [`apps/server/app/services/forecast.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/services/forecast.py), [`apps/server/app/schemas/forecast.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/schemas/forecast.py), [`apps/server/app/api/v1/routes/predictions.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/predictions.py).
- Frontend: Hook `useForecast`, gráfico interactivo `RevenueTrendChart` en el Dashboard (`src/app/page.tsx`) y pestaña especializada "Predicciones (IA)" con bandas de confianza `ForecastChart` en Analíticas (`src/app/analytics/page.tsx`).

---

### 5. Asesor financiero y Copiloto IA conversacional

**Qué hace.** Ofrece análisis de lenguaje natural, explicaciones de variaciones y asistencia interactiva basada en el estado contable del anfitrión.

**Cómo lo hace.**
- **Copiloto multi-sesión:** Endpoints `/chat/sessions` y `/chat/` que gestionan historiales de conversación persistentes (`AIChatSession` y `AIChatMessage`).
- **Inyección de contexto determinístico:** Antes de contactar al LLM, el backend consulta PostgreSQL y el motor de Golden Rule, inyectando en el system prompt métricas reales (ingresos, ocupación, gastos, alertas) del periodo y propiedad consultada.
- **Gobernanza y rate limiting:** Validación en Redis con contadores atómicos de límite diario/mensual por usuario y cuota global del servidor para prevenir sobrecostos de API OpenAI.
- **Procesamiento en segundo plano (Jobs):** Tareas pesadas de análisis (`/analysis/ai-insights`) se encolan con `BackgroundTasks` y coordinan estado (`pending`, `processing`, `completed`, `failed`) vía Redis en `/jobs/{job_id}`.
- **Regla estricta de solo lectura:** El agente tiene prohibido inventar cifras y no dispone de permisos de escritura contable.

**Dónde se utiliza.**
- Backend: [`apps/server/app/agents/copilot.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/agents/copilot.py), [`financial_advisor.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/agents/financial_advisor.py), [`rate_limiter.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/agents/rate_limiter.py), [`chat.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/chat.py), [`jobs.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/jobs.py).
- Frontend: Componente flotante `AIChatCopilot.tsx` y vistas de análisis.

---

### 6. Automatizaciones operativas con aprobación humana (Human-in-the-Loop)

**Qué hace.** Permite preparar acciones de optimización operativa (como ajuste de tarifas recomendadas o reglas) sujetas a revisión del usuario antes de su ejecución.

**Cómo lo hace.**
- Máquina de estados: `draft` / `pending_approval` $\rightarrow$ `executed` o `cancelled`.
- Creación de acciones mediante `POST /automations/` con payload JSON parametrizado.
- Endpoint de aprobación explícita `PUT /automations/{id}/approve` que ejecuta la regla y actualiza marcas de tiempo `executed_at`.
- **Trazabilidad estricta:** Toda acción genera un registro inmutable en la tabla `AuditLog` asociando usuario, acción, id de automatización y detalles del cambio.
- Protegido exclusivamente para usuarios del plan Pro (`require_tier("pro")`).

**Dónde se utiliza.**
- Backend: [`apps/server/app/api/v1/routes/automations.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/automations.py), modelos [`AutomationAction`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/models/automation.py) y [`AuditLog`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/models/automation.py).
- Frontend: Pantalla `src/app/automations/page.tsx`.

---

### 7. Facturación, suscripciones y monetización (Stripe)

**Qué hace.** Monetiza la plataforma mediante modelos de suscripción mensual/anual, pasarela de pago seguro y aprovisionamiento automático de cuotas Pro.

**Cómo lo hace.**
- Integración oficial con Stripe (`stripe-python`).
- Endpoint `/billing/checkout-session` para crear sesiones de suscripción alojadas en Stripe con redirección de éxito y cancelación.
- Endpoint `/billing/customer-portal` para que los clientes administren métodos de pago y cancelaciones de forma autónoma.
- Endpoint `/billing/webhook` con verificación de firma criptográfica (`stripe.Webhook.construct_event`) que procesa eventos `checkout.session.completed`, `customer.subscription.updated` y `customer.subscription.deleted`, actualizando el estado de la entidad `Subscription` y `User.tier` (`free` o `pro`).
- Registro de eventos en la tabla `BillingEvent` para auditoría contable de la plataforma.

**Dónde se utiliza.**
- Backend: [`apps/server/app/api/v1/routes/billing.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/billing.py), servicios en [`billing.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/services/billing.py) y modelos en [`subscription.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/models/subscription.py).
- Frontend: `src/app/plans/page.tsx` y configuración de cuenta en `src/app/settings`.

---

### 8. Integración y sincronización de canales externos (Beds24)

**Qué hace.** Conecta el inventario y reservas con el Channel Manager / PMS Beds24 para mantener la disponibilidad y las estancias sincronizadas.

**Cómo lo hace.**
- Cliente API en `services/beds24.py` y orquestador en `services/beds24_sync.py`.
- Verificación de credenciales e invitaciones de token de canal.
- Mapeo de identificadores de propiedades externas a propiedades internas de AIFM.
- Sincronización bidireccional y registro de cuotas/límites de API para no exceder las tasas del proveedor.

**Dónde se utiliza.**
- Backend: [`apps/server/app/api/v1/routes/integrations.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/integrations.py), [`beds24.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/services/beds24.py), [`beds24_sync.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/services/beds24_sync.py).
- Frontend: Paneles de integración en configuración y `Beds24SyncPanel`.

---

### 9. Dashboard consolidado, Analíticas y Reportes

**Qué hace.** Centraliza en una experiencia de usuario unificada la salud de propiedades individuales y la cartera completa del propietario (*Portfolio Dashboard*).

**Cómo lo hace.**
- Endpoint unificado `/analysis/dashboard` y `/analysis/portfolio-dashboard`:
  - Agregación por rangos temporales dinámicos: vista diaria para periodos cortos (`1m`) y vista mensual para horizontes amplios (`3m`, `6m`, `1y`).
  - Segregación estricta por moneda: no realiza conversiones FX arbitrarias; agrupa y filtra por divisa (USD, EUR, MXN, etc.).
  - Desglose porcentual de gastos por categoría (`calculate_expense_breakdown`).
  - Feed de actividad reciente unificado (últimas reservas confirmadas y gastos registrados).
- Exportación de transacciones en formato CSV mediante `/export/transactions`.
- Búsqueda global multicriterio de reservas, huéspedes y gastos en `/search/`.

**Dónde se utiliza.**
- Backend: [`apps/server/app/api/v1/routes/analysis.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/analysis.py), [`export.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/export.py), [`search.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/search.py).
- Frontend: Páginas `src/app/page.tsx` (Dashboard), `src/app/analytics`, `src/app/reports`, `src/app/calendar` y `src/app/roi`.

---

### 10. Rendimiento y Caché de Borde (Edge Worker)

**Qué hace.** Reduce la latencia a menos de 50 ms en lecturas frecuentes (`/users/me` y `/properties/`), protegiendo la base de datos PostgreSQL de sobrecarga.

**Cómo lo hace.**
- Cloudflare Worker intermedio valida criptográficamente la firma del JWT con algoritmo HS256 antes de evaluar la caché.
- Clave de caché aislada por identificador de usuario (`user_id`).
- TTL de 2 minutos para datos cacheados con reenvío transparente a FastAPI en caso de *cache miss*.

**Dónde se utiliza.**
- Perímetro: [`apps/worker/src/index.ts`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/worker/src/index.ts) y [`apps/worker/wrangler.toml`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/worker/wrangler.toml).

---

## Flujo funcional completo

```text
[1. Autenticación & Acceso]
  Usuario inicia sesión en Next.js → Cookie JWT HttpOnly → Validación de Tier (Free/Pro)
         │
[2. Ingesta & Sincronización]
  Carga manual o Sync con Beds24 → Validación de esquema → Persistencia en PostgreSQL
         │
[3. Procesamiento Determinístico]
  Petición al Dashboard → Consulta SQL (filtrado por owner_id)
  → Motor Golden Rule (Decimal, días únicos, net_amount = total - fee)
  → Almacenamiento en caché Redis (TTL 60s)
         │
[4. Modelado Predictivo (Forecasting)]
  Petición a /predictions/forecast
  → Construcción de serie temporal mensual en memoria
  → Selección algorítmica: Moving Average (n<4) | Holt-Winters (n>=24) | Holt Lineal (4<=n<24)
  → Cálculo de intervalos de confianza al 80% (Z=1.28)
  → Entrega al frontend sin mutación contable (Render-safe <512MB RAM)
         │
[5. Capa Interpretativa & Asistencia IA]
  Usuario consulta Copilot o solicita AI Insights
  → Verificación de cuota de uso en Redis
  → Inyección de métricas determinísticas en el System Prompt
  → Generación LangChain/ChatOpenAI (solo lectura)
         │
[6. Automatización & Auditoría]
  Reglas operativas en estado 'draft' o 'pending_approval'
  → Aprobación del usuario (Human-in-the-Loop)
  → Ejecución de la acción + Registro inmutable en AuditLog
```

---

## Principios técnicos que definen el producto

1. **Determinismo sobre generación sintética:** Las finanzas y métricas contables son calculadas mediante algoritmos matemáticos determinísticos con precisión `Decimal`. La IA jamás calcula estados financieros; únicamente los interpreta.
2. **Predicción preventiva sin mutación contable:** El motor predictivo genera estimaciones estadísticas de apoyo a la decisión que nunca alteran el libro contable histórico.
3. **Eficiencia estricta de recursos (Cloud-Ready):** El motor predictivo y los servicios de soporte prescinden de librerías numéricas gigantescas para garantizar que el backend opere con holgura en entornos de memoria limitada (micro-instancias de 512 MB).
4. **Multitenencia y aislamiento estricto:** Cada lectura y escritura verifica la relación de propiedad con el usuario (`owner_id`), impidiendo accesos cruzados.
5. **Control humano en automatizaciones (Human-in-the-Loop):** Las automatizaciones críticas requieren confirmación explícita y dejan huella no repudiable en `AuditLog`.
6. **Defensa en profundidad:** JWT en cookies seguras, validación criptográfica en el borde con Cloudflare Workers, rate limiting en Redis y RBAC por niveles de suscripción respaldado por Stripe.

---

## Fuentes internas del repositorio

- Backend Core & Motor: [`apps/server/app/engine/golden_rule.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/engine/golden_rule.py), [`deterministic_analyzer.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/engine/deterministic_analyzer.py).
- Motor Predictivo: [`apps/server/app/services/forecast.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/services/forecast.py), [`apps/server/app/schemas/forecast.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/schemas/forecast.py), [`apps/server/app/api/v1/routes/predictions.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/predictions.py).
- Agentes IA y Chat: [`apps/server/app/agents/copilot.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/agents/copilot.py), [`financial_advisor.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/agents/financial_advisor.py), [`rate_limiter.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/agents/rate_limiter.py), [`apps/server/app/api/v1/routes/chat.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/chat.py).
- Automatizaciones y Auditoría: [`apps/server/app/api/v1/routes/automations.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/automations.py), [`apps/server/app/models/automation.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/models/automation.py).
- Facturación: [`apps/server/app/api/v1/routes/billing.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/api/v1/routes/billing.py), [`apps/server/app/services/billing.py`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/server/app/services/billing.py).
- Frontend Visual & Hooks: `apps/web/src/hooks/useForecast.ts`, `apps/web/src/components/dashboard/RevenueTrendChart.tsx`, `apps/web/src/components/analytics/AnalyticsCharts.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/app/analytics/page.tsx`.
- Edge Worker: [`apps/worker/src/index.ts`](file:///c:/Users/jorjo/OneDrive/Documentos/proyectos%20personales/aifm/AIFM/apps/worker/src/index.ts).
