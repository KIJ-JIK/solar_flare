"""
build_features.py — Member B's feature engineering pipeline (v1)
Reads data/processed/combined_lightcurve.csv → produces data/processed/features.csv
Spec reference: docs/architecture/feature_spec_v1.md
Contract reference: README.md "B delivers" table
"""
import os, sys, warnings
import numpy as np
import pandas as pd
from pathlib import Path

# ── Tunable constants (all at top for easy Day-5 tuning) ──────────────
RATE_WINDOW       = 5       # N samples for hard_rate_of_rise finite difference
TREND_WINDOW      = 30      # M samples for soft_bg_trend rolling OLS slope
EPSILON           = 1e-9    # denominator floor for hardness_ratio
FLARE_PERCENTILE  = 95      # placeholder flare threshold (percentile of soft_xray_flux)
RECENT_FLARE_HRS  = 24      # trailing window for recent_flare_count
LABEL_HORIZONS    = [30, 60, 120]  # forecast horizons in minutes
CADENCE_MINUTES   = 1       # assumed cadence (1 row = 1 minute)

# ── Paths (relative to repo root) ────────────────────────────────────
REPO_ROOT    = Path(__file__).resolve().parents[2]
LC_PATH      = REPO_ROOT / "data" / "processed" / "combined_lightcurve.csv"
FEAT_PATH    = REPO_ROOT / "data" / "processed" / "features.csv"
CATALOGUE    = REPO_ROOT / "outputs" / "catalogue" / "detected_flares.json"


# ── Synthetic data generator (used ONLY when A's file is missing) ────
def _generate_synthetic(path: Path, hours: int = 48, cadence_min: int = 1) -> pd.DataFrame:
    """Create ~48h of 1-min-cadence data with 3 injected Neupert-style flares."""
    n = hours * 60 // cadence_min
    ts = pd.date_range("2025-01-01", periods=n, freq=f"{cadence_min}min", tz="UTC")
    t = np.arange(n, dtype=float)

    # quiet-sun background
    soft = 1e-6 * (1 + 0.05 * np.sin(2 * np.pi * t / 1440))  # slow diurnal wobble
    hard = 5e-7 * (1 + 0.03 * np.sin(2 * np.pi * t / 1440))

    # inject 3 flares at different times & magnitudes
    flare_params = [
        (400,  3e-5, 2e-5, 15, 25),   # (center_min, soft_amp, hard_amp, hard_sigma, soft_sigma)
        (1200, 8e-5, 5e-5, 12, 20),
        (2200, 1e-4, 7e-5, 10, 18),
    ]
    for ctr, s_amp, h_amp, h_sig, s_sig in flare_params:
        # Hard peaks slightly BEFORE soft (Neupert effect)
        hard += h_amp * np.exp(-0.5 * ((t - (ctr - 3)) / h_sig) ** 2)
        soft += s_amp * np.exp(-0.5 * ((t - ctr) / s_sig) ** 2)

    # crude background: rolling median over 2-hour window
    bg_win = 120 // cadence_min
    soft_bg = pd.Series(soft).rolling(bg_win, center=True, min_periods=1).median().values
    hard_bg = pd.Series(hard).rolling(bg_win, center=True, min_periods=1).median().values

    df = pd.DataFrame({
        "timestamp":          ts,
        "soft_xray_flux":     soft,
        "hard_xray_flux":     hard,
        "soft_bg_subtracted": soft - soft_bg,
        "hard_bg_subtracted": hard - hard_bg,
        "source":             "goes",   # synthetic placeholder
    })
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    return df


# ── Rolling OLS slope (vectorised, no statsmodels dependency) ────────
def _rolling_slope(series: pd.Series, window: int) -> pd.Series:
    """Slope of OLS fit y = a*x + b over trailing `window` samples."""
    x = np.arange(window, dtype=float)
    x_mean = x.mean()
    denom = ((x - x_mean) ** 2).sum()
    def _slope(arr):
        if len(arr) < window:
            return np.nan
        y = arr - arr.mean()
        return np.dot(x - x_mean, y) / denom
    return series.rolling(window, min_periods=window).apply(_slope, raw=True)


