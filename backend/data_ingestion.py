import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_data():
    print("Generating synthetic Aditya-L1 SoLEXS + HEL1OS data...")
    
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Time parameters: 5 days, 10-second cadence
    start_time = datetime(2026, 6, 1, 0, 0, 0)
    duration_days = 5
    cadence_seconds = 10
    total_samples = int(duration_days * 24 * 3600 / cadence_seconds)
    
    timestamps = [start_time + timedelta(seconds=i*cadence_seconds) for i in range(total_samples)]
    
    # Base background (slow active region modulation)
    time_index = np.arange(total_samples)
    soft_base = 1e-6 + 0.3e-6 * np.sin(2 * np.pi * time_index / (total_samples / 3))  # 3 cycles in 5 days
    hard_base = 2e-7 + 0.5e-7 * np.sin(2 * np.pi * time_index / (total_samples / 3))
    
    # Generate high-frequency noise
    soft_noise = np.random.normal(0, 0.02e-6, total_samples)
    hard_noise = np.random.normal(0, 0.005e-7, total_samples)
    
    soft_flux = soft_base + soft_noise
    hard_flux = hard_base + hard_noise
    
    # Define flare events to inject
    # (relative index in time, duration in samples, peak intensity multiplier, flare_class)
    flares = [
        {"start_pct": 0.12, "duration_min": 45, "intensity": 3e-5, "class": "M3.0"},  # M-class
        {"start_pct": 0.28, "duration_min": 30, "intensity": 8e-6, "class": "C8.0"},  # C-class
        {"start_pct": 0.45, "duration_min": 90, "intensity": 1.2e-4, "class": "X1.2"}, # X-class
        {"start_pct": 0.62, "duration_min": 40, "intensity": 2e-5, "class": "M2.0"},  # M-class
        {"start_pct": 0.78, "duration_min": 25, "intensity": 5e-6, "class": "C5.0"},  # C-class
        {"start_pct": 0.90, "duration_min": 60, "intensity": 4.5e-5, "class": "M4.5"}, # M-class
    ]
    
    for flare in flares:
        start_idx = int(flare["start_pct"] * total_samples)
        duration_samples = int(flare["duration_min"] * 60 / cadence_seconds)
        
        # Flare profile: Impulsive rise in Hard X-rays, integral/slower thermal rise in Soft X-rays
        # HXR profile: fast rise, fast decay
        # SXR profile: Neupert effect (integral of HXR) + slow decay
        
        hxr_peak_idx = int(0.2 * duration_samples) # peak occurs early
        
        # Hard X-ray flare profile (lognormal-like or asymmetric double exponential)
        hxr_profile = np.zeros(duration_samples)
        for i in range(duration_samples):
            if i < hxr_peak_idx:
                hxr_profile[i] = (i / hxr_peak_idx) ** 2
            else:
                hxr_profile[i] = np.exp(-(i - hxr_peak_idx) / (0.15 * duration_samples))
                
        # Scale HXR profile
        hxr_flare_intensity = flare["intensity"] * 0.15
        hard_flux[start_idx : start_idx + duration_samples] += hxr_profile * hxr_flare_intensity
        
        # Soft X-ray flare profile based on Neupert Effect (integral of HXR) + thermal decay
        sxr_profile = np.zeros(duration_samples)
        running_integral = 0.0
        for i in range(duration_samples):
            running_integral += hxr_profile[i]
            # Thermal decay
            sxr_profile[i] = running_integral * 0.05
            if i > hxr_peak_idx:
                decay_factor = np.exp(-(i - hxr_peak_idx) / (0.4 * duration_samples))
                sxr_profile[i] = (sxr_profile[hxr_peak_idx] * 0.4 * decay_factor) + (sxr_profile[i] * 0.6)
                
        # Normalize and scale SXR profile
        sxr_profile = sxr_profile / (np.max(sxr_profile) + 1e-12)
        soft_flux[start_idx : start_idx + duration_samples] += sxr_profile * flare["intensity"]
        
    # Ensure no negative values
    soft_flux = np.clip(soft_flux, 1e-9, None)
    hard_flux = np.clip(hard_flux, 1e-9, None)
    
    # Create DataFrame complying with the Day-1 Data Handoff Contract
    df = pd.DataFrame({
        "timestamp": [ts.strftime("%Y-%m-%dT%H:%M:%SZ") for ts in timestamps],
        "soft_xray_flux": soft_flux,
        "hard_xray_flux": hard_flux,
        "soft_bg_subtracted": 0.0, # Filled by nowcast detector
        "hard_bg_subtracted": 0.0, # Filled by nowcast detector
        "source": "aditya"
    })
    
    # Save output
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)
    
    # Save raw config file
    with open("data/raw/pradan_catalog_meta.txt", "w") as f:
        f.write("PRADAN Aditya-L1 SoLEXS & HEL1OS Meta\n")
        f.write(f"Start Time: {start_time}\n")
        f.write(f"End Time: {timestamps[-1]}\n")
        f.write(f"Cadence: {cadence_seconds}s\n")
        f.write(f"Events injected: {len(flares)}\n")
        
    output_path = "data/processed/combined_lightcurve.csv"
    df.to_csv(output_path, index=False)
    print(f"Data saved to {output_path}. Total records: {len(df)}")

if __name__ == "__main__":
    generate_synthetic_data()
