import math
import os
from datetime import date
from typing import List, Tuple, Optional, Any, Union

from app.engine.golden_rule import calculate_monthly_summary
from app.schemas.forecast import MonthForecast

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def _next_months(start_date: date, count: int) -> List[Tuple[int, int]]:
    """Generates the next `count` (year, month) pairs starting from the month after start_date."""
    y, m = start_date.year, start_date.month
    months = []
    for _ in range(count):
        m += 1
        if m > 12:
            m = 1
            y += 1
        months.append((y, m))
    return months


def _fit_and_forecast(
    values: List[float],
    steps: int,
    property_id: str,
    metric_name: str,
    clip_zero: bool = True,
) -> Tuple[List[float], List[float], List[float], str]:
    """Fits Exponential Smoothing (Holt-Winters / Holt Linear) or moving average in pure Python.

    Memory-efficient: avoids loading heavy statistical libraries (statsmodels/scipy/pandas)
    to keep RAM usage well under Render's 512MB limit.
    """
    n = len(values)
    z_score = 1.28  # ~80% confidence interval

    # 1. Fallback to moving average when history is too short for time series regression
    if n < 4:
        mean_val = float(sum(values) / n) if n > 0 else 0.0
        variance = sum((x - mean_val) ** 2 for x in values) / max(1, n)
        std_val = math.sqrt(variance) if n > 1 else (mean_val * 0.25)
        preds = [round(max(0.0 if clip_zero else -999999.0, mean_val), 2)] * steps
        lowers = [round(max(0.0 if clip_zero else -999999.0, mean_val - z_score * std_val), 2)] * steps
        uppers = [round(max(0.0 if clip_zero else -999999.0, mean_val + z_score * std_val), 2)] * steps
        return preds, lowers, uppers, "moving_average"

    # 2. Constant series
    if len(set(values)) <= 1:
        val = float(values[-1])
        return [round(val, 2)] * steps, [round(val, 2)] * steps, [round(val, 2)] * steps, "moving_average"

    # 3. Holt-Winters with additive seasonality (if at least 2 full years of data)
    if n >= 24:
        m = 12
        alpha = 0.2
        beta = 0.1
        gamma = 0.3

        level = sum(values[:m]) / m
        trend = (sum(values[m : 2 * m]) - sum(values[:m])) / (m * m)
        seasonals = [values[i] - level for i in range(m)]
        fitted = []

        for t in range(m, n):
            y = values[t]
            s_idx = t % m
            last_level = level
            last_trend = trend
            level = alpha * (y - seasonals[s_idx]) + (1 - alpha) * (last_level + last_trend)
            trend = beta * (level - last_level) + (1 - beta) * last_trend
            seasonals[s_idx] = gamma * (y - last_level - last_trend) + (1 - gamma) * seasonals[s_idx]
            fitted.append(last_level + last_trend + seasonals[s_idx])

        residuals = [y - f for y, f in zip(values[m:], fitted)]
        std_resid = math.sqrt(sum(r ** 2 for r in residuals) / max(1, len(residuals))) if residuals else 0.0

        preds, lowers, uppers = [], [], []
        for h in range(1, steps + 1):
            s_idx = (n + h - 1) % m
            pred_val = level + h * trend + seasonals[s_idx]
            step_std = std_resid * math.sqrt(h)
            low_val = pred_val - z_score * step_std
            up_val = pred_val + z_score * step_std

            if clip_zero:
                pred_val = max(0.0, pred_val)
                low_val = max(0.0, low_val)
                up_val = max(0.0, up_val)

            preds.append(round(pred_val, 2))
            lowers.append(round(low_val, 2))
            uppers.append(round(up_val, 2))

        return preds, lowers, uppers, "holt_winters"

    # 4. Holt Linear trend model (for n between 4 and 23 months)
    alpha = 0.3
    beta = 0.1
    level = values[0]
    trend = values[1] - values[0]
    fitted = [level]

    for y in values[1:]:
        last_level = level
        level = alpha * y + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        fitted.append(last_level + trend)

    residuals = [y - f for y, f in zip(values, fitted)]
    std_resid = math.sqrt(sum(r ** 2 for r in residuals) / max(1, len(residuals)))

    preds, lowers, uppers = [], [], []
    for h in range(1, steps + 1):
        pred_val = level + h * trend
        step_std = std_resid * math.sqrt(h)
        low_val = pred_val - z_score * step_std
        up_val = pred_val + z_score * step_std

        if clip_zero:
            pred_val = max(0.0, pred_val)
            low_val = max(0.0, low_val)
            up_val = max(0.0, up_val)

        preds.append(round(pred_val, 2))
        lowers.append(round(low_val, 2))
        uppers.append(round(up_val, 2))

    return preds, lowers, uppers, "holt"


