# @aifm/database

Paquete compartido de acceso a datos para el monorepo AIFM.

## Herramientas

- **Prisma** (TypeScript / Next.js): ORM para Next.js
- **SQLAlchemy + Alembic** (Python / FastAPI): en `apps/server`

## Próximo paso

El experto en Backend del equipo definirá el schema relacional completo.
Ejecutar una vez que el schema esté listo:

```bash
# Desde packages/database
pnpm db:push        # sincronizar schema con la DB (desarrollo)
pnpm db:migrate     # crear migración formal
pnpm db:generate    # regenerar Prisma Client
pnpm db:studio      # abrir UI de Prisma Studio
```

## Conexión

Asegúrate de que Docker esté corriendo (`pnpm db:up` desde la raíz) antes de ejecutar cualquier comando de Prisma.
