"""
schemas/prediction.py

Pydantic schemas for the Prediction (ML inference) API.
"""

from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel

from app.models.prediction import RiskLevel, PredictionLabel


class PredictRequest(BaseModel):
    """Body for POST /api/predict — just the patient id; features come from DB."""
    patient_id: int


class ImportantFactor(BaseModel):
    feature: str
    impact: float


class PredictResponse(BaseModel):
    id: int
    patient_id: int
    prediction: PredictionLabel
    probability: float
    riskLevel: RiskLevel
    importantFactors: List[ImportantFactor]
    performed_by_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionListItem(BaseModel):
    id: int
    patient_id: int
    prediction_label: PredictionLabel
    probability: float
    risk_level: RiskLevel
    performed_by_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
