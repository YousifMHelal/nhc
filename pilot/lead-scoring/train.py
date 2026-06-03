#!/usr/bin/env python3
"""
NHC CRM — Lead Scoring Pilot: Training Script
==============================================
Trains a logistic regression model on the labelled lead dataset, evaluates it
on a holdout set, and exports coefficients + feature metadata to model.json.

Usage:
    pip install scikit-learn numpy
    python train.py

Output:
    model.json  — coefficients, intercept, feature metadata, eval metrics
"""

import json
import math
import os
import sys
from pathlib import Path

# ── Try to import scikit-learn; fall back to transparent weighted-factor scheme ─

try:
    import numpy as np
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    from sklearn.metrics import (
        roc_auc_score, accuracy_score, confusion_matrix,
        classification_report, precision_score, recall_score,
    )
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("WARNING: scikit-learn not found. Falling back to weighted-factor scheme.")

# ── Feature engineering ──────────────────────────────────────────────────────

SOURCE_SCORE = {
    "Referral":   1.0,
    "Exhibition": 0.8,
    "Web":        0.6,
    "Campaign":   0.5,
    "Social":     0.4,
    "Cold Call":  0.3,
}
CHANNEL_SCORE = {
    "WhatsApp": 1.0,
    "Email":    0.7,
    "Web":      0.6,
    "Social":   0.4,
    "SMS":      0.3,
}
PROPERTY_SCORE = {
    "فيلا":      1.0,
    "تاون هاوس": 0.85,
    "دوبلكس":    0.75,
    "شقة":       0.65,
    "أرض":       0.5,
}

BUDGET_MAX = 5_000_000
INTERACTION_MAX = 8
RECENCY_MAX = 120
DAYS_IN_PIPELINE_MAX = 300


def featurise(record: dict) -> list:
    """Convert a raw training record into a normalised feature vector.

    Feature index  Name
    0              source_score        (0–1)
    1              channel_score       (0–1)
    2              property_score      (0–1)
    3              city_tier_norm      (0–1; tier 1=1.0, tier 2=0.6, tier 3=0.3)
    4              budget_norm         (0–1; capped at BUDGET_MAX)
    5              interaction_norm    (0–1; capped at INTERACTION_MAX)
    6              has_site_visit      (0 or 1)
    7              has_email           (0 or 1)
    8              recency_score       (0–1; higher = more recent = better)
    9              pipeline_age_score  (0–1; inverse — longer stale = lower)
    """
    city_tier_map = {1: 1.0, 2: 0.6, 3: 0.3}
    recency_score = max(0.0, 1.0 - record["recency_days"] / RECENCY_MAX)
    pipeline_age_score = max(0.0, 1.0 - record["days_in_pipeline"] / DAYS_IN_PIPELINE_MAX)

    return [
        SOURCE_SCORE.get(record["source"], 0.4),
        CHANNEL_SCORE.get(record["channel"], 0.4),
        PROPERTY_SCORE.get(record["property_interest"], 0.6),
        city_tier_map.get(record["city_tier"], 0.3),
        min(record["budget_riyal"] / BUDGET_MAX, 1.0),
        min(record["interaction_count"] / INTERACTION_MAX, 1.0),
        float(record["has_site_visit"]),
        float(record["has_email"]),
        recency_score,
        pipeline_age_score,
    ]


FEATURE_NAMES = [
    "source_score",
    "channel_score",
    "property_score",
    "city_tier_norm",
    "budget_norm",
    "interaction_norm",
    "has_site_visit",
    "has_email",
    "recency_score",
    "pipeline_age_score",
]

FEATURE_LABELS_AR = [
    "قوة مصدر العميل",
    "قوة قناة التواصل",
    "نوع العقار المفضل",
    "تمركز المدينة",
    "الملاءة المالية",
    "كثافة التفاعل",
    "زيارة الموقع",
    "توفر البريد الإلكتروني",
    "حداثة التواصل",
    "عمر الفرصة",
]


# ── Weighted-factor fallback ─────────────────────────────────────────────────

