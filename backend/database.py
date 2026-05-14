import json
import os
import time
from filelock import FileLock
from typing import List, Optional
from models import FileRecord, ProcessingStatus

DB_FILE = "db.json"
LOCK_FILE = "db.json.lock"

def read_db_robust():
    """Helper to safely read DB with retries. Returns list."""
    if not os.path.exists(DB_FILE):
        return []
        
    for i in range(50): # 50 retries (approx 2.5s)
        try:
            with open(DB_FILE, "r") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
        except (json.JSONDecodeError, FileNotFoundError, PermissionError):
            time.sleep(0.05)
            continue
        except Exception as e:
            print(f"DB Read Error: {e}")
            break
            
    print("DB Read Timed Out or Failed after 50 retries")
    return None

def get_all_records() -> List[FileRecord]:
    if not os.path.exists(DB_FILE):
        return []
    
    lock = FileLock(LOCK_FILE)
    items = []
    with lock:
        data = read_db_robust()
        if data is not None:
             items = [FileRecord(**item) for item in data if not item.get("archived", False)]
            
    return items

def add_record(record: FileRecord):
    lock = FileLock(LOCK_FILE)
    with lock:
        data = read_db_robust()
        if data is None:
            # If Read Failed, assume empty IF file doesn't exist, else abort
            if not os.path.exists(DB_FILE):
                data = []
            else:
                print("DB Locked/Corrupt, skipping add_record to prevent data loss")
                return 

        data.append(record.dict())
        
        with open(DB_FILE, "w") as f:
            json.dump(data, f, default=str, indent=2)

def update_status(file_id: str, status: ProcessingStatus, metadata: Optional[dict] = None, error: Optional[str] = None, processing_state: Optional[str] = None):
    lock = FileLock(LOCK_FILE)
    with lock:
        data = read_db_robust()
        if data is None: return
        
        updated = False
        for item in data:
            if item["id"] == file_id:
                item["status"] = status
                # Merge metadata if existing
                if metadata:
                    if not item.get("metadata"):
                        item["metadata"] = metadata
                    else:
                        # Updates keys
                        if "extracted_data" in metadata:
                            if "extracted_data" not in item["metadata"] or not item["metadata"]["extracted_data"]:
                                item["metadata"]["extracted_data"] = {}
                            item["metadata"]["extracted_data"].update(metadata["extracted_data"])
                        
                        # Update other top level keys like confidence
                        for k, v in metadata.items():
                            if k != "extracted_data":
                                item["metadata"][k] = v
                                
                if error:
                    item["error_message"] = error
                if processing_state:
                    item["processing_state"] = processing_state
                updated = True
                break
        
        if updated:
            with open(DB_FILE, "w") as f:
                json.dump(data, f, default=str, indent=2)

def archive_all_records():
    """Soft delete all visible records"""
    print("Attempting to archive all records...")
    lock = FileLock(LOCK_FILE)
    with lock:
        data = read_db_robust()
        if data is None: 
            print("Archive failed: Could not read DB.")
            return

        changed = False
        count = 0
        for item in data:
            if not item.get("archived"):
                item["archived"] = True
                changed = True
                count += 1
            
        if changed:
            print(f"Archiving {count} records...")
            with open(DB_FILE, "w") as f:
                json.dump(data, f, default=str, indent=2)
            print("Archive loop complete.")
        else:
            print("No new records to archive.")
        
def update_record(file_id: str, updates: dict):
    """
    Update top-level fields or metadata of a record.
    updates: dict containing fields to update. 
             If key is 'metadata', it merges with existing metadata.
    """
    lock = FileLock(LOCK_FILE)
    print(f"Updating record {file_id} with {updates.keys()}")
    with lock:
        data = read_db_robust()
        if data is None: return None
        
        found = False
        updated_record = None
        
        for item in data:
            if item["id"] == file_id:
                # 1. Update top-level fields (e.g. status) if present
                for k, v in updates.items():
                    if k != "metadata":
                        item[k] = v
                
                # 2. Update metadata if present
                if "metadata" in updates and updates["metadata"]:
                    if not item.get("metadata"):
                        item["metadata"] = {}
                        
                    # Merge metadata fields
                    new_meta = updates["metadata"]
                    # Handle extracted_fields specially if needed, but for manual edits 
                    # we often just want to update the accounting values (invoice_number, total_amount etc)
                    # which are top-level in FileMetadata.
                    
                    for mk, mv in new_meta.items():
                         item["metadata"][mk] = mv
                         
                updated_record = item
                found = True
                break
        
        if found:
            with open(DB_FILE, "w") as f:
                json.dump(data, f, default=str, indent=2)
            return updated_record
        return None

# --- Multi-Tenancy / Auth Support ---
from models import User, Company

USERS_FILE = "users.json"
COMPANIES_FILE = "companies.json"

def read_json_file(filename):
    if not os.path.exists(filename): return []
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except: return []

def write_json_file(filename, data):
    with open(filename, "w") as f:
        json.dump(data, f, default=str, indent=2)

def create_company(company: Company):
    lock = FileLock(LOCK_FILE) # Reuse lock for simplicity
    with lock:
        data = read_json_file(COMPANIES_FILE)
        data.append(company.dict())
        write_json_file(COMPANIES_FILE, data)
        return company

def get_company(company_id: str):
    data = read_json_file(COMPANIES_FILE)
    for c in data:
        if c["id"] == company_id:
            return c
    return None

def create_user(user: User):
    lock = FileLock(LOCK_FILE)
    with lock:
        data = read_json_file(USERS_FILE)
        # Check duplicate
        for u in data:
            if u["email"] == user.email:
                return None # Already exists
        data.append(user.dict())
        write_json_file(USERS_FILE, data)
        return user

def get_user_by_email(email: str):
    data = read_json_file(USERS_FILE)
    for u in data:
        if u["email"] == email:
            return User(**u) # Return model
    return None

# Update existing data access to be company-aware
# We redefine get_all_records to accept optional company_id
# Note: For backward compatibility with existing tasks/endpoints, we default to None (return all) 
# BUT strict multi-tenancy endpoints will pass company_id.

def get_all_records(company_id: Optional[str] = None) -> List[FileRecord]:
    if not os.path.exists(DB_FILE):
        return []
    
    lock = FileLock(LOCK_FILE)
    items = []
    with lock:
        data = read_db_robust()
        if data is not None:
             # Logic: if company_id provided, filter. If None, return all (admin/dev mode)
             items = []
             for item in data:
                 if item.get("archived", False): continue
                 
                 # Isolation check
                 if company_id:
                     if item.get("company_id") != company_id:
                         continue
                         
                 items.append(FileRecord(**item))
            
    return items
