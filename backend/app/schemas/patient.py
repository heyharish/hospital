"""
schemas/patient.py

Pydantic schemas for the Patient API.

PatientCreate  — validated input for POST /api/patients and PUT /api/patients/{id}
PatientResponse — what the API returns (never exposes internal FK ids beyond created_by_id)
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.models.patient import GenderEnum
from app.ml.preprocessing import ALLOWED_CATEGORIES


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    gender: GenderEnum

    # Categorical ML features — validated against allowed training-data categories
    age: str
    medical_specialty: str
    diag_1: str
    diag_2: str
    diag_3: str
    glucose_test: str
    A1Ctest: str
    change: str
    diabetes_med: str

    # Numerical ML features
    time_in_hospital: int = Field(..., ge=1, le=14)
    n_lab_procedures: int = Field(..., ge=0)
    n_procedures: int = Field(..., ge=0)
    n_medications: int = Field(..., ge=0)
    n_outpatient: int = Field(0, ge=0)
    n_inpatient: int = Field(0, ge=0)
    n_emergency: int = Field(0, ge=0)

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v not in ALLOWED_CATEGORIES["age"]:
            raise ValueError(f"age must be one of {ALLOWED_CATEGORIES['age']}")
        return v

    @field_validator("medical_specialty")
    @classmethod
    def validate_medical_specialty(cls, v):
        if v not in ALLOWED_CATEGORIES["medical_specialty"]:
            raise ValueError(f"medical_specialty must be one of {ALLOWED_CATEGORIES['medical_specialty']}")
        return v

    @field_validator("diag_1")
    @classmethod
    def validate_diag_1(cls, v):
        if v not in ALLOWED_CATEGORIES["diag_1"]:
            raise ValueError(f"diag_1 must be one of {ALLOWED_CATEGORIES['diag_1']}")
        return v

    @field_validator("diag_2")
    @classmethod
    def validate_diag_2(cls, v):
        if v not in ALLOWED_CATEGORIES["diag_2"]:
            raise ValueError(f"diag_2 must be one of {ALLOWED_CATEGORIES['diag_2']}")
        return v

    @field_validator("diag_3")
    @classmethod
    def validate_diag_3(cls, v):
        if v not in ALLOWED_CATEGORIES["diag_3"]:
            raise ValueError(f"diag_3 must be one of {ALLOWED_CATEGORIES['diag_3']}")
        return v

    @field_validator("glucose_test")
    @classmethod
    def validate_glucose_test(cls, v):
        if v not in ALLOWED_CATEGORIES["glucose_test"]:
            raise ValueError(f"glucose_test must be one of {ALLOWED_CATEGORIES['glucose_test']}")
        return v

    @field_validator("A1Ctest")
    @classmethod
    def validate_a1ctest(cls, v):
        if v not in ALLOWED_CATEGORIES["A1Ctest"]:
            raise ValueError(f"A1Ctest must be one of {ALLOWED_CATEGORIES['A1Ctest']}")
        return v

    @field_validator("change")
    @classmethod
    def validate_change(cls, v):
        if v not in ALLOWED_CATEGORIES["change"]:
            raise ValueError(f"change must be one of {ALLOWED_CATEGORIES['change']}")
        return v

    @field_validator("diabetes_med")
    @classmethod
    def validate_diabetes_med(cls, v):
        if v not in ALLOWED_CATEGORIES["diabetes_med"]:
            raise ValueError(f"diabetes_med must be one of {ALLOWED_CATEGORIES['diabetes_med']}")
        return v


class PatientResponse(BaseModel):
    id: int
    name: str
    gender: GenderEnum
    age: str
    medical_specialty: str
    diag_1: str
    diag_2: str
    diag_3: str
    glucose_test: str
    A1Ctest: str
    change: str
    diabetes_med: str
    time_in_hospital: int
    n_lab_procedures: int
    n_procedures: int
    n_medications: int
    n_outpatient: int
    n_inpatient: int
    n_emergency: int
    created_by_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
