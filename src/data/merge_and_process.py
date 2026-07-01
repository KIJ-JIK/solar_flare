import os
import argparse
import pandas as pd
import numpy as np

def process_and_merge(solexs_path, hel1os_path, output_csv):
    print("Loading intermediate parquet files...")
    df_solexs = pd.read_parquet(solexs_path)
    df_hel1os = pd.read_parquet(hel1os_path)
    
    # 1. Time Alignment
    # SoLEXS has whole second timestamps. HEL1OS has fractional seconds.
    # We round HEL1OS to the nearest second to enable an exact inner join.
    print("Aligning timestamps...")
    df_hel1os['timestamp'] = df_hel1os['timestamp'].dt.round('s')
    
    # Merge datasets (inner join automatically trims to the overlap window)
    print("Merging datasets on timestamp...")
    df = pd.merge(df_solexs, df_hel1os, on='timestamp', how='inner')
    
    if df.empty:
        print("Error: Merged dataframe is empty. No overlapping timestamps found.")
        return False
        
    print(f"Overlap window: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Overlap rows: {len(df)}")
    
    # 2. Background Subtraction
    # Consistent with GOES processing logic (rolling 10th percentile).
    # Since cadence is 1s, a 24-hour window is 86,400 points.
    window_size = min(86400, len(df))
    print(f"Computing background subtraction with rolling window of {window_size} points...")
    
    soft_bg = df['soft_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    hard_bg = df['hard_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    
    # 3. Create Contract Columns
    df['soft_xray_flux'] = df['soft_flux_raw']
    df['hard_xray_flux'] = df['hard_flux_raw']
    df['soft_bg_subtracted'] = np.maximum(0.0, df['soft_xray_flux'] - soft_bg)
    df['hard_bg_subtracted'] = np.maximum(0.0, df['hard_xray_flux'] - hard_bg)
    df['source'] = 'aditya'
    
    # Format timestamp as ISO8601 UTC string per contract
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    # Ensure exact contract schema and ordering
    contract_cols = [
        'timestamp', 
        'soft_xray_flux', 
        'hard_xray_flux', 
        'soft_bg_subtracted', 
        'hard_bg_subtracted', 
        'source'
    ]
    df_final = df[contract_cols]
    
    # Save to CSV
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    print(f"Saving {len(df_final)} records to {output_csv}...")
    df_final.to_csv(output_csv, index=False)
    print("Done!")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge and process SoLEXS and HEL1OS data")
    parser.add_argument("--solexs", type=str, default="data/processed/_intermediate/solexs_parsed.parquet")
    parser.add_argument("--hel1os", type=str, default="data/processed/_intermediate/hel1os_parsed.parquet")
    parser.add_argument("--output", type=str, default="data/processed/combined_lightcurve.csv")
    
    args = parser.parse_args()
    process_and_merge(args.solexs, args.hel1os, args.output)
