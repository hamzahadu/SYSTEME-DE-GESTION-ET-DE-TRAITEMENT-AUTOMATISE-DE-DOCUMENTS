from huey import SqliteHuey
from database import update_status
from models import ProcessingStatus, FileMetadata, FieldData
import os
import re
from typing import List, Dict, Any, Optional
from datetime import datetime

# Initialize Huey
huey = SqliteHuey('tasks.db')

# --- Global Models (Lazy Load) ---
_ocr_model = None
_donut_processor = None
_donut_model = None

def get_ocr_model():
    global _ocr_model
    if _ocr_model is None:
        print("Loading Doctr OCR model...")
        from doctr.models import ocr_predictor
        _ocr_model = ocr_predictor(det_arch='db_resnet50', reco_arch='crnn_vgg16_bn', pretrained=True)
    return _ocr_model

def get_donut_model():
    global _donut_processor, _donut_model
    if _donut_model is None:
        print("Loading Donut model...")
        from transformers import DonutProcessor, VisionEncoderDecoderModel
        import torch
        
        model_name = "naver-clova-ix/donut-base-finetuned-cord-v2"
        _donut_processor = DonutProcessor.from_pretrained(model_name)
        _donut_model = VisionEncoderDecoderModel.from_pretrained(model_name)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _donut_model.to(device)
        
    return _donut_processor, _donut_model

# --- Stage 1: OCR ---

class OCRBlock:
    def __init__(self, text, box):
        self.text = text
        self.box = box # (min_x, min_y, max_x, max_y) relative 0-1

    @property
    def center_x(self): return (self.box[0] + self.box[2]) / 2
    @property
    def center_y(self): return (self.box[1] + self.box[3]) / 2

def run_stages_ocr(file_path):
    print(f"Stage 1: Running OCR on {file_path}")
    from doctr.io import DocumentFile
    
    doc = None
    if file_path.lower().endswith(".pdf"):
        try:
            doc = DocumentFile.from_pdf(file_path)
        except Exception as e:
            print(f"from_pdf failed ({e}), attempting from_images fallback...")
            try:
                doc = DocumentFile.from_images(file_path)
            except Exception as e2:
                raise ValueError(f"Fichier illisible ou format non reconnu: {e}")
    else:
        doc = DocumentFile.from_images(file_path)
        
    predictor = get_ocr_model()
    result = predictor(doc)
    
    full_text = ""
    blocks = []
    
    for page in result.pages:
        for block in page.blocks:
            for line in block.lines:
                line_text = " ".join([w.value for w in line.words])
                full_text += line_text + "\n"
                # Simplify block geometry to just the line for layout analysis
                xmin, ymin = line.geometry[0]
                xmax, ymax = line.geometry[1]
                blocks.append(OCRBlock(line_text, (xmin, ymin, xmax, ymax)))
                
    return full_text, blocks

# --- Stage 2: Classification ---

def classify_document(text):
    print("Stage 2: Classifying Document")
    lower_text = text.lower()
    
    # 0. Check for Resume / CV / General non-financial documents with word boundaries
    resume_keywords = [
        "curriculum vitae", "resume", "experience", "education", "skills",
        "certifications", "bachelor", "master", "formation",
        "compétences", "profil", "coordonnées", "langues", "summary", "university",
        "diplôme", "baccalauréat", "stage", "internship"
    ]
    resume_matches = sum(1 for w in resume_keywords if re.search(r'\b' + re.escape(w) + r'\b', lower_text))

    # Keywords for accounting / financial documents with word boundaries
    kws = {
        "invoice": [
            "invoice", "facture", "inv#", "bill to", "due date", "balance due", "amount due", "tax", "tva", "montant",
            "subtotal", "sous-total", "total due", "remise", "discount", "price", "prix", "qty", "quantity",
            "quantité", "amount", "solde", "devis", "purchase order", "bon de commande", "client", "customer", "payment",
            "paiement", "banque", "iban", "rib", "ttc", "ht", "ice", "rc", "patente"
        ],
        "receipt": [
            "receipt", "reçu", "ticket de caisse", "total ticket", "cash", "espèces", "credit card",
            "change due", "supermarket", "superstore"
        ],
        "contract": ["agreement", "contract", "contrat", "between the parties", "witnesseth", "signed by"],
        "purchase_order": ["purchase order", "bon de commande", "p.o. number", "order date"],
        "delivery_note": ["delivery note", "bon de livraison", "packing slip", "despatch advice"]
    }
    
    scores = {cls: 0 for cls in kws}
    for cls, words in kws.items():
        for w in words:
            if re.search(r'\b' + re.escape(w) + r'\b', lower_text):
                scores[cls] += 1
                
    # Detect Layout hints (e.g. "Invoice" at top)
    header = lower_text[:300]
    if re.search(r'\b(invoice|facture)\b', header): scores["invoice"] += 3
    if re.search(r'\b(receipt|reçu)\b', header): scores["receipt"] += 3
    if re.search(r'\b(purchase order|bon de commande)\b', header): scores["purchase_order"] += 3

    # Check for presence of monetary values (e.g. $100.00, 150.00 €, 200 DH, etc.)
    has_money = bool(re.search(r'[\$€£]|mad|dh|usd|eur|\b\d+[.,]\d{2}\b', lower_text))
    if has_money:
        scores["invoice"] += 1
        scores["receipt"] += 1

    # Winner
    best_type = max(scores, key=scores.get)

    # If document has resume signals and NO or very low invoice score -> Resume
    if resume_matches >= 3 and scores["invoice"] <= 1 and scores["receipt"] <= 1:
        return "resume", 0.95

    # If it has financial signals or score >= 1 -> financial document
    if scores[best_type] >= 1:
        confidence = min(scores[best_type] / 4.0, 1.0)
        return best_type, max(confidence, 0.75)
        
    # Non-financial / unknown
    return "unknown", 0.0

