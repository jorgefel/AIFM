---
tags: [moc, arquitectura, overview]
---
# AIFM - Map of Content (MOC)

## Meta
- **Nombre**: AIFM - Airbnb Intelligent Finance & Management
- **Descripción General**: Sistema híbrido de finanzas e inteligencia operativa para la gestión avanzada de propiedades en plataformas como Airbnb. Combina una interfaz web moderna, un motor backend robusto y análisis inteligente para optimizar operaciones y finanzas.
- **Objetivo**: Automatizar el análisis, asegurando precisión absoluta en los números mediante un motor determinístico mientras se proveen insights avanzados mediante agentes IA.
- **Estado Actual**: En desarrollo activo. Infraestructura backend (FastAPI, SQLAlchemy, LangGraph) y frontend (Next.js 15, Tailwind CSS 4) establecida en un Monorepo con Turborepo.
- **Fecha Generación**: 2026-08-12

## Arquitectura
- **Stack Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts, Lucide React, Three.js, React Query (@tanstack/react-query)
- **Stack Backend**: FastAPI (Python 3.12), SQLAlchemy, Alembic, LangGraph / LangChain, OpenAI API, Redis 7, bcrypt, jwt
- **Base de Datos**: PostgreSQL 16 (con Prisma para Node.js y SQLAlchemy para Python)
- **Infraestructura y Deploy**: Vercel (Frontend), Render/Railway/Supabase (Backend), Cloudflare Workers (Edge Cache), Docker Compose para desarrollo local.

## Diagrama de Flujo
Cliente Web (Next.js) se comunica vía HTTP REST. Peticiones de lectura frecuentes (ej. propiedades, usuario actual) pasan primero por el Edge Cache Worker (Cloudflare), el cual valida el JWT y sirve respuestas cacheadas. Las peticiones que llegan a la API FastAPI pasan por Middleware de Autenticación y llegan a Controladores. Los controladores consultan la BD PostgreSQL (vía SQLAlchemy) y Redis para Rate Limiting. Para el análisis, el Motor Determinista genera los cálculos fijos ([[10-Glosario#Regla de Oro|Regla de Oro]]), y luego el Agente IA consume estos datos vía OpenAI API para generar recomendaciones.

## Índice del Proyecto
- [[01-Modulos/Frontend-Web|Frontend Web]]
- [[01-Modulos/Auth-Users|Auth & Users]]
- [[01-Modulos/Gestion-Core|Gestión Core: Properties, Reservations, Expenses]]
- [[01-Modulos/Motor-Engine-IA-Agents|Motor Engine & IA Agents]]
- [[01-Modulos/Edge-Cache-Worker|Edge Cache Worker]]
- [[02-Motor-Financiero|Motor Financiero]]
- [[03-Agentes-IA|Agentes IA]]
- [[04-Seguridad|Seguridad]]
- [[05-Base-de-Datos|Base de Datos]]
- [[06-Historial-Decisiones|Historial y Decisiones]]
- [[07-Que-Falta|Qué Falta (Deuda Técnica)]]
- [[08-Que-No-Se-Necesita|Qué no se necesita (Descartado)]]
- [[09-Equipo|Equipo y Metodología]]
- [[10-Glosario|Glosario]]
