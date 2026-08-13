---
tags: [glosario, diccionario]
---
# Glosario

A continuación, los términos clave del proyecto AIFM.

### Regla de Oro
`net_amount = total_amount - platform_fee`
Es el cálculo sagrado e inmutable del sistema financiero en backend. Se realiza sin IA para asegurar precisión absoluta. (Ver [[02-Motor-Financiero|Motor Financiero]]).

### Health Score
Puntuación heurística de salud de una propiedad de `0` a `100` basada en:
- Margen neto
- Gastos operativos
- Ocupación
(Ver [[02-Motor-Financiero|Motor Financiero]]).

### Soft Delete
Marcado lógico de inactividad (`is_active=False`, `is_deleted=True`) para entidades de negocio en lugar de borrar la fila físicamente, asegurando que el historial financiero no se altere.

## Enlaces
- Volver a [[00-Overview|Overview]]
