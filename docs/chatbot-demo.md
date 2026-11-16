# Guía de Demostración del Chatbot de Dos Capas y Pronóstico Financiero

Esta guía detalla el paso a paso para probar y demostrar el **chatbot financiero de Nomora**, su arquitectura de dos capas (Capa 1 determinística y Capa 2 con Ollama local), el pronóstico estadístico y las recomendaciones basadas en evidencia.

---

## 1. Preparación del Entorno y Datos de Prueba

### 1.1 Iniciar Servidores
- **Backend (FastAPI):**
  ```bash
  cd apps/server
  poetry run uvicorn app.main:app --reload --port 8000
  ```
- **Frontend (Next.js):**
  ```bash
  pnpm --filter web dev
  ```
  La aplicación estará disponible en `http://localhost:3000`.

### 1.2 Sembrar Datos de Prueba (24 Meses de Historial)
Para que el modelo estadístico cuente con datos suficientes ($n \ge 24$ para Holt-Winters y backtest confiable), ejecuta el script de sembrado idempotente:
```bash
cd apps/server
python scripts/seed_demo.py
```
Este script crea o actualiza:
- Usuario de prueba: `demo-analitica@nomora.app` (Tier Pro).
- Propiedad: `Apartamento Vista Mar - Bocagrande` (Cartagena, COP, 2 habitaciones, $380,000 COP/noche).
- 24 meses continuos de reservas reales con estacionalidad turística caribeña (alta en Dic/Ene y Jul/Ago).
- Gastos operativos categorizados (limpiezas por reserva, servicios públicos mensuales, suministros, mantenimientos periódicos e impuestos).

---

## 2. Capa 1: Motor Determinístico ("Cálculo directo")

La Capa 1 es el núcleo del producto. Funciona al 100 % en el backend sin requerir modelos de lenguaje ni Ollama. Todas las respuestas de esta capa llevan la insignia visible **`Cálculo directo`**.

### 2.1 Cómo Interactuar
1. Abre el panel del chatbot desde el botón flotante inferior derecho en cualquier vista de propiedad.
2. Puedes hacer clic en los chips de sugerencias o escribir preguntas en lenguaje natural.

### 2.2 Catálogo de Preguntas y Ejemplos de Prueba

| Categoría | Pregunta sugerida / Texto libre | Qué calcula y qué esperar |
| :--- | :--- | :--- |
| **Resumen** | *"Dame un resumen del mes"* | Ingresos netos, gastos totales, utilidad y porcentaje de ocupación del mes actual. Formato: Resumen + 4 KPI Cards. |
| **Ingresos** | *"¿Cuánto gané este mes?"* | Ingresos brutos, comisiones de plataforma, neto y número de reservas. |
| **Ingresos** | *"¿Cuál es mi utilidad este mes?"* | Margen neto, utilidad en moneda y comparación ingresos vs gastos. |
| **Ingresos** | *"¿Qué plataforma me deja más?"* | Desglose por Airbnb, Booking, Directo y Vrbo con tabla de reservas, bruto y neto. |
| **Ingresos** | *"¿Cuál es mi tarifa promedio por noche?"* | Tarifa media cobrada (ADR) sobre las noches reservadas del mes. |
| **Ingresos** | *"¿Cuáles han sido mis mejores meses?"* | Tabla histórica con el top 5 de meses por ingreso neto. |
| **Gastos** | *"¿En qué estoy gastando más?"* | Total de gastos y tabla detallada por categoría con porcentaje sobre el gasto total. |
| **Ocupación** | *"¿Cuál es mi ocupación este mes?"* | Porcentaje de ocupación sobre el mes (días ocupados vs días disponibles). |
| **Ocupación** | *"¿Qué días tengo libres este mes?"* | Conteo y detalle de días disponibles restantes en el mes. |
| **Reservas** | *"¿Cuáles son mis próximas reservas?"* | Próximas 5 reservas confirmadas a partir de hoy con huésped y fechas. |
| **Reservas** | *"¿Quién llega esta semana?"* | Llegadas agendadas para los próximos 7 días calendario. |
| **Reservas** | *"¿Cuánto dura en promedio una estadía?"* | Duración promedio de estancia (noches por reserva) del mes. |
| **Reservas** | *"¿Cuántas reservas se cancelaron?"* | Conteo de reservas canceladas y tasa de cancelación mensual. |
| **Comparación**| *"¿Cómo voy frente al mes pasado?"* | Variación porcentual y absoluta de ingresos netos, gastos y ocupación frente al mes previo. |
| **Pronóstico** | *"¿Cuánto ganaré el próximo mes?"* | Proyección Holt/Holt-Winters con rango estimado (mínimo - máximo) y nivel de confianza. |
| **Estrategia** | *"Ver recomendaciones"* | Consejos operativos y comerciales basados en evidencia numérica (con chips de evidencia). |
| **Mercado**    | *"¿Cómo está mi precio frente a la competencia?"* | Posición percentil de tarifa frente a competidores directos en la zona. |
| **Estrategia** | *"¿Qué me recomendaste antes?"* | Historial de consejos previos almacenados en Postgres con evolución de métricas (entonces vs ahora). |

