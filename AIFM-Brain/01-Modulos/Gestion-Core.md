---
tags: [backend, modulo, core, db]
---
# Gestión Core: Properties, Reservations, Expenses

**Qué hace:** 
CRUD y manejo del ciclo de vida de entidades de negocio.

**Cómo lo hace:** 
Endpoints REST utilizando SQLAlchemy para consultar y mutar PostgreSQL, filtrando estrictamente por el `owner_id` del usuario autenticado (multi-tenancy) y utilizando [[10-Glosario#Soft Delete|Soft Delete]].

**Estado:** 
En progreso

## Detalles Técnicos
- **Archivos Clave:** 
  - `apps/server/app/api/v1/routes/properties.py`
  - `apps/server/app/models/property.py`
  - `apps/server/app/models/reservation.py`
  - `apps/server/app/models/expense.py`
- **Dependencias Principales:** SQLAlchemy, FastAPI
- **Endpoints / Funciones:** 
  - GET/POST/PUT/DELETE /properties
  - Endpoints bajo /reservations
  - Endpoints bajo /expenses

## Enlaces
- Ver también: [[05-Base-de-Datos|Base de Datos]]
- Volver a [[00-Overview|Overview]]
