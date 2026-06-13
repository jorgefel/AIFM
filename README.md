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
