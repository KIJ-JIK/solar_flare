# Day 7 Data Pipeline Defense Brief

**Date:** 2026-07-01  
**Project:** BAH2026 PS15 (Solar Flare Forecasting)  
**Lead:** Member A (Domain & Data Lead)

---

## 1. Overlap-Window Decision
*   **Decision:** We crop the data strictly to the overlapping observation window (using an inner join on timestamp) rather than attempting to extrapolate or forward-fill.
*   **Reasoning:** Aditya-L1 SoLEXS covers a full 24 hours, but HEL1OS observations only cover a partial day (~11.8 hours). Extrapolating the hard X-ray flux beyond the HEL1OS observation window would introduce unscientific noise and false flare triggers, violating the physical constraints of our forecasting models.
*   **What I'd say if challenged:** *"If we try to pad or extrapolate HEL1OS data beyond its actual observing hours, we would be feeding the machine learning model fabricated values. The inner join is the only scientifically valid method to ensure that both hard and soft X-ray features represent real, simultaneous solar measurements."*

---

## 2. Resampling Cadence (1-Second Cadence)
*   **Decision:** We align the datasets at a 1-second cadence by rounding HEL1OS timestamps (originally in fractional seconds/MJD) to the nearest integer second.
*   **Reasoning:** SoLEXS provides exactly 1-second cadence data. Maintaining the native 1-second cadence preserves high-frequency flare precursor signals (like impulsive hard X-ray spikes from HEL1OS) that would be smoothed out if we downsampled to 1-minute averages.
*   **What I'd say if challenged:** *"A 1-minute cadence would wash out the short-duration hard X-ray spikes that we rely on as early warning precursors (the Neupert effect). By rounding HEL1OS to the nearest second, we align it with SoLEXS while keeping the high-frequency features intact for real-time forecasting."*

---

## 3. Background Subtraction Method
*   **Decision:** We implement a rolling 10th percentile window (equivalent to a 24-hour window, or the overlap window length of 42,539 points) to estimate the quiet-Sun baseline.
*   **Reasoning:** A simple rolling minimum is too sensitive to noise spikes, while a rolling median is heavily influenced by large solar flares. A 10th percentile filter effectively isolates the true coronal baseline during quiet-Sun periods without being skewed by flare peaks.
*   **What I'd say if challenged:** *"A median filter gets heavily distorted when a massive flare occurs because the flare counts skew the median upward. The 10th percentile gives us a robust estimate of the true quiet-Sun baseline that remains stable during active flare events."*

---

## 4. Parallel Column Representation
*   **Decision:** We represent both instruments in a single row using parallel columns (`soft_xray_flux` and `hard_xray_flux`) rather than an interleaved (long-format) representation.
*   **Reasoning:** Parallel columns make it trivial for the ML model to calculate instantaneous ratios (like the spectral hardness ratio) and rates of change across both channels simultaneously without needing complex lag or reshape operations.
*   **What I'd say if challenged:** *"Interleaved long-format tables force the model to do complex grouping and shifting just to compare the two channels. Parallel columns deliver the features side-by-side in every row, which is the exact format required for instantaneous feature engineering."*

---

## 5. Deviations from the Integration Contract
*   **Decision:** We export raw count rates (`soft_xray_flux` and `hard_xray_flux`) rather than absolute physical irradiance (Watts/m²).
*   **Reasoning:** Absolute irradiance calibration requires effective area and instrument responsivity constants that are still being validated for Aditya-L1 payloads. Standard scaling (z-score normalization) must be used by the ML pipeline to handle the scale difference between instruments.
*   **What I'd say if challenged:** *"The raw data from the PRADAN portal is in counts per second, not Watts/m². Until the official calibration coefficients are finalized, standard scaling of count rates is the only reliable way to integrate the data without introducing uncalibrated errors."*
