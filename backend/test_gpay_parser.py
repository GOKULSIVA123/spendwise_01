# test_gpay_parser.py
# Verification test for gpay_parser.py

from gpay_parser import parse_gpay_document, classify_category, clean_merchant_title

def test_merchant_cleaning():
    print("🧪 1. Testing Merchant Title Cleaning & Category Classification...")
    samples = [
        ("Paid to Swiggy", "Swiggy", "Food"),
        ("UPI/Zomato Media/987123", "Zomato Media", "Food"),
        ("Transfer to Uber India", "Uber India", "Transport"),
        ("HPCL PETROL PUMP", "Hpcl Petrol Pump", "Transport"),
        ("AMAZON PAY INDIA", "Amazon Pay India", "Shopping"),
        ("Netflix Entertainment", "Netflix Entertainment", "Entertainment"),
        ("BESCOM ELECTRICITY BILL", "Bescom Electricity Bill", "Utilities"),
        ("Unknown General Merchant", "Unknown General Merchant", "Other"),
    ]
    for raw, expected_clean, expected_cat in samples:
        clean = clean_merchant_title(raw)
        cat = classify_category(clean)
        print(f"   '{raw}' ➔ '{clean}' [{cat}]")
        assert cat == expected_cat, f"Expected {expected_cat}, got {cat}"

def test_csv_parsing():
    print("\n🧪 2. Testing GPay CSV Statement Parsing...")
    sample_csv = """Date,Description,Amount,Status
05/10/2026,Paid to Swiggy Bundl,340.50,Success
06/10/2026,Shell Fuel Station,500.00,Completed
07/10/2026,Amazon Marketplace,1299.00,Success
08/10/2026,Payment to Chai Point,45.00,Completed
09/10/2026,Bescom Power Bill,1450.00,Completed
10/10/2026,Transfer to Friend,500.00,Failed
"""
    results = parse_gpay_document(sample_csv.encode("utf-8"), "sample_gpay.csv")
    print(f"   Successfully parsed {len(results)} transactions (failed txns filtered out).")
    assert len(results) == 5, f"Expected 5 successful transactions, got {len(results)}"
    
    first = results[0]
    print(f"   First txn: {first['title']} | ₹{first['amount']} | {first['category']} | {first['date']}")
    assert first["amount"] == 340.50
    assert first["category"] == "Food"
    assert first["date"] == "2026-10-05"

    second = results[1]
    assert second["category"] == "Transport"
    assert second["amount"] == 500.00

    print("\n✅ All GPay Parser Unit Tests Passed Successfully!")

if __name__ == "__main__":
    test_merchant_cleaning()
    test_csv_parsing()
