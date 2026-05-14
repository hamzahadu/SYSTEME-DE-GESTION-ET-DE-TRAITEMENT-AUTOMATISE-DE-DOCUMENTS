<p align="center"> <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white"/> <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black"/> <img src="https://img.shields.io/badge/TailwindCSS-UI-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/> <img src="https://img.shields.io/badge/Python-AI-3776AB?style=for-the-badge&logo=python&logoColor=white"/> </p> <p align="center">
  AI-powered document processing platform for invoices, receipts, and financial workflows. </p>
  
# DocuProcess AI 📄

An AI-powered document processing platform designed to automate the extraction of structured data from invoices, receipts, and financial documents. This project bridges the gap between raw document images/PDFs and actionable financial data using modern OCR and transformer models.

## ✨ Features

### 🤖 Intelligent Data Extraction

Leverages **DocTR** and **Transformer** models to pull structured fields automatically:

* **Core Fields:** Invoice Number, Vendor Name, and Dates.
* **Financials:** Tax amounts, Currency detection, and Subtotals/Totals.
* **Tech:** Powered by deep learning models for high-accuracy OCR.

### ⚡ Async Processing Pipeline

Don't let the UI hang while the AI thinks. We use **Huey** as a background worker to handle:

* **Live States:** Queued → Processing → Completed/Failed.
* **Performance:** Non-blocking API requests via FastAPI.

### 📊 Business Intelligence

* **Dashboards:** Track monthly and quarterly spending at a glance.
* **Vendor Insights:** See where the money is going with automated vendor breakdowns.
* **Export:** Take your data with you in **Excel**, **CSV**, or **JSON**.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Backend** | FastAPI, Python |
| **AI/ML** | DocTR, PyTorch, HuggingFace Transformers |
| **Task Queue** | Huey (with SQLite/Redis) |
| **Frontend** | React (Vite), Tailwind CSS, Axios |
| **Security** | JWT Authentication, Multi-tenant Isolation |

---

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

```

*The API will be available at `http://127.0.0.1:8000*`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev

```

*The dashboard will be available at `http://localhost:5173*`

---

## 📁 Project Structure

```text
DocuProcess-AI/
├── backend/            # FastAPI Application
│   ├── routes/         # API Endpoints
│   ├── services/       # OCR & AI Logic
│   └── models/         # DB Schemas (SQLite)
├── frontend/           # React Application
│   ├── src/components/ # Reusable UI 
│   └── src/pages/      # Dashboard & Upload views
└── README.md

```

---

## 📈 Roadmap & Future Plans

* [ ] **Multi-page PDF Support:** Handling complex, multi-page financial statements.
* [ ] **Integrations:** Direct sync with Xero and QuickBooks.
* [ ] **Fraud Detection:** Identifying duplicate or suspicious invoices using AI.
* [ ] **Dockerization:** Containerizing the stack for easy deployment.
* [ ] **Cloud Storage:** Moving from local storage to AWS S3/Azure Blobs.

## 📸 Preview

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

*Built for modern, automated accounting workflows.*
