# Import all models here so that SQLAlchemy's Base.metadata.create_all()
# sees every table definition, regardless of which module triggers the call.
from app.models import user, patient, prediction  # noqa: F401