FALLBACK_WEIGHTS = [0.18, 0.12, 0.10, 0.08, 0.20, 0.15, 0.07, 0.04, 0.04, 0.02]


def weighted_score(features: list) -> float:
    return sum(w * f for w, f in zip(FALLBACK_WEIGHTS, features))


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    script_dir = Path(__file__).parent
    data_path = script_dir / "training-data.json"
    output_path = script_dir / "model.json"

    with open(data_path) as f:
        data = json.load(f)

    records = data["records"]
    X = [featurise(r) for r in records]
    y = [r["label"] for r in records]
    ids = [r["id"] for r in records]

    n_total = len(records)
    n_pos = sum(y)
    n_neg = n_total - n_pos
    print(f"Dataset: {n_total} records — {n_pos} Closed Won, {n_neg} negative")

    if not SKLEARN_AVAILABLE:
        # ── Fallback: transparent weighted-factor scheme ──────────────────
        print("Using fallback weighted-factor scheme (no scikit-learn).")
        model_json = build_fallback_model(X, y, ids)
    else:
        model_json = build_sklearn_model(X, y, ids)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(model_json, f, ensure_ascii=False, indent=2)

    print(f"\nModel exported → {output_path}")
    auc_mean = model_json['eval']['auc_cv_mean']
    auc_std  = model_json['eval']['auc_cv_std']
    if auc_mean is not None:
        print(f"  AUC (CV)  : {auc_mean:.3f} ± {auc_std:.3f}")
    else:
        print("  AUC (CV)  : N/A (weighted-factor fallback)")
    print(f"  Accuracy  : {model_json['eval']['accuracy_holdout']:.3f}")
    print(f"  Precision : {model_json['eval']['precision_holdout']:.3f}")
    print(f"  Recall    : {model_json['eval']['recall_holdout']:.3f}")


def build_sklearn_model(X, y, ids):
    import numpy as np

    X_np = np.array(X)
    y_np = np.array(y)

    # Stratified 5-fold CV for AUC
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_np)

    clf = LogisticRegression(random_state=42, max_iter=1000, C=1.0)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    auc_scores = cross_val_score(clf, X_scaled, y_np, cv=cv, scoring="roc_auc")
    print(f"5-fold CV AUC: {auc_scores.mean():.3f} ± {auc_scores.std():.3f}")

    # Final fit on full dataset for export; holdout = last 10 records
    holdout_n = 10
    X_train, X_test = X_scaled[:-holdout_n], X_scaled[-holdout_n:]
    y_train, y_test = y_np[:-holdout_n], y_np[-holdout_n:]
    ids_test = ids[-holdout_n:]

    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    auc_holdout = roc_auc_score(y_test, y_prob) if len(set(y_test)) > 1 else float("nan")
    cm = confusion_matrix(y_test, y_pred).tolist()

    print(f"Holdout ({holdout_n} records):")
    print(f"  Accuracy={acc:.3f}  Precision={prec:.3f}  Recall={rec:.3f}  AUC={auc_holdout:.3f}")
    print(f"  Confusion matrix: {cm}")
    print(classification_report(y_test, y_pred, target_names=["Negative", "Positive"]))

    # Refit on ALL data for export
    clf_final = LogisticRegression(random_state=42, max_iter=1000, C=1.0)
    clf_final.fit(X_scaled, y_np)
    coef = clf_final.coef_[0].tolist()
    intercept = float(clf_final.intercept_[0])
    mean_ = scaler.mean_.tolist()
    scale_ = scaler.scale_.tolist()

    # Feature importance: abs(coef * std_input) normalised to sum=1
    importances_raw = [abs(c) for c in coef]
    imp_total = sum(importances_raw) or 1.0
    importances = [v / imp_total for v in importances_raw]

    # Holdout predictions for precision@k
    probs_all = clf_final.predict_proba(X_scaled)[:, 1]
    ranked = sorted(zip(probs_all.tolist(), y), key=lambda x: -x[0])
    top10_hits = sum(lbl for _, lbl in ranked[:10])
    precision_at_10 = top10_hits / 10

    print(f"Precision@10 (all data): {precision_at_10:.2f}")

    # Holdout per-lead predictions
    holdout_preds = []
    for lid, prob, actual, pred in zip(ids_test, y_prob.tolist(), y_test.tolist(), y_pred.tolist()):
        holdout_preds.append({"id": lid, "prob": round(prob, 3), "actual": int(actual), "pred": int(pred)})

    return {
        "version": "1.0.0",
        "model_type": "logistic_regression",
        "trained_at": "2026-06-03",
        "n_train": len(X),
        "feature_names": FEATURE_NAMES,
        "feature_labels_ar": FEATURE_LABELS_AR,
        "scaler": {"mean": mean_, "scale": scale_},
        "coef": coef,
        "intercept": intercept,
        "feature_importances": importances,
        "eval": {
            "auc_cv_mean": round(float(auc_scores.mean()), 4),
            "auc_cv_std": round(float(auc_scores.std()), 4),
            "accuracy_holdout": round(acc, 4),
            "precision_holdout": round(prec, 4),
            "recall_holdout": round(rec, 4),
            "auc_holdout": round(auc_holdout, 4) if not math.isnan(auc_holdout) else None,
            "confusion_matrix": cm,
            "precision_at_10": round(precision_at_10, 4),
            "holdout_predictions": holdout_preds,
        },
        "scoring": {
            "source_scores": SOURCE_SCORE,
            "channel_scores": CHANNEL_SCORE,
            "property_scores": PROPERTY_SCORE,
            "budget_max": BUDGET_MAX,
            "interaction_max": INTERACTION_MAX,
            "recency_max": RECENCY_MAX,
            "days_in_pipeline_max": DAYS_IN_PIPELINE_MAX,
        },
    }


