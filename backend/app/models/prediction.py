"""
models/prediction.py

SQLAlchemy model for the 'predictions' table.

Each row represents one ML inference run:
  - which patient was assessed
  - who triggered the prediction
  - the raw probability, risk classification, and top contributing factors
  - when it happened

'important_factors' is stored as a JSON column so the list of
{feature, impact} dicts from the SHAP explainer can be read back
without any secondary table.
"""

import enum
from sqlalchemy import Column, Integer, Float, String, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class PredictionLabel(str, enum.Enum):
    READMITTED = "READMITTED"
    NOT_READMITTED = "NOT_READMITTED"


class Prediction(Base):
    __tablename__ = "predictions"

    # ── Primary key ──────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── Foreign keys ─────────────────────────────────────────────────────────
    patient_id = Column(
        Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    performed_by_id = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )

    # ── ML outputs ────────────────────────────────────────────────────────────
    probability = Column(Float, nullable=False)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    prediction_label = Column(Enum(PredictionLabel), nullable=False)

    # Stored as JSON array: [{"feature": "n_inpatient", "impact": 0.42}, ...]
    important_factors = Column(JSON, nullable=True)

    # ── Audit ─────────────────────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── Relationships ─────────────────────────────────────────────────────────
    patient = relationship("Patient", back_populates="predictions")
    performed_by = relationship("User", foreign_keys=[performed_by_id])
