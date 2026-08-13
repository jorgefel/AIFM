---
tags: [backend, ia, llm, langgraph]
---
# Agentes IA

## Descripción
Asesor financiero (`financial_advisor.py`) basado en IA que provee inteligencia y estrategias sobre los datos duros determinísticos provistos por el [[02-Motor-Financiero|Motor Financiero]].

## Framework
LangChain con ChatOpenAI

## Flujo de Decisión
1. Recibe el resumen mensual calculado (netos, bruto, gastos, ocupación) + discrepancias.
2. Se instruye mediante un `SYSTEM_PROMPT` para ser únicamente asesor.
3. Evalúa tendencias, anomalías, oportunidades de optimización y tarifas.
4. Devuelve un resumen textual accionable.

## Límites y Controles de Costo
- **Solo Lectura**: El Agente es 100% de Solo Lectura (no muta BD).
- **Parámetros Restringidos**: `temperature=0.3`, `max_tokens=1500`.
- **Fallback 'Mock AI Analysis'**: Si no hay `OPENAI_API_KEY` en las variables de entorno, el sistema devuelve un análisis simulado por defecto evitando crashear y ahorrando llamadas de API.

## Enlaces
- Módulo: [[01-Modulos/Motor-Engine-IA-Agents|Motor Engine & IA Agents]]
- Volver a [[00-Overview|Overview]]
