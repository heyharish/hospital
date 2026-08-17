"""
main.py

Single unified FastAPI backend entry point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings

# Import ALL models so SQLAlchemy knows about them before create_all()
from app.models import user, patient, prediction  # noqa: F401

from app.routers import auth as auth_router
from app.routers import patients as patients_router
from app.routers import predictions as predictions_router
from app.routers import dashboard as dashboard_router

# Creates any tables that don't exist yet. Safe to call every startup —
# it does NOT drop or alter existing tables.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hospital Readmission AI - Backend",
    description="Unified FastAPI backend: auth, patients, predictions, dashboard, ML.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(patients_router.router)
app.include_router(predictions_router.router)
app.include_router(dashboard_router.router)


@app.get("/health")
def health():
    return {"status": "UP", "service": "hospital-readmission-backend"}