# --- Stage 3: Extraction ---

class ExtractionContext:
    def __init__(self, text, blocks, file_path, doc_type):
        self.text = text
        self.blocks = blocks
        self.file_path = file_path
        self.doc_type = doc_type
        self.donut_data = None # Lazy load

def strategy_regex(context, pattern):
    matches = re.findall(pattern, context.text, re.IGNORECASE)
    if matches:
        # Return unique, non-empty matches
        valid = [m for m in matches if m.strip()]
        if valid: return valid[0]
    return None

def strategy_layout_top_right(context):
    # Find number-like blocks in top right quadrant
    candidates = []
    for b in context.blocks:
        if b.center_x > 0.5 and b.center_y < 0.4: # Top Right
            if re.search(r'\d', b.text): # Contains digit
                 candidates.append(b.text)
    if candidates: return candidates[0] # Return first found
    return None

def strategy_donut(context, field):
    if context.donut_data is None:
        # Run Donut Inference
        pass 
    return context.donut_data.get(field)

def run_donut(file_path):
    if os.getenv("ENABLE_DONUT", "false").lower() != "true":
        return {}
    try:
        print("Running Donut AI fallback...")
        import pypdfium2 as pdfium
        
        pdf = pdfium.PdfDocument(file_path)
        page = pdf[0]
        bitmap = page.render(scale=1.5) 
        pil_image = bitmap.to_pil()
        
        processor, model = get_donut_model()
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"

        pixel_values = processor(pil_image, return_tensors="pt").pixel_values.to(device)
        task_prompt = "<s_cord-v2>"
        decoder_input_ids = processor.tokenizer(task_prompt, add_special_tokens=False, return_tensors="pt").input_ids.to(device)
        
        outputs = model.generate(
            pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=384, 
            early_stopping=True,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            use_cache=True,
            num_beams=1,
            bad_words_ids=[[processor.tokenizer.unk_token_id]],
            return_dict_in_generate=True,
        )
        
        sequence = processor.batch_decode(outputs.sequences)[0]
        sequence = sequence.replace(processor.tokenizer.eos_token, "").replace(processor.tokenizer.pad_token, "")
        sequence = sequence.replace(task_prompt, "")
        return processor.token2json(sequence)
    except Exception as e:
        print(f"[Donut Fallback Skipped] {e}")
        return {}

