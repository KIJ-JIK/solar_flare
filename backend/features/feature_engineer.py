import os
import pandas as pd
import numpy as np

def engineer_features():
    print("Engineering solar flare precursor features (Member B)...")
    
    input_path = "data/processed/combined_lightcurve.csv"
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Missing input lightcurve file: {input_path}. Run ingestion first.")
        
    df = pd.read_csv(input_path)
    
    # 1. Hardness Ratio
    # Simple ratio of HEL1OS hard X-ray to SoLEXS soft X-ray
    df['hardness_ratio'] = df['hard_xray_flux'] / (df['soft_xray_flux'] + 1e-12)
    
    # 2. Hard Rate of Rise (HRR)
    # Temporal gradient of hard flux. We calculate it over a rolling 1-minute window (6 samples)
    # and smooth it with a 30-second rolling average.
    cadence_seconds = 10
    samples_1min = 6
    df['hard_rate_of_rise'] = (df['hard_xray_flux'] - df['hard_xray_flux'].shift(samples_1min)) / (samples_1min * cadence_seconds)
    df['hard_rate_of_rise'] = df['hard_rate_of_rise'].fillna(0.0)
    
    # 3. Soft Background Trend
    # Long-term rolling mean of soft X-rays over 1 hour (360 samples)
    df['soft_bg_trend'] = df['soft_xray_flux'].rolling(window=360, min_periods=1).mean()
    
    # 4. Recent Flare Count
    # We estimate active flare periods where background subtracted flux is high
    # First, let's do a simple threshold proxy of "flare state": soft_xray_flux > 5e-6 (C5-class flare baseline)
    is_flare_active = (df['soft_xray_flux'] > 5e-6).astype(int)
    # Count how many times we transitioned into a flare state in the last 6 hours (2160 samples)
    state_transitions = (is_flare_active.diff() == 1).astype(int)
    df['recent_flare_count'] = state_transitions.rolling(window=2160, min_periods=1).sum().fillna(0).astype(int)
    
    # 5. Future Flare Target Labels (label_30min, label_60min, label_120min)
    # Ground-truth: will a major flare (flux >= 1e-5, M-class equivalent) occur in the future window?
    # We define the prediction target: flare onset occurs in the lookahead window [t + 5min, t + T]
    # where T is 30, 60, or 120 minutes.
    
    # Target threshold (M-class flare equivalent: 1e-5 Watts/m2)
    flare_threshold = 1e-5
    future_is_flare = (df['soft_xray_flux'] >= flare_threshold).astype(int)
    
    # Convert minutes to samples
    offset_samples = int(5 * 60 / cadence_seconds) # 5 minutes offset to avoid cheating near onset
    samples_30min = int(30 * 60 / cadence_seconds)
    samples_60min = int(60 * 60 / cadence_seconds)
    samples_120min = int(120 * 60 / cadence_seconds)
    
    # Calculate rolling max looking forward
    # label_T is True if the max flux in the lookahead window exceeds threshold
    df['label_30min'] = future_is_flare.shift(-samples_30min).rolling(window=samples_30min - offset_samples, min_periods=1).max().fillna(0).astype(bool)
    df['label_60min'] = future_is_flare.shift(-samples_60min).rolling(window=samples_60min - offset_samples, min_periods=1).max().fillna(0).astype(bool)
    df['label_120min'] = future_is_flare.shift(-samples_120min).rolling(window=samples_120min - offset_samples, min_periods=1).max().fillna(0).astype(bool)
    
    # Select columns to comply with the contract
    features_df = df[[
        "timestamp", 
        "hard_rate_of_rise", 
        "hardness_ratio", 
        "soft_bg_trend", 
        "recent_flare_count", 
        "label_30min", 
        "label_60min", 
        "label_120min"
    ]]
    
    output_path = "data/processed/features.csv"
    features_df.to_csv(output_path, index=False)
    print(f"Features saved to {output_path}. Total records: {len(features_df)}")

if __name__ == "__main__":
    engineer_features()