def build_fallback_model(X, y, ids):
    scores = [weighted_score(x) for x in X]
    holdout_n = 10
    scores_test = scores[-holdout_n:]
    y_test = y[-holdout_n:]
    threshold = 0.5
    preds = [1 if s >= threshold else 0 for s in scores_test]

    correct = sum(p == a for p, a in zip(preds, y_test))
    acc = correct / holdout_n
    tp = sum(p == 1 and a == 1 for p, a in zip(preds, y_test))
    fp = sum(p == 1 and a == 0 for p, a in zip(preds, y_test))
    fn = sum(p == 0 and a == 1 for p, a in zip(preds, y_test))
    tn = sum(p == 0 and a == 0 for p, a in zip(preds, y_test))
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0

    ranked = sorted(zip(scores, y), key=lambda x: -x[0])
    top10_hits = sum(lbl for _, lbl in ranked[:10])
    p_at_10 = top10_hits / 10

    return {
        "version": "1.0.0",
        "model_type": "weighted_factor",
        "trained_at": "2026-06-03",
        "n_train": len(X),
        "feature_names": FEATURE_NAMES,
        "feature_labels_ar": FEATURE_LABELS_AR,
        "scaler": None,
        "coef": FALLBACK_WEIGHTS,
        "intercept": 0.0,
        "feature_importances": FALLBACK_WEIGHTS,
        "eval": {
            "auc_cv_mean": None,
            "auc_cv_std": None,
            "accuracy_holdout": round(acc, 4),
            "precision_holdout": round(prec, 4),
            "recall_holdout": round(rec, 4),
            "auc_holdout": None,
            "confusion_matrix": [[tn, fp], [fn, tp]],
            "precision_at_10": round(p_at_10, 4),
            "holdout_predictions": [],
        },
        "scoring": {
            "source_scores": SOURCE_SCORE,
            "channel_scores": CHANNEL_SCORE,
            "property_scores": PROPERTY_SCORE,
            "budget_max": BUDGET_MAX,
            "interaction_max": INTERACTION_MAX,
            "recency_max": RECENCY_MAX,
            "days_in_pipeline_max": DAYS_IN_PIPELINE_MAX,
        },
    }


if __name__ == "__main__":
    main()