def compute_backtest_mape(values: List[float]) -> Optional[float]:
    """Calcula el Error Porcentual Absoluto Medio (MAPE) mediante backtest

    unipaso rodante sobre los últimos K meses históricos conocidos.
    Requiere al menos 4 meses de historial.
    """
    n = len(values)
    if n < 4:
        return None

    k = min(6, n - 2)
    apes = []
    for t in range(n - k, n):
        train = values[:t]
        actual = values[t]
        if actual <= 0:
            continue
        preds, _, _, _ = _fit_and_forecast(train, steps=1, property_id="backtest", metric_name="backtest")
        pred = preds[0]
        ape = abs(actual - pred) / actual
        apes.append(ape)

    if not apes:
        return None

    return round(float(sum(apes) / len(apes) * 100.0), 1)


def generate_property_forecast(
    property_id: str,
    reservations: list[dict],
    expenses: list[dict],
    steps: int = 3,
    return_metadata: bool = False,
) -> Union[Tuple[List[MonthForecast], int], Tuple[List[MonthForecast], int, dict]]:
    """Extracts continuous monthly history, runs Holt-Winters / Holt Linear models,

    and returns forecast estimates for next `steps` months.
    """
    steps = min(max(1, steps), 12)
    today = date.today()

    # Find earliest date in records
    dates = []
    for r in reservations:
        if r.get("status") != "cancelled" and r.get("check_in"):
            d = r["check_in"] if isinstance(r["check_in"], date) else date.fromisoformat(str(r["check_in"]))
            dates.append(d)
    for e in expenses:
        if not e.get("is_deleted", False) and e.get("date"):
            d = e["date"] if isinstance(e["date"], date) else date.fromisoformat(str(e["date"]))
            dates.append(d)

    gross_history = []
    net_history = []

    if dates:
        earliest = min(dates)
        cur_y, cur_m = earliest.year, earliest.month
        end_y, end_m = today.year, today.month

        while (cur_y < end_y) or (cur_y == end_y and cur_m <= end_m):
            summary = calculate_monthly_summary(reservations, expenses, cur_y, cur_m)
            gross_history.append(float(summary["gross_income"]))
            net_history.append(float(summary["net_profit"]))

            cur_m += 1
            if cur_m > 12:
                cur_m = 1
                cur_y += 1

    historical_count = len(gross_history)

    # Determinación de modelo y nivel de confianza según meses de historia
    if historical_count < 4:
        global_model = "moving_average"
        global_confidence = "limited"
    elif historical_count < 24:
        global_model = "holt"
        global_confidence = "medium" if historical_count < 12 else "high"
    else:
        global_model = "holt_winters"
        global_confidence = "high"

    backtest_mape = compute_backtest_mape(gross_history)

    # Train and forecast
    g_preds, g_lowers, g_uppers, g_model = _fit_and_forecast(
        gross_history, steps, property_id, "gross_income", clip_zero=True
    )
    n_preds, n_lowers, n_uppers, n_model = _fit_and_forecast(
        net_history, steps, property_id, "net_profit", clip_zero=False
    )

    future_months = _next_months(today, steps)
    forecasts = []

    for idx, (fy, fm) in enumerate(future_months):
        booked = calculate_monthly_summary(reservations, expenses, fy, fm)
        booked_gross = float(booked["gross_income"])
        booked_net = float(booked["net_profit"])
        proj_gross = max(g_preds[idx], booked_gross)
        proj_net = max(n_preds[idx], booked_net) if n_preds[idx] >= 0 else booked_net
        low_gross = max(g_lowers[idx], booked_gross)
        up_gross = max(g_uppers[idx], booked_gross)

        # Regresión corregida: net_profit_max usa el límite superior del beneficio neto (n_uppers), NO del ingreso bruto
        low_net = n_lowers[idx]
        up_net = max(n_uppers[idx], booked_net)
        if low_net > up_net:
            low_net = up_net

        forecasts.append(
            MonthForecast(
                month=f"{fy:04d}-{fm:02d}",
                projected_gross_income=round(proj_gross, 2),
                gross_income_min=round(low_gross, 2),
                gross_income_max=round(up_gross, 2),
                projected_net_profit=round(proj_net, 2),
                net_profit_min=round(low_net, 2),
                net_profit_max=round(up_net, 2),
                confidence_level=global_confidence,
                confidence_score=0.80,
                model_used=global_model,
                is_forecast=True,
            )
        )

    metadata = {
        "confidence_level": global_confidence,
        "model": global_model,
        "months_of_history": historical_count,
        "backtest_mape": backtest_mape,
        "central": forecasts[0].projected_gross_income if forecasts else None,
        "min": forecasts[0].gross_income_min if forecasts else None,
        "max": forecasts[0].gross_income_max if forecasts else None,
    }

    if return_metadata:
        return forecasts, historical_count, metadata
    return forecasts, historical_count
