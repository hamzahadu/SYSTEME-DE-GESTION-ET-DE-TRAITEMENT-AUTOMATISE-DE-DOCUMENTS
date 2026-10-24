# Rule: Gestion Document System Context & Architecture Memory

This repository contains **Gestion Document**, an intelligent document and accounting management platform designed for a Master PFE defense in Morocco by Hamza Haddou.

## Critical Behavioral Guidelines:
1. **Application Brand**:
   - The brand name is strictly **Gestion Document** (formerly DocuProcess / GestionDoc AI).
   - Subtitle: *"Gestion Documentaire & Comptable"* (FR) / *"Intelligent Document Management"* (EN).

2. **Currency & Localization**:
   - The user is based in Morocco. The default currency is **MAD (DH)**, with options for **EUR (€)** and **USD ($)**.
   - Always use `const { formatCurrency } = useCurrency();` to format financial numbers across components.

3. **Styling & Theming**:
   - Uses Tailwind CSS v4. The class-based dark mode selector is `@custom-variant dark (&:where(.dark, .dark *));` defined in `frontend/src/index.css`.
   - Never hardcode dark background colors (like `bg-black` or `bg-slate-900`) without proper responsive dark variants (`bg-white dark:bg-zinc-900` or `bg-[#F3F5F7] dark:bg-zinc-950`).

4. **Document Extraction & Architecture**:
   - Backend is FastAPI on port 8000, connected to SQLite/PostgreSQL with SQLAlchemy.
   - Background tasks run via Huey consumer: `python -m huey.bin.huey_consumer tasks.huey -w 2`.
   - Document pipeline incorporates Tesseract 5 OCR, fast regex/layout classification, semantic RAG search via `rag_service.py`, and Human-in-the-Loop review in `EditModal.jsx`.

5. **Start Command**:
   - Start all services with `start_project.bat`.
