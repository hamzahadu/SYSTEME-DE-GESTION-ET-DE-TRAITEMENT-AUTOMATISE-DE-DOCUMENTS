import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, select, update, and_
from sqlalchemy.orm import sessionmaker, scoped_session

from db_models import Base, CompanyModel, UserModel, DocumentModel, DocumentChunkModel
from models import FileRecord, ProcessingStatus, Company, User

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "docuprocess.db")

# Database connection URL:
# Reads from DATABASE_URL env var if set (e.g. Docker / PostgreSQL), defaults to local SQLite file
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

# Fix for Heroku/Docker legacy postgres:// URLs and ensure psycopg2 driver is used
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# SQLite requires check_same_thread=False for FastAPI multithreaded requests
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def get_db():
    """Dependency helper yielding a SQLAlchemy session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes tables and migrates existing JSON data if database is fresh."""
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(32)"))
            conn.commit()
    except Exception:
        pass
    _migrate_from_json_if_needed()

def _migrate_from_json_if_needed():
    """
    Automatic one-time seed: If the database is empty but db.json / users.json
    exist from the prototype phase, migrate them into the SQL database.
    """
    db = SessionLocal()
    try:
        # Check if already seeded
        company_count = db.query(CompanyModel).count()
        if company_count > 0:
            return

        # 1. Migrate companies.json
        comp_file = os.path.join(BASE_DIR, "companies.json")
        if os.path.exists(comp_file):
            try:
                with open(comp_file, "r") as f:
                    companies_data = json.load(f)
                    seen_cids = set()
                    for c in companies_data:
                        if c["id"] not in seen_cids:
                            created_at = None
                            if c.get("created_at"):
                                try:
                                    created_at = datetime.fromisoformat(str(c["created_at"]).replace("Z", ""))
                                except:
                                    created_at = datetime.utcnow()
                            db.add(CompanyModel(
                                id=c["id"],
                                name=c["name"],
                                plan=c.get("plan", "free"),
                                created_at=created_at or datetime.utcnow()
                            ))
                            seen_cids.add(c["id"])
                    db.commit()
            except Exception as e:
                print(f"[Migration] Error loading companies.json: {e}")
                db.rollback()

        # 2. Migrate users.json
        users_file = os.path.join(BASE_DIR, "users.json")
        if os.path.exists(users_file):
            try:
                with open(users_file, "r") as f:
                    users_data = json.load(f)
                    for u in users_data:
                        db.add(UserModel(
                            id=u["id"],
                            email=u["email"],
                            full_name=u["full_name"],
                            hashed_password=u["hashed_password"],
                            company_id=u["company_id"],
                            role=u.get("role", "admin"),
                            disabled=bool(u.get("disabled", False))
                        ))
                    db.commit()
            except Exception as e:
                print(f"[Migration] Error loading users.json: {e}")
                db.rollback()

        # 3. Migrate db.json (documents)
        db_file = os.path.join(BASE_DIR, "db.json")
        if os.path.exists(db_file):
            try:
                with open(db_file, "r") as f:
                    docs_data = json.load(f)
                    for doc in docs_data:
                        meta = doc.get("metadata") or {}
                        upload_time = None
                        if doc.get("upload_time"):
                            try:
                                upload_time = datetime.fromisoformat(str(doc["upload_time"]).replace("Z", ""))
                            except:
                                upload_time = datetime.utcnow()

                        doc_obj = DocumentModel(
                            id=doc["id"],
                            company_id=doc.get("company_id"),
                            filename=doc["filename"],
                            upload_time=upload_time or datetime.utcnow(),
                            status=doc.get("status", "Queued"),
                            processing_state=doc.get("processing_state", "uploaded"),
                            error_message=doc.get("error_message"),
                            archived=bool(doc.get("archived", False)),
                            document_type=meta.get("document_type", "unknown"),
                            confidence=float(meta.get("confidence", 0.0) or 0.0),
                            invoice_number=meta.get("invoice_number"),
                            invoice_date=meta.get("invoice_date"),
                            vendor_name=meta.get("vendor_name"),
                            subtotal=meta.get("subtotal"),
                            tax_amount=meta.get("tax_amount"),
                            total_amount=meta.get("total_amount"),
                            currency=meta.get("currency", "USD"),
                            category=meta.get("category"),
                            month=meta.get("month"),
                            year=meta.get("year"),
                            tags=meta.get("tags") or [],
                            extracted_fields=meta.get("extracted_fields") or {},
                            extracted_data=meta.get("extracted_data") or {}
                        )
                        db.add(doc_obj)
                    db.commit()
                    print(f"[Migration] Migrated {len(docs_data)} records into SQL database.")
            except Exception as e:
                print(f"[Migration] Error loading db.json: {e}")
                db.rollback()

    finally:
        db.close()


