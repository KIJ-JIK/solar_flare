"""
GOES X-ray Solar Flare Detector — Script v0.1
Day 3: Minimal detection script (background subtraction + threshold)
Day 4: Correctly flags known historical flare

Method:
  1. Load GOES XRS-B 1-minute data
  2. Estimate rolling background (median over N-minute window)
  3. Subtract background, apply threshold
  4. Classify flares by NOAA class (A/B/C/M/X) from peak B_FLUX
  5. Output detected events in standard contract format
"""

import numpy as np
import pandas as pd
import json
from datetime import datetime

# ── NOAA GOES XRS Flare Classes (W/m²) ──────────────────────────────────────
FLARE_CLASSES = {
    'X': 1e-4,
    'M': 1e-5,
    'C': 1e-6,
    'B': 1e-7,
    'A': 0,
}

def classify_flare(peak_flux):
    """Return NOAA flare class string, e.g. 'X1.7'."""
    for cls, threshold in FLARE_CLASSES.items():
        if peak_flux >= threshold:
            mult = peak_flux / threshold
            return f"{cls}{mult:.1f}"
    return f"A{peak_flux/1e-8:.1f}"


def load_data(filepath):
    """Load GOES XRS CSV into DataFrame with parsed timestamps."""
    df = pd.read_csv(filepath)
    df['time_tag'] = pd.to_datetime(df['time_tag'])
    df = df.sort_values('time_tag').reset_index(drop=True)
    return df


def estimate_background(b_flux, window_minutes=60):
    """Rolling median background over window_minutes."""
    series = pd.Series(b_flux)
    bg = series.rolling(window=window_minutes, center=True, min_periods=10).quantile(0.10)
    bg = bg.bfill().ffill()
    return bg.values


def detect_flares(df,
                  bg_window=60,
                  threshold_multiplier=5.0,
                  min_duration=3,
                  min_class='B'):
    """
    Detect solar flares via background-subtracted threshold crossing.

    Parameters
    ----------
    df                  : DataFrame with time_tag, B_FLUX columns
    bg_window           : Rolling background window (minutes)
    threshold_multiplier: Signal must exceed background * this factor
    min_duration        : Minimum consecutive minutes above threshold
    min_class           : Minimum NOAA class to report (default B)

    Returns
    -------
    List of dicts in contract format
    """
    b_flux = df['B_FLUX'].values
    background = estimate_background(b_flux, window_minutes=bg_window)
    signal = b_flux - background
    threshold = background * (threshold_multiplier - 1)  # excess above bg

    # Boolean mask: above threshold
    above = signal > threshold

    # Find contiguous runs above threshold
    events = []
    in_flare = False
    start_idx = None

    for i, flag in enumerate(above):
        if flag and not in_flare:
            in_flare = True
            start_idx = i
        elif not flag and in_flare:
            in_flare = False
            end_idx = i - 1
            duration = end_idx - start_idx + 1
            if duration >= min_duration:
                seg = b_flux[start_idx:end_idx + 1]
                peak_idx = start_idx + np.argmax(seg)
                peak_flux = b_flux[peak_idx]
                flare_class = classify_flare(peak_flux)
                # Filter by minimum class
                min_flux = FLARE_CLASSES.get(min_class, 1e-7)
                if peak_flux >= min_flux:
                    events.append({
                        'flare_id': f"SOL{df['time_tag'].iloc[peak_idx].strftime('%Y-%m-%dT%H:%M')}",
                        'start_time': df['time_tag'].iloc[start_idx].isoformat(),
                        'peak_time':  df['time_tag'].iloc[peak_idx].isoformat(),
                        'end_time':   df['time_tag'].iloc[end_idx].isoformat(),
                        'duration_min': int(duration),
                        'peak_b_flux': float(round(peak_flux, 12)),
                        'noaa_class': flare_class,
                        'peak_background': float(round(background[peak_idx], 12)),
                        'snr': float(round(peak_flux / background[peak_idx], 2)),
                    })
    # Handle flare still active at end of file
    if in_flare:
        end_idx = len(b_flux) - 1
        seg = b_flux[start_idx:end_idx + 1]
        peak_idx = start_idx + np.argmax(seg)
        peak_flux = b_flux[peak_idx]
        flare_class = classify_flare(peak_flux)
        if peak_flux >= FLARE_CLASSES.get(min_class, 1e-7):
            events.append({
                'flare_id': f"SOL{df['time_tag'].iloc[peak_idx].strftime('%Y-%m-%dT%H:%M')}",
                'start_time': df['time_tag'].iloc[start_idx].isoformat(),
                'peak_time':  df['time_tag'].iloc[peak_idx].isoformat(),
                'end_time':   df['time_tag'].iloc[end_idx].isoformat(),
                'duration_min': int(end_idx - start_idx + 1),
                'peak_b_flux': float(round(peak_flux, 12)),
                'noaa_class': flare_class,
                'peak_background': float(round(background[peak_idx], 12)),
                'snr': float(round(peak_flux / background[peak_idx], 2)),
            })
    return events, background


if __name__ == '__main__':
    import sys, os

    data_file = sys.argv[1] if len(sys.argv) > 1 else 'raw_sample.csv'
    out_dir = 'outputs'
    os.makedirs(out_dir, exist_ok=True)

    print(f"\n=== GOES XRS Flare Detector v0.1 ===")
    print(f"Input:  {data_file}")

    df = load_data(data_file)
    print(f"Loaded {len(df)} records: {df['time_tag'].iloc[0]} → {df['time_tag'].iloc[-1]}")

    events, background = detect_flares(df)

    print(f"\nDetected {len(events)} flare(s):\n")
    for e in events:
        print(f"  {e['flare_id']}")
        print(f"    Class  : {e['noaa_class']}")
        print(f"    Start  : {e['start_time']}")
        print(f"    Peak   : {e['peak_time']}")
        print(f"    End    : {e['end_time']}")
        print(f"    Dur    : {e['duration_min']} min")
        print(f"    PeakFlux: {e['peak_b_flux']:.3e} W/m²")
        print(f"    SNR    : {e['snr']:.1f}x background")
        print()

    out_json = os.path.join(out_dir, 'detected_flares.json')
    with open(out_json, 'w') as f:
        json.dump({'source': data_file,
                   'generated': datetime.utcnow().isoformat(),
                   'flares': events}, f, indent=2)
    print(f"Results saved to: {out_json}")
