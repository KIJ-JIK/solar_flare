import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, precision_recall_curve, roc_curve, auc, precision_score, recall_score
import matplotlib.pyplot as plt
import seaborn as sns

def train_forecasters():
    print("Training predictive models (Member C)...")
    
    features_path = "data/processed/features.csv"
    if not os.path.exists(features_path):
        raise FileNotFoundError(f"Missing features file: {features_path}. Run feature engineer first.")
        
    df = pd.read_csv(features_path)
    
    # Drop rows with NaNs (first few shift rows)
    df = df.dropna().reset_index(drop=True)
    
    # Separate features and targets
    feature_cols = ["hard_rate_of_rise", "hardness_ratio", "soft_bg_trend", "recent_flare_count"]
    X = df[feature_cols]
    
    targets = ["label_30min", "label_60min", "label_120min"]
    
    # Train-test split: Temporal split (first 75% train, last 25% test) to prevent time-series leakage
    split_idx = int(0.75 * len(df))
    
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    
    os.makedirs("outputs/plots", exist_ok=True)
    
    # Set style
    sns.set_theme(style="darkgrid")
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    reports = {}
    
    for target in targets:
        y = df[target].astype(int)
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
        
        # Train Random Forest Classifier
        # Set class_weight='balanced' to handle class imbalance of flare events
        clf = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight='balanced', random_state=42)
        clf.fit(X_train, y_train)
        
        # Predictions
        y_pred = clf.predict(X_test)
        y_prob = clf.predict_proba(X_test)[:, 1]
        
        # Metrics
        rec = recall_score(y_test, y_pred) # TPR
        prec = precision_score(y_test, y_pred)
        far = 1.0 - prec if (prec + rec) > 0 else 0.0 # FAR = FP / (TP + FP)
        
        # Heidke Skill Score (HSS) calculation
        # Confusion matrix elements
        from sklearn.metrics import confusion_matrix
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
        
        expected_correct = ((tp + fn)*(tp + fp) + (tn + fn)*(tn + fp)) / (tp + tn + fp + fn)
        hss = (tp + tn - expected_correct) / (tp + tn + fp + fn - expected_correct + 1e-12)
        
        reports[target] = {
            "TPR": rec,
            "FAR": far,
            "HSS": hss,
            "F1-Score": 2 * prec * rec / (prec + rec + 1e-12)
        }
        
        print(f"\nEvaluation for {target}:")
        print(f"  True Positive Rate (TPR): {rec:.2f}")
        print(f"  False Alarm Rate (FAR):  {far:.2f}")
        print(f"  Heidke Skill Score (HSS): {hss:.2f}")
        
        # Plot ROC curve
        fpr_curve, tpr_curve, _ = roc_curve(y_test, y_prob)
        roc_auc = auc(fpr_curve, tpr_curve)
        axes[0].plot(fpr_curve, tpr_curve, label=f'{target} (AUC = {roc_auc:.2f})')
        
        # Plot Precision-Recall curve
        p_curve, r_curve, _ = precision_recall_curve(y_test, y_prob)
        axes[1].plot(r_curve, p_curve, label=f'{target}')
        
    # Finalize curves plot
    axes[0].plot([0, 1], [0, 1], 'k--', alpha=0.5)
    axes[0].set_xlabel('False Positive Rate')
    axes[0].set_ylabel('True Positive Rate')
    axes[0].set_title('Receiver Operating Characteristic (ROC) Curves')
    axes[0].legend(loc='lower right')
    
    axes[1].set_xlabel('Recall (True Positive Rate)')
    axes[1].set_ylabel('Precision')
    axes[1].set_title('Precision-Recall Curves')
    axes[1].legend(loc='lower left')
    
    plt.tight_layout()
    plot_path = "outputs/plots/forecast_roc_pr_curves.png"
    plt.savefig(plot_path, dpi=150)
    plt.close()
    
    # 2. Time-series comparison plot for label_60min on test set
    plt.figure(figsize=(14, 5))
    y_test_60 = df["label_60min"].iloc[split_idx:].values
    
    # Train specific model again to plot probabilities
    clf_60 = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight='balanced', random_state=42)
    clf_60.fit(X_train, df["label_60min"].iloc[:split_idx].astype(int))
    probs_60 = clf_60.predict_proba(X_test)[:, 1]
    
    # Subsample for visual clarity (plot last 12 hours of test data)
    plot_samples = min(4320, len(X_test)) # 12 hours is 4320 samples at 10-second cadence
    x_axis = np.arange(plot_samples)
    
    plt.plot(x_axis, probs_60[-plot_samples:], label='Predicted Flare Probability (60 min)', color='blue', alpha=0.7)
    plt.fill_between(x_axis, 0, y_test_60[-plot_samples:], facecolor='orange', alpha=0.2, label='Actual Flare Window')
    plt.xlabel('Time Steps (10s intervals)')
    plt.ylabel('Probability')
    plt.title('Forecasting Alert Probability vs. Ground-Truth Window (60-Minute Horizon)')
    plt.ylim(-0.05, 1.05)
    plt.legend(loc='upper right')
    
    ts_plot_path = "outputs/plots/forecast_timeseries_comparison.png"
    plt.savefig(ts_plot_path, dpi=150)
    plt.close()
    
    print("\nModels successfully trained and validation plots generated under outputs/plots/.")

if __name__ == "__main__":
    train_forecasters()
