# System Architecture

The pipeline is organized as an end-to-end, modular data pipeline where each component has clear boundaries and complies with the **Day-1 Data Handoff Contract**.

## Data Flow Diagram

```mermaid
graph TD
    subgraph Payloads ["Solar Observations (Aditya-L1)"]
        SoLEXS["SoLEXS (Soft X-rays: 2-22 keV)"]
        HEL1OS["HEL1OS (Hard X-rays: 8-150 keV)"]
    end

    subgraph Phase1 ["1. Data Ingestion (Member A)"]
        Ingest["data_ingestion.py"]
        Raw["data/raw/"]
        Combined["data/processed/combined_lightcurve.csv"]
    end

    subgraph Phase2 ["2. Feature Engineering (Member B)"]
        FeatEng["feature_engineer.py"]
        Features["data/processed/features.csv"]
    end

    subgraph Phase3 ["3. Nowcast & Forecast Engine (Member C)"]
        Detector["nowcast_detector.py"]
        Predictor["predictor.py"]
        Catalogue["outputs/catalogue/master_catalogue.csv"]
        Plots["outputs/plots/*.png"]
    end

    subgraph Phase4 ["4. User Interface (Member D / Team)"]
        Backend["app.py (Flask API Backend)"]
        Frontend["React Dashboard (Vite App)"]
    end

    %% Flow lines
    SoLEXS --> Ingest
    HEL1OS --> Ingest
    Raw --> Ingest
    Ingest --> Combined
    Combined --> FeatEng
    Combined --> Detector
    FeatEng --> Features
    Features --> Predictor
    Detector --> Catalogue
    Predictor --> Plots
    
    %% Interactive dashboard integration
    Combined --> Backend
    Catalogue --> Backend
    Features --> Backend
    Plots --> Backend
    Backend --> Frontend
```

## Architectural Components

1. **Data Ingestion Module (`data_ingestion.py`)**: Responsible for reading raw telemetry files, performing coordinate/timestamp alignment, resampling to a common cadence (e.g., 10-second intervals), and outputting `combined_lightcurve.csv`.
2. **Feature Engineering Module (`feature_engineer.py`)**: Computes physical indicators from the raw fluxes. It outputs `features.csv` which contains normalized ratios, derivatives, trends, and target prediction labels.
3. **Nowcasting Detector (`nowcast_detector.py`)**: Computes running backgrounds, applies threshold triggers, finds the onset, peak, and decay of flares, and logs them in `master_catalogue.csv`.
4. **Forecasting Predictor (`predictor.py`)**: Reads engineered features, trains supervised classification models (Random Forest), generates future flare warnings, and evaluates them using precision-recall metrics.
5. **Interactive Dashboard (`/backend/` & `/frontend/`)**: Powered by a Python Flask API backend and a React + Vite + TypeScript frontend. It features real-time Recharts telemetry plotting, an interactive Neupert Effect simulation playground, orbital geometry visualizations, and proposal documentation viewers.
