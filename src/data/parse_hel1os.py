import os
import sys
import glob
import argparse
import pandas as pd
from astropy.io import fits

def parse_hel1os(input_dir, output_file):
    # Find all cdte lightcurve files
    lc_files = glob.glob(os.path.join(input_dir, '**', 'lightcurve_*.fits'), recursive=True)
    if not lc_files:
        print(f"Error: No lightcurve fits files found in {input_dir}")
        return None
        
    # NOTE: Using pre-binned lightcurve instead of event list binning, as native 
    # 1s binned lightcurves are already provided in the Level-1 data products.
    # Selecting cdte1 as representative hard X-ray flux.
    cdte1_files = [f for f in lc_files if 'cdte1' in f.lower()]
    if not cdte1_files:
        cdte1_files = lc_files
        
    lc_file = cdte1_files[0]
    print(f"Parsing HEL1OS file: {lc_file}")
    print("NOTE: Using pre-binned lightcurve instead of event list binning, as native 1s binned lightcurves are provided in the data products.")
    print(f"NOTE: Selecting {os.path.basename(lc_file)} as representative hard X-ray flux. Combination across 4 detectors is an open question.")
    
    with fits.open(lc_file) as hdul:
        # We will use the broadband HDU for the total flux.
        # In our inspection, this was HDU 5: 1.80KEV_TO_90.00KEV
        # Let's find the broadband HDU by name or just use the last one
        hdu = hdul[-1]
        for h in hdul:
            if h.name and '1.80KEV_TO_90.00KEV' in h.name:
                hdu = h
                break
                
        print(f"Using HDU: {hdu.name}")
        data = hdu.data
        
        # ISOT is the ISO 8601 UTC timestamp
        import numpy as np
        timestamps = pd.to_datetime(np.array(data['ISOT']).astype(str), utc=True)
        counts = data['CTR'].astype(float)
        stat_err = data['STAT_ERR'].astype(float)
        
        df = pd.DataFrame({
            'timestamp': timestamps,
            'hard_flux_raw': counts,
            'stat_err': stat_err
        })
        
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    df.to_parquet(output_file, index=False)
    print(f"Saved {len(df)} rows to {output_file}")
    
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse HEL1OS data")
    parser.add_argument("--input", type=str, default="data/raw/aditya/HLS_20260620_121027_42563sec_lev1_V111", help="Input directory")
    parser.add_argument("--output", type=str, default="data/processed/_intermediate/hel1os_parsed.parquet", help="Output file")
    parser.add_argument("--validate", action="store_true", help="Validate output")
    
    args = parser.parse_args()
    
    df = parse_hel1os(args.input, args.output)
    if df is not None and args.validate:
        print("\n--- Validation ---")
        print(f"Row count: {len(df)}")
        print(f"Time range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        cadence = df['timestamp'].diff().median()
        print(f"Cadence: {cadence}")
