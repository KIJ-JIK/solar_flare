# Expected Outcomes & Evaluation Framework

To establish a scientifically rigorous flare forecasting system, we evaluate our nowcasting and forecasting models against standard space-weather validation metrics.

## 1. Evaluation Metrics

### Nowcasting (Detection) Performance
Nowcasting is evaluated on event-based matching. A detected flare is a **True Positive (TP)** if its peak time falls within an actual flare window, and a **False Positive (FP)** if it triggers on noise.
- **Classification Accuracy**: Percentage of flares categorized with the correct peak class (C, M, X).
- **Peak Time Offset**: The time delta between the actual flare peak and the detected peak.

### Forecasting (Prediction) Performance
Forecasting is evaluated using a confusion matrix at each timestamp cadence (e.g., every 10 seconds):
- **True Positive Rate (TPR / Recall)**: The proportion of actual flare windows correctly predicted:
  \[
  \text{TPR} = \frac{\text{TP}}{\text{TP} + \text{FN}}
  \]
- **False Alarm Rate (FAR)**: The proportion of predicted flare windows that did not occur:
  \[
  \text{FAR} = \frac{\text{FP}}{\text{TP} + \text{FP}}
  \]
- **Heidke Skill Score (HSS)**: Measures prediction accuracy relative to random chance:
  \[
  \text{HSS} = \frac{2(\text{TP} \cdot \text{TN} - \text{FP} \cdot \text{FN})}{(\text{TP} + \text{FN})(\text{FN} + \text{TN}) + (\text{TP} + \text{FP})(\text{FP} + \text{TN})}
  \]
  An HSS of 1 indicates perfect forecasting, while 0 indicates no skill beyond random guessing.
- **Lead Time**: The duration between the forecast alarm and the actual flare onset:
  \[
  \text{Lead Time} = t_{\text{onset}} - t_{\text{alarm}}
  \]
  Our target lead time is **15 to 45 minutes** using HEL1OS hard X-ray rise-rate precursors.

---

## 2. Operational Space Weather Impact

By deploying this combined SoLEXS + HEL1OS pipeline, we deliver:
1. **Critical Satellite Safeguards**: A 20-minute lead time allows satellite operators to put sensitive sensors in safe-mode and defer LEO altitude maneuvers.
2. **HF Communication Protection**: High-frequency communication networks can be redirected, avoiding signal degradation or blackouts during impulsive flare events.
3. **Geomagnetic Storm Warnings**: Predicting large M- and X-class flares provides early indicators of potential CMEs, allowing power grids to manage geomagnetic induced currents (GICs) effectively.