# ── Main pipeline ────────────────────────────────────────────────────
def main():
    # 1. Load or generate lightcurve
    if LC_PATH.exists() and LC_PATH.stat().st_size > 100:
        print(f"[INFO] Loading REAL lightcurve from {LC_PATH}")
        lc = pd.read_csv(LC_PATH, parse_dates=["timestamp"])
    else:
        print("=" * 65)
        print("[WARNING] Real combined_lightcurve.csv NOT FOUND.")
        print("  -> Generating SYNTHETIC 48-hour dataset as placeholder.")
        print("  -> Chase Member A today — real data has not been delivered.")
        print("=" * 65)
        lc = _generate_synthetic(LC_PATH)

    lc = lc.sort_values("timestamp").reset_index(drop=True)

    # 2. Compute features
    feat = pd.DataFrame({"timestamp": lc["timestamp"]})

    # hard_rate_of_rise: finite difference over trailing N samples
    feat["hard_rate_of_rise"] = lc["hard_xray_flux"].diff(RATE_WINDOW) / RATE_WINDOW

    # hardness_ratio: hard/soft with epsilon floor
    feat["hardness_ratio"] = (
        lc["hard_bg_subtracted"] / (lc["soft_bg_subtracted"].abs() + EPSILON)
    )

    # soft_bg_trend: rolling OLS slope over trailing M samples
    feat["soft_bg_trend"] = _rolling_slope(lc["soft_bg_subtracted"], TREND_WINDOW)

    # Load real catalogue flares if they exist
    real_flare_starts = []
    if CATALOGUE.exists():
        import json
        try:
            with open(CATALOGUE, "r") as f:
                cat_data = json.load(f)
            for flare in cat_data.get("flares", []):
                if "start_time" in flare:
                    real_flare_starts.append(pd.to_datetime(flare["start_time"], utc=True))
        except Exception as e:
            print(f"[WARNING] Could not parse {CATALOGUE}: {e}")

    # recent_flare_count: trailing 24h count of flare events
    flare_window_rows = int(RECENT_FLARE_HRS * 60 / CADENCE_MINUTES)
    threshold = np.nanpercentile(lc["soft_xray_flux"], FLARE_PERCENTILE)
    flare_flag = (lc["soft_xray_flux"] > threshold).astype(int)

    if real_flare_starts:
        def count_flares_in_lookback(t):
            start_t = t - pd.Timedelta(hours=RECENT_FLARE_HRS)
            count = 0
            for ft in real_flare_starts:
                if start_t <= ft <= t:
                    count += 1
            return count
        feat["recent_flare_count"] = lc["timestamp"].apply(count_flares_in_lookback)
    else:
        feat["recent_flare_count"] = (
            flare_flag.rolling(flare_window_rows, min_periods=1).sum().astype(int)
        )

    # label columns: True if a flare onset in next N minutes
    for horizon in LABEL_HORIZONS:
        rows_ahead = int(horizon / CADENCE_MINUTES)
        
        if real_flare_starts:
            def check_flare_in_window(t):
                end_t = t + pd.Timedelta(minutes=horizon)
                for start_t in real_flare_starts:
                    if t < start_t <= end_t:
                        return True
                return False
            feat[f"label_{horizon}min"] = lc["timestamp"].apply(check_flare_in_window)
        else:
            # fallback to threshold logic
            fwd = flare_flag[::-1].rolling(rows_ahead, min_periods=1).max()[::-1]
            feat[f"label_{horizon}min"] = fwd.shift(-1).fillna(0).astype(bool)

    # 3. Data-quality log
    print(f"\n[QA] Row count:   {len(feat)}")
    print(f"[QA] Date range:  {feat['timestamp'].min()} -> {feat['timestamp'].max()}")
    print(f"[QA] NaNs per column:")
    for col in feat.columns:
        n_na = feat[col].isna().sum()
        print(f"       {col}: {n_na}")
    print(f"[QA] Flare threshold (p{FLARE_PERCENTILE}): {threshold:.3e}")
    pos = {h: feat[f"label_{h}min"].sum() for h in LABEL_HORIZONS}
    print(f"[QA] Positive labels -- 30m: {pos[30]}, 60m: {pos[60]}, 120m: {pos[120]}")

    # 4. Write features.csv
    FEAT_PATH.parent.mkdir(parents=True, exist_ok=True)
    feat.to_csv(FEAT_PATH, index=False)
    print(f"\n[OK] features.csv written to {FEAT_PATH}  ({len(feat)} rows)")

    # 5. Preview
    print("\n-- First 10 rows --")
    with pd.option_context("display.max_columns", 12, "display.width", 140):
        print(feat.head(10).to_string(index=False))


if __name__ == "__main__":
    main()
