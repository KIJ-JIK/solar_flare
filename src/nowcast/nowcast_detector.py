import os
import pandas as pd
import numpy as np

def run_nowcast():
    print("Running nowcast flare detection pipeline (Member C)...")
    
    input_path = "data/processed/combined_lightcurve.csv"
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Missing input lightcurve file: {input_path}. Run ingestion first.")
        
    df = pd.read_csv(input_path)
    
    # 1. Background Subtraction
    # We estimate background using a rolling minimum (10 minutes/60 samples)
    # smoothed by a rolling median (2 hours/720 samples)
    win_min = 60
    win_median = 720
    
    soft_bg = df['soft_xray_flux'].rolling(window=win_min, min_periods=1).min()
    soft_bg = soft_bg.rolling(window=win_median, min_periods=1).median()
    df['soft_bg_subtracted'] = np.clip(df['soft_xray_flux'] - soft_bg, 0.0, None)
    
    hard_bg = df['hard_xray_flux'].rolling(window=win_min, min_periods=1).min()
    hard_bg = hard_bg.rolling(window=win_median, min_periods=1).median()
    df['hard_bg_subtracted'] = np.clip(df['hard_xray_flux'] - hard_bg, 0.0, None)
    
    # Save back background-subtracted values to combined_lightcurve.csv (as per Integration Contract)
    df.to_csv(input_path, index=False)
    print(f"Updated {input_path} with background subtracted columns.")
    
    # 2. Flare Detection & Cataloging
    # Trigger threshold: soft_bg_subtracted > 1.5e-6 Watts/m2 (starts detecting C-class flares)
    soft_threshold = 1.5e-6
    hard_threshold = 3e-8
    
    active_trigger = False
    flare_events = []
    current_flare = {}
    
    for idx, row in df.iterrows():
        flux_val = row['soft_bg_subtracted']
        hard_val = row['hard_bg_subtracted']
        time_str = row['timestamp']
        raw_soft = row['soft_xray_flux']
        
        if not active_trigger:
            # Check for flare onset
            if flux_val > soft_threshold:
                active_trigger = True
                current_flare = {
                    "start_time": time_str,
                    "peak_time": time_str,
                    "peak_flux": raw_soft,
                    "end_time": time_str,
                    "hard_triggered": hard_val > hard_threshold
                }
        else:
            # Check for flare decay / termination
            # We trigger termination if soft_bg_subtracted falls below soft_threshold
            # or if it falls below 30% of the peak value attained in this flare
            if flux_val < soft_threshold or flux_val < 0.3 * (current_flare["peak_flux"] - soft_threshold):
                active_trigger = False
                current_flare["end_time"] = time_str
                
                # Classify peak SXR flux into GOES classes
                peak = current_flare["peak_flux"]
                if peak >= 1e-4:
                    flare_class = f"X{peak/1e-4:.1f}"
                elif peak >= 1e-5:
                    flare_class = f"M{peak/1e-5:.1f}"
                elif peak >= 1e-6:
                    flare_class = f"C{peak/1e-6:.1f}"
                elif peak >= 1e-7:
                    flare_class = f"B{peak/1e-7:.1f}"
                else:
                    flare_class = f"A{peak/1e-8:.1f}"
                    
                # Confidence
                confidence = "hard-confirmed" if current_flare["hard_triggered"] else "soft-only"
                
                flare_events.append({
                    "start_time": current_flare["start_time"],
                    "peak_time": current_flare["peak_time"],
                    "end_time": current_flare["end_time"],
                    "flare_class": flare_class,
                    "confidence": confidence
                })
            else:
                # Update peak and check hard X-ray activity
                if raw_soft > current_flare["peak_flux"]:
                    current_flare["peak_flux"] = raw_soft
                    current_flare["peak_time"] = time_str
                if hard_val > hard_threshold:
                    current_flare["hard_triggered"] = True
                    
    # Create catalogue DataFrame
    catalogue_df = pd.DataFrame(flare_events)
    if catalogue_df.empty:
        catalogue_df = pd.DataFrame(columns=["start_time", "peak_time", "end_time", "flare_class", "confidence"])
        
    os.makedirs("outputs/catalogue", exist_ok=True)
    output_path = "outputs/catalogue/master_catalogue.csv"
    catalogue_df.to_csv(output_path, index=False)
    print(f"Master catalogue saved to {output_path}. Flares detected: {len(catalogue_df)}")

if __name__ == "__main__":
    run_nowcast()
