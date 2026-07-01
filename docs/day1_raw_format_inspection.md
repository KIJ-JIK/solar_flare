# Day 1: Raw Format Inspection Report

**Inspection date:** 2026-06-29  
**Data inspected:** Closest available equivalents to user-requested dates  
**Note:** The user referenced June 23 data, but the downloaded archive contains dates Jun 10–20 (SoLEXS) and Jun 16–20 (HEL1OS). Inspected representative files; format is identical across dates.

---

## 1. SoLEXS — `AL1_SLX_L1_20260619_v1.0`

**Source zip:** `AL1_SLX_L1_20260619_v1.0.zip` (3,172,771 bytes)

### 1.1 Directory Tree & File Inventory

```text
AL1_SLX_L1_20260619_v1.0/
├── SDD1/
│   └── AL1_SOLEXS_20260619_SDD1_L1.gti.gz           956 bytes
└── SDD2/
    ├── AL1_SOLEXS_20260619_SDD2_L1.gti.gz         1,062 bytes
    ├── AL1_SOLEXS_20260619_SDD2_L1.lc.gz         250,792 bytes
    └── AL1_SOLEXS_20260619_SDD2_L1.pi.gz       5,469,059 bytes
```

**Observation:** SDD1 only has a GTI file (0 rows — no good-time intervals). SDD2 has GTI + lightcurve + spectral data. This pattern means **SDD1 was not active** for this observation day.

**File types:** All files are gzip-compressed FITS (`.gti.gz`, `.lc.gz`, `.pi.gz`). Astropy reads them directly.

---

### 1.2 File: `SDD1/AL1_SOLEXS_20260619_SDD1_L1.gti.gz`

| HDU | Name    | Type         | Rows | Columns            |
|-----|---------|-------------|------|--------------------|
| 0   | PRIMARY | PrimaryHDU  | —    | (no data)          |
| 1   | GTI     | BinTableHDU | **0 rows** | START (I/int16), STOP (I/int16) |

**Key headers (HDU 0):**

| Keyword   | Value                |
|-----------|----------------------|
| TELESCOP  | `'AL1'`             |
| INSTRUME  | `'SoLEXS'`          |
| MISSION   | `'ADITYA-L1'`       |
| ORIGIN    | `'SoLEXSPOC'`       |
| CREATOR   | `'solexs_pipeline-1.4'` |
| CONTENT   | `'GOOD TIME INTERVAL'` |
| TSTART    | `''` (empty!)        |
| TSTOP     | `''` (empty!)        |
| OBS_DATE  | `'20260619'`         |
| OBS_ID    | `'N00_0000_000935'`  |
| DATE      | `'2026-06-21'`       |

**GTI HDU 1 headers:**

| Keyword  | Value                |
|----------|----------------------|
| EXTNAME  | `'GTI'`             |
| HDUCLASS | `'OGIP'`            |
| EXPOSURE | `'0.0'`             |

**Sample data:** None (0 rows). SDD1 had no valid observation intervals.

---

### 1.3 File: `SDD2/AL1_SOLEXS_20260619_SDD2_L1.gti.gz`

| HDU | Name    | Type         | Rows | Columns            |
|-----|---------|-------------|------|--------------------|
| 0   | PRIMARY | PrimaryHDU  | —    | (no data)          |
| 1   | GTI     | BinTableHDU | **5 rows** | START (D/float64), STOP (D/float64) |

**Key headers (HDU 1):**

| Keyword  | Value                             |
|----------|-----------------------------------|
| TSTART   | `'2026-06-19T00:00:01+00:00'`    |
| TSTOP    | `'2026-06-19T23:59:59+00:00'`    |
| EXPOSURE | `'86395.0'`                       |

**Sample data (5 GTI rows):**

| Row | START          | STOP           |
|-----|----------------|----------------|
| 0   | 178182720**1**.0 | 178184508**8**.0 |
| 1   | 178184509**0**.0 | 178184509**4**.0 |
| 2   | 178184509**6**.0 | 178184620**2**.0 |
| 3   | 178184620**4**.0 | 178189899**4**.0 |
| 4   | 178189899**6**.0 | 178191359**9**.0 |

**Note:** These are mission-elapsed-time (MET) values in seconds. The reference epoch is encoded as MJDREFI=40587, MJDREFF=0 → **Unix epoch (1970-01-01T00:00:00 UTC)**. So TIME = Unix timestamp in seconds.

