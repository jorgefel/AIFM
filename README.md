# AIFM — Airbnb Intelligent Finance & Management

**AIFM** es un sistema híbrido de finanzas e inteligencia operativa para la gestión avanzada de propiedades en plataformas como Airbnb. Combina una interfaz web moderna, un motor backend robusto y análisis inteligente para optimizar operaciones y finanzas.

---

## 🏗 Arquitectura y Stack Tecnológico

El proyecto está estructurado como un **Monorepo** utilizando **Turborepo** y **pnpm** para gestionar eficientemente las aplicaciones y paquetes compartidos.

| Capa | Tecnología | Descripción |
|---|---|---|
| **Monorepo** | Turborepo + pnpm | Gestión de dependencias, ejecución paralela y caché de builds. |
| **Frontend** | Next.js 15, React, TypeScript | Interfaz de usuario basada en App Router, con Tailwind CSS 4 para el diseño de UI. |
| **Backend API** | FastAPI (Python 3.12) | Servidor de alto rendimiento para lógica de negocio, endpoints e inteligencia artificial. |
| **Base de Datos** | PostgreSQL 16 | Almacenamiento relacional principal. |
| **Caché / Rate Limit** | Redis 7 | Manejo de caché, sesiones y Rate Limiting a través de `FastAPILimiter`. |
| **ORM / Migraciones** | SQLAlchemy + Alembic, Prisma | Manejo de modelos en backend y un paquete de `database` con Prisma. |

---

## 📂 Estructura del Proyecto

```text
aifm-root/
├── apps/
│   ├── web/                # Aplicación Frontend (Next.js 15)
│   │   ├── src/            # Componentes, Contextos, Hooks, Lib, Types
│   │   └── public/         # Archivos estáticos de la web
│   │
│   └── server/             # Aplicación Backend (FastAPI)
│       ├── app/            # Código fuente (api, core, engine, models, schemas, services, agents)
│       ├── alembic/        # Migraciones de Base de Datos
│       ├── tests/          # Tests unitarios y de integración
│       ├── .env.example    # Variables de entorno backend
│       └── main.py         # Punto de entrada FastAPI
│
├── packages/
│   ├── database/           # Paquete de Base de Datos (Prisma)
│   └── shared/             # Tipos e interfaces compartidas (TypeScript)
│
├── docker-compose.yml      # Definición de contenedores (Postgres, Redis, pgAdmin)
├── turbo.json              # Configuración de los pipelines de Turborepo
└── package.json            # Dependencias raíz y scripts de workspace
```

---

## 🧠 Lógica Core e Inteligencia Operativa (El Sistema)

AIFM no es solo un CRUD; integra un **Motor Financiero Determinístico** y un sistema de **Agentes de IA** (basado en LangChain/LLMs) que trabajan en conjunto para automatizar el análisis, asegurando precisión absoluta en los números mientras se proveen insights avanzados.

### 1. Entidades del Dominio (Modelos)
El sistema se modela en base a las siguientes entidades relacionales principales (vía SQLAlchemy en `apps/server/app/models/`):
- **User**: Propietarios o administradores del sistema.
- **Property**: Unidades de negocio en plataformas como Airbnb.
- **Reservation**: Registros de estancias. Maneja fechas, montos brutos, tarifas de plataforma y montos netos.
- **Expense**: Gastos operativos de las propiedades (limpieza, mantenimiento, utilidades).

### 2. Motor Financiero Determinístico (`golden_rule.py` & `deterministic_analyzer.py`)
Ubicado en `apps/server/app/engine/`, es la **única fuente de verdad** para los cálculos.
- **Regla de Oro**: `net_amount = total_amount - platform_fee`. El motor recalcula y audita esto del lado del servidor para evitar discrepancias.
- **Métricas Mensuales**: Calcula ingresos brutos, tarifas totales, beneficio neto y la **tasa de ocupación real** (cruzando días ocupados vs días del mes). Todas las operaciones financieras usan `Decimal` para evitar errores de coma flotante.
- **Health Score**: Algoritmo que evalúa la salud de una propiedad (0-100) penalizando si el ratio de gastos supera el 30%, si la ocupación es baja o el margen de ganancia neta decae.
- **Heurísticas y Alertas**: Lanza advertencias de alta severidad instantáneamente sin costo de IA (ej. discrepancias monetarias detectadas o beneficios netos negativos).

### 3. Agente Asesor Financiero (`financial_advisor.py`)
Ubicado en `apps/server/app/agents/`, utiliza modelos de **OpenAI** para proveer inteligencia sobre los datos duros.
- **Solo Lectura**: El Agente nunca modifica datos financieros; asume los datos del Motor Determinista y actúa como un asesor consultor.
- **Generación de Insights**: Recibe el resumen financiero y las alertas previas, analizando las tendencias. Sugiere estrategias de optimización de precios, reducciones de gastos o estrategias operativas para maximizar el ROI.
- **Fallback**: Incorpora un modo simulado por defecto en caso de no proveer una `OPENAI_API_KEY`.

