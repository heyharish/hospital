"""
models/patient.py

SQLAlchemy model for the 'patients' table.

Column names intentionally mirror the feature names in app/ml/preprocessing.py
so that building the ML prediction dict is a simple model.__dict__ lookup,
with no field renaming at the router layer.
"""

import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class GenderEnum(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Patient(Base):
    __tablename__ = "patients"

    # ── Primary key ──────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── Demographic ───────────────────────────────────────────────────────────
    name = Column(String(150), nullable=False, index=True)
    gender = Column(Enum(GenderEnum), nullable=False)

    # ── ML categorical features ───────────────────────────────────────────────
    # These match CATEGORICAL_FEATURES in app/ml/preprocessing.py exactly.
    age = Column(String(20), nullable=False)           # e.g. "[70-80)"
    medical_specialty = Column(String(50), nullable=False)
    diag_1 = Column(String(30), nullable=False)
    diag_2 = Column(String(30), nullable=False)
    diag_3 = Column(String(30), nullable=False)
    glucose_test = Column(String(10), nullable=False)  # "no" | "normal" | "high"
    A1Ctest = Column(String(10), nullable=False)       # "no" | "high" | "normal"
    change = Column(String(5), nullable=False)          # "no" | "yes"
    diabetes_med = Column(String(5), nullable=False)    # "yes" | "no"

    # ── ML numerical features ─────────────────────────────────────────────────
    # These match NUMERICAL_FEATURES in app/ml/preprocessing.py exactly.
    time_in_hospital = Column(Integer, nullable=False)
    n_lab_procedures = Column(Integer, nullable=False)
    n_procedures = Column(Integer, nullable=False)
    n_medications = Column(Integer, nullable=False)
    n_outpatient = Column(Integer, nullable=False, default=0)
    n_inpatient = Column(Integer, nullable=False, default=0)
    n_emergency = Column(Integer, nullable=False, default=0)

    # ── Audit ─────────────────────────────────────────────────────────────────
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    created_by = relationship("User", foreign_keys=[created_by_id])
    predictions = relationship(
        "Prediction", back_populates="patient", cascade="all, delete-orphan"
    )
