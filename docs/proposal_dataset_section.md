# Proposal Section: Dataset, Sourcing & Preprocessing

## 1. Sourcing and Sizing
To build a robust solar flare nowcasting and forecasting pipeline, our team integrates primary data from India's first solar mission, **Aditya-L1**, and supplements it with long-term historical records from the NOAA **Geostationary Operational Environmental Satellite (GOES)** series.

### 1.1 Aditya-L1 Mission Data
Primary observations are sourced from two payloads on Aditya-L1:
1.  **Solar Low Energy X-ray Spectrometer (SoLEXS):** Measures soft X-ray solar irradiance. Level-1 daily data files contain 1-second cadence lightcurves and 340-channel spectral time-series.
2.  **High Energy L1 Orbiting X-ray Spectrometer (HEL1OS):** Measures hard X-ray solar irradiance. Level-1 data includes 1-second cadence lightcurves across five energy bands (ranging from 1.8 keV to 90 keV) and high-resolution event lists.

Data access is established via the **ISRO Science Data Centre (ISSDC) PRADAN portal** (`pradan.issdc.gov.in`), downloading daily reconstructed scientific products in Flexible Image Transport System (FITS) formats.

### 1.2 Supplementary NOAA GOES Data
To validate our algorithms and provide a large-scale historical training dataset, we download reprocessed, science-quality 1-minute averaged X-ray Sensor (XRS) data from the NOAA National Centers for Environmental Information (NCEI) archives. This includes:
*   **XRS-A (Short Channel, 0.05–0.4 nm):** Serving as a proxy for hard/impulsive X-ray emissions.
*   **XRS-B (Long Channel, 0.1–0.8 nm):** Serving as the standard soft X-ray channel used for flare classification (A, B, C, M, X class).

---

## 2. Preprocessing & Time Alignment Pipeline
Before ingestion by the Machine Learning modeling pipeline, the raw data undergoes a strict time alignment and cleaning workflow:

1.  **Timestamp Standardization:** Aditya-L1 SoLEXS uses Unix timestamps (seconds since 1970-01-01) as its Mission Elapsed Time (MET), whereas HEL1OS uses Modified Julian Dates (MJD) and UTC string columns. We convert both measurements into standard ISO 8601 UTC timestamps (`YYYY-MM-DDThh:mm:ssZ`).
2.  **Temporal Resampling and Merging:** HEL1OS timestamps (reported with millisecond precision) are rounded to the nearest integer second. We then perform an exact inner join with the SoLEXS 1-second lightcurve. Because daily observations might have non-overlapping starts, the join automatically crops the data to the overlapping time window (typically ~11.8 hours for the inspected sample).
3.  **Gap Handling:** SoLEXS data pads periods outside of Good Time Intervals (GTI) with `NaN` values, maintaining a constant 86,400 rows per day. Small telemetry gaps (up to 5 minutes) are interpolated linearly, while larger gaps are flagged for exclusion.
4.  **Quiet-Sun Background Subtraction:** Flare signals are isolated by subtracting the slowly-varying quiet-Sun background. We implement a rolling 10th percentile window (equivalent to a 24-hour window, or 86,400 points at 1-second cadence) to estimate the background baseline and floor the subtracted flux at 0.0 to prevent negative values.

---

## 3. Data Realities & Constraints (Integration Contract)
During our prototyping phase, we identified several physical constraints that shape our modeling choices:

*   **Cadence Contrast:** Aditya-L1 provides high-resolution 1-second cadence data, whereas the reprocessed historical GOES data is in 1-minute averages. Our pipeline downsamples Aditya-L1 data to 1-minute averages for historical cross-validation, but retains the native 1-second cadence for real-time nowcasting.
*   **Physical Units vs. Count Rates:** Aditya-L1 Level-1 lightcurves report measurements in raw instrument count rates (`COUNTS` and `CTR`), while GOES reports absolute physical irradiance (W/m²). To ensure compatibility, we apply standard scaling (z-score normalization) to the count rates per instrument channel, allowing the Machine Learning models to learn scale-invariant relative features (such as rate-of-rise and spectral hardness ratios).
