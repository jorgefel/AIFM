---
tags: [deuda-tecnica, tareas, backend]
---
# Qué Falta (Deuda Técnica)

## Funcionalidades Pendientes
- Definición completa del schema relacional en Prisma dentro de `packages/database` (según su README).
- Despliegue y configuración de producción de variables de entorno en Vercel/Render.

## Deuda Técnica
- Las rutas REST carecen de tests automáticos; actualmente `apps/server/tests/` solo cubre las lógicas de modelado de datos y el motor financiero (`test_financial_precision.py` y `test_golden_rule.py`).

## Riesgos
- No determinados explícitamente en el código. El principal riesgo asumido detectado es la falta de testing e2e y de integración en las rutas de la API, lo que puede causar regresiones en endpoints no cubiertos.

## Enlaces
- Relacionado con: [[04-Seguridad|Seguridad (Pruebas pendientes)]]
- Volver a [[00-Overview|Overview]]