---

### 1.4 File: `SDD2/AL1_SOLEXS_20260619_SDD2_L1.lc.gz` ★ SCIENCE LIGHTCURVE

| HDU | Name    | Type         | Rows       | Columns       |
|-----|---------|-------------|------------|---------------|
| 0   | PRIMARY | PrimaryHDU  | —          | (no data)     |
| 1   | RATE    | BinTableHDU | **86,400** | TIME (D/float64), COUNTS (D/float64) |

**Key headers (HDU 1):**

| Keyword   | Value                    | Comment                        |
|-----------|--------------------------|--------------------------------|
| TELESCOP  | `'AL1'`                 |                                |
| INSTRUME  | `'SoLEXS'`             |                                |
| DATE-OBS  | `'2026-06-19 00:00:00'` |                                |
| DATE-END  | `'2026-06-19 23:59:59'` |                                |
| TIMESYS   | `'UTC'`                 |                                |
| TIMEUNIT  | `'s'`                   |                                |
| TIMEREF   | `'LOCAL'`               |                                |
| TSTART    | `178182720**0**.0`       | MET (Unix epoch)               |
| TSTOP     | `178191359**9**.0`       |                                |
| TIMEDEL   | `1`                     | **1-second cadence**           |
| TIMZERO   | `0`                     |                                |
| MJDREFI   | `40587`                 | MJD of reference epoch = Unix  |
| MJDREFF   | `0`                     |                                |
| HDUCLAS1  | `'LIGHTCURVE'`          |                                |
| HDUCLAS2  | `'TOTAL'`               |                                |
| HDUCLAS3  | `'COUNTS'`              |                                |
| FILTER    | `'SDD2'`                | Detector channel               |
| NUMBAND   | `'4'`                   |                                |
| CONTENT   | `'LIGHT CURVE'`         |                                |
| EXTNAME   | `'RATE'`                |                                |

**Table schema:**

| Column | FITS format | dtype   | Unit | Description                     |
|--------|------------|---------|------|---------------------------------|
| TIME   | D          | float64 | N/A  | MET in seconds (Unix timestamp) |
| COUNTS | D          | float64 | N/A  | Broadband count rate (1s bins)  |

**Sample data (first 5 rows):**

| Row | TIME              | COUNTS |
|-----|-------------------|--------|
| 0   | 1781827200.0      | NaN    |
| 1   | 1781827201.0      | 2.0    |
| 2   | 1781827202.0      | 0.0    |
| 3   | 1781827203.0      | 4.0    |
| 4   | 1781827204.0      | 1.0    |

**Note:** Row 0 has NaN counts — likely outside GTI. Rows have 1-second spacing. COUNTS are integer-valued counts stored as float64.

---

### 1.5 File: `SDD2/AL1_SOLEXS_20260619_SDD2_L1.pi.gz` ★ SCIENCE SPECTRAL TIME-SERIES

| HDU | Name     | Type         | Rows       | Columns                                          |
|-----|----------|-------------|------------|--------------------------------------------------|
| 0   | PRIMARY  | PrimaryHDU  | —          | (no data)                                         |
| 1   | SPECTRUM | BinTableHDU | **86,400** | TSTART, TELAPSE, SPEC_NUM, CHANNEL, COUNTS, EXPOSURE |

**Key headers (HDU 1):**

| Keyword   | Value                    |
|-----------|--------------------------|
| EXTNAME   | `'SPECTRUM'`            |
| CONTENT   | `'OGIP PHA data'`       |
| HDUCLAS1  | `'SPECTRUM'`            |
| HDUCLAS2  | `'TOTAL'`               |
| HDUCLAS3  | `'COUNTS'`              |
| HDUCLAS4  | `'TYPE:II'`             |
| CHANTYPE  | `'PI'`                  |
| DETCHANS  | `340`                   |
| FILTER    | `'SDD2'`                |
| POISSERR  | `False`                 |
| CORRSCAL  | `1.0`                   |
| AREASCAL  | `1.0`                   |

**Table schema:**

| Column   | FITS format | dtype          | Unit | Description                              |
|----------|------------|----------------|------|------------------------------------------|
| TSTART   | D          | float64        | s    | Start time of spectrum (MET)             |
| TELAPSE  | D          | float64        | s    | Elapsed time                             |
| SPEC_NUM | J          | int32          | N/A  | Spectrum sequence number                 |
| CHANNEL  | 340K       | int64[340]     | N/A  | Channel numbers (0..339), 340 per row    |
| COUNTS   | 340D       | float64[340]   | N/A  | Counts in each channel, 340 per row      |
| EXPOSURE | D          | float64        | s    | Exposure time                            |

