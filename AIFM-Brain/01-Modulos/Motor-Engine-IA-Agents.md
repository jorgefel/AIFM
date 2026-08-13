---
tags: [backend, modulo, ia, motor-financiero]
---
# Motor Engine & IA Agents

**Qué hace:** 
Genera análisis financieros determinísticos y asesoramiento heurístico y de LLMs.

**Cómo lo hace:** 
Combina `golden_rule.py` y `deterministic_analyzer.py` para cálculos matemáticos. `financial_advisor.py` utiliza ChatOpenAI para generar lenguaje natural.

**Estado:** 
En progreso

## Detalles Técnicos
- **Archivos Clave:** 
  - `apps/server/app/engine/golden_rule.py`
  - `apps/server/app/engine/deterministic_analyzer.py`
  - `apps/server/app/agents/financial_advisor.py`
- **Dependencias Principales:** langchain_openai, langchain_core
- **Endpoints / Funciones:** 
  - /analysis endpoints
  - `calculate_monthly_summary`
  - `run_financial_analysis`

## Enlaces
- Profundiza en el motor matemático: [[02-Motor-Financiero|Motor Financiero]]
- Profundiza en los modelos de IA: [[03-Agentes-IA|Agentes IA]]
- Volver a [[00-Overview|Overview]]
