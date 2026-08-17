"""
train_model.py

Trains and compares three models for hospital readmission risk prediction:
  1. Logistic Regression
  2. Random Forest
  3. XGBoost

Selects the best model based on Recall / F1 / ROC-AUC (not just accuracy),
because missing a true high-risk patient (false negative) is the costly
error in this problem.

Saves the final chosen pipeline (preprocessing + model bundled together)
to model/readmission_model.pkl
"""

import pandas as pd
import numpy as np
import joblib
import json
import os

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

DATA_PATH = "data/hospital_readmissions.csv"
MODEL_DIR = "model"
MODEL_PATH = os.path.join(MODEL_DIR, "readmission_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

NUMERICAL_FEATURES = [
    "time_in_hospital",
    "n_lab_procedures",
    "n_procedures",
    "n_medications",
    "n_outpatient",
    "n_inpatient",
    "n_emergency",
]

CATEGORICAL_FEATURES = [
    "age",
    "medical_specialty",
    "diag_1",
    "diag_2",
    "diag_3",
    "glucose_test",
    "A1Ctest",
    "change",
    "diabetes_med",
]

TARGET = "readmitted"


def load_data():
    df = pd.read_csv(DATA_PATH)
    return df


def build_preprocessor():
    numeric_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown="ignore")

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERICAL_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES),
        ]
    )
    return preprocessor


def evaluate_model(name, pipeline, X_test, y_test):
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_proba),
    }

    cm = confusion_matrix(y_test, y_pred)

    print(f"\n===== {name} =====")
    for k, v in metrics.items():
        print(f"{k:10s}: {v:.4f}")
    print("Confusion Matrix (rows=actual, cols=predicted) [0=no, 1=yes]:")
    print(cm)
    print(classification_report(y_test, y_pred, target_names=["no", "yes"]))

    return metrics


def main():
    print("Loading dataset...")
    df = load_data()

    # Encode target: yes -> 1, no -> 0
    df[TARGET] = df[TARGET].map({"yes": 1, "no": 0})

    X = df[NUMERICAL_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    preprocessor = build_preprocessor()

    models = {
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "RandomForest": RandomForestClassifier(
            n_estimators=300, random_state=42, n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.1,
            random_state=42,
            eval_metric="logloss",
            n_jobs=-1,
        ),
    }

    results = {}
    fitted_pipelines = {}

    for name, model in models.items():
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])
        pipeline.fit(X_train, y_train)
        metrics = evaluate_model(name, pipeline, X_test, y_test)
        results[name] = metrics
        fitted_pipelines[name] = pipeline

    # ---- Model selection ----
    # Do NOT select purely on accuracy. Rank by ROC-AUC primarily,
    # with recall as a tiebreaker, since false negatives (missing a
    # high-risk patient) are the more dangerous error type here.
    print("\n===== MODEL COMPARISON SUMMARY =====")
    comparison_df = pd.DataFrame(results).T
    print(comparison_df)

    best_name = comparison_df.sort_values(
        by=["roc_auc", "recall"], ascending=False
    ).index[0]

    print(f"\nSelected best model: {best_name}")

    best_pipeline = fitted_pipelines[best_name]

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(best_pipeline, MODEL_PATH)
    print(f"Saved best pipeline to {MODEL_PATH}")

    # Save metrics + which model was chosen, for documentation/reporting
    output = {
        "selected_model": best_name,
        "all_results": results,
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(output, f, indent=2)
    print(f"Saved metrics to {METRICS_PATH}")


if __name__ == "__main__":
    main()
