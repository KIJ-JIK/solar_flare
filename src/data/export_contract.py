import os
import argparse
import pandas as pd
import numpy as np

def export_contract(solexs_path, hel1os_path, output_csv):
    print("Loading intermediate parquet files...")
    df_solexs = pd.read_parquet(solexs_path)
    df_hel1os = pd.read_parquet(hel1os_path)
    
    # Time Alignment
    df_hel1os['timestamp'] = df_hel1os['timestamp'].dt.round('s')
    df = pd.merge(df_solexs, df_hel1os, on='timestamp', how='inner')
    
    if df.empty:
        print("Error: Merged dataframe is empty. No overlapping timestamps found.")
        return False
        
    window_size = min(86400, len(df))
    soft_bg = df['soft_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    hard_bg = df['hard_flux_raw'].rolling(window=window_size, min_periods=1, center=True).quantile(0.1)
    
    df['soft_xray_flux'] = df['soft_flux_raw']
    df['hard_xray_flux'] = df['hard_flux_raw']
    df['soft_bg_subtracted'] = np.maximum(0.0, df['soft_xray_flux'] - soft_bg)
    df['hard_bg_subtracted'] = np.maximum(0.0, df['hard_xray_flux'] - hard_bg)
    df['source'] = 'aditya'
    
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    contract_cols = [
        'timestamp', 
        'soft_xray_flux', 
        'hard_xray_flux', 
        'soft_bg_subtracted', 
        'hard_bg_subtracted', 
        'source'
    ]
    df_final = df[contract_cols]
    
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df_final.to_csv(output_csv, index=False)
    print("Exported successfully.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export contract data")
    parser.add_argument("--solexs", type=str, default="data/processed/_intermediate/solexs_parsed.parquet")
    parser.add_argument("--hel1os", type=str, default="data/processed/_intermediate/hel1os_parsed.parquet")
    parser.add_argument("--output", type=str, default="data/processed/combined_lightcurve.csv")
    
    args = parser.parse_args()
    export_contract(args.solexs, args.hel1os, args.output)
