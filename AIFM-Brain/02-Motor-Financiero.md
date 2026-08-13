---
tags: [backend, motor-financiero, core]
---
# Motor Financiero Determinista

## Descripción
Motor determinístico (`golden_rule.py`) que funge como la única fuente de verdad para los cálculos, garantizando precisión absoluta sobre cualquier IA. Es ejecutado 100% server-side utilizando tipos `Decimal`.

## Reglas Determinísticas
- **[[10-Glosario#Regla de Oro|Regla de Oro]]**: `net_amount = total_amount - platform_fee`. Ignora cualquier entrada calculada por el cliente.
- **Tasa de ocupación**: Calcula días únicos ocupados (check_in <= día < check_out) con estado confirmed o completed, limitados al mes actual.
- **Beneficio Neto (net_profit)**: `gross_income - platform_fees - total_expenses_amount` del mes.
- **[[10-Glosario#Health Score|Health Score]]**: Calcula 0-100 puntos basado en Ocupación (hasta 40 pts, ideal >70%), Margen Neto (hasta 40 pts, ideal >40%) y Ratio de Gastos (hasta 20 pts, ideal <30%).
- **Generación de alertas**: Discrepancias de montos y rentabilidad negativa son alertas de severidad 'high'.

## Fórmulas
1. `net_amount = total_amount - platform_fee`
2. `occupancy_rate = len(occupied_days) / days_in_month`
3. `net_profit = net_income - total_expenses`

## ¿Por qué es la fuente de verdad?
Porque las IAs (LLMs) son propensas a errores matemáticos (alucinaciones numéricas). El uso de `Decimal` en Python en operaciones deterministas asegura que no haya errores de coma flotante, previniendo discrepancias monetarias.

## Enlaces
- Relacionado con: [[01-Modulos/Motor-Engine-IA-Agents|Motor Engine & IA Agents]]
- Volver a [[00-Overview|Overview]]
