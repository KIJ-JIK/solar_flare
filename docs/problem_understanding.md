# Problem Understanding: Forecasting/Nowcasting Solar Flares

## Scientific Context & Space Weather Impact
Solar flares are sudden, explosive releases of energy in the solar atmosphere caused by magnetic reconnection in active regions. These eruptions release electromagnetic radiation across the entire spectrum—from radio waves to gamma rays—along with energetic particles and, frequently, Coronal Mass Ejections (CMEs).

Solar flares are classified based on their peak Soft X-ray (SXR) flux (typically in the 1–8 Å wavelength band) measured near Earth, using classes:
- **A, B, C**: Minor solar activity.
- **M-class**: Moderate flares that can cause brief radio blackouts in polar regions.
- **X-class**: Major flares that can trigger global radio blackouts, damage satellite electronics, induce geomagnetic storms, disrupt terrestrial power grids, and pose severe radiation hazards to astronauts.

### Nowcasting vs. Forecasting
1. **Nowcasting (Detection)**: Real-time detection of flare onset, peak time, and flare classification as it happens. Accurate nowcasting allows rapid alerting for operators of high-frequency (HF) communications and low-Earth-orbit (LEO) satellites.
2. **Forecasting (Prediction)**: Predicting the occurrence of M- or X-class flares within a future window (e.g., 30, 60, or 120 minutes) using pre-flare indicators. Forecasting provides crucial preparation lead-time for sensitive orbit maneuvers and grid shutdowns.

---

## Aditya-L1 Payload Capabilities
Aditya-L1, located at the Sun-Earth Lagrange Point L1, offers continuous, occultation-free monitoring of solar activity. This project utilizes data from two primary X-ray payloads:

### 1. Solar Low Energy X-ray Spectrometer (SoLEXS)
- **Spectral Range**: Soft X-rays (2 keV to 22 keV).
- **Core Function**: Monitors the thermal emission from the hot coronal plasma. SXR flux increases relatively slowly during a flare as plasma is heated, providing the baseline for flare classification.

### 2. High Energy L1 Orbiting X-ray Spectrometer (HEL1OS)
- **Spectral Range**: Hard X-rays (8 keV to 150 keV).
- **Core Function**: Captures the non-thermal emission from high-energy electrons accelerated during the magnetic reconnection phase. Hard X-rays (HXR) are highly impulsive, rising rapidly *before* the thermal peak (the Neupert Effect). This early rise is an invaluable precursor for solar flare forecasting.

By combining the thermal/plasma signatures from SoLEXS with the non-thermal/particle signatures from HEL1OS, this pipeline enables high-accuracy nowcasting and significantly increases the lead-time of predictive forecasting.
