import os
import sys
import glob
import argparse
import pandas as pd
from astropy.io import fits

def parse_solexs(input_dir, output_file):
    # Find all lightcurve files
    lc_files = glob.glob(os.path.join(input_dir, '**', '*.lc.gz'), recursive=True)
    if not lc_files:
        print(f"Error: No .lc.gz files found in {input_dir}")
        return None
        
    if len(lc_files) > 1:
        print(f"Warning: Found multiple SDD lightcurve files ({len(lc_files)}). Prioritizing SDD2.")
        sdd2_files = [f for f in lc_files if 'SDD2' in f]
        lc_file = sdd2_files[0] if sdd2_files else lc_files[0]
    else:
        lc_file = lc_files[0]
        
    print(f"Parsing SoLEXS file: {lc_file}")
    
    with fits.open(lc_file) as hdul:
        data = hdul['RATE'].data
        
        # TIME is MET (Unix epoch offset)
        # MJDREFI = 40587 (1970-01-01), so MET = Unix timestamp
        timestamps = pd.to_datetime(data['TIME'].astype(float), unit='s', utc=True)
        counts = data['COUNTS'].astype(float)
        
        df = pd.DataFrame({
            'timestamp': timestamps,
            'soft_flux_raw': counts
        })
        
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    df.to_parquet(output_file, index=False)
    print(f"Saved {len(df)} rows to {output_file}")
    
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse SoLEXS data")
    parser.add_argument("--input", type=str, default="data/raw/aditya/AL1_SLX_L1_20260619_v1.0", help="Input directory")
    parser.add_argument("--output", type=str, default="data/processed/_intermediate/solexs_parsed.parquet", help="Output file")
    parser.add_argument("--validate", action="store_true", help="Validate output")
    
    args = parser.parse_args()
    
    df = parse_solexs(args.input, args.output)
    if df is not None and args.validate:
        print("\n--- Validation ---")
        print(f"Row count: {len(df)}")
        print(f"Time range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        cadence = df['timestamp'].diff().median()
        print(f"Cadence: {cadence}")
