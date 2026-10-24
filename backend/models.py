from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union
from enum import Enum
from datetime import datetime

class ProcessingStatus(str, Enum):
    QUEUED = "Queued"
    OCR = "OCR"
    CLASSIFYING = "Classifying"
    EXTRACTING = "Extracting"
    COMPLETED = "Completed"
    NEEDS_REVIEW = "Needs Review"
    FAILED = "Failed"
    REJECTED = "Rejected"

class FieldData(BaseModel):
    value: Any
    confidence: float
    source: str  # e.g., "regex", "layout", "donut"

class FileMetadata(BaseModel):
    document_type: Optional[str] = "unknown"
    confidence: float = 0.0
    # Accounting Fields
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None # YYYY-MM-DD
    vendor_name: Optional[str] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = "USD"
    category: Optional[str] = None
    tags: List[str] = []
    month: Optional[int] = None
    year: Optional[int] = None
    
    # Map field_name -> FieldData (or raw value for backward compat if needed, but we prefer structured)
    extracted_fields: Dict[str, FieldData] = {} 
    # Keep simple extracted_data for simple UI display if needed, or derived from fields
    extracted_data: Dict[str, Any] = {}

class ProcessingState(str, Enum):
    UPLOADED = "uploaded"
    OCR_DONE = "ocr_done"
    CLASSIFIED = "classified"
    EXTRACTING = "extracting"
    COMPLETED = "completed"
    REVIEW = "review"

class UserRole(str, Enum):
    ADMIN = "admin"
    VIEWER = "viewer"

class Company(BaseModel):
    id: str
    name: str
    plan: str = "free"
    created_at: datetime = datetime.now()

class User(BaseModel):
    id: str
    email: str
    full_name: str
    hashed_password: str
    company_id: str
    role: str = "admin"
    phone: Optional[str] = None
    disabled: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    company_id: Optional[str] = None

class FileRecord(BaseModel):
    id: str
    filename: str
    upload_time: datetime
    status: ProcessingStatus
    processing_state: ProcessingState = ProcessingState.UPLOADED
    metadata: Optional[FileMetadata] = None
    error_message: Optional[str] = None
    archived: bool = False
    company_id: Optional[str] = None # Make optional for now to support migration/dev
