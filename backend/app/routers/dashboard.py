"""
routers/dashboard.py

Aggregate statistics endpoint for the frontend Dashboard page.

Endpoints:
    GET /api/dashboard/stats    — high-level counts + risk distribution + recent activity

All endpoints require a valid JWT token.
"""

from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prediction import Prediction, RiskLevel
from app.auth.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# ── Response schemas (inline — simple enough to not warrant a separate file) ──

class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int


class RecentPrediction(BaseModel):
    prediction_id: int
    patient_id: int
    patient_name: str
    risk_level: RiskLevel
    probability: float
    created_at: datetime


class DashboardStats(BaseModel):
    total_patients: int
    total_predictions: int
    predictions_last_7_days: int
    risk_distribution: RiskDistribution
    recent_predictions: List[RecentPrediction]


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns:
    - Total patient count
    - Total prediction count
    - Predictions made in the last 7 days
    - Risk distribution (LOW / MEDIUM / HIGH counts across ALL predictions)
    - 10 most recent predictions with patient name
    """
    total_patients = db.query(func.count(Patient.id)).scalar()
    total_predictions = db.query(func.count(Prediction.id)).scalar()

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    predictions_last_7_days = (
        db.query(func.count(Prediction.id))
        .filter(Prediction.created_at >= seven_days_ago)
        .scalar()
    )

    # Risk distribution — count per risk_level across all predictions
    risk_counts = (
        db.query(Prediction.risk_level, func.count(Prediction.id))
        .group_by(Prediction.risk_level)
        .all()
    )
    risk_map = {row[0]: row[1] for row in risk_counts}
    risk_distribution = RiskDistribution(
        low=risk_map.get(RiskLevel.LOW, 0),
        medium=risk_map.get(RiskLevel.MEDIUM, 0),
        high=risk_map.get(RiskLevel.HIGH, 0),
    )

    # 10 most recent predictions joined with patient name
    recent_rows = (
        db.query(Prediction, Patient.name)
        .join(Patient, Prediction.patient_id == Patient.id)
        .order_by(Prediction.created_at.desc())
        .limit(10)
        .all()
    )
    recent_predictions = [
        RecentPrediction(
            prediction_id=pred.id,
            patient_id=pred.patient_id,
            patient_name=name,
            risk_level=pred.risk_level,
            probability=pred.probability,
            created_at=pred.created_at,
        )
        for pred, name in recent_rows
    ]

    return DashboardStats(
        total_patients=total_patients,
        total_predictions=total_predictions,
        predictions_last_7_days=predictions_last_7_days,
        risk_distribution=risk_distribution,
        recent_predictions=recent_predictions,
    )