# --- Document Operations ---

def get_all_records(company_id: Optional[str] = None) -> List[FileRecord]:
    """Retrieves all non-archived documents, filtered by company_id if provided."""
    db = SessionLocal()
    try:
        query = db.query(DocumentModel).filter(DocumentModel.archived == False)
        if company_id:
            query = query.filter(DocumentModel.company_id == company_id)
        
        query = query.order_by(DocumentModel.upload_time.desc())
        records = query.all()
        return [FileRecord(**r.to_file_record_dict()) for r in records]
    finally:
        db.close()

def add_record(record: FileRecord):
    """Inserts a new FileRecord into the SQL database."""
    db = SessionLocal()
    try:
        meta = record.metadata.dict() if record.metadata else {}
        doc = DocumentModel(
            id=record.id,
            company_id=record.company_id,
            filename=record.filename,
            upload_time=record.upload_time,
            status=record.status.value if hasattr(record.status, "value") else str(record.status),
            processing_state=record.processing_state.value if hasattr(record.processing_state, "value") else str(record.processing_state),
            error_message=record.error_message,
            archived=record.archived,
            document_type=meta.get("document_type", "unknown"),
            confidence=float(meta.get("confidence", 0.0) or 0.0),
            invoice_number=meta.get("invoice_number"),
            invoice_date=meta.get("invoice_date"),
            vendor_name=meta.get("vendor_name"),
            subtotal=meta.get("subtotal"),
            tax_amount=meta.get("tax_amount"),
            total_amount=meta.get("total_amount"),
            currency=meta.get("currency", "USD"),
            category=meta.get("category"),
            month=meta.get("month"),
            year=meta.get("year"),
            tags=meta.get("tags") or [],
            extracted_fields=meta.get("extracted_fields") or {},
            extracted_data=meta.get("extracted_data") or {}
        )
        db.add(doc)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[DB Error] add_record failed: {e}")
    finally:
        db.close()

def update_status(
    file_id: str,
    status: ProcessingStatus,
    metadata: Optional[dict] = None,
    error: Optional[str] = None,
    processing_state: Optional[str] = None
):
    """Updates status, processing_state, and merges metadata for a document."""
    db = SessionLocal()
    try:
        doc = db.query(DocumentModel).filter(DocumentModel.id == file_id).first()
        if not doc:
            return

        doc.status = status.value if hasattr(status, "value") else str(status)
        if error:
            doc.error_message = error
        if processing_state:
            doc.processing_state = processing_state.value if hasattr(processing_state, "value") else str(processing_state)

        if metadata:
            if "document_type" in metadata: doc.document_type = metadata["document_type"]
            if "confidence" in metadata: doc.confidence = float(metadata["confidence"] or 0.0)
            if "invoice_number" in metadata: doc.invoice_number = metadata["invoice_number"]
            if "invoice_date" in metadata: doc.invoice_date = metadata["invoice_date"]
            if "vendor_name" in metadata: doc.vendor_name = metadata["vendor_name"]
            if "subtotal" in metadata: doc.subtotal = metadata["subtotal"]
            if "tax_amount" in metadata: doc.tax_amount = metadata["tax_amount"]
            if "total_amount" in metadata: doc.total_amount = metadata["total_amount"]
            if "currency" in metadata: doc.currency = metadata["currency"]
            if "category" in metadata: doc.category = metadata["category"]
            if "month" in metadata: doc.month = metadata["month"]
            if "year" in metadata: doc.year = metadata["year"]
            if "tags" in metadata: doc.tags = metadata["tags"]

            # Merge JSON payloads
            if "extracted_fields" in metadata:
                current_fields = dict(doc.extracted_fields or {})
                current_fields.update(metadata["extracted_fields"])
                doc.extracted_fields = current_fields

            if "extracted_data" in metadata:
                current_data = dict(doc.extracted_data or {})
                current_data.update(metadata["extracted_data"])
                doc.extracted_data = current_data

            if "ocr_full_text" in metadata:
                doc.ocr_full_text = metadata["ocr_full_text"]

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[DB Error] update_status failed: {e}")
    finally:
        db.close()