**Sample data (first 5 rows):**

| Row | TSTART       | TELAPSE | SPEC_NUM | CHANNEL[0:3] | COUNTS[0:3]    | EXPOSURE |
|-----|--------------|---------|----------|--------------|----------------|----------|
| 0   | 1781827200.0 | 1.0     | 1        | [0, 1, 2]    | [NaN, NaN, NaN]| 1.0      |
| 1   | 1781827201.0 | 1.0     | 2        | [0, 1, 2]    | [0., 0., 0.]   | 1.0      |
| 2   | 1781827202.0 | 1.0     | 3        | [0, 1, 2]    | [0., 0., 0.]   | 1.0      |
| 3   | 1781827203.0 | 1.0     | 4        | [0, 1, 2]    | [0., 0., 0.]   | 1.0      |
| 4   | 1781827204.0 | 1.0     | 5        | [0, 1, 2]    | [0., 0., 0.]   | 1.0      |

**Note:** This is an OGIP Type-II PHA file — each row = one 1-second spectrum with 340 energy channels. The channel array is the same in every row (0..339). COUNTS is the per-channel spectral data.

---

### 1.6 SoLEXS Science File Identification

| File | Content | Science? |
|------|---------|----------|
| `SDD1/*.gti.gz` | Good Time Intervals for SDD1 | **No data** (0 rows — SDD1 inactive) |
| `SDD2/*.gti.gz` | Good Time Intervals for SDD2 | Auxiliary (5 GTI intervals) |
| `SDD2/*.lc.gz`  | **Broadband 1s lightcurve** | **★ PRIMARY SCIENCE** — broadband counts/s time series |
| `SDD2/*.pi.gz`  | **Spectral time-series (Type-II PHA)** | **★ PRIMARY SCIENCE** — 340-channel spectra at 1s cadence |

---

## 2. HEL1OS — `HLS_20260620_121027_42563sec_lev1_V111`

**Source zip:** `HLS_20260620_121027_42563sec_lev1_V111.zip` (48,730,880 bytes)

### 2.1 Directory Tree & File Inventory

```text
HLS_20260620_121027_42563sec_lev1_V111/
├── aux/
│   └── cztdis/
│       ├── czt1dispix.txt                              13 bytes
│       └── czt2dispix.txt                               0 bytes
├── cdte/
│   ├── hel1os_cdte_spectra_cdte1.fits          21,807,360 bytes
│   ├── hel1os_cdte_spectra_cdte2.fits          21,818,880 bytes
│   ├── lightcurve_cdte1.fits                   11,502,720 bytes
│   └── lightcurve_cdte2.fits                   11,502,720 bytes
├── czt/
│   ├── hel1os_czt_spectra_czt1.fits            14,590,080 bytes
│   ├── hel1os_czt_spectra_czt2.fits            14,590,080 bytes
│   ├── lightcurve_czt1.fits                    11,508,480 bytes
│   └── lightcurve_czt2.fits                    11,508,480 bytes
└── events/
    └── evt.fits                               183,375,360 bytes
```

**File types:**
- `.fits` — Standard FITS (uncompressed)
- `.txt` — Plain text auxiliary files

**Detector names:**
- `cdte1`, `cdte2` — Cadmium Telluride detectors (lower energy)
- `czt1`, `czt2` — Cadmium Zinc Telluride detectors (higher energy)

---

### 2.2 File: `aux/cztdis/czt1dispix.txt`

**Content (4 lines):**
```text
0
15
111
240
```

These are CZT disabled pixel IDs. `czt2dispix.txt` is empty (0 bytes = no disabled pixels).

---

### 2.3 File: `cdte/lightcurve_cdte1.fits` ★ SCIENCE LIGHTCURVE

