# Day 3: Data Realities & Constraints (Member C)

Based on the raw data inspection, here are the hard realities to build the detection script against:

### 1. File Formats & Science Data
- **SoLEXS:** Gzip-compressed FITS. The primary science lightcurve is the `SDD2/*.lc.gz` file (SDD1 was found inactive/empty).
- **HEL1OS:** Uncompressed FITS. The primary science lightcurves are the `cdte/lightcurve_*.fits` and `czt/lightcurve_*.fits` files, which contain multiple HDUs corresponding to specific energy bands.

### 2. Native Cadence
- **SoLEXS:** Exactly 1-second cadence (based on `TIME` deltas of exactly 1.0s).
- **HEL1OS:** Approximately 1-second cadence (based on `MJD` deltas of ~0.0000115 days). 

### 3. Date/Time Coverage & Overlap Constraint
- **SoLEXS:** Covers the full 24 hours of 2026-06-23 (Time is Unix epoch MET).
- **HEL1OS:** Covers 2026-06-23 starting at 12:10:27 UTC for 42,566s (~11.8 hours).
- **CRITICAL:** These are SAME-DAY but partially NON-OVERLAPPING. Any unified dataset combining both is strictly limited to the overlapping time window (12:10:27 UTC onwards).

### 4. Units (Counts vs. Flux)
Both instruments report in **Count Rates**, not physical flux:
- SoLEXS: `COUNTS` per second (integers stored as floats).
- HEL1OS: `CTR` (Count rate).

### 5. Quirks & Irregularities
- **SoLEXS Gaps:** The file strictly contains 86,400 rows (24h) and pads missing data (outside Good Time Intervals) with `NaN`.
- **HEL1OS Gaps:** Only valid rows are present; gaps in time must be inferred by checking timestamp jumps.
- **HEL1OS Bands:** Lightcurve files encode specific energy bands into the HDU extension names (e.g., `CDTE1_LC_BAND_5.00KEV_TO_20.00KEV`). You must pick or sum the correct HDUs for the hard X-ray feature.

### 6. Contract Column Feasibility
**FLAG: Calibration Required.**
The agreed contract columns (`soft_xray_flux`, `hard_xray_flux`) are **not directly derivable**. We only have raw instrument counts/rates, not physical irradiance (e.g., Watts/m²). We must either insert an intermediate instrument calibration step to convert counts to physical flux, or formally redefine the ML contract to accept normalized count rates instead.
