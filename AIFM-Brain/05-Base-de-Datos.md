---
tags: [backend, db, postgresql, prisma, sqlalchemy]
---
# Base de Datos

## Modelo de Datos
Relacional (PostgreSQL 16)

## Tablas Principales
- `users`
- `properties`
- `reservations`
- `expenses`

## Relaciones Clave
- User **1:N** Property (`owner_id` FK, RESTRICT ondelete)
- Property **1:N** Reservation (`property_id` FK, RESTRICT ondelete)
- Property **1:N** Expense (`property_id` FK, RESTRICT ondelete)

## Enlaces
- Módulo: [[01-Modulos/Gestion-Core|Gestión Core]]
- Ver Deuda: [[07-Que-Falta|Qué Falta]]
- Volver a [[00-Overview|Overview]]