| HDU | Name | Type | Rows | Columns |
|-----|------|------|------|---------|
| 0 | PRIMARY | PrimaryHDU | — | (no data) |
| 1 | CDTE1_LC_BAND_5.00KEV_TO_20.00KEV | BinTableHDU | 42,520 | MJD, ISOT, CTR, STAT_ERR |
| 2 | CDTE1_LC_BAND_20.00KEV_TO_30.00KEV | BinTableHDU | 42,503 | MJD, ISOT, CTR, STAT_ERR |
| 3 | CDTE1_LC_BAND_30.00KEV_TO_40.00KEV | BinTableHDU | 42,475 | MJD, ISOT, CTR, STAT_ERR |
| 4 | CDTE1_LC_BAND_40.00KEV_TO_60.00KEV | BinTableHDU | 42,539 | MJD, ISOT, CTR, STAT_ERR |
| 5 | CDTE1_LC_BAND_1.80KEV_TO_90.00KEV | BinTableHDU | 42,539 | MJD, ISOT, CTR, STAT_ERR |

**Key headers (HDU 0):**

| Keyword  | Value |
|----------|-------|
| TELESCOP | `'Aditya-L1'` |
| INSTRUME | `'HEL1OS'` |
| CREATOR  | `'HEL1OS-L1-PIPELINE'` |

**Key headers (HDU 1):**

| Keyword  | Value |
|----------|-------|
| TSTART   | `61211.50729283394` (MJD) |
| TSTOP    | `61211.99942246357` (MJD) |

**Table schema (all 5 HDUs identical):**

| Column   | FITS format | dtype   | Description |
|----------|------------|---------|-------------|
| MJD      | D          | float64 | Modified Julian Date |
| ISOT     | 30A        | string  | ISO 8601 timestamp (UTC) |
| CTR      | D          | float64 | Count rate |
| STAT_ERR | D          | float64 | Statistical error (sqrt(N)) |

**Sample data (HDU 1: 5–20 keV band):**

| Row | MJD               | ISOT                        | CTR | STAT_ERR |
|-----|--------------------|------------------------------|-----|----------|
| 0   | 61211.507298620970 | 2026-06-20T12:10:30.601      | 2.0 | 1.4142   |
| 1   | 61211.507310195050 | 2026-06-20T12:10:31.601      | 0.0 | 0.0      |
| 2   | 61211.507321769124 | 2026-06-20T12:10:32.601      | 1.0 | 1.0      |
| 3   | 61211.507333343194 | 2026-06-20T12:10:33.601      | 0.0 | 0.0      |
| 4   | 61211.507344917270 | 2026-06-20T12:10:34.601      | 1.0 | 1.0      |

**Energy bands (5 HDUs in lightcurve file):**

| HDU | Band                    | Rows   |
|-----|-------------------------|--------|
| 1   | 5.00–20.00 keV          | 42,520 |
| 2   | 20.00–30.00 keV         | 42,503 |
| 3   | 30.00–40.00 keV         | 42,475 |
| 4   | 40.00–60.00 keV         | 42,539 |
| 5   | 1.80–90.00 keV (total)  | 42,539 |

**Note:** Each HDU is a different energy band. Row counts vary slightly (~42,475–42,539) because only seconds with valid data are included. Time spacing is ~1 second. `lightcurve_cdte2.fits` has the same structure for CdTe detector 2.

---

### 2.4 File: `events/evt.fits` ★ SCIENCE EVENT LIST

| HDU | Name          | Type         | Rows        | Columns |
|-----|---------------|-------------|-------------|---------|
| 0   | PRIMARY       | PrimaryHDU  | —           | (no data) |
| 1   | CDTE1-EVENTS  | BinTableHDU | **113,717** | mjd, hlsobt, currtemp, chn, ener, recnum, utc-isot |
| 2   | CDTE2-EVENTS  | BinTableHDU | **124,169** | (same schema) |
| 3   | CZT1-EVENTS   | BinTableHDU | **1,377,987** | mjd, hlsobt, currtemp, quadrant, detx, dety, ener, recnum, utc-isot |
| 4   | CZT2-EVENTS   | BinTableHDU | **1,260,167** | (same schema) |

**Key headers:**

| Keyword  | Value |
|----------|-------|
| TELESCOP | `'Aditya-L1'` |
| INSTRUME | `'HEL1OS'` |
| TSTART   | `61211.50726437308` (MJD) |
| TSTOP    | `61211.99961807689` (MJD) |
| DETNAM   | `'CdTe1'` (for HDU 1) |

**CdTe event table schema (HDUs 1–2):**

