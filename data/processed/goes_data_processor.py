import os
import sys
import pandas as pd
# pyrefly: ignore [missing-import]
import xarray as xr
import numpy as np

def process_nc_to_csv(nc_path, csv_path):
    if not os.path.exists(nc_path):
        print(f"Error: NetCDF file '{nc_path}' not found.")
        return False
        
    print(f"Loading NetCDF: {nc_path}")
    try:
        ds = xr.open_dataset(nc_path)
    except Exception as e:
        print(f"Failed to open NetCDF: {e}")
        return False
        
    # Extract dimensions and variables
    times = ds['time'].values
    xrsa = ds['xrsa_flux'].values  # Hard channel (0.05-0.4 nm)
    xrsb = ds['xrsb_flux'].values  # Soft channel (0.1-0.8 nm)
    
    # Handle flags: Replace bad/eclipsed data with NaN (or interpolate)
    xrsa_flag = ds['xrsa_flag'].values
    xrsb_flag = ds['xrsb_flag'].values
    
    # 0 is good_data in flag_meanings: "good_data bad_data eclipsed_by_earth temperature_recovery"
    xrsa_clean = np.where(xrsa_flag == 0, xrsa, np.nan)
    xrsb_clean = np.where(xrsb_flag == 0, xrsb, np.nan)
    
    # Create pandas DataFrame
    df = pd.DataFrame({
        'timestamp': pd.to_datetime(times),
        'hard_xray_flux': xrsa_clean,
        'soft_xray_flux': xrsb_clean
    })
    
    # Interpolate small gaps (up to 5 minutes)
    df['hard_xray_flux'] = df['hard_xray_flux'].interpolate(method='linear', limit=5)
    df['soft_xray_flux'] = df['soft_xray_flux'].interpolate(method='linear', limit=5)
    
    # Compute quiet-Sun background using a rolling 10th percentile
    # For 1-minute cadence, 24 hours is 1440 points. If data is shorter, we scale down the window.
    window_size = min(1440, len(df))
    print(f"Computing background subtraction with rolling window of {window_size} points...")
    
    soft_bg = df['soft_xray_flux'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    hard_bg = df['hard_xray_flux'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    
    # Background subtraction (ensure we don't go below 0)
    df['soft_bg_subtracted'] = np.maximum(0.0, df['soft_xray_flux'] - soft_bg)
    df['hard_bg_subtracted'] = np.maximum(0.0, df['hard_xray_flux'] - hard_bg)
    
    # Add source metadata
    df['source'] = 'goes'
    
    # Format timestamp as ISO8601 UTC string
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    # Rearrange columns to match A's deliverable contract exactly
    df = df[['timestamp', 'soft_xray_flux', 'hard_xray_flux', 'soft_bg_subtracted', 'hard_bg_subtracted', 'source']]
    
    # Save to processed folder
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    df.to_csv(csv_path, index=False)
    print(f"Successfully processed and saved {len(df)} records to: {csv_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python goes_data_processor.py <input_nc_file> <output_csv_file>")
    else:
        process_nc_to_csv(sys.argv[1], sys.argv[2])
