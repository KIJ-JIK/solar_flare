# Feature Specification v1

## Part 1: Model Choices

**Baseline Model: Gradient Boosted Trees (XGBoost)**
XGBoost is highly appropriate for tabular time-series flare forecasting on small-to-medium historical datasets because it is computationally efficient, handles non-linear relationships well, and is robust to minor data scaling issues. However, its main failure mode is that it fundamentally ignores temporal order and dependencies beyond what is explicitly engineered into the features (like rolling means or lags), potentially missing subtle sequential patterns leading up to a flare. For the Day 1-10 submission deadline, the minimum viable version is a scikit-learn pipeline using a lightweight XGBoost model trained on dummy or minimal simulated feature sets that outputs correctly formatted predictions, proving the inference pipeline runs end-to-end.

**Stretch-Goal Model: LSTM or Transformer Sequence Model**
Sequence models like LSTMs or Transformers are theoretically ideal for this task because they can inherently learn complex temporal dependencies and precursor patterns directly from the raw time-series windows without relying on hand-crafted lag features. The primary failure mode for these models in this context is their voracious appetite for training data and sensitivity to hyperparameter tuning; with limited historical data, they are highly prone to overfitting or failing to converge during careful windowing. The minimum viable version for the deadline would be a constructed PyTorch `Dataset`/`DataLoader` pipeline combined with an untrained, small-parameter network architecture that successfully ingests sequence windows and outputs the correct probability shape, demonstrating architectural readiness.

## Part 2: Feature Engineering Logic

*Note: As A's data realities document has not been received yet, the logic below relies on explicit placeholder assumptions [marked below] regarding the data cadence.*

*   **`hard_rate_of_rise`**: This feature represents the windowed first derivative (or finite difference) of the `hard_xray_flux` over a trailing window.
    *   *Proposed Logic:* Calculate the difference between the current `hard_xray_flux` and the value from exactly $N=3$ minutes prior, divided by the time delta.
    *   *Physical Justification:* This is tied to the Neupert effect, which states that the hard X-ray emission (associated with non-thermal electron acceleration) rapidly rises and peaks before the gradual soft X-ray thermal emission peaks. A steep positive slope here is a strong early indicator of an impulsive flare onset.
    *   *Assumption:* [ASSUMPTION: We have a consistent, regular cadence (e.g., 1-minute) allowing a clean $N=3$ minute lookback without interpolation gaps.]

*   **`hardness_ratio`**: This captures the spectral hardness of the solar emission, identifying periods where high-energy output dominates.
    *   *Proposed Logic:* `hard_bg_subtracted / (soft_bg_subtracted + epsilon)`. The `epsilon` term (e.g., $10^{-6}$) acts as a floor to prevent division-by-zero or explosion in the ratio when soft flux is near zero or missing.

*   **`soft_bg_trend`**: This measures the longer-term evolution of the baseline thermal environment of the solar corona.
    *   *Proposed Logic:* Calculate the slope of an Ordinary Least Squares (OLS) linear regression line fitted over a trailing 6-hour rolling window of `soft_bg_subtracted`.
    *   *Justification:* A longer window (6 hours) is distinctly larger than the impulsive `hard_rate_of_rise` window, helping to capture slow coronal heating or the gradual emergence of active regions preceding a flare.
    *   *Assumption:* [ASSUMPTION: The 6-hour window will not contain large contiguous NaN gaps that would invalidate a rolling slope calculation.]

*   **`recent_flare_count`**: A proxy for the productivity and magnetic complexity of currently visible active regions.
    *   *Proposed Logic:* Count the number of unique flare events occurring within a trailing 24-hour window. This should ideally be pulled from C's detection module / `master_catalogue.csv`. If that catalogue is unavailable during training, use a fallback heuristic (e.g., counting instances where `soft_bg_subtracted` exceeds a fixed C-class threshold).

*   **`label_30min`, `label_60min`, `label_120min`**: The ground-truth targets for our supervised forecasting models.
    *   *Proposed Logic:* For a given row at timestamp $T$, the label is boolean `True` if a flare onset (derived from the `start_time` column in `master_catalogue.csv`) occurs at any point within the interval $(T, T + N\text{ minutes}]$, where $N \in \{30, 60, 120\}$. Otherwise, it is `False`.
    *   *Assumption:* [ASSUMPTION: We have a comprehensive catalogue of historical flares covering our training period, aligned to our common timestamp cadence.]

## Part 3: Explicit Assumptions for Day 3 Schema Confirmation (A)

*   [ ] Confirm timestamp cadence in `combined_lightcurve.csv` is regular/resampled (e.g., strictly 1-minute bins), not the raw irregular instrument cadence.
*   [ ] Confirm `soft_bg_subtracted` and `hard_bg_subtracted` will not contain NaN gaps longer than 15 minutes that would break our rolling derivative and trend calculations.
*   [ ] Confirm if Aditya-L1 and GOES data ranges overlap smoothly, or if we need to handle specific crossover logic where one source abruptly cuts out and the other takes over.
*   [ ] Confirm the total continuous date range available for training, so we know if our 24-hour trailing window for `recent_flare_count` will consume an unacceptable percentage of our total data points at the start of the dataset.

***

*Reminder: Manually share this file with A before the evening stand-up, as today's integration point requires confirming this feature schema matches what A's data actually supports.*