| Column   | FITS format | dtype   | Description |
|----------|------------|---------|-------------|
| mjd      | D          | float64 | Modified Julian Date |
| hlsobt   | D          | float64 | HEL1OS onboard time (seconds) |
| currtemp | D          | float64 | Detector temperature (°C) |
| chn      | I          | uint16  | Channel number |
| ener     | D          | float64 | Energy (keV) |
| recnum   | J          | int32   | Record number |
| utc-isot | 23A        | string  | ISO 8601 UTC timestamp |

**CZT event table schema (HDUs 3–4, extra columns):**

| Column   | FITS format | dtype   | Description |
|----------|------------|---------|-------------|
| mjd      | D          | float64 | Modified Julian Date |
| hlsobt   | D          | float64 | HEL1OS onboard time (seconds) |
| currtemp | D          | float64 | Detector temperature (°C) |
| quadrant | B          | uint8   | Detector quadrant |
| detx     | I          | uint16  | Pixel X coordinate |
| dety     | I          | uint16  | Pixel Y coordinate |
| ener     | D          | float64 | Energy (keV) |
| recnum   | J          | int32   | Record number |
| utc-isot | 23A        | string  | ISO 8601 UTC timestamp |

**Sample data (HDU 1: CdTe1 events):**

| Row | mjd         | hlsobt  | currtemp | chn | ener    | recnum | utc-isot                |
|-----|-------------|---------|----------|-----|---------|--------|-------------------------|
| 0   | 61211.50726 | 78090.96| -40.202  | 332 | 58.475  | 1      | 2026-06-20T12:10:27.642 |
| 1   | 61211.50727 | 78099.18| -40.202  | 497 | 86.855  | 2      | 2026-06-20T12:10:28.442 |
| 2   | 61211.50729 | 78115.04| -40.202  | 29  | 6.359   | 4      | 2026-06-20T12:10:30.101 |
| 3   | 61211.50730 | 78123.10| -40.202  | 34  | 7.219   | 5      | 2026-06-20T12:10:30.813 |
| 4   | 61211.50731 | 78130.35| -40.202  | 117 | 21.495  | 6      | 2026-06-20T12:10:31.581 |

---

### 2.5 File: `cdte/hel1os_cdte_spectra_cdte1.fits` ★ SCIENCE SPECTRAL TIME-SERIES

| HDU | Name     | Type         | Rows   | Columns |
|-----|----------|-------------|--------|---------|
| 0   | PRIMARY  | PrimaryHDU  | —      | (no data) |
| 1   | SPECTRUM | BinTableHDU | **2,125** | SPEC_NUM, CHANNEL, COUNTS, STAT_ERR, utc-isot, MJD, TIMEDEL, LIVETIME |

**Key headers:**

| Keyword  | Value |
|----------|-------|
| TELESCOP | `'Aditya-L1'` |
| INSTRUME | `'HEL1OS'` |
| DETNAM   | `'CdTe1'` |

**Table schema:**

| Column   | FITS format | dtype        | Description |
|----------|------------|-------------|-------------|
| SPEC_NUM | I          | uint16      | Spectrum sequence number |
| CHANNEL  | 511J       | int32[511]  | Channel numbers (511 channels) |
| COUNTS   | 511D       | float64[511]| Counts per channel |
| STAT_ERR | 511D       | float64[511]| Statistical error per channel |
| utc-isot | 12A        | string      | UTC time string |
| MJD      | D          | float64     | Modified Julian Date |
| TIMEDEL  | D          | float64     | Time bin width |
| LIVETIME | D          | float64     | Live time |

**Note:** 2,125 spectra × 511 channels. These are accumulated spectra (not 1-second cadence). The CZT spectra files have similar structure.

---

### 2.6 HEL1OS Science File Identification

| File | Content | Science? |
|------|---------|----------|
| `aux/cztdis/czt*dispix.txt` | CZT disabled pixel lists | **Auxiliary/calibration** |
| `events/evt.fits` | **Full event list** (all 4 detectors) | **★ PRIMARY SCIENCE** — individual photon events with time, energy, position |
| `cdte/lightcurve_cdte1.fits` | **CdTe1 binned lightcurves** (5 energy bands) | **★ PRIMARY SCIENCE** — 1s-cadence lightcurves |
| `cdte/lightcurve_cdte2.fits` | **CdTe2 binned lightcurves** (5 energy bands) | **★ PRIMARY SCIENCE** |
| `czt/lightcurve_czt1.fits` | **CZT1 binned lightcurves** | **★ PRIMARY SCIENCE** |
| `czt/lightcurve_czt2.fits` | **CZT2 binned lightcurves** | **★ PRIMARY SCIENCE** |
| `cdte/hel1os_cdte_spectra_cdte1.fits` | CdTe1 accumulated spectra | **Science (spectral)** |
| `cdte/hel1os_cdte_spectra_cdte2.fits` | CdTe2 accumulated spectra | **Science (spectral)** |
| `czt/hel1os_czt_spectra_czt1.fits` | CZT1 accumulated spectra | **Science (spectral)** |
| `czt/hel1os_czt_spectra_czt2.fits` | CZT2 accumulated spectra | **Science (spectral)** |

