# AIFM — Airbnb Intelligent Finance & Management

Sistema híbrido de finanzas e inteligencia operativa para propiedades en Airbnb.

## Stack

| Capa | Tecnología |
|---|---|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15 · App Router · TypeScript · Tailwind CSS 4 |
| Backend | Python 3.12 · FastAPI · SQLAlchemy · Alembic |
| Base de datos | PostgreSQL 16 |
| Caché / Sesiones | Redis 7 |
| GUI DB | pgAdmin 4 |

## Estructura

```
aifm-root/
├── apps/
│   ├── web/        → Next.js 15 (frontend)
│   └── server/     → FastAPI (backend API)
├── packages/
│   ├── shared/     → Tipos TypeScript compartidos
│   └── database/   → Prisma Client (schema relacional)
├── docker-compose.yml
└── turbo.json
```

## Inicio Rápido

### 1. Infraestructura (Docker)
```bash
pnpm db:up
```

### 2. Frontend (Next.js)
```bash
pnpm dev
```

### 3. Backend (FastAPI) — nueva terminal
```bash
cd apps/server
.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate  # macOS/Linux
uvicorn main:app --reload --port 8000
```

### URLs
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/api/docs
- pgAdmin: http://localhost:5050

## Setup del entorno Python (primera vez)

```bash
cd apps/server
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Equipo

| Rol | Responsabilidad |
|---|---|
| Tech Lead / DevOps | Arquitectura, CI/CD, infraestructura |
| Backend Expert | Schema SQL, endpoints FastAPI, migraciones |
| Full-stack | Integración API ↔ Frontend |
| Frontend (x3) | Componentes Next.js, UI/UX |

## 🚀 Despliegue en Vercel (Producción)

Dado que este proyecto utiliza una arquitectura de Monorepo (Turborepo), desplegar el frontend de Next.js en Vercel es muy sencillo. Sin embargo, recuerda que el backend (FastAPI) y la Base de Datos (PostgreSQL) deberán alojarse en servicios compatibles como Render, Railway o Supabase para que la app funcione de forma online.

### Paso 1: Configurar el Repositorio
1. Asegúrate de que todo tu código esté subido a un repositorio en **GitHub**, **GitLab** o **Bitbucket**.

### Paso 2: Importar en Vercel
1. Ve a [Vercel](https://vercel.com/) e inicia sesión.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio de **AIFM**.

### Paso 3: Configurar el Monorepo en Vercel
Al importar el proyecto, Vercel suele detectar que es un monorepo, pero debes asegurarte de configurar las siguientes opciones en la pantalla de "Configure Project":

- **Framework Preset:** Next.js
- **Root Directory:** `apps/web` (Este paso es crucial, dile a Vercel que el código fuente de la web está aquí).
- **Build Command:** `pnpm run build` o `npx turbo run build --filter=@aifm/web...` (Vercel lo autodetectará normalmente si el Root Directory está bien puesto).
- **Install Command:** `pnpm install`

### Paso 4: Variables de Entorno
Despliega la sección **Environment Variables** en Vercel y añade:
- `NEXT_PUBLIC_API_URL`: La URL pública de tu backend FastAPI en producción (por ejemplo, `https://tu-api-backend.onrender.com`). *Importante: Actualmente en local usa localhost:8000, para producción debes apuntar a tu servidor real.*

### Paso 5: Desplegar
1. Haz clic en el botón **"Deploy"**.
2. Vercel comenzará a compilar la aplicación. Gracias a Turborepo, este proceso estará optimizado.
3. ¡Listo! En un par de minutos tendrás tu dominio `tu-app.vercel.app` funcionando online y listo para compartir.
