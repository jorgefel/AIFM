# Contrato y Arquitectura del Modelo Predictivo Financiero

## 1. Alcance y Naturaleza del Modelo

> **IMPORTANTE:** El pronóstico actual de Nomora es un **pronóstico estrictamente financiero** (ingresos brutos y beneficio neto mensual proyectado). **NO es un modelo de demanda ni de ocupación.** 
> En ninguna parte del sistema se etiqueta este componente como "IA"; se presenta y documenta de forma transparente como **"Pronóstico estadístico"**.

---

## 2. Fuentes de Datos Actuales

El motor estadístico procesa exclusivamente los registros financieros de la propiedad autenticada:

| Fuente | Entidad / Modelo | Campos Utilizados |
| :--- | :--- | :--- |
| **Reservas** | `Reservation` | `check_in`, `check_out`, `total_amount`, `platform_fee`, `net_amount`, `status` (`confirmed`, `completed`), `platform`. |
| **Gastos** | `Expense` | `amount`, `category`, `date`, `is_deleted`. |
| **Metadatos de Propiedad** | `Property` | `nightly_rate`, `bedrooms`, `bathrooms`, `max_guests`, `currency`. |
| **Mercado** | Caché / Snapshot | Snapshots en PostgreSQL y claves temporales en Redis (solo lectura). |

### Convenciones contables y temporales:
- Atribución de ingresos: mes de la fecha de `check_in`.
- Días ocupados: intervalo semiabierto `[check_in, check_out)`.
- Solo se consideran reservas en estado confirmado o completado.
- Los gastos se atribuyen al mes de su fecha contable y se filtran los eliminados (`is_deleted == False`).

---

## 3. Requerimientos Faltantes para Modelar Demanda u Ocupación

Para predecir demanda y ocupación con rigor estadístico y de aprendizaje automático, el sistema requeriría instrumentar:

1. **Calendario de disponibilidad diaria:** registro día a día de qué fechas están abiertas para alquiler vs ocupadas.
2. **Noches bloqueadas por el anfitrión:** distinción explícita entre una noche vacía por falta de reservas y una bloqueada manualmente por remodelación, mantenimiento o estadía personal.
3. **Historial de cambios de tarifa (Pricing dinámico):** registro temporal de las modificaciones de precios por temporada, día de la semana o eventos locales, superando la tarifa estática `nightly_rate`.
4. **Fecha y anticipación de creación (`Lead Time`):** diferencia temporal entre el momento en que el huésped reserva y la fecha de `check_in`.
5. **Comportamiento de cancelación por canal:** curva de probabilidad de cancelación anticipada por plataforma (Airbnb, Booking, Beds24, directa).

---

## 4. Contrato de la API de Pronóstico

La respuesta del endpoint `/api/v1/predictions/forecast` y del esquema estructurado `PropertyForecastResponse` implementa el siguiente contrato:

```json
{
  "kind": "financial_forecast",
  "property_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "property_name": "Apartamento El Poblado",
  "currency": "COP",
  "period": "month",
  "historical_months_count": 8,
  "confidence_level": "medium",
  "model": "holt",
  "backtest_mape": 9.4,
  "as_of": "2026-11-16",
  "forecasts": [
    {
      "month": "2026-12",
      "projected_gross_income": 4500000.0,
      "gross_income_min": 3800000.0,
      "gross_income_max": 5200000.0,
      "projected_net_profit": 3600000.0,
      "net_profit_min": 2900000.0,
      "net_profit_max": 4300000.0,
      "confidence_level": "medium",
      "confidence_score": 0.80,
      "model_used": "holt",
      "is_forecast": true
    }
  ],
  "disclaimer": "Pronóstico estadístico preventivo basado en series temporales históricas. No modifica registros contables reales."
}
```

---

## 5. Modelos Estadísticos y Umbrales de Confianza

Los modelos están implementados en Python puro sin dependencias pesadas (pandas, scipy, statsmodels) para operar con bajo consumo de memoria (<512 MB de RAM en Render):

| Meses de Historia ($n$) | Modelo Aplicado (`model`) | Nivel de Confianza (`confidence_level`) | Descripción Técnica |
| :---: | :---: | :---: | :--- |
| **$n < 4$** | `moving_average` | `limited` | Promedio móvil y dispersión muestral. Historial insuficiente para inferir pendiente o estacionalidad. |
| **$4 \le n < 24$** | `holt` | `medium` ($4 \le n < 12$)<br>`high` ($n \ge 12$) | Suavizado exponencial lineal con nivel ($\alpha=0.3$) y tendencia ($\beta=0.1$). Detecta aceleración o desaceleración. |
| **$n \ge 24$** | `holt_winters` | `high` | Suavizado exponencial triple con estacionalidad aditiva de ciclo anual ($m=12$, $\alpha=0.2$, $\beta=0.1$, $\gamma=0.3$). Requiere al menos dos ciclos completos. |

### Intervalos de Confianza y Regla de Negocio
- Los intervalos se estiman mediante la desviación estándar de los residuales ajustados escalados por $\sqrt{h}$ para un horizonte $h$, con $z = 1.28$ (~80% de probabilidad en distribución normal de errores).
- **Límite superior del beneficio neto (`net_profit_max`):** Se calcula estrictamente a partir de la cota superior del beneficio neto modelado (`n_uppers[idx]`), nunca a partir del ingreso bruto.
- **Piso de ingresos contratados:** Si ya existen reservas confirmadas para meses futuros (`booked_gross` o `booked_net`), el pronóstico toma `max(prediccion, contratado)`.

### Métrica de Backtest (MAPE)
Para $n \ge 4$, se realiza un backtest retrospectivo rodante de un paso hacia adelante sobre los meses históricos conocidos:
$$\text{MAPE} = \frac{1}{K} \sum_{t=n-K}^{n-1} \frac{|y_t - \hat{y}_t|}{y_t} \times 100$$
Donde $K = \min(6, n - 2)$ meses de prueba.

---

## 6. Backlog: Puerta de Datos para CatBoost (Decisión D4)

CatBoost queda diferido para cuando la base de datos recopile la telemetría diaria de disponibilidad y anticipación de reserva. Su interfaz de entrada esperará:
- Matriz de características por propiedad: capacidad, ratio de precio respecto a la mediana de mercado, días de anticipación promedio, tasa de cancelación histórica, estacionalidad del mes y tendencia del último trimestre.
- Salida cuantílica (p10, p50, p90) para modelar incertidumbre asimétrica en arriendos turísticos.