---

## 3. Capa 2: Agente IA Local con Ollama ("Agente IA")

La Capa 2 está diseñada para preguntas abiertas, análisis de causa raíz ("¿por qué?"), consejos estratégicos no estructurados y preguntas fuera del catálogo fijo.

### 3.1 Arquitectura y Privacidad
- El backend **NO** llama a ningún modelo LLM en la nube ni localmente (respetando el límite de 512 MB de RAM en Render).
- El backend únicamente empaqueta un `contexto de cifras` precalculadas (ingresos, ocupación, gastos, pronóstico y mercado).
- El **navegador del usuario** realiza la petición directamente a la instancia local de Ollama en `http://localhost:11434`.

### 3.2 Pasos para Activar la Capa 2

1. **Instalar y ejecutar Ollama:**
   Descarga Ollama desde [ollama.com](https://ollama.com) y ejecuta en tu terminal:
   ```bash
   ollama run llama3.2
   ```
   *(También son compatibles `mistral`, `qwen2.5`, `phi3` o `gemma2`).*

2. **Habilitar CORS en Ollama (si es necesario):**
   Para permitir que el navegador se comunique con Ollama desde `localhost:3000`:
   - En Windows: Establecer variable de entorno de sistema `OLLAMA_ORIGINS="*"` y reiniciar Ollama.
   - En macOS / Linux: `OLLAMA_ORIGINS="*" ollama serve`

3. **Configurar desde Nomora:**
   - En el panel del Chatbot, haz clic en el ícono de **Engranaje (Configuración)**.
   - Verifica que la URL apunte a `http://localhost:11434`.
   - Haz clic en **Probar conexión** (debe mostrar un indicador verde con los modelos disponibles).
   - Selecciona `llama3.2` (o el modelo que descargaste).
   - Haz clic en **Guardar**.

### 3.3 Preguntas que Disparan la Capa 2
Escribe preguntas abiertas o que contengan raíces de análisis estratégico:
- *"¿Por qué bajaron mis ingresos en mayo frente a abril?"*
- *"¿Qué estrategia me sugieres para aumentar la ocupación en temporada baja?"*
- *"¿Debería subir el precio de mi apartamento en diciembre?"*
- Preguntas largas de más de 12 palabras.

### 3.4 Resultado Esperado
- El bot responderá con una explicación analítica y accionable basada estrictamente en las cifras del contexto financiero provisto.
- En la esquina superior del mensaje se mostrará la insignia púrpura **`Agente IA`** y el modelo utilizado (ej. `llama3.2:latest`).

---

## 4. Flujo de Degradación Elegante

Si la Capa 2 no está disponible (Ollama apagado, error de conexión o CORS):
1. El chatbot no se bloquea ni muestra errores técnicos (pantallazos rojos ni trazas de red).
2. El sistema degrada automáticamente a **Capa 1**, entregando el resumen financiero determinístico del mes actual.
3. Se muestra una alerta informativa amigable:
   > *"Capa 2 no disponible (Ollama no responde). Mostrando cálculo directo de la Capa 1."*
4. La respuesta incluye la insignia **`Cálculo directo`** para total transparencia.

---

## 5. Reglas de Negocio Verificables en la Demo

1. **Autoridad Única:** Todas las cifras numéricas provienen del motor financiero determinístico (`app/engine/golden_rule.py`). La IA nunca inventa cifras contables.
2. **Aislamiento Multi-inquilino (Regla 2):** Consultar una propiedad inexistente o de otro usuario retorna siempre un código `404 Not Found` (nunca 403).
3. **Rotulación Honesta (Regla 9):**
   - Reglas y cálculos directos: `Cálculo directo`.
   - Suavizado exponencial / Holt: `Pronóstico estadístico` (nunca "IA").
   - Respuestas de Ollama: `Agente IA`.
4. **Sin Caché de Chatbot en Redis (Regla 5):** Las respuestas del chat nunca se almacenan en Redis; Redis se utiliza exclusivamente para lecturas puntuales del snapshot de mercado con fallback seguro a PostgreSQL.
