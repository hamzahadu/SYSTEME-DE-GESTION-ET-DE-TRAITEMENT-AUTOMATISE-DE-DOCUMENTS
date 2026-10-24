import os
import uuid
import shutil
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from huey import SqliteHuey
from models import FileRecord, ProcessingStatus, FileMetadata, User, Company, Token, UserRole
from tasks import process_document, huey
from database import add_record, get_all_records, archive_all_records, update_record
from database import create_user, create_company, get_user_by_email, get_company
from auth import verify_password, get_password_hash, create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import Depends, status, Form

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    token_data = decode_access_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_email(token_data.email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

app = FastAPI(title="DocuProcess Prototype")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# --- Auth Endpoints ---

@app.post("/auth/signup", response_model=Token)
async def signup(
    company_name: str = Form(...),
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    # 1. Check if user exists
    if get_user_by_email(email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 2. Create Company
    company_id = str(uuid.uuid4())
    company = Company(id=company_id, name=company_name)
    create_company(company)
    
    # 3. Create Admin User
    hashed_pw = get_password_hash(password)
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=full_name,
        hashed_password=hashed_pw,
        company_id=company_id,
        role=UserRole.ADMIN
    )
    create_user(user)
    
    # 4. Return Token
    access_token = create_access_token(data={"sub": user.email, "company_id": user.company_id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(
        data={"sub": user.email, "company_id": user.company_id}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@app.patch("/auth/me", response_model=User)
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    updates = {}
    if body.full_name:
        updates["full_name"] = body.full_name
    if body.role:
        updates["role"] = body.role
    if body.phone is not None:
        updates["phone"] = body.phone

    if body.new_password:
        if not body.current_password or not verify_password(body.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
        updates["hashed_password"] = get_password_hash(body.new_password)

    from database import update_user_profile
    updated = update_user_profile(current_user.id, updates)
    if not updated:
        raise HTTPException(status_code=500, detail="Échec de la mise à jour du profil")
    return updated

@app.post("/upload", response_model=List[str])
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    file_ids = []
    
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    for file in files:
        file_id = str(uuid.uuid4())
        file_ids.append(file_id)
        
        file_path = os.path.join(upload_dir, f"{file_id}_{file.filename}")
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Create record with company_id
        record = FileRecord(
            id=file_id,
            filename=file.filename,
            upload_time=datetime.now(),
            status=ProcessingStatus.QUEUED,
            company_id=current_user.company_id
        )
        add_record(record)
        
        # Enqueue task
        process_document(file_id, file_path)
        
    return file_ids

@app.get("/status", response_model=List[FileRecord])
async def get_status(current_user: User = Depends(get_current_user)):
    return get_all_records(company_id=current_user.company_id)

@app.patch("/documents/{document_id}", response_model=FileRecord)
async def update_document(
    document_id: str, 
    updates: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Updates a document's metadata or status.
    """
    # Verify ownership? get_all_records filters by company, but update_record currently does not verify
    # Optimization: Check if record belongs to company first.
    # For prototype speed, we'll fetch all company records and check ID.
    existing_records = get_all_records(company_id=current_user.company_id)
    if not any(r.id == document_id for r in existing_records):
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    # 1. Update DB
    updated_record = update_record(document_id, updates)
    
    if not updated_record:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return updated_record

class BulkUpdateModel(BaseModel):
    document_ids: List[str]
    updates: Dict[str, Any]

@app.post("/documents/bulk/update")
async def bulk_update(
    body: BulkUpdateModel,
    current_user: User = Depends(get_current_user)
):
    # Verify ownership of all IDs
    existing_records = get_all_records(company_id=current_user.company_id)
    allowed_ids = {r.id for r in existing_records}
    
    updated_count = 0
    for doc_id in body.document_ids:
        if doc_id not in allowed_ids: continue
        
        payload = body.updates.copy() # copy to avoid mutation issues in loop
        if "category" in payload or "tags" in payload:
            if "metadata" not in payload:
                payload["metadata"] = {}
            if "category" in payload:
                payload["metadata"]["category"] = payload.pop("category")
            if "tags" in payload:
                payload["metadata"]["tags"] = payload.pop("tags")
                
        if update_record(doc_id, payload):
            updated_count += 1
            
    return {"status": "success", "updated_count": updated_count}

class BulkDeleteModel(BaseModel):
    document_ids: List[str]

@app.post("/documents/bulk/delete")
async def bulk_delete(
    body: BulkDeleteModel,
    current_user: User = Depends(get_current_user)
):
    existing_records = get_all_records(company_id=current_user.company_id)
    allowed_ids = {r.id for r in existing_records}

    deleted_count = 0
    for doc_id in body.document_ids:
        if doc_id not in allowed_ids: continue
        # Soft delete by marking archived
        if update_record(doc_id, {"archived": True}):
            deleted_count += 1
            
    return {"status": "success", "deleted_count": deleted_count}

@app.post("/documents/clear")
async def clear_history(current_user: User = Depends(get_current_user)):
    from database import clear_company_history
    cleared_count = clear_company_history(current_user.company_id)
    return {"status": "cleared", "cleared_count": cleared_count}

@app.get("/events")
async def events(request: Request):
    """
    Server-Sent Events endpoint.
    Streams changes from the database to the client.
    """
    async def event_generator():
        last_state = {}
        
        while True:
            if await request.is_disconnected():
                break
                
            current_records = get_all_records()
            
            for record in current_records:
                rid = record.id
                r_dict = record.dict()
                
                # Check for new file
                if rid not in last_state:
                    yield f"data: {json.dumps({'type': 'new_file', 'data': r_dict}, default=str)}\n\n"
                    last_state[rid] = r_dict
                    continue
                
                cached = last_state[rid]
                
                # Check status change
                if cached["status"] != r_dict["status"]:
                     payload = {"document_id": rid, "status": r_dict["status"]}
                     if r_dict.get("metadata") and r_dict["metadata"].get("confidence"):
                         payload["confidence"] = r_dict["metadata"]["confidence"]
                     yield f"data: {json.dumps(payload, default=str)}\n\n"
                     cached["status"] = r_dict["status"]
                
                # Check fields progressive updates
                r_extracted_fields = {}
                if r_dict.get("metadata") and r_dict["metadata"].get("extracted_fields"):
                     r_extracted_fields = r_dict["metadata"]["extracted_fields"]
                
                # Fallback to simple data if fields not present
                r_simple_data = {}
                if r_dict.get("metadata") and r_dict["metadata"].get("extracted_data"):
                     r_simple_data = r_dict["metadata"]["extracted_data"]

                c_extracted_fields = {}
                if cached.get("metadata") and cached["metadata"].get("extracted_fields"):
                    c_extracted_fields = cached["metadata"]["extracted_fields"]
                
                # 1. Diff structured fields
                for k, field_obj in r_extracted_fields.items():
                    # field_obj is a dict representation of FieldData if coming from r_dict (Pydantic .dict())
                    # or it might be the object itself if logic handled differently, but here r_dict is dict.
                    
                    prev_obj = c_extracted_fields.get(k)
                    
                    # Check if changed (value or confidence)
                    if not prev_obj or prev_obj != field_obj:
                        payload = {
                            "document_id": rid,
                            "field": k,
                            "value": field_obj.get("value"),
                            "confidence": field_obj.get("confidence"),
                            "source": field_obj.get("source")
                        }
                        yield f"data: {json.dumps(payload, default=str)}\n\n"
                
                # 2. Diff simple data (for fields not in extracted_fields, if any)
                # This ensures we don't miss anything that was just put in extracted_data
                for k, v in r_simple_data.items():
                    if k not in r_extracted_fields: # Only if not already handled
                        # Check against cached SIMPLE data
                        c_simple = {}
                        if cached.get("metadata") and cached["metadata"].get("extracted_data"):
                             c_simple = cached["metadata"]["extracted_data"]
                        
                        if k not in c_simple or c_simple[k] != v:
                             payload = {
                                "document_id": rid,
                                "field": k,
                                "value": v
                            }
                             yield f"data: {json.dumps(payload, default=str)}\n\n"
                
                # Update cache
                last_state[rid] = r_dict
            
            # Identify cleared files (in cache but not in current)
            current_ids = {r.id for r in current_records}
            removed_ids = [rid for rid in last_state if rid not in current_ids]
            for rid in removed_ids:
                yield f"data: {json.dumps({'document_id': rid, 'status': 'cleared'}, default=str)}\n\n"
                del last_state[rid]

            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# --- Accounting Reports & Exports ---

import io
import pandas as pd
from fastapi.responses import Response
from typing import Optional

def get_flat_data(
    company_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    vendor: Optional[str] = None
):
    records = get_all_records(company_id=company_id)
    data = []
    
    # Parse dates if provided
    start_dt = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
    
    for r in records:
        # Strict Filtering:
        if not r.metadata: continue
        if r.metadata.extracted_data.get("is_duplicate"): continue
        
        # Apply Filters
        # 1. Date Filter (Invoice Date or Upload Time fallback)
        doc_date_str = r.metadata.invoice_date
        doc_dt = None
        if doc_date_str:
            try:
                doc_dt = datetime.strptime(doc_date_str, "%Y-%m-%d")
            except: pass
        
        if not doc_dt: 
            doc_dt = r.upload_time
            
        if start_dt and doc_dt < start_dt: continue
        if end_dt and doc_dt > end_dt: continue
        
        # 2. Category Filter
        if category and ((r.metadata.category or "Uncategorized") != category): continue
        
        # 3. Vendor Filter
        if vendor and ((r.metadata.vendor_name or "") != vendor): continue

        row = {
            "document_id": r.id,
            "filename": r.filename,
            "status": r.status,
            "upload_time": r.upload_time,
            "document_type": r.metadata.document_type,
            "confidence": r.metadata.confidence,
        }
        
        row["invoice_number"] = r.metadata.invoice_number
        row["invoice_date"] = r.metadata.invoice_date
        row["vendor_name"] = r.metadata.vendor_name
        row["subtotal"] = r.metadata.subtotal
        row["tax_amount"] = r.metadata.tax_amount
        row["total_amount"] = r.metadata.total_amount
        row["currency"] = r.metadata.currency
        row["category"] = r.metadata.category
        row["tags"] = ", ".join(r.metadata.tags) if r.metadata.tags else ""
        row["month"] = r.metadata.month
        row["year"] = r.metadata.year
            
        data.append(row)
    return data

# Reports reuse get_flat_data without filters for now, or could accept them
# For simplicity, keeping reports as 'all time' or we can add filters later if user asks.
# Focusing on EXPORT being filtered.

@app.get("/reports/monthly")
async def report_monthly(current_user: User = Depends(get_current_user)):
    data = get_flat_data(company_id=current_user.company_id)
    if not data: return []
    
    df = pd.DataFrame(data)
    if "total_amount" not in df.columns: return []
    
    if "year" not in df.columns or "month" not in df.columns: return []
    
    df["total_amount"] = df["total_amount"].fillna(0.0)
    df["tax_amount"] = df["tax_amount"].fillna(0.0)
    
    summary = df.groupby(["year", "month"])[["total_amount", "tax_amount"]].sum().reset_index()
    summary = summary.sort_values(["year", "month"], ascending=False)
    
    return summary.to_dict(orient="records")

@app.get("/reports/vendor")
async def report_vendor(current_user: User = Depends(get_current_user)):
    data = get_flat_data(company_id=current_user.company_id)
    if not data: return []
    df = pd.DataFrame(data)
    if "vendor_name" not in df.columns: return []
    
    df["total_amount"] = df["total_amount"].fillna(0.0)
    
    summary = df.groupby("vendor_name")[["total_amount"]].sum().reset_index()
    summary = summary.sort_values("total_amount", ascending=False)
    
    return summary.to_dict(orient="records")

@app.get("/reports/category")
async def report_category(current_user: User = Depends(get_current_user)):
    data = get_flat_data(company_id=current_user.company_id)
    if not data: return []
    df = pd.DataFrame(data)
    if "category" not in df.columns: return []
    
    df["total_amount"] = df["total_amount"].fillna(0.0)
    
    summary = df.groupby("category")[["total_amount"]].sum().reset_index()
    summary = summary.sort_values("total_amount", ascending=False)
    
    return summary.to_dict(orient="records")

@app.get("/reports/quarterly")
async def report_quarterly(current_user: User = Depends(get_current_user)):
    data = get_flat_data(company_id=current_user.company_id)
    if not data: return []
    
    df = pd.DataFrame(data)
    if "year" not in df.columns or "month" not in df.columns: return []
    
    df["total_amount"] = df["total_amount"].fillna(0.0)
    
    def get_quarter(m):
        if not m: return 0
        return (int(m) - 1) // 3 + 1
        
    df["quarter"] = df["month"].apply(get_quarter)
    
    summary = df.groupby(["year", "quarter"])[["total_amount"]].sum().reset_index()
    summary = summary.sort_values(["year", "quarter"], ascending=False)
    
    return summary.to_dict(orient="records")

@app.get("/reports/yearly")
async def report_yearly(current_user: User = Depends(get_current_user)):
    data = get_flat_data(company_id=current_user.company_id)
    if not data: return []
    
    df = pd.DataFrame(data)
    if "year" not in df.columns: return []
    
    df["total_amount"] = df["total_amount"].fillna(0.0)
    
    summary = df.groupby("year")[["total_amount"]].sum().reset_index()
    summary = summary.sort_values("year", ascending=False)
    
    return summary.to_dict(orient="records")

@app.get("/reports/tax")
async def report_tax(current_user: User = Depends(get_current_user)):
    data = get_flat_data(company_id=current_user.company_id)
    if not data: return {}
    
    df = pd.DataFrame(data)
    
    if "total_amount" not in df.columns: df["total_amount"] = 0.0
    if "tax_amount" not in df.columns: df["tax_amount"] = 0.0
    
    total_spend = df["total_amount"].sum()
    total_tax = df["tax_amount"].sum()
    net_total = total_spend - total_tax
    
    effective_rate = (total_tax / net_total * 100) if net_total > 0 else 0.0
    
    return {
        "total_spend": total_spend,
        "total_tax": total_tax,
        "net_total": net_total,
        "effective_rate": round(effective_rate, 2)
    }

@app.get("/export/csv")
async def export_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    vendor: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    cols = [
        "document_id", "document_type", "invoice_number", "invoice_date", 
        "year", "month", "vendor_name", "category", "tags",
        "subtotal", "tax_amount", "total_amount", "currency", 
        "confidence_score", "processing_status", "needs_review", "created_at"
    ]

    # Get Filtered Data
    raw_data = get_flat_data(current_user.company_id, start_date, end_date, category, vendor)
    rows = []
    
    for row_dict in raw_data:
        # Need to format again for CSV string cleanliness?
        # Actually existing get_flat_data returned clean dicts but we did extra formatting in the old export_csv
        # Let's rely on pandas for most, but ensure strings are clean.
        
        # Helper wrappers
        def fmt_str(s): return str(s).strip() if s is not None else ""
        def fmt_num(n): return float(n) if n is not None else ""
        
        # Re-map flat data to CSV columns
        new_row = {
            "document_id": fmt_str(row_dict["document_id"]),
            "document_type": fmt_str(row_dict["document_type"]),
            "invoice_number": fmt_str(row_dict["invoice_number"]),
            "invoice_date": fmt_str(row_dict["invoice_date"]),
            "year": row_dict["year"],
            "month": row_dict["month"],
            "vendor_name": fmt_str(row_dict["vendor_name"]),
            "category": fmt_str(row_dict["category"]),
            "tags": fmt_str(row_dict.get("tags", "")),
            "subtotal": fmt_num(row_dict["subtotal"]),
            "tax_amount": fmt_num(row_dict["tax_amount"]),
            "total_amount": fmt_num(row_dict["total_amount"]),
            "currency": fmt_str(row_dict["currency"]),
            "confidence_score": row_dict["confidence"],
            "processing_status": fmt_str(row_dict["status"]),
            "needs_review": "TRUE" if row_dict["status"] == ProcessingStatus.NEEDS_REVIEW else "FALSE",
            "created_at": str(row_dict["upload_time"]).split(" ")[0]
        }
        rows.append(new_row)

    df = pd.DataFrame(rows)
    for c in cols:
        if c not in df.columns: df[c] = ""
    df = df[cols]
    
    output = io.StringIO()
    df.to_csv(output, index=False, encoding='utf-8')
    csv_data = output.getvalue()
    
    filename = f"export_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/export/excel")
async def export_excel(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    vendor: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    data = get_flat_data(current_user.company_id, start_date, end_date, category, vendor)
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Invoices', index=False)
        
        if not df.empty and "month" in df.columns:
            try:
                monthly = df.groupby(["year", "month"])[["total_amount", "tax_amount"]].sum().reset_index()
                monthly.to_excel(writer, sheet_name='Monthly Summary', index=False)
            except: pass
            
        if not df.empty and "vendor_name" in df.columns:
            try:
                vendor_sum = df.groupby("vendor_name")[["total_amount"]].sum().reset_index()
                vendor_sum.to_excel(writer, sheet_name='Vendor Summary', index=False)
            except: pass

        if not df.empty and "category" in df.columns:
            try:
                cat = df.groupby("category")[["total_amount"]].sum().reset_index()
                cat.to_excel(writer, sheet_name='Category Summary', index=False)
            except: pass
            
    xlsx_data = output.getvalue()
    filename = f"export_{datetime.now().strftime('%Y%m%d')}.xlsx"
    
    return Response(
        content=xlsx_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/export/json")
async def export_json(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    vendor: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    data = get_flat_data(current_user.company_id, start_date, end_date, category, vendor)
    return data

# --- RAG (Retrieval-Augmented Generation) Endpoints ---

class RAGQueryModel(BaseModel):
    query: str

@app.post("/rag/query")
async def rag_query(
    body: RAGQueryModel,
    current_user: User = Depends(get_current_user)
):
    """
    Semantic search and natural language synthesis over company invoice documents.
    """
    from rag_service import rag_service
    result = rag_service.query(body.query, company_id=current_user.company_id)
    return result

@app.post("/rag/reindex")
async def rag_reindex(
    current_user: User = Depends(get_current_user)
):
    """
    Indexes all existing documents into vector chunks for the user's company.
    """
    from rag_service import rag_service
    count = rag_service.reindex_company_documents(current_user.company_id)
    return {"status": "success", "indexed_documents": count}

