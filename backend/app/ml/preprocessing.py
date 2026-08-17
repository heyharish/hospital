"""
preprocessing.py

Defines the exact feature schema the trained pipeline expects.

IMPORTANT: This is the single source of truth for feature names/order,
used by both training and the FastAPI service, so we never end up with
two different, silently-drifting definitions of "what the model needs."
"""

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

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

# Allowed categorical values, taken from the actual training data.
# Used for request validation in the FastAPI layer.
ALLOWED_CATEGORIES = {
    "age": ["[40-50)", "[50-60)", "[60-70)", "[70-80)", "[80-90)", "[90-100)"],
    "medical_specialty": [
        "Missing",
        "InternalMedicine",
        "Other",
        "Emergency/Trauma",
        "Family/GeneralPractice",
        "Cardiology",
        "Surgery",
    ],
    "diag_1": [
        "Circulatory", "Other", "Respiratory", "Digestive",
        "Diabetes", "Injury", "Musculoskeletal", "Missing",
    ],
    "diag_2": [
        "Other", "Circulatory", "Diabetes", "Respiratory",
        "Digestive", "Injury", "Musculoskeletal", "Missing",
    ],
    "diag_3": [
        "Other", "Circulatory", "Diabetes", "Respiratory",
        "Digestive", "Injury", "Musculoskeletal", "Missing",
    ],
    "glucose_test": ["no", "normal", "high"],
    "A1Ctest": ["no", "high", "normal"],
    "change": ["no", "yes"],
    "diabetes_med": ["yes", "no"],
}
