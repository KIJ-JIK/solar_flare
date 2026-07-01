import os
import glob
import pandas as pd
import numpy as np
from astropy.io import fits

def parse_single_solexs(folder_path):
    print(f"Searching SoLEXS in {folder_path} ...")
    lc_files = glob.glob(os.path.join(folder_path, '**', '*.lc.gz'), recursive=True)
    if not lc_files:
        print(f"Warning: No SoLEXS .lc.gz file found in {folder_path}")
        return None
        
    # Prioritize SDD2
    sdd2_files = [f for f in lc_files if 'SDD2' in f]
    lc_file = sdd2_files[0] if sdd2_files else lc_files[0]
    
    print(f"Reading SoLEXS: {lc_file}")
    with fits.open(lc_file) as hdul:
        data = hdul['RATE'].data
        # TIME is MET (Unix epoch offset)
        timestamps = pd.to_datetime(data['TIME'].astype(float), unit='s', utc=True)
        counts = data['COUNTS'].astype(float)
        
        df = pd.DataFrame({
            'timestamp': timestamps,
            'soft_flux_raw': counts
        })
    return df

def parse_single_hel1os(folder_path):
    print(f"Searching HEL1OS in {folder_path} ...")
    lc_files = glob.glob(os.path.join(folder_path, '**', 'lightcurve_*.fits'), recursive=True)
    if not lc_files:
        print(f"Warning: No HEL1OS lightcurve fits found in {folder_path}")
        return None
        
    cdte1_files = [f for f in lc_files if 'cdte1' in f.lower()]
    lc_file = cdte1_files[0] if cdte1_files else lc_files[0]
    
    print(f"Reading HEL1OS: {lc_file}")
    with fits.open(lc_file) as hdul:
        # Locate the total energy band HDU (1.80KEV_TO_90.00KEV)
        hdu = hdul[-1]
        for h in hdul:
            if h.name and '1.80KEV_TO_90.00KEV' in h.name:
                hdu = h
                break
        
        data = hdu.data
        timestamps = pd.to_datetime(np.array(data['ISOT']).astype(str), utc=True)
        counts = data['CTR'].astype(float)
        
        df = pd.DataFrame({
            'timestamp': timestamps,
            'hard_flux_raw': counts
        })
    return df

def process_historical_dataset(output_csv="data/processed/master_historical_lightcurve.csv"):
    dates = ['20260616', '20260617', '20260618', '20260619', '20260620']
    all_days_dfs = []
    
    for date_str in dates:
        print(f"\n--- Processing Date: {date_str} ---")
        
        # 1. Locate and parse SoLEXS data for the day
        solexs_dirs = glob.glob(f"data/raw/aditya/*SLX_L1_{date_str}_*")
        if not solexs_dirs:
            print(f"Skipping date {date_str}: No SoLEXS directory found.")
            continue
            
        df_sol = parse_single_solexs(solexs_dirs[0])
        if df_sol is None or df_sol.empty:
            continue
            
        # 2. Locate and parse all HEL1OS directories for the day (some days have 2 blocks)
        day_str = date_str[-2:]
        hel1os_dirs = glob.glob(f"data/raw/aditya/*HLS_{date_str}_*") + \
                      glob.glob(f"data/raw/aditya/2026/06/{day_str}/*HLS_{date_str}_*")
        if not hel1os_dirs:
            print(f"Skipping date {date_str}: No HEL1OS directory found.")
            continue
            
        hel1os_dfs = []
        for h_dir in hel1os_dirs:
            df_h = parse_single_hel1os(h_dir)
            if df_h is not None and not df_h.empty:
                hel1os_dfs.append(df_h)
                
        if not hel1os_dfs:
            print(f"Skipping date {date_str}: No valid HEL1OS data parsed.")
            continue
            
        # Concatenate HEL1OS time blocks and sort
        df_hel = pd.concat(hel1os_dfs, ignore_index=True).sort_values('timestamp')
        
        # 3. Align and merge
        df_hel['timestamp'] = df_hel['timestamp'].dt.round('s')
        
        # Remove duplicate rounded timestamps in HEL1OS if any overlap exists
        df_hel = df_hel.drop_duplicates(subset=['timestamp'])
        
        df_merged = pd.merge(df_sol, df_hel, on='timestamp', how='inner')
        if df_merged.empty:
            print(f"No overlapping observation time found on {date_str}")
            continue
            
        print(f"Successfully aligned same-day datasets. Overlapping records: {len(df_merged)}")
        
        # 4. Background subtraction
        # Since cadence is 1-sec, 24-hr is 86,400 points. We scale down if overlap window is smaller.
        window_size = min(86400, len(df_merged))
        
        soft_bg = df_merged['soft_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
        hard_bg = df_merged['hard_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
        
        df_merged['soft_xray_flux'] = df_merged['soft_flux_raw']
        df_merged['hard_xray_flux'] = df_merged['hard_flux_raw']
        df_merged['soft_bg_subtracted'] = np.maximum(0.0, df_merged['soft_xray_flux'] - soft_bg)
        df_merged['hard_bg_subtracted'] = np.maximum(0.0, df_merged['hard_xray_flux'] - hard_bg)
        df_merged['source'] = 'aditya'
        
        all_days_dfs.append(df_merged)
        
    if not all_days_dfs:
        print("Error: No overlapping days could be compiled.")
        return False
        
    # Concatenate all days and sort chronologically
    master_df = pd.concat(all_days_dfs, ignore_index=True).sort_values('timestamp')
    
    # Format timestamp to ISO8601 UTC string
    master_df['timestamp'] = master_df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    # Select contract columns
    contract_cols = [
        'timestamp', 
        'soft_xray_flux', 
        'hard_xray_flux', 
        'soft_bg_subtracted', 
        'hard_bg_subtracted', 
        'source'
    ]
    master_df = master_df[contract_cols]
    
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    master_df.to_csv(output_csv, index=False)
    print(f"\n==========================================")
    print(f"Master Historical Dataset compiled successfully!")
    print(f"Total rows: {len(master_df)}")
    print(f"Time range: {master_df['timestamp'].min()} to {master_df['timestamp'].max()}")
    print(f"Saved to: {output_csv}")
    print(f"==========================================")
    return True

if __name__ == "__main__":
    process_historical_dataset()
