# Solar Flare Forecasting Pipeline Proposal
**Aditya-L1 (SoLEXS & HEL1OS) cross-validated with NOAA GOES**

---

## 1. Data Ingestion Stage (Data Eng / Ingestion)
*Responsibility: Data Engineering (Me)*

- **Raw Data Pull:** 
  - **Aditya-L1:** Download Level-1 FITS data for SoLEXS (`.lc` lightcurves for soft X-ray) and HEL1OS (lightcurve HDUs for hard X-ray).
  - **GOES:** Retrieve GOES-15 Science-quality XRS NetCDF files (1-minute cadence averages) via the NCEI API.
- **Time Alignment & Preprocessing:**
  - Translate Aditya-L1 Mission Elapsed Time (MET) into standard UTC timestamps.
  - Clean GOES data using flag masks (handling eclipsed or bad data points).
- **Background Subtraction:** 
  - Implement a rolling 10th percentile window (e.g., 24-hour window) to estimate the quiet-Sun baseline.
  - Subtract this baseline from raw fluxes to isolate active flare signals (flooring values at 0.0).
- **Merge & Unification:** 
  - Combine both data sources into a single, standardized lightcurve table.

---

## 2. Feature Engineering Stage
*Responsibility: ML Lead (B)*

- **Inputs Received:** A clean, merged, timestamp-indexed time series containing soft and hard X-ray fluxes (raw and background-subtracted) from both Aditya-L1 and GOES.
- **Operations:** From this unified dataset, B will construct derivative features required for modeling. Expected features may include:
  - Temporal derivatives (flux gradients over time)
  - Soft-to-hard flux ratios
  - Running integral of flux (flare fluence estimates)
  - Wavelet transforms or frequency-domain features (if high-cadence data is preserved)

---

## 3. Detection / Forecast Stage
*Responsibility: Modeling Team (C & B)*

- **Handoff Point:** The feature-engineered tabular dataset (or feature store) serves as the exact boundary between data engineering and ML.
- **Execution:** The ML models ingest these features to predict flare probability, magnitude (class), and timing, using GOES as the historical baseline and Aditya-L1 as the primary observational input.

---

## 4. Handoff Contract (Schema)
The output of the ingestion stage will strictly adhere to the following schema, as previously agreed:

| Column | Type | Description |
| :--- | :--- | :--- |
| `timestamp` | String | ISO 8601 UTC timestamp (e.g., `YYYY-MM-DDThh:mm:ssZ`) |
| `soft_xray_flux` | Float | Raw soft X-ray flux (SoLEXS / GOES XRS-B 0.1-0.8 nm) |
| `hard_xray_flux` | Float | Raw hard X-ray flux (HEL1OS / GOES XRS-A 0.05-0.4 nm) |
| `soft_bg_subtracted` | Float | Soft flux minus rolling quiet-Sun background |
| `hard_bg_subtracted` | Float | Hard flux minus rolling quiet-Sun background |
| `source` | String | Data origin (`aditya` \| `goes`) |

---

## 5. Open Questions for Whiteboard Session

1. **Cadence Mismatches:** Aditya-L1 provides data at a ~1-second cadence, while our GOES science data is currently 1-minute averages. 
   - *Question:* Should we downsample Aditya-L1 to 1-minute bins to strictly match GOES, or should we keep Aditya-L1 at 1-second and interpolate/forward-fill GOES?
2. **Unit & Scale Discrepancies:** Aditya-L1 lightcurves currently report in raw counts/sec (integer counts stored as floats), whereas GOES reports physical irradiance (Watts/m²). 
   - *Question:* Do we need an intermediate physical calibration step before handoff, or will the ML model handle normalization independently (e.g., via standard scaling / z-scores per source)?
3. **Missing Data Imputation:** We currently interpolate small gaps (up to 5 minutes) in GOES data. 
   - *Question:* How should we handle larger gaps (e.g., telemetry drops, earth eclipses)? Should I leave them as `NaN` for the ML pipeline to impute, or drop those rows entirely?
