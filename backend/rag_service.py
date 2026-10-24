import os
import re
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from database import SessionLocal
from db_models import DocumentModel, DocumentChunkModel

class RAGService:
    """
    Retrieval-Augmented Generation (RAG) engine for enterprise accounting documents.
    Indexes invoices, receipts, and financial records for natural language Q&A.
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self._cached_chunks = {}  # company_id -> list of chunk dicts
        self._cached_matrices = {}  # company_id -> tfidf_matrix

    def index_document(self, document_id: str, company_id: Optional[str] = None):
        """
        Creates semantic chunks for an ingested document.
        Combines structured accounting fields with full-text OCR blocks.
        """
        db = SessionLocal()
        try:
            doc = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
            if not doc:
                return

            cid = doc.company_id or company_id or "default"

            # Remove previous chunks for this document
            db.query(DocumentChunkModel).filter(DocumentChunkModel.document_id == document_id).delete()

            chunks_to_create = []

            # 1. Structured Accounting Summary Chunk (High semantic value)
            summary_parts = [
                f"Document: {doc.filename}",
                f"Type: {doc.document_type or 'Invoice'}",
                f"Status: {doc.status}"
            ]
            if doc.invoice_number:
                summary_parts.append(f"Invoice Number: {doc.invoice_number}")
            if doc.vendor_name:
                summary_parts.append(f"Vendor / Merchant: {doc.vendor_name}")
            if doc.invoice_date:
                summary_parts.append(f"Invoice Date: {doc.invoice_date}")
            if doc.total_amount is not None:
                summary_parts.append(f"Total Amount: ${doc.total_amount:.2f} {doc.currency or 'USD'}")
            if doc.tax_amount is not None:
                summary_parts.append(f"Tax / VAT Amount: ${doc.tax_amount:.2f}")
            if doc.subtotal is not None:
                summary_parts.append(f"Subtotal: ${doc.subtotal:.2f}")
            if doc.category:
                summary_parts.append(f"Expense Category: {doc.category}")
            if doc.tags:
                summary_parts.append(f"Tags: {', '.join(doc.tags)}")

            summary_text = " | ".join(summary_parts)
            chunks_to_create.append(summary_text)

            # 2. OCR Full Text Chunks (Chunks of ~400 characters)
            if doc.ocr_full_text:
                clean_ocr = " ".join(doc.ocr_full_text.split())
                ocr_paragraphs = [clean_ocr[i:i+400] for i in range(0, len(clean_ocr), 350)]
                chunks_to_create.extend(ocr_paragraphs[:5])

            for idx, text_chunk in enumerate(chunks_to_create):
                chunk_record = DocumentChunkModel(
                    id=f"{document_id}_chunk_{idx}",
                    document_id=document_id,
                    chunk_index=idx,
                    chunk_text=text_chunk,
                    created_at=datetime.utcnow()
                )
                db.add(chunk_record)

            db.commit()

            # Invalidate memory cache for this company
            self._cached_chunks.pop(cid, None)
            self._cached_matrices.pop(cid, None)

        except Exception as e:
            db.rollback()
            print(f"[RAG Error] index_document failed for {document_id}: {e}")
        finally:
            db.close()

    def reindex_company_documents(self, company_id: str) -> int:
        """Indexes all existing non-archived documents for a company."""
        db = SessionLocal()
        try:
            doc_ids = [row[0] for row in db.query(DocumentModel.id).filter(
                DocumentModel.company_id == company_id,
                DocumentModel.archived == False
            ).all()]
        finally:
            db.close()

        for did in doc_ids:
            self.index_document(did, company_id=company_id)
        return len(doc_ids)

    def _get_company_index(self, company_id: str):
        """Retrieves or builds in-memory vector index for a company."""
        if company_id in self._cached_chunks and company_id in self._cached_matrices:
            return self._cached_chunks[company_id], self._cached_matrices[company_id], self.vectorizer

        db = SessionLocal()
        try:
            # Check existing chunks
            chunk_count = (
                db.query(DocumentChunkModel)
                .join(DocumentModel, DocumentChunkModel.document_id == DocumentModel.id)
                .filter(DocumentModel.company_id == company_id, DocumentModel.archived == False)
                .count()
            )

            if chunk_count == 0:
                doc_ids = [row[0] for row in db.query(DocumentModel.id).filter(
                    DocumentModel.company_id == company_id,
                    DocumentModel.archived == False
                ).limit(50).all()]
                db.close()

                for did in doc_ids:
                    self.index_document(did, company_id)

                db = SessionLocal()

            results = (
                db.query(DocumentChunkModel, DocumentModel)
                .join(DocumentModel, DocumentChunkModel.document_id == DocumentModel.id)
                .filter(DocumentModel.company_id == company_id, DocumentModel.archived == False)
                .all()
            )

            chunk_records = []
            corpus = []
            for chunk, doc in results:
                data = {
                    "chunk_id": chunk.id,
                    "document_id": doc.id,
                    "filename": doc.filename,
                    "vendor_name": doc.vendor_name,
                    "total_amount": doc.total_amount,
                    "invoice_date": doc.invoice_date,
                    "category": doc.category,
                    "status": doc.status,
                    "text": chunk.chunk_text
                }
                chunk_records.append(data)
                corpus.append(chunk.chunk_text)

            if not corpus:
                return [], None, None

            # Fit TF-IDF matrix
            matrix = self.vectorizer.fit_transform(corpus)
            self._cached_chunks[company_id] = chunk_records
            self._cached_matrices[company_id] = matrix

            return chunk_records, matrix, self.vectorizer
        finally:
            db.close()

    def query(self, user_query: str, company_id: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Retrieves relevant document context and generates an augmented answer.
        """
        chunks, matrix, vectorizer = self._get_company_index(company_id)
        if not chunks or matrix is None or vectorizer is None:
            return {
                "query": user_query,
                "answer": "No documents are currently indexed for your company. Please upload invoices or receipts first.",
                "sources": []
            }

        # 1. Vector similarity search
        query_vec = vectorizer.transform([user_query])
        similarities = cosine_similarity(query_vec, matrix).flatten()
        top_indices = np.argsort(similarities)[::-1][:top_k]

        matched_chunks = []
        seen_doc_ids = set()
        sources = []

        for idx in top_indices:
            score = float(similarities[idx])
            chunk = chunks[idx]
            matched_chunks.append(chunk)

            if chunk["document_id"] not in seen_doc_ids:
                seen_doc_ids.add(chunk["document_id"])
                sources.append({
                    "document_id": chunk["document_id"],
                    "filename": chunk["filename"],
                    "vendor_name": chunk["vendor_name"] or "Unknown Vendor",
                    "total_amount": chunk["total_amount"],
                    "invoice_date": chunk["invoice_date"],
                    "category": chunk["category"],
                    "relevance_score": round(score, 3)
                })

        # 2. Augmented Answer Synthesis
        answer = self._synthesize_answer(user_query, matched_chunks, sources)

        return {
            "query": user_query,
            "answer": answer,
            "sources": sources
        }

    def _synthesize_answer(self, query: str, context_chunks: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> str:
        """
        Synthesizes a natural, factual response based strictly on the retrieved context.
        Supports both French and English queries.
        """
        q_lower = query.lower()
        is_french = any(w in q_lower for w in ["combien", "facture", "dépensé", "fournisseur", "total", "quelles", "montant", "quel"])

        if not sources or max([s["relevance_score"] for s in sources], default=0) < 0.05:
            if is_french:
                return "Aucun document financier pertinent n'a été trouvé correspondant à votre question dans les dossiers de votre entreprise."
            return "No relevant financial documents matching your query were found in your company records."

        # Compute sum or totals if asked about spend/cost
        is_sum_query = any(w in q_lower for w in ["total", "sum", "combien", "how much", "spend", "dépensé", "dépense"])
        amounts = [s["total_amount"] for s in sources if s.get("total_amount") is not None]

        if is_sum_query and amounts:
            total_sum = sum(amounts)
            doc_names = ", ".join([f"**{s['filename']}** ({s['vendor_name']}: ${s['total_amount']:.2f})" for s in sources[:3] if s.get("total_amount") is not None])
            
            if is_french:
                return (
                    f"D'après les documents pertinents retrouvés, le montant total identifié est de **${total_sum:.2f}**.\n\n"
                    f"**Documents sources identifiés :**\n"
                    f"- {doc_names}\n\n"
                    f"Vous pouvez vérifier ou modifier les détails de ces pièces dans l'onglet Documents."
                )
            else:
                return (
                    f"Based on the relevant documents retrieved, the total calculated amount is **${total_sum:.2f}**.\n\n"
                    f"**Identified Source Documents:**\n"
                    f"- {doc_names}\n\n"
                    f"You can inspect and confirm these invoices directly in your Documents view."
                )

        # General summary answer
        top_source = sources[0]
        if is_french:
            resp = (
                f"Voici les informations trouvées pour votre recherche :\n\n"
                f"- **Document principal :** {top_source['filename']}\n"
                f"- **Fournisseur :** {top_source['vendor_name']}\n"
                f"- **Date :** {top_source['invoice_date'] or 'Non spécifiée'}\n"
                f"- **Montant :** ${top_source['total_amount']:.2f} USD\n"
                f"- **Catégorie :** {top_source['category'] or 'Non catégorisé'}\n\n"
                f"Au total, {len(sources)} document(s) correspondent à votre critère."
            )
        else:
            resp = (
                f"Here is the information found matching your request:\n\n"
                f"- **Top Document:** {top_source['filename']}\n"
                f"- **Vendor:** {top_source['vendor_name']}\n"
                f"- **Date:** {top_source['invoice_date'] or 'N/A'}\n"
                f"- **Amount:** ${top_source['total_amount']:.2f} USD\n"
                f"- **Category:** {top_source['category'] or 'Uncategorized'}\n\n"
                f"Found {len(sources)} related document(s) in total."
            )

        return resp

# Singleton instance
rag_service = RAGService()