def update_record(file_id: str, updates: dict):
    """Updates top-level fields or nested metadata of a document record."""
    db = SessionLocal()
    try:
        doc = db.query(DocumentModel).filter(DocumentModel.id == file_id).first()
        if not doc:
            return None

        for k, v in updates.items():
            if k == "metadata" and isinstance(v, dict):
                for mk, mv in v.items():
                    if hasattr(doc, mk):
                        setattr(doc, mk, mv)
                    elif mk == "extracted_data" and isinstance(mv, dict):
                        curr = dict(doc.extracted_data or {})
                        curr.update(mv)
                        doc.extracted_data = curr
            elif hasattr(doc, k):
                setattr(doc, k, v)

        db.commit()
        db.refresh(doc)
        return doc.to_file_record_dict()
    except Exception as e:
        db.rollback()
        print(f"[DB Error] update_record failed: {e}")
        return None
    finally:
        db.close()

def archive_all_records():
    """Soft deletes all visible records."""
    db = SessionLocal()
    try:
        db.query(DocumentModel).update({DocumentModel.archived: True})
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[DB Error] archive_all_records failed: {e}")
    finally:
        db.close()

def clear_company_history(company_id: str) -> int:
    """Soft deletes/archives all records belonging to a company in PostgreSQL/SQLAlchemy."""
    db = SessionLocal()
    try:
        count = db.query(DocumentModel).filter(
            DocumentModel.company_id == company_id,
            DocumentModel.archived == False
        ).update({DocumentModel.archived: True}, synchronize_session=False)
        db.commit()
        return count
    except Exception as e:
        db.rollback()
        print(f"[DB Error] clear_company_history failed: {e}")
        return 0
    finally:
        db.close()



# --- User & Company Authentication Operations ---

def create_company(company: Company) -> Company:
    db = SessionLocal()
    try:
        existing = db.query(CompanyModel).filter(CompanyModel.id == company.id).first()
        if existing:
            return company
        comp = CompanyModel(
            id=company.id,
            name=company.name,
            plan=company.plan,
            created_at=company.created_at or datetime.utcnow()
        )
        db.add(comp)
        db.commit()
        return company
    except Exception as e:
        db.rollback()
        print(f"[DB Error] create_company failed: {e}")
        return company
    finally:
        db.close()

def get_company(company_id: str) -> Optional[dict]:
    db = SessionLocal()
    try:
        c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
        return c.to_dict() if c else None
    finally:
        db.close()

def create_user(user: User) -> Optional[User]:
    db = SessionLocal()
    try:
        existing = db.query(UserModel).filter(UserModel.email == user.email).first()
        if existing:
            return None
        u = UserModel(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            hashed_password=user.hashed_password,
            company_id=user.company_id,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            disabled=user.disabled
        )
        db.add(u)
        db.commit()
        return user
    except Exception as e:
        db.rollback()
        print(f"[DB Error] create_user failed: {e}")
        return None
    finally:
        db.close()

def get_user_by_email(email: str) -> Optional[User]:
    db = SessionLocal()
    try:
        u = db.query(UserModel).filter(UserModel.email == email).first()
        if not u:
            return None
        return User(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            hashed_password=u.hashed_password,
            company_id=u.company_id,
            role=u.role,
            phone=getattr(u, "phone", None),
            disabled=u.disabled
        )
    finally:
        db.close()

def update_user_profile(user_id: str, updates: dict) -> Optional[User]:
    """Updates user information such as name, role, phone, or password in the database."""
    db = SessionLocal()
    try:
        u = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not u:
            return None
        if "full_name" in updates and updates["full_name"]:
            u.full_name = updates["full_name"]
        if "role" in updates and updates["role"]:
            u.role = updates["role"]
        if "phone" in updates:
            u.phone = updates["phone"]
        if "hashed_password" in updates and updates["hashed_password"]:
            u.hashed_password = updates["hashed_password"]
        db.commit()
        db.refresh(u)
        return User(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            hashed_password=u.hashed_password,
            company_id=u.company_id,
            role=u.role,
            phone=getattr(u, "phone", None),
            disabled=u.disabled
        )
    except Exception as e:
        db.rollback()
        print(f"[DB Error] update_user_profile failed: {e}")
        return None
    finally:
        db.close()

# Auto-initialize database schema and run seed upon module load
init_db()