def extract_fields_progressive(file_id, context):
    """
    Generator that yields (field_name, field_data) tuples.
    This allows updating the DB progressive.
    """
    
    schema = {}
    if context.doc_type == "invoice":
        schema = {
            "invoice_number": [
                ("regex", r'(?i)\bInvoice\s*(?:Number|No|#)\s*[:.]?\s*((?!Invoice|Bill)\S+)'),
                ("regex", r'(?i)\bInv\s*[:.]?\s*((?!Invoice|Bill)\S+)'),
                ("layout", "top_right_number"),
                ("donut", "invoice_no")
            ],
            "date": [
                ("regex", r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'),
                ("regex", r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}'),
                ("donut", "date")
            ],
            "subtotal": [
                ("regex", r'(?i)Sub\s*we?total\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'),
                ("regex", r'(?i)Net\s*Amount\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'),
                ("donut", "subtotal_price")
            ],
            "tax_amount": [
                ("regex", r'(?i)(?:Tax|VAT|TVA|GST|HST)\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'),
                ("regex", r'(?i)Total\s*Tax\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'),
                ("donut", "tax_price")
            ],
            "total_amount": [
                ("regex", r'(?i)Balance\s*Due\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'),
                ("regex", r'(?i)Amount\s*Due\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'),
                ("regex", r'(?i)Total\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'),
                ("donut", "total_price")
            ],
            "vendor": [
                ("layout", "top_header"),
                ("donut", "store_name") 
            ]
        }
    elif context.doc_type == "receipt":
        # ... Similar schema for receipt
        schema = {
             "vendor": [("layout", "top_header"), ("donut", "store_name")],
             "date": [("regex", r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'), ("donut", "date")],
             "tax_amount": [("regex", r'(?i)(?:Tax|VAT)\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)')],
             "total_amount": [("regex", r'(?i)Total\s*[:.]?\s*[\$£€]?\s*([\d,]+\.?\d*)'), ("donut", "total_price")]
        }
    else:
        # Generic
        return {}

    # Run extraction
    extracted = {}
    
    for field, strategies in schema.items():
        best_val = None
        best_source = None
        best_conf = 0.0
        
        candidates = []
        
        for strat_type, param in strategies:
            val = None
            if strat_type == "regex":
                val = strategy_regex(context, param)
            elif strat_type == "layout":
                if param == "top_right_number":
                     val = strategy_layout_top_right(context)
                elif param == "top_header":
                     if context.blocks: val = context.blocks[0].text # Naive first block
            elif strat_type == "donut":
                 if best_val is None and not candidates:
                     if context.donut_data is None:
                         context.donut_data = run_donut(context.file_path)
                     val = context.donut_data.get(param)
            
            if val:
                # Clean value
                if isinstance(val, str):
                     val = val.strip().replace('$', '')
                
                candidates.append((val, strat_type))
                
                # Logic: Regex is usually high confidence if specific
                conf = 0.7 if strat_type == "regex" else 0.5
                if strat_type == "donut": conf = 0.6
                
                if conf > best_conf:
                    best_conf = conf
                    best_val = val
                    best_source = strat_type
        
        # Consensus Bonus
        if len(candidates) >= 2:
            # Check if values match
            values = [c[0] for c in candidates]
            if len(set(values)) == 1:
                best_conf = 0.95 # High confidence if Agreement
            else:
                 best_conf = 0.8 # Some Agreement
        
        if best_val:
            fd = FieldData(value=best_val, confidence=best_conf, source=best_source)
            yield field, fd

def calculate_confidence(doc_type, final_data):
    # Backward compatibility if needed, but we are moving to new logic
    pass

def calculate_final_confidence(doc_type, accumulated_fields):
    """
    Calculates confidence based on the presence of required fields.
    Returns: float (0.0 to 1.0)
    """
    REQUIRED_FIELDS = {
        "invoice": ["invoice_number", "date", "total_amount", "vendor"],
        "receipt": ["merchant", "date", "total"],
        "contract": ["party_1", "party_2", "start_date"] 
    }
    
    doc_required = REQUIRED_FIELDS.get(doc_type, [])
    
    if not doc_required:
         # Fallback: Average of field confidences
         if accumulated_fields:
             avg = sum(f.confidence for f in accumulated_fields.values()) / len(accumulated_fields)
             return round(avg, 2)
         return 0.0

    found_count = 0
    for field in doc_required:
        # Check if field exists and has a non-empty value
        if field in accumulated_fields and accumulated_fields[field].value:
            found_count += 1
    
    return round(found_count / len(doc_required), 2)

    return round(found_count / len(doc_required), 2)

# --- Accounting Logic Helpers ---

def parse_amount(text: Optional[str]) -> Optional[float]:
    if not text: return None
    try:
        # Remove currency symbols and valid non-numeric chars
        clean = re.sub(r'[^\d.,-]', '', str(text))
        # Handle 1,000.00 vs 1.000,00 logic if needed, but assuming standard US/UK for now
        # Simply remove commas
        clean = clean.replace(',', '')
        return float(clean)
    except:
        return None

def parse_date(text: Optional[str]) -> Optional[datetime]:
    if not text: return None
    from dateutil import parser
    try:
        return parser.parse(text)
    except:
        return None

def apply_accounting_logic(file_id, doc_type, extracted_fields):
    """
    Post-process extracted fields to apply accounting rules.
    Returns a dict of updates for FileMetadata.
    """
    updates = {}
    
    def get_val(key):
        item = extracted_fields.get(key)
        if not item: return None
        if isinstance(item, FieldData): return item.value
        if isinstance(item, dict): return item.get("value")
        return None
    
    # 1. Parse Amounts
    total = parse_amount(get_val("total_amount"))
    tax = parse_amount(get_val("tax_amount"))
    subtotal = parse_amount(get_val("subtotal"))
    
    if total is not None: updates["total_amount"] = total
    if tax is not None: updates["tax_amount"] = tax
    if subtotal is not None: updates["subtotal"] = subtotal
    
    # 1b. Validate/Calculate Total
    if total and tax and subtotal:
        if abs((subtotal + tax) - total) < 0.05:
            # High confidence if math works
            if "total_amount" in extracted_fields:
                # We need to act on the object in extracted_fields
                f = extracted_fields["total_amount"]
                if isinstance(f, FieldData):
                    f.confidence = 0.99
                elif isinstance(f, dict):
                    f["confidence"] = 0.99
                
    # 2. Parse Date & Assign Month/Year
    date_val = get_val("date")
    if date_val:
        dt = parse_date(date_val)
        if dt:
            updates["invoice_date"] = dt.strftime("%Y-%m-%d")
            updates["month"] = dt.month
            updates["year"] = dt.year
            
    # 3. Vendor & Category
    vendor = get_val("vendor")
    if vendor:
        updates["vendor_name"] = vendor
        # Simple Category Mapping
        vendor_lower = vendor.lower()
        if any(x in vendor_lower for x in ["uber", "taxi", "train", "flight"]):
            updates["category"] = "Transport"
        elif any(x in vendor_lower for x in ["slack", "aws", "github", "adobe", "google"]):
            updates["category"] = "Software"
        elif any(x in vendor_lower for x in ["restaurant", "cafe", "coffee", "food"]):
            updates["category"] = "Meals"
        elif any(x in vendor_lower for x in ["office", "staples", "paper"]):
            updates["category"] = "Office supplies"
        else:
            updates["category"] = "Services" # Default

    # 4. Invoice Number
    inv_num = get_val("invoice_number")
    if inv_num:
        updates["invoice_number"] = inv_num
        
    return updates

def check_duplicates(file_id, invoice_number, vendor_name):
    """
    Check if duplicate invoice exists.
    Returns True if duplicate found.
    """
    if not invoice_number or not vendor_name: return False
    
    from database import get_all_records
    all_recs = get_all_records()
    
    for r in all_recs:
        if r.id == file_id: continue
        if r.status != ProcessingStatus.COMPLETED: continue  # Check completed invoices
        
        meta = r.metadata
        if not meta: continue
        
        # Check match
        if meta.vendor_name == vendor_name and meta.invoice_number == invoice_number:
            return True
            
    return False

@huey.task()
def process_document(file_id, file_path):
    print(f"Processing Pipeline for {file_id}")
    try:
        from models import ProcessingState
        
        # Stage 1: OCR
        # State: OCR_DONE
        update_status(file_id, ProcessingStatus.OCR, processing_state=ProcessingState.OCR_DONE)
        full_text, blocks = run_stages_ocr(file_path)
        
        # Stage 2: Classify
        # State: CLASSIFIED
        update_status(file_id, ProcessingStatus.CLASSIFYING, processing_state=ProcessingState.CLASSIFIED)
        doc_type, type_conf = classify_document(full_text)
        
        print(f"[{file_id}] Classified as {doc_type} ({type_conf})")
        
        # Fast exit for non-financial documents (Resumes, CVs, generic PDFs with no financial info)
        if doc_type in ["resume", "unknown"]:
            is_cv = doc_type == "resume"
            vendor_tag = "CV / Profil (Non-Facture)" if is_cv else "Document Non-Comptable"
            reject_msg = (
                "Document non comptable détecté (CV ou profil). Seules les factures et reçus sont traités."
                if is_cv
                else "Document non comptable détecté (aucune donnée financière ou de facturation identifiée)."
            )
            meta = FileMetadata(
                document_type=doc_type,
                confidence=0.0,
                vendor_name=vendor_tag,
                extracted_fields={},
                extracted_data={"is_non_financial": True, "reason": reject_msg}
            )
            meta_dict = meta.dict()
            meta_dict["ocr_full_text"] = full_text[:1000]
            update_status(
                file_id,
                ProcessingStatus.REJECTED,
                meta_dict,
                error=reject_msg,
                processing_state=ProcessingState.COMPLETED
            )
            print(f"[{file_id}] Fast exit: Rejected as non-financial document ({doc_type}).")
            return

        # Init Metadata (Temporary Confidence)
        meta = FileMetadata(
            document_type=doc_type,
            confidence=0.0, # Temporary
            extracted_fields={},
            extracted_data={}
        )
        
        update_status(file_id, ProcessingStatus.EXTRACTING, meta.dict(), processing_state=ProcessingState.EXTRACTING)
        
        # Stage 3: Extraction (Progressive)
        context = ExtractionContext(full_text, blocks, file_path, doc_type)
        
        accumulated_fields = {}
        accumulated_data = {}
        
        # Loop through fields - STATE remains EXTRACTING
        for field_name, field_data in extract_fields_progressive(file_id, context):
            print(f"[{file_id}] Extracted {field_name}: {field_data.value}")
            accumulated_fields[field_name] = field_data
            accumulated_data[field_name] = field_data.value
            
            # Emit Update
            meta.extracted_fields = accumulated_fields
            meta.extracted_data = accumulated_data
            
            # Update current confidence without affecting status
            if accumulated_fields:
                curr_conf = sum(f.confidence for f in accumulated_fields.values()) / len(accumulated_fields)
                meta.confidence = round(curr_conf, 2)
            
            update_status(file_id, ProcessingStatus.EXTRACTING, meta.dict())
            
        # Finalization
        # State: COMPLETED (or REVIEW)
        
        # Finalization
        # State: COMPLETED (or REVIEW)
        
        # 3b. Accounting Logic & Post-processing
        print(f"[{file_id}] Applying Accounting Logic...")
        acc_updates = apply_accounting_logic(file_id, doc_type, accumulated_fields)
        
        # Update metadata with accounting fields
        for k, v in acc_updates.items():
            if hasattr(meta, k):
                setattr(meta, k, v)
            # Also update into extracted_data for easy access
            meta.extracted_data[k] = v
            
        # 3c. Duplicate Check
        is_duplicate = check_duplicates(file_id, meta.invoice_number, meta.vendor_name)
        if is_duplicate:
            print(f"[{file_id}] Duplicate detected!")
            
        # 1. Final Confidence Calculation
        final_conf = calculate_final_confidence(doc_type, accumulated_fields)
        meta.confidence = final_conf
        
        # 2. Determine Final Status based on Rules
        # Mark document as Needs Review if:
        # - Tax missing
        # - Duplicate detected
        # - Confidence < 0.75
        
        # Completed only if:
        # - invoice_number, date, vendor, total are present (checked by confidence mostly, but we can be explicit)
        
        final_status = ProcessingStatus.FAILED
        final_state = ProcessingState.REVIEW 
        
        # Check mandatory fields presence explicitly
        has_mandatory = (
            meta.invoice_number is not None and 
            meta.invoice_date is not None and 
            meta.vendor_name is not None and 
            meta.total_amount is not None
        )
        
        # Check Tax
        tax_present = meta.tax_amount is not None
        
        if is_duplicate:
             final_status = ProcessingStatus.NEEDS_REVIEW
             meta.extracted_data["is_duplicate"] = True # Flag for UI
             final_state = ProcessingState.REVIEW
        elif not tax_present:
             # Rule: Review if Tax missing
             final_status = ProcessingStatus.NEEDS_REVIEW
             final_state = ProcessingState.REVIEW
        elif final_conf < 0.75:
             final_status = ProcessingStatus.NEEDS_REVIEW
             final_state = ProcessingState.REVIEW
        elif not has_mandatory:
             final_status = ProcessingStatus.NEEDS_REVIEW
             final_state = ProcessingState.REVIEW
        else:
             final_status = ProcessingStatus.COMPLETED
             final_state = ProcessingState.COMPLETED
             
        meta_dict = meta.dict()
        meta_dict["ocr_full_text"] = full_text
        update_status(file_id, final_status, meta_dict, processing_state=final_state)
        print(f"Pipeline Finished {file_id}: {final_status} (Conf: {final_conf})")

        # Automatically index document chunks for RAG semantic search
        try:
            from rag_service import rag_service
            rag_service.index_document(file_id)
        except Exception as rag_err:
            print(f"[{file_id}] RAG indexing note: {rag_err}")

    except Exception as e:
        print(f"Error processing {file_id}: {e}")
        import traceback
        traceback.print_exc()
        from models import ProcessingState
        update_status(file_id, ProcessingStatus.FAILED, error=str(e), processing_state=ProcessingState.REVIEW)
