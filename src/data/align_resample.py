import os
import argparse
import pandas as pd
import numpy as np

def align_and_resample(solexs_path, hel1os_path, output_csv):
    print("Loading intermediate parquet files...")
    df_solexs = pd.read_parquet(solexs_path)
    df_hel1os = pd.read_parquet(hel1os_path)
    
    # Time Alignment: round HEL1OS (which has fractional seconds) to the nearest second
    print("Aligning HEL1OS timestamps to the nearest second...")
    df_hel1os['timestamp'] = df_hel1os['timestamp'].dt.round('s')
    
    # Merge datasets (inner join automatically trims to the overlap window)
    print("Merging datasets on timestamp (inner join)...")
    df = pd.merge(df_solexs, df_hel1os, on='timestamp', how='inner')
    
    if df.empty:
        print("Error: Merged dataframe is empty. No overlapping timestamps found.")
        return False
        
    print(f"Overlap window: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Overlap rows: {len(df)}")
    
    # Background Subtraction (rolling 10th percentile over the overlap window)
    window_size = min(86400, len(df))
    print(f"Computing background subtraction with rolling window of {window_size} points...")
    
    soft_bg = df['soft_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    hard_bg = df['hard_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    
    # Create Contract Columns
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
    parser = argparse.ArgumentParser(description="Align and resample SoLEXS and HEL1OS data")
    parser.add_argument("--solexs", type=str, default="data/processed/_intermediate/solexs_parsed.parquet")
    parser.add_argument("--hel1os", type=str, default="data/processed/_intermediate/hel1os_parsed.parquet")
    parser.add_argument("--output", type=str, default="data/processed/combined_lightcurve.csv")
    
    args = parser.parse_args()
    align_and_resample(args.solexs, args.hel1os, args.output)
