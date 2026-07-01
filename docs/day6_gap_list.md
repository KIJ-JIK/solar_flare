# Day 6 Gap List

**Date:** 2026-07-01  
**Project:** BAH2026 PS15 (Solar Flare Forecasting)  
**Lead:** Member A (Domain & Data Lead)

---

## 1. Objectives Gaps (Stated vs. Pipeline Capability)

| Objective | Current Pipeline Status | Gap Identified |
| :--- | :--- | :--- |
| **Real-time Flare Nowcasting** | Batch processing only. | No streaming ingestion or low-latency buffer implemented for live Aditya-L1 data streams. |
| **Multi-Class Flare Classification** | We output raw count rates. | Missing classification logic (e.g., mapping SoLEXS raw count rates to GOES-equivalent C/M/X classes). |
| **Cross-Validation with GOES** | Historical GOES data downloaded. | No shared calibration conversion factor exists to match Aditya-L1 counts directly with GOES absolute flux (Watts/m²). |

---

## 2. Integration Contract Gaps (features.csv & master_catalogue.csv)

*   **Underspecified inputs for `features.csv` (Member B):**
    *   Member B needs `recent_flare_count` (int) and ground-truth labels `label_30min`, `label_60min`, `label_120min`. 
    *   *Gap:* To compute these, the pipeline needs an active flare catalog for June 2026. However, the official ISRO flare event catalogue for June 2026 has not yet been released.
*   **Detector Combination Rules (Member C):**
    *   *Gap:* HEL1OS has 4 detectors (CdTe1, CdTe2, CZT1, CZT2). Our pipeline currently only parses `cdte1`. Combining or summing across all 4 detectors is still an open question for B and C to define.

---

## 3. Action Items & Responsibility Matrix

### **My Action Items (Member A)**
*   [ ] **Action:** Resolve the physical flux calibration mismatch by searching the `SoLEXS_Tools` documentation for count-to-irradiance conversion coefficients.
*   [ ] **Action:** Update the pipeline scripts to dynamically merge multiple active SDD files for SoLEXS if present.

### **ML & Modeling Gaps (Member B/C - NOT A's responsibility)**
*   [ ] **Action (B):** Define the exact algorithm to compute `hardness_ratio` and `soft_bg_trend` from the background-subtracted data columns.
*   [ ] **Action (B/C):** Implement the binary/multi-class label generator for `features.csv` using proxy NOAA flare catalogues for historical training.
*   [ ] **Action (C):** Write the nowcasting peak-detection algorithm to output the `master_catalogue.csv` columns (`start_time`, `peak_time`, `end_time`).

### **Strategy & Submission Gaps (Member D - NOT A's responsibility)**
*   [ ] **Action (D):** Extract the official template guidelines from the Hack2skill portal and format the final proposal draft.