---

## 🚀 Guía de Configuración y Desarrollo Local

### Prerrequisitos
- **Node.js**: `>=20`
- **pnpm**: `>=9`
- **Python**: `3.12`
- **Docker & Docker Compose**

### 1. Iniciar Infraestructura (Docker)
Levanta la base de datos PostgreSQL, Redis y pgAdmin.
```bash
# Iniciar los servicios en segundo plano
pnpm db:up

# Para ver los logs
pnpm db:logs

# Para detener los servicios
pnpm db:down
```

### 2. Configurar el Backend (FastAPI)
Se requiere crear un entorno virtual para instalar las dependencias de Python.
```bash
cd apps/server
python -m venv .venv

# Activar el entorno virtual:
# En Windows:
.venv\Scripts\Activate.ps1
# En macOS/Linux:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```
*Asegúrate de copiar el archivo `apps/server/.env.example` a `.env` y configurar las credenciales correctas según `docker-compose.yml`.*

### 3. Ejecutar el Proyecto

Gracias a Turborepo, puedes arrancar ambos servidores al mismo tiempo (si configuraste tu entorno Python para ejecutar `uvicorn` globalmente o en el path) o por separado.

**Para ejecutar solo el Frontend:**
```bash
# Desde la raíz del proyecto
pnpm dev
```

**Para ejecutar el Backend (en una nueva terminal):**
```bash
cd apps/server
.venv\Scripts\Activate.ps1  # O source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 🔗 URLs Locales
- **Frontend Web**: [http://localhost:3000](http://localhost:3000)
- **API Swagger / Docs**: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **pgAdmin (Gestión de DB)**: [http://localhost:5050](http://localhost:5050)

---

## 🛠️ Base de Datos y Migraciones

La base de datos central es PostgreSQL 16. Dependiendo del dominio, se interactúa mediante SQLAlchemy (Backend) o Prisma (Paquete compartido).

- **Backend (Alembic)**: 
  Ubicado en `apps/server/alembic/`. Maneja los modelos en Python.
  Para generar nuevas migraciones:
  ```bash
  alembic revision --autogenerate -m "Descripción"
  alembic upgrade head
  ```

- **Paquete de Base de Datos (Prisma)**:
  Ubicado en `packages/database/`. 
  Útil si se planea consumir la base de datos desde Node.js (scripts de sincronización, webhooks o futuros servicios TS).
  ```bash
  # Desde packages/database/
  pnpm db:generate   # Genera el cliente Prisma
  pnpm db:push       # Sincroniza el esquema sin migraciones
  pnpm db:studio     # Abre interfaz de exploración visual
  ```

---

## ☁️ Despliegue en Producción (CI/CD)

### Frontend (Vercel)
Al utilizar Turborepo, Vercel gestiona las dependencias de forma eficiente.
1. Crea un proyecto en Vercel e impórtalo desde GitHub/GitLab.
2. **Root Directory**: Configúralo en `apps/web`.
3. **Build Command**: Vercel detectará el comando correcto o usa `npx turbo run build --filter=web`.
4. Añade variables de entorno como `NEXT_PUBLIC_API_URL` apuntando a tu backend en producción.

### Backend (Render, Railway, Supabase)
El backend requiere un entorno con Python y Redis.
1. Utiliza un servicio como Render o Railway para desplegar la carpeta `apps/server`.
2. Configura el comando de inicio: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Asegúrate de configurar las variables de entorno para `DATABASE_URL` y `REDIS_URL` en tu proveedor cloud.

---

## 👥 Equipo y Responsabilidades

| Rol | Responsabilidad |
|---|---|
| **Tech Lead / DevOps** | Arquitectura, CI/CD, configuración de Turborepo e infraestructura. |
| **Backend Expert** | Modelado SQL (SQLAlchemy), endpoints de FastAPI, agentes inteligentes. |
| **Full-stack** | Integración del API al Frontend (Hooks, Fetching, Zustand/Context). |
| **Frontend UI/UX** | Desarrollo de componentes (Next.js), diseño interactivo (Tailwind CSS 4). |

## 📐 Convenciones
- **Linting & Formateo**: Todo el código web debe pasar por `pnpm lint` y `pnpm type-check`.
- **Ramas**: Utilizar `feature/<nombre>`, `fix/<nombre>` o `chore/<nombre>`.
- **Pull Requests**: Requeridas para cualquier cambio en la rama `main`. Asegurarse de que el pipeline de Turborepo compile exitosamente (`pnpm build`).
