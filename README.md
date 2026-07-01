# Solar Flare Forecasting & Nowcasting (Aditya-L1 SoLEXS + HEL1OS)

This repository contains the complete implementation for **PS15: Solar Flare Forecasting (Aditya-L1 SoLEXS + HEL1OS)**, structured in accordance with the Day-1 Integration Contract for a 4-member hackathon team.

## Repository Structure

- `data/raw/`: Untouched original files.
- `data/processed/`: Cleaned and merged data files.
  - `combined_lightcurve.csv`: Ingested and synchronized lightcurve (Member A).
  - `features.csv`: Engineered physical features and ground-truth windows (Member B).
- `src/features/`: Feature engineering scripts (Member B).
- `src/nowcast/`: Background subtraction and real-time threshold flare detection (Member C).
- `src/forecast/`: Predictive ML baseline modeling (Member C).
- `outputs/plots/`: Validation curves and predictive visualizations (Member C).
- `outputs/catalogue/`: Generated events database.
  - `master_catalogue.csv`: Confirmed flare event list (Member C).
- `docs/`: Strategic reports, proposal drafts, and architecture diagrams (Member D).
- `backend/`: Flask API backend caching data and providing APIs for dashboard telemetry, catalogues, and triggers.
- `frontend/`: React + Vite + TypeScript web application serving as the interactive dashboard.

## Getting Started

### 1. Run the Data Pipeline
First, install the Python dependencies and run the pipeline scripts to generate mock datasets, nowcasts, and forecast models:
```bash
pip install -r requirements.txt
python src/data_ingestion.py
python src/features/feature_engineer.py
python src/nowcast/nowcast_detector.py
python src/forecast/predictor.py
```

### 2. Start the Backend API Server
Navigate to the root directory and start the Flask API backend:
```bash
python backend/app.py
```
This runs the API server on `http://localhost:5000`.

### 3. Start the Frontend Dashboard
Navigate to the `frontend/` directory, install Node dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or the port specified by Vite) in your browser.
