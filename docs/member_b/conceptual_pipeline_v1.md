# Conceptual End-to-End Pipeline v1

## 1. Raw Data Ingestion
This stage involves the retrieval and initial staging of raw solar observation data, handling disparate formats and cadences from the Aditya-L1 (SoLEXS/HEL1OS) payloads and NOAA GOES archival sources. It ensures that the raw satellite telemetry and archived observations are reliably transferred into our workspace for processing.
**Input Artifacts:** Aditya-L1 SoLEXS/HEL1OS raw files, NOAA GOES archive files (arbitrary native formats and cadences).
**Output Artifact:** Raw downloaded datasets staged in the local file system (e.g., `data/raw/`).
**Owner:** Member A (Domain & Data Lead)
**Risks/Assumptions:** Raw file formats might vary unpredictably, or there could be API rate limits/access issues when pulling GOES historical data. We assume that the necessary Aditya-L1 data subsets are available and readable.

## 2. Cleaning, Resampling, and Merging
In this stage, the raw, asynchronous datasets are parsed, cleaned of missing or corrupted values, and resampled to a unified time cadence. The soft and hard X-ray fluxes from different instruments are aligned and merged into a single, standardized tabular contract format, with preliminary background subtraction applied.
**Input Artifacts:** Raw downloaded datasets from stage 1.
**Output Artifact:** `data/processed/combined_lightcurve.csv` (Exact columns: `timestamp`, `soft_xray_flux`, `hard_xray_flux`, `soft_bg_subtracted`, `hard_bg_subtracted`, `source`)
**Owner:** Member A (Domain & Data Lead)
**Risks/Assumptions:** Aligning timestamps from different instruments might introduce resampling artifacts or latency. We assume a common timestamp cadence can be established without losing critical flare onset characteristics, and that background estimation models are sufficiently robust across both satellite sources.

## 3. Feature Engineering
This stage takes the standardized lightcurves and derives physically meaningful indicators of solar activity to be used as predictive inputs. Time-series transformations are applied to calculate the rate of rise in hard X-rays, the hardness ratio between bands, background trend calculations, and the generation of forward-looking target labels for supervised learning.
**Input Artifacts:** `data/processed/combined_lightcurve.csv`
**Output Artifact:** `data/processed/features.csv` (Exact columns: `timestamp`, `hard_rate_of_rise`, `hardness_ratio`, `soft_bg_trend`, `recent_flare_count`, `label_30min`, `label_60min`, `label_120min`)
**Owner:** Member B (Algorithm/ML Design Lead)
**Risks/Assumptions:** Window sizes chosen for trend calculation (e.g., for `hard_rate_of_rise` and `soft_bg_trend`) might be too wide or too narrow, diluting the signal or capturing noise. We assume the predefined feature columns contain enough predictive power to differentiate pre-flare phases from background activity.

## 4. Nowcasting / Detection
This stage continuously monitors the incoming (or historical) standardized lightcurves to automatically identify and flag active solar flares in real-time. It applies thresholding or event-detection algorithms to determine flare onset, peak, and decay phases on the fly.
**Input Artifacts:** `data/processed/combined_lightcurve.csv`
**Output Artifact:** Real-time flare event flags/triggers (conceptual output, potentially intermediate streams or detection logs).
**Owner:** Member C
**Risks/Assumptions:** Hardcoded intensity thresholds may fail across different background activity levels or solar cycle phases. We assume that the detection logic can distinguish between true flare events and sensor noise or cosmic ray hits without excessive false positives.

## 5. Forecasting Model
This stage leverages the engineered features to predict the occurrence of solar flares within specific future time horizons (30, 60, 120 minutes). A Gradient Boosted Tree (GBT) baseline will be trained first, with deep learning models (LSTM/Transformer) planned as a stretch goal to better capture complex temporal dependencies.
**Input Artifacts:** `data/processed/features.csv`
**Output Artifact:** Trained model artifacts and predictions for the target labels.
**Owner:** Member B (Algorithm/ML Design Lead)
**Risks/Assumptions:** The dataset may be heavily imbalanced (far more non-flare periods than flares), which could cause the model to collapse to always predicting "no flare". We assume that the baseline GBT model can adequately handle the feature distributions before committing time to the deep learning stretch goals.

## 6. Validation & Catalogue Output
The final stage assesses the performance of both detection and forecasting models, consolidating the results into a definitive catalog of events. It matches predicted/detected flares against ground-truth physics metrics and generates a final report documenting the characteristics and confidence levels of every flare period.
**Input Artifacts:** Model predictions, event triggers, and original lightcurve data.
**Output Artifact:** `outputs/catalogue/master_catalogue.csv` (Exact columns: `start_time`, `peak_time`, `end_time`, `flare_class`, `confidence`)
**Owner:** Member C
**Risks/Assumptions:** Defining the exact start and end times of a flare can be subjective and vary between automated metrics and historical NOAA catalogs. We assume our validation metrics (e.g., precision, recall, F1) accurately reflect the operational utility of the pipeline for end-users.

## Open Questions for Day 3 Schema Confirmation
*   **Sampling Cadence:** What will be the exact time delta between rows in `combined_lightcurve.csv`? (e.g., 1-second vs. 1-minute cadence? The forecasting model's window sizes depend entirely on this).
*   **Background Subtraction Reliability:** Is the methodology for `soft_bg_subtracted` and `hard_bg_subtracted` robust across the full multi-year time range, or will there be discontinuities that the model might mistake for actual flares/trends?
*   **Data Completeness and Gap Handling:** Will both `soft_xray_flux` and `hard_xray_flux` have 100% full coverage, or will there be gaps? If there are gaps, how are they being represented (e.g., NaNs, interpolation, or missing rows)?
*   **Date-Range / Coverage Limits:** What is the exact continuous date range we are training on? Are there any significant blackout periods in the Aditya-L1 or GOES data we need to artificially exclude from our feature engineering windows?
*   **Source Column Interaction:** Will the `source` column ("aditya" vs "goes") imply different scaling or calibration factors that I need to account for during feature engineering, or is the flux already cross-calibrated between the two satellites?
