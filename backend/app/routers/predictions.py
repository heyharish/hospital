"""
routers/predictions.py

ML prediction endpoints — all protected by JWT.

Endpoints:
    POST  /api/predict                          Run ML prediction for a patient; store result
    GET   /api/predictions                      List all predictions (optional patient_id filter)
    GET   /api/predictions/{id}                 Get a single prediction by ID
    GET   /api/patients/{patient_id}/predictions  All predictions for a patient

Design:
    POST /api/predict accepts only { patient_id }.
    It fetches the patient's clinical features from the DB, builds the
    feature dict the ML pipeline expects, runs inference via ReadmissionPredictor,
    and persists the result.  The caller never sends raw ML features over the wire.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.models.prediction import Prediction, RiskLevel, PredictionLabel
from app.auth.dependencies import get_current_user
from app.schemas.prediction import PredictRequest, PredictResponse, PredictionListItem
from app.ml.prediction import predictor          # singleton loaded at startup
from app.ml.preprocessing import NUMERICAL_FEATURES, CATEGORICAL_FEATURES

router = APIRouter(tags=["Predictions"])

ALL_ML_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES


# ── Helpers ───────────────────────────────────────────────────────────────────

def _patient_to_feature_dict(patient: Patient) -> dict:
    """
    Extract the exact feature set the ML pipeline expects from a Patient ORM object.
    Column names on the model match preprocessing.py feature names, so a simple
    getattr loop is sufficient.
    """
    return {col: getattr(patient, col) for col in ALL_ML_FEATURES}


def _require_prediction(prediction_id: int, db: Session) -> Prediction:
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with id {prediction_id} not found.",
        )
    return pred


def _orm_to_predict_response(pred: Prediction) -> PredictResponse:
    """Map a Prediction ORM row to the PredictResponse schema."""
    return PredictResponse(
        id=pred.id,
        patient_id=pred.patient_id,
        prediction=pred.prediction_label,
        probability=pred.probability,
        riskLevel=pred.risk_level,
        importantFactors=pred.important_factors or [],
        performed_by_id=pred.performed_by_id,
        created_at=pred.created_at,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/api/predict", response_model=PredictResponse, status_code=status.HTTP_201_CREATED)
def run_prediction(
    body: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run ML readmission prediction for a patient.

    - Fetches the patient's clinical data from the DB (no raw features in request body).
    - Calls the trained sklearn/XGBoost pipeline.
    - Persists the result (probability, risk level, SHAP factors) to the DB.
    - Returns the full prediction result.
    """
    # 1. Resolve patient
    patient = db.query(Patient).filter(Patient.id == body.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {body.patient_id} not found.",
        )

    # 2. Build ML feature dict and run inference
    features = _patient_to_feature_dict(patient)
    result = predictor.predict(features)   # returns dict from ReadmissionPredictor

    # 3. Persist result
    db_pred = Prediction(
        patient_id=patient.id,
        performed_by_id=current_user.id,
        probability=result["probability"],
        risk_level=RiskLevel(result["riskLevel"]),
        prediction_label=PredictionLabel(result["prediction"]),
        important_factors=result["importantFactors"],
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)

    return _orm_to_predict_response(db_pred)


@router.get("/api/predictions", response_model=List[PredictionListItem])
def list_predictions(
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List prediction history, optionally filtered by patient."""
    query = db.query(Prediction)
    if patient_id is not None:
        query = query.filter(Prediction.patient_id == patient_id)
    return query.order_by(Prediction.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/api/predictions/{prediction_id}", response_model=PredictResponse)
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single prediction result by its ID."""
    pred = _require_prediction(prediction_id, db)
    return _orm_to_predict_response(pred)


@router.get("/api/patients/{patient_id}/predictions", response_model=List[PredictionListItem])
def get_patient_predictions(
    patient_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All prediction history for a specific patient."""
    # Verify patient exists first
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} not found.",
        )
    return (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
