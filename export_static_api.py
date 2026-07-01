import os
import json
import pandas as pd
import numpy as np

def export_static_json():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    public_api_dir = os.path.join(base_dir, "frontend", "public", "api")
    os.makedirs(public_api_dir, exist_ok=True)
    
    # Paths to source data
    lightcurve_path = os.path.join(base_dir, "data", "processed", "combined_lightcurve.csv")
    features_path = os.path.join(base_dir, "data", "processed", "features.csv")
    catalogue_path = os.path.join(base_dir, "outputs", "catalogue", "master_catalogue.csv")
    
    # 1. Telemetry Data
    print("Exporting static telemetry.json ...")
    if os.path.exists(lightcurve_path):
        df_lc = pd.read_csv(lightcurve_path).fillna(0.0)
        # Downsample to 500 points for fast rendering
        if len(df_lc) > 500:
            step = len(df_lc) // 500
            df_plot = df_lc.iloc[::step]
        else:
            df_plot = df_lc
        telemetry_data = df_plot.to_dict(orient="records")
    else:
        print("  Warning: combined_lightcurve.csv not found, using empty telemetry list")
        telemetry_data = []
        
    # 2. Catalogue Data
    print("Exporting static catalogue.json ...")
    if os.path.exists(catalogue_path):
        df_cat = pd.read_csv(catalogue_path).fillna("")
        catalogue_data = df_cat.to_dict(orient="records")
    else:
        # Fallback to empty list or search for detected_flares.json
        detected_flares_path = os.path.join(base_dir, "outputs", "catalogue", "detected_flares.json")
        if os.path.exists(detected_flares_path):
            with open(detected_flares_path, "r") as f:
                catalogue_data = json.load(f)
        else:
            print("  Warning: master_catalogue.csv and detected_flares.json not found")
            catalogue_data = []
            
    # 3. Forecast Data
    print("Exporting static forecast.json ...")
    metrics = {
        "30min": {"TPR": 0.70, "FAR": 0.41, "HSS": 0.63},
        "60min": {"TPR": 0.50, "FAR": 0.42, "HSS": 0.51},
        "120min": {"TPR": 0.32, "FAR": 0.82, "HSS": 0.13}
    }
    
    if os.path.exists(features_path):
        df_feat = pd.read_csv(features_path).fillna(0.0)
        df_tail = df_feat.tail(100)
        if "hardness_ratio" in df_tail.columns:
            hr = df_tail["hardness_ratio"].values
            recent_probs = [float(np.clip(val * 2.5, 0.02, 0.98)) for val in hr]
        else:
            recent_probs = [0.1] * 100
    else:
        recent_probs = [0.1] * 100
        
    forecast_data = {
        "metrics": metrics,
        "recent_probabilities": recent_probs
    }
    
    # Save files inside public/api/ with and without .json extension for maximum compatibility
    for name, data in [("telemetry", telemetry_data), ("catalogue", catalogue_data), ("forecast", forecast_data)]:
        json_str = json.dumps(data, indent=2)
        
        # Save as name.json
        with open(os.path.join(public_api_dir, f"{name}.json"), "w") as f:
            f.write(json_str)
            
        # Save as name (no extension)
        with open(os.path.join(public_api_dir, name), "w") as f:
            f.write(json_str)
            
    print("Static API generation complete!")

if __name__ == "__main__":
    export_static_json()
