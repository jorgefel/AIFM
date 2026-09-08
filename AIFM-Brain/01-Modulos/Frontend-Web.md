---
tags: [frontend, modulo]
---
# Frontend Web (@aifm/web)

**Qué hace:** 
Interfaz de usuario para visualizar dashboards interactivos, registrar propiedades y ver análisis.

**Cómo lo hace:** 
App Router de Next.js, utilizando Tailwind CSS 4 para el diseño de UI y librerías como framer-motion y recharts para animaciones y gráficos.

**Estado:** 
En progreso

## Detalles Técnicos
- **Archivos Clave:** 
  - `apps/web/package.json`
  - `apps/web/src/`
  - `apps/web/src/contexts/QueryProvider.tsx` (Proveedor global de React Query)
  - Metadatos SEO: `metadata.ts`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`
- **Dependencias Principales:** next, react, tailwindcss, framer-motion, recharts, @tanstack/react-query
- **Endpoints / Funciones:** Renderizado de UI y dashboards (configuración de layouts con react-grid-layout). Gestión de estado remoto y caché mediante React Query. Mejoras recientes en SEO y metadatos dinámicos.

## Enlaces
- Volver a [[00-Overview|Overview]]
