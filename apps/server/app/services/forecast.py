import os
from datetime import date
from typing import List, Tuple
import joblib
import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing

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
    clip_zero: bool = True
) -> Tuple[List[float], List[float], List[float], str]:
    """
    Fits Exponential Smoothing (Holt-Winters / Holt Linear) or moving average
    and returns (predictions, lower_bounds, upper_bounds, model_name).
    """
    n = len(values)
    z_score = 1.28  # ~80% confidence interval

    # shortcut: fallback to weighted average when history is too short for time series regression
    if n < 4:
        mean_val = float(np.mean(values)) if n > 0 else 0.0
        std_val = float(np.std(values)) if n > 1 else (mean_val * 0.25)
        preds = [round(max(0.0 if clip_zero else -999999.0, mean_val), 2)] * steps
        lowers = [round(max(0.0 if clip_zero else -999999.0, mean_val - z_score * std_val), 2)] * steps
        uppers = [round(max(0.0 if clip_zero else -999999.0, mean_val + z_score * std_val), 2)] * steps
        return preds, lowers, uppers, "moving_average"

    series = pd.Series(values, dtype=float)

    # If series is completely flat or zero
    if series.nunique() <= 1:
        val = float(values[-1])
        return [round(val, 2)] * steps, [round(val, 2)] * steps, [round(val, 2)] * steps, "constant_baseline"

    model_used = "holt_linear"
    fitted = None

    if n >= 24:
        try:
            # Full Holt-Winters with additive seasonality (12 months cycle)
            hw = ExponentialSmoothing(
                series,
                trend="add",
                seasonal="add",
                seasonal_periods=12,
                initialization_method="estimated"
            )
            fitted = hw.fit()
            model_used = "holt_winters"
        except Exception:
            fitted = None

    if fitted is None:
        try:
            # Holt's linear trend model
            hl = ExponentialSmoothing(
                series,
                trend="add",
                seasonal=None,
                initialization_method="estimated"
            )
            fitted = hl.fit()
            model_used = "holt_linear"
        except Exception:
            # Simple exponential smoothing fallback
            ses = ExponentialSmoothing(series, trend=None, seasonal=None)
            fitted = ses.fit()
            model_used = "simple_exp_smoothing"

    # Persist model with joblib
    try:
        model_path = os.path.join(MODELS_DIR, f"{property_id}_{metric_name}.joblib")
        joblib.dump(fitted, model_path)
    except Exception:
        pass

    raw_preds = fitted.forecast(steps=steps)
    residuals = getattr(fitted, "resid", pd.Series([0.0]))
    std_resid = float(np.std(residuals)) if len(residuals) > 0 else 0.0

    preds, lowers, uppers = [], [], []
    for step_idx, p in enumerate(raw_preds, start=1):
        # Forecast uncertainty grows with horizon: sqrt(step_idx)
        step_std = std_resid * np.sqrt(step_idx)
        pred_val = float(p)
        low_val = pred_val - z_score * step_std
        up_val = pred_val + z_score * step_std

        if clip_zero:
            pred_val = max(0.0, pred_val)
            low_val = max(0.0, low_val)
            up_val = max(0.0, up_val)

        preds.append(round(pred_val, 2))
        lowers.append(round(low_val, 2))
        uppers.append(round(up_val, 2))

    return preds, lowers, uppers, model_used


def generate_property_forecast(
    property_id: str,
    reservations: list[dict],
    expenses: list[dict],
    steps: int = 3
) -> Tuple[List[MonthForecast], int]:
    """
    Extracts continuous monthly history, trains Holt-Winters models,
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

    if not dates:
        earliest = date(today.year - 1, today.month, 1)
    else:
        earliest = min(dates)

    # Build sequential monthly timeline from earliest to current month
    cur_y, cur_m = earliest.year, earliest.month
    end_y, end_m = today.year, today.month

    gross_history = []
    net_history = []

    while (cur_y < end_y) or (cur_y == end_y and cur_m <= end_m):
        summary = calculate_monthly_summary(reservations, expenses, cur_y, cur_m)
        gross_history.append(float(summary["gross_income"]))
        net_history.append(float(summary["net_profit"]))

        cur_m += 1
        if cur_m > 12:
            cur_m = 1
            cur_y += 1

    historical_count = len(gross_history)

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
        forecasts.append(
            MonthForecast(
                month=f"{fy:04d}-{fm:02d}",
                projected_gross_income=g_preds[idx],
                gross_income_min=g_lowers[idx],
                gross_income_max=g_uppers[idx],
                projected_net_profit=n_preds[idx],
                net_profit_min=n_lowers[idx],
                net_profit_max=n_uppers[idx],
                confidence_level=0.80,
                model_used=f"{g_model}+{n_model}",
                is_forecast=True,
            )
        )

    return forecasts, historical_count
