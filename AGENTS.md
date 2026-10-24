# GESTION DOCUMENT — Architecture, Memory & Instructions

> **Permanent Project Context & Memory for AI Agents**  
> *Last Updated: October 2026*  
> *Project: Gestion Document (Master PFE Maroc — Intelligent Accounting & Document Management Platform)*  
> *Author: Hamza Haddou (`haddouhamza2000@gmail.com`)*

---

## 1. Project Overview & Identity
- **Official Brand Name**: **Gestion Document**
- **Subtitles**:
  - French: *"Gestion Documentaire & Comptable"*
  - English: *"Intelligent Document Management"*
- **Target Audience / Purpose**:
  - Master PFE thesis defense in Morocco.
  - Production-grade SaaS accounting automation for Moroccan & international SMEs.
  - Core philosophy: **Human-in-the-Loop AI** (AI extracts & pre-fills with uncertainty scores, human accountant reviews and validates).

---

## 2. Technical Stack & Environment
- **Backend**:
  - **Framework**: FastAPI (Python 3.14 / 3.12+).
  - **Task Queue**: Huey async background worker (`tasks.huey`) with SQLite/Redis backend.
  - **Database**: SQLAlchemy ORM with auto-migration (`database.py`, `db_models.py`, `models.py`). Runs on SQLite (`docuprocess.db`) locally and PostgreSQL in Docker.
  - **OCR Engine**: Tesseract OCR 5 (`pytesseract`, `pdf2image`, `PyPDF2`).
  - **AI Extraction Pipeline**: Hybrid Regex anchors with OCR error tolerance + Spatial layout heuristic.
  - **RAG Engine**: Semantic document vector search over OCR text chunks (`rag_service.py`), supporting TF-IDF cosine similarity and dense embeddings.
  - **Authentication**: JWT Bearer authentication with PBKDF2 password hashing (`auth.py`).
- **Frontend**:
  - **Framework**: React 19 + Vite 7.
  - **Styling**: Tailwind CSS v4 (configured via `@custom-variant dark (&:where(.dark, .dark *));` in `index.css`).
  - **Icons & Animation**: Lucide React + Framer Motion.
  - **Charts**: Recharts.
  - **State / Contexts**:
    - `AuthContext`: Session, JWT storage, profile updates (`updateProfile`).
    - `LanguageContext`: French (`fr`) default & English (`en`).
    - `ThemeContext`: Dark mode / Light mode class-based toggling.
    - `CurrencyContext`: Multi-currency support (`MAD` default, `EUR`, `USD`).

---

## 3. Major Features & Work Implemented

### A. Dark Mode & UI Theming
- Fixed sticking dark mode issue by adding `@custom-variant dark (&:where(.dark, .dark *));` to `frontend/src/index.css`.
- Removed hardcoded `bg-black` and `bg-slate-900` from `Sidebar.jsx`, `TopBar.jsx`, and `Profile.jsx`.
- Clean white / gray theme (`#F3F5F7` bg with `#ffffff` cards) in light mode, deep zinc (`#09090b` bg with `#18181b` cards) in dark mode.

### B. Multi-Currency Engine (`CurrencyContext.jsx`)
- Supports **MAD (DH)** for Morocco, **EUR (€)**, and **USD ($)**.
- Formats amounts cleanly (e.g. `1 450,00 DH`, `1 450,00 €`, `$1,450.00`).
- Integrated into `TopBar.jsx` dropdown, `Dashboard.jsx`, `FileList.jsx`, `FileItem.jsx`, `Categories.jsx`, and `EditModal.jsx`.

### C. Extended Profile Dashboard (`Profile.jsx`)
- Redesigned from a narrow 672px card into a full-width `max-w-6xl` responsive dashboard.
- Includes:
  - First Name (`Prénom`) & Last Name (`Nom`).
  - Email (verified badge).
  - Phone Number (`Numéro de Téléphone` persisted in database via `UserModel.phone`).
  - Role selection (Administrateur, Comptable, Étudiant / Chercheur, Observateur).
  - Security (Current password, New password, Confirmation).
  - Workspace details & Company ID copy button.
  - In-page Quick Theme & Language switcher.

### D. Accounting Breakdown & Audit Trail (`EditModal.jsx`)
- **Écritures Comptables Tab**:
  - Montant HT (Hors Taxes).
  - Taux de TVA (20% standard, 14%, 10%, 7%, 0%) & Montant TVA.
  - Montant Total TTC.
  - Auto-calculation buttons (`Calculer TTC = HT + TVA` and `Déduire HT depuis TTC`).
  - Confidence pills (`IA : 95%`) and field-level extraction source badges.
- **Piste d'Audit & IA Tab**:
  - Visual 6-step timeline for jury presentation: Ingestion Horodatée -> OCR Tesseract -> Classification Sémantique (100%) -> Extraction Hybride -> Indexation RAG -> Supervision Humaine.

### E. Professional Accounting Export (`ExportModal.jsx`)
- Multi-sheet Excel export (`.xlsx`), CSV (`.csv`), and JSON (`.json`).
- Direct export buttons in `FileList.jsx` and `Categories.jsx`.

### F. Fast Document Classification & Upload Pipeline
- OCR classification uses regex word boundaries `\b` in `classify_document` to prevent false invoice detections (e.g. Resumes/CVs correctly marked as `Rejected` with zero delay).
- Heavy transformer Donut model is disabled by default (`ENABLE_DONUT=false`) for instant local processing.

---

## 4. Run & Development Commands
- **Launch Everything (Batch script)**:
  ```cmd
  start_project.bat
  ```
  Launches:
  1. Backend API on `http://127.0.0.1:8000` (docs at `/docs`).
  2. Huey Worker on `tasks.huey`.
  3. Frontend on `http://localhost:5173`.
- **Backend Manual Run**:
  ```cmd
  .venv\Scripts\activate.bat
  cd backend
  uvicorn main:app --reload --port 8000
  ```
- **Huey Worker**:
  ```cmd
  .venv\Scripts\activate.bat
  cd backend
  python -m huey.bin.huey_consumer tasks.huey -w 2
  ```
- **Frontend Manual Run**:
  ```cmd
  cd frontend
  npm run dev
  ```
- **Frontend Production Build**:
  ```cmd
  cd frontend
  npm run build
  ```

---

## 5. Important Guidelines for Future Agents
- Keep the branding strictly **Gestion Document**.
- Always use `formatCurrency(val)` from `useCurrency` when rendering financial amounts.
- Maintain bilingual keys in `frontend/src/context/LanguageContext.jsx` for any new UI element.
- Ensure all Tailwind classes support both light mode and dark mode via `dark:` variants.
