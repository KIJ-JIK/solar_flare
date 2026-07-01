# Proposed Methodology

Our methodology is split into four sequential phases, matching the specialized roles of our hackathon team.

## 1. Data Ingestion & Preprocessing (Member A)
Raw data from Aditya-L1 consists of high-temporal-resolution files from SoLEXS and HEL1OS. The preprocessing pipeline:
- **Time Synchronization**: Aligns timestamps from both instruments using ISO8601 UTC.
- **Resampling**: Resamples fluxes to a uniform time-grid (e.g., 10-second bins) using linear interpolation to handle telemetry drops.
- **Background Removal**: Calculates the baseline solar emission (non-flare state) using a rolling minimum-median window:
  \[
  F_{\text{bg}}(t) = \text{RollingMedian}_{t \in [t - W, t]}(\text{RollingMin}_{t \in [t - W_2, t]}(F(t)))
  \]
  where \(W = 2\) hours and \(W_2 = 10\) minutes.
- **Background Subtraction**: Computes the net flux:
  \[
  F_{\text{sub}}(t) = F(t) - F_{\text{bg}}(t)
  \]

## 2. Feature Engineering (Member B)
We compute physics-inspired features that act as predictive precursors:
- **Hardness Ratio (HR)**: The ratio of hard X-ray flux to soft X-ray flux:
  \[
  \text{HR}(t) = \frac{\text{hard\_xray\_flux}(t)}{\text{soft\_xray\_flux}(t) + \epsilon}
  \]
  HR spikes during the impulsive phase of a flare as non-thermal electron acceleration dominates.
- **Hard Rate of Rise (HRR)**: The temporal derivative of the hard X-ray flux:
  \[
  \text{HRR}(t) = \frac{d}{dt}[\text{hard\_bg\_subtracted}(t)]
  \]
  This is a critical precursor that rises several minutes *before* the thermal soft X-ray peak (Neupert Effect).
- **Soft Background Trend**: The gradient of the soft X-ray background to capture active-region thermal build-up.
- **Recent Flare Count**: Number of flares detected in the preceding 6 hours, proxying active-region productivity.
- **Ground-Truth Labeling**: For training, a boolean label is assigned if a flare (exceeding a threshold) occurs in the future window \([t + 10\text{min}, t + T]\) where \(T \in \{30, 60, 120\}\) minutes.

## 3. Nowcasting Flare Detection (Member C)
Flares are detected dynamically in real-time:
- **Trigger**: A flare is triggered if the background-subtracted soft flux exceeds a sliding threshold:
  \[
  F_{\text{sub\_soft}}(t) > k \cdot \sigma_{\text{noise\_soft}}
  \]
- **Peak and Classification**: The peak flux within the active trigger window determines the flare class (C, M, or X based on standard GOES equivalents).
- **Confidence Scoring**:
  - **Hard-Confirmed**: Triggered if a corresponding spike in Hard X-rays (HEL1OS) matches the Soft X-ray (SoLEXS) onset, indicating strong particle acceleration.
  - **Soft-Only**: Triggered if only SoLEXS SXR increases (thermal-only heating, typical of weaker flares).

## 4. Forecasting Model (Member C)
We formulate flare forecasting as a binary classification problem. Using the features generated:
- **Model**: A Random Forest classifier is trained to output the probability of an M- or X-class flare occurring in the next 30, 60, and 120 minutes.
- **Class Imbalance**: Synthetic Minority Over-sampling Technique (SMOTE) or class weighting is applied to handle the rarity of large flares (M- and X-class).
