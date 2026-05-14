
import sys
import os
import unittest
from typing import List

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from tasks import (
    classify_document,
    extract_fields_progressive,
    calculate_final_confidence,
    ExtractionContext,
    OCRBlock,
    FieldData
)

class MockContext(ExtractionContext):
    def __init__(self, text, blocks, doc_type, donut_data=None):
        self.text = text
        self.blocks = blocks
        self.file_path = "mock.pdf"
        self.doc_type = doc_type
        self.donut_data = donut_data

class TestPipelineRefactor(unittest.TestCase):
    
    def test_classify_invoice(self):
        text = """
        SUPERSTORE INC.
        INVOICE # 12345
        Total Amount: $500.00
        """
        doc_type, conf = classify_document(text)
        self.assertEqual(doc_type, "invoice")
        self.assertGreater(conf, 0.5)

    def test_classify_receipt(self):
        text = """
        Walmart Store #123
        Receipt for your purchase
        Total: $12.99
        Thank you for shopping
        """
        doc_type, conf = classify_document(text)
        self.assertEqual(doc_type, "receipt")

    def test_extract_invoice_fields(self):
        text = """
        INVOICE
        Invoice Number: INV-2024-001
        Date: Oct 12, 2024
        Balance Due: $1,250.00
        """
        # Mock Layout Blocks (Top Right for Layout Strategy)
        # 0-1 coords. Top Right is x>0.5, y<0.4
        blocks = [
            OCRBlock("INV-2024-001", (0.6, 0.1, 0.8, 0.15)), # Top Right Number
            OCRBlock("INVOICE", (0.4, 0.05, 0.6, 0.1))
        ]
        
        context = MockContext(text, blocks, "invoice", donut_data={"total_price": "1250.00"})
        
        results = {}
        print("\n--- Testing Extraction ---")
        for field, data in extract_fields_progressive("test_id", context):
            print(f"Got {field}: {data.value} (Conf: {data.confidence}, Src: {data.source})")
            results[field] = data

        self.assertEqual(results["invoice_number"].value, "INV-2024-001")
        # Should pick regex or layout, likely regex gives high confidence
        
        self.assertEqual(results["date"].value, "Oct 12, 2024")
        
        # Total Amount: Donut says 1250.00, Regex says 1,250.00.
        # They match in value.
        self.assertIn("1,250.00", str(results["total_amount"].value))

    def test_consensus_bonus(self):
        # Scenario: Regex and Layout agree
        text = "Invoice # 123"
        blocks = [OCRBlock("123", (0.8, 0.1, 0.9, 0.2))]
        context = MockContext(text, blocks, "invoice", donut_data={}) # Fix: Provide empty dict so it doesn't trigger run_donut
        results = {}
        for field, data in extract_fields_progressive("test_id", context):
            if field == "invoice_number":
                results["invoice_number"] = data
        
        # If both agree, confidence should be high
        self.assertTrue(results["invoice_number"].confidence >= 0.8)

    def test_confidence_ratio(self):
        # 4 required fields for Invoice: invoice_number, date, total_amount, vendor
        required = ["invoice_number", "date", "total_amount", "vendor"]
        extracted = {
            "invoice_number": FieldData(value="123", confidence=0.9, source="regex"),
            "date": FieldData(value="2022-01-01", confidence=0.8, source="regex"),
            "total_amount": FieldData(value="100.00", confidence=0.7, source="regex")
            # Vendor missing
        }
        
        conf = calculate_final_confidence("invoice", extracted)
        self.assertEqual(conf, 0.75)
        
        # Test Status Logic (simulated)
        status = "Failed"
        if conf >= 0.75: status = "Completed"
        elif conf >= 0.5: status = "Needs Review"
        
        self.assertEqual(status, "Completed")
        
        # Test Perfect Case
        extracted["vendor"] = FieldData(value="Vendor Inc", confidence=0.5, source="layout")
        conf_perfect = calculate_final_confidence("invoice", extracted)
        self.assertEqual(conf_perfect, 1.0)

if __name__ == "__main__":
    unittest.main()
