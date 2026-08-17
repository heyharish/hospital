"""
prediction.py

Loads the trained pipeline ONCE and exposes a function to run a real
prediction + risk classification. The model is never retrained here.

Risk thresholds are intentionally configurable and NOT claimed to be
medically validated (see README / disclaimer).
"""

import os
import joblib
import pandas as pd

from app.ml.preprocessing import ALL_FEATURES
from app.ml.explainability import ReadmissionExplainer

# app/ml/prediction.py -> app/ml -> app -> backend -> backend/model
MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "model", "readmission_model.pkl"
)

# Configurable risk thresholds. NOT medically validated — prototype only.
RISK_THRESHOLDS = {
    "low_max": 0.39,
    "medium_max": 0.69,
}


def classify_risk(probability: float) -> str:
    if probability <= RISK_THRESHOLDS["low_max"]:
        return "LOW"
    elif probability <= RISK_THRESHOLDS["medium_max"]:
        return "MEDIUM"
    else:
        return "HIGH"


class ReadmissionPredictor:
    def __init__(self):
        self.pipeline = joblib.load(MODEL_PATH)
        self.explainer = ReadmissionExplainer(self.pipeline)

    def predict(self, features: dict) -> dict:
        """
        features: dict of raw feature values (as received from the API request)
        Returns a dict matching the response contract used by the prediction API.
        """
        input_df = pd.DataFrame([features])[ALL_FEATURES]

        probability = float(self.pipeline.predict_proba(input_df)[0][1])
        prediction_label = "READMITTED" if probability >= 0.5 else "NOT_READMITTED"
        risk_level = classify_risk(probability)

        important_factors = self.explainer.explain(input_df, top_n=5)

        return {
            "prediction": prediction_label,
            "probability": round(probability, 4),
            "riskLevel": risk_level,
            "importantFactors": important_factors,
        }


# Singleton instance — loaded once when the FastAPI app starts,
# NOT on every request.
predictor = ReadmissionPredictor()
