from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class CompanyModel(Base):
    """
    SQLAlchemy model representing a multi-tenant Company entity.
    """
    __tablename__ = "companies"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    plan = Column(String(64), default="free")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("UserModel", back_populates="company", cascade="all, delete-orphan")
    documents = relationship("DocumentModel", back_populates="company", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "plan": self.plan,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserModel(Base):
    """
    SQLAlchemy model representing an authenticated user within a Company.
    """
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(32), default="admin")
    phone = Column(String(32), nullable=True)
    disabled = Column(Boolean, default=False)

    company = relationship("CompanyModel", back_populates="users")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "company_id": self.company_id,
            "role": self.role,
            "phone": self.phone,
            "disabled": self.disabled
        }


class DocumentModel(Base):
    """
    SQLAlchemy model representing an ingested document (Invoice, Receipt, PO).
    Stores both relational accounting columns for indexing & fast aggregation
    and flexible JSON structures for deep extraction metadata.
    """
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True, index=True)
    company_id = Column(String(64), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(String(32), default="Queued", index=True)
    processing_state = Column(String(32), default="uploaded")
    error_message = Column(Text, nullable=True)
    archived = Column(Boolean, default=False, index=True)

    # Extracted Accounting Attributes
    document_type = Column(String(64), default="unknown")
    confidence = Column(Float, default=0.0)
    invoice_number = Column(String(128), nullable=True, index=True)
    invoice_date = Column(String(64), nullable=True, index=True)  # YYYY-MM-DD
    vendor_name = Column(String(255), nullable=True, index=True)
    subtotal = Column(Float, nullable=True)
    tax_amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True, index=True)
    currency = Column(String(16), default="USD")
    category = Column(String(128), nullable=True, index=True)
    month = Column(Integer, nullable=True, index=True)
    year = Column(Integer, nullable=True, index=True)

    # Structured Payloads
    tags = Column(JSON, default=list)
    extracted_fields = Column(JSON, default=dict)
    extracted_data = Column(JSON, default=dict)

    # Full text extracted via OCR (used for RAG retrieval)
    ocr_full_text = Column(Text, nullable=True)

    company = relationship("CompanyModel", back_populates="documents")
    chunks = relationship("DocumentChunkModel", back_populates="document", cascade="all, delete-orphan")

    def to_file_record_dict(self):
        """Converts ORM record into dictionary compatible with Pydantic FileRecord."""
        meta = {
            "document_type": self.document_type or "unknown",
            "confidence": self.confidence or 0.0,
            "invoice_number": self.invoice_number,
            "invoice_date": self.invoice_date,
            "vendor_name": self.vendor_name,
            "subtotal": self.subtotal,
            "tax_amount": self.tax_amount,
            "total_amount": self.total_amount,
            "currency": self.currency or "USD",
            "category": self.category,
            "tags": self.tags or [],
            "month": self.month,
            "year": self.year,
            "extracted_fields": self.extracted_fields or {},
            "extracted_data": self.extracted_data or {}
        }
        return {
            "id": self.id,
            "filename": self.filename,
            "upload_time": self.upload_time,
            "status": self.status,
            "processing_state": self.processing_state or "uploaded",
            "metadata": meta,
            "error_message": self.error_message,
            "archived": bool(self.archived),
            "company_id": self.company_id
        }


class DocumentChunkModel(Base):
    """
    Stores document text chunks and vector embeddings for RAG semantic search.
    """
    __tablename__ = "document_chunks"

    id = Column(String(64), primary_key=True, index=True)
    document_id = Column(String(64), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)  # List of floats for cosine similarity search
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("DocumentModel", back_populates="chunks")