---

## 3. Critical Format Differences Summary

| Property | SoLEXS | HEL1OS |
|----------|--------|--------|
| **Time system** | Unix timestamps (seconds since 1970-01-01) stored as MET. MJDREFI=40587 | MJD (Modified Julian Date), plus ISO 8601 string column |
| **Time column name** | `TIME` (lc), `TSTART` (pi) | `MJD` + `ISOT` (lightcurve), `mjd` + `utc-isot` (events) |
| **Time cadence** | 1 second (TIMEDEL=1) | ~1 second (lightcurves), irregular (events) |
| **Count column** | `COUNTS` (float64) | `CTR` (lightcurve), `ener`+`chn` (events) |
| **Error column** | None in lightcurve | `STAT_ERR` |
| **Energy resolution** | 340 PI channels (spectral file) | 511 channels (spectra), individual photon energies (events) |
| **TELESCOP keyword** | `'AL1'` | `'Aditya-L1'` |
| **INSTRUME keyword** | `'SoLEXS'` | `'HEL1OS'` |
| **CREATOR** | `'solexs_pipeline-1.4'` | `'HEL1OS-L1-PIPELINE'` |
| **GTI handling** | Separate `.gti.gz` file | No separate GTI file; implicit via row presence |
| **Detector channels** | SDD1, SDD2 (separate folders) | CdTe1, CdTe2, CZT1, CZT2 (separate files + event HDUs) |
| **Compression** | gzip-compressed FITS | Uncompressed FITS |
| **NaN handling** | NaN for non-GTI intervals in lightcurve | Only valid rows present (no NaN padding) |
| **Energy bands** | Single broadband count (lc), 340-channel spectra (pi) | 5 named energy bands per detector (lightcurve HDU names encode band) |

---

## 4. Raw Findings & Gotchas

1. **SDD1 is often inactive.** Multiple days show SDD1 GTI files with 0 rows. Only SDD2 data is usable for most dates.

2. **SoLEXS uses Unix timestamps as MET.** MJDREFI=40587 (MJD of 1970-01-01). TIME column is raw Unix time in seconds. This is non-standard compared to most X-ray missions (which use mission-specific epochs).

3. **HEL1OS uses MJD natively + ISO string.** Both `MJD` (float64) and `ISOT`/`utc-isot` (string) columns are present. MJD is the authoritative numeric time; ISOT provides human-readable UTC.

4. **HEL1OS lightcurve HDU names encode energy bands.** The HDU extension name (e.g. `CDTE1_LC_BAND_5.00KEV_TO_20.00KEV`) must be parsed to extract band boundaries.

5. **SoLEXS lightcurve pads non-GTI with NaN.** The `.lc` file always has exactly 86,400 rows (one per second for 24 hours), with NaN for gaps. HEL1OS only includes valid-time rows.

6. **HEL1OS event files are very large.** `evt.fits` is ~183 MB with ~2.9M total events across 4 detector HDUs. CZT detectors have 10× more events than CdTe.

7. **Column name inconsistency.** SoLEXS uses `COUNTS`, HEL1OS uses `CTR` (count rate) for the equivalent measurement. SoLEXS has no error column; HEL1OS provides `STAT_ERR`.

8. **The `.pi` spectral file is OGIP Type-II PHA.** Each row has 340-element arrays for CHANNEL and COUNTS. This is a standard X-ray spectral format but is NOT a simple time-series.

9. **HEL1OS CZT events have spatial info (detx, dety, quadrant).** CdTe events do not have spatial columns — only time, channel, energy, temperature.

10. **HEL1OS lightcurve row counts differ per band.** Not all bands have the same number of valid seconds (ranges from 42,475 to 42,539), presumably due to per-band quality filtering.
