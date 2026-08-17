"""
routers/patients.py

Patient CRUD endpoints — all protected by JWT.

Endpoints:
    POST   /api/patients            Create a new patient record
    GET    /api/patients            List all patients (skip/limit pagination, optional name search)
    GET    /api/patients/{id}       Get a single patient by ID
    PUT    /api/patients/{id}       Update patient record (any logged-in user)
    DELETE /api/patients/{id}       Hard-delete (ADMIN or DOCTOR role only)
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.auth.dependencies import get_current_user
from app.schemas.patient import PatientCreate, PatientResponse

router = APIRouter(prefix="/api/patients", tags=["Patients"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_patient(patient_id: int, db: Session) -> Patient:
    """Return a Patient or raise 404."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} not found.",
        )
    return patient


def _require_admin_or_doctor(current_user: User) -> None:
    if current_user.role not in (UserRole.ADMIN, UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only ADMIN or DOCTOR users can perform this action.",
        )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    body: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new patient record."""
    patient = Patient(**body.model_dump(), created_by_id=current_user.id)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Filter by patient name (partial match)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List patients with optional name search and pagination."""
    query = db.query(Patient)
    if search:
        query = query.filter(Patient.name.ilike(f"%{search}%"))
    return query.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single patient by ID."""
    return _require_patient(patient_id, db)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    body: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update all fields of a patient record."""
    patient = _require_patient(patient_id, db)
    for field, value in body.model_dump().items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hard-delete a patient and all their predictions (ADMIN/DOCTOR only)."""
    _require_admin_or_doctor(current_user)
    patient = _require_patient(patient_id, db)
    db.delete(patient)
    db.commit()
