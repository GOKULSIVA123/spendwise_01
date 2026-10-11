# gpay_parser.py
# Intelligent Google Pay (GPay) and UPI Statement Parser.
# Supports both CSV / Excel text exports and PDF statements.
# Automatically extracts Date, Merchant Title, Amount, and classifies Categories.

import io
import re
import csv
from datetime import datetime
from typing import List, Dict, Any
from dateutil import parser as date_parser


# ─────────────────────────────────────────────────────────────────────────────
# SMART CATEGORY CLASSIFICATION RULES
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_RULES = {
    "Food": [
        "swiggy", "zomato", "mcdonald", "kfc", "starbucks", "cafe", "tea", "chai",
        "dhaba", "restaurant", "bakery", "dominos", "pizza", "burger", "bistro",
        "kitchen", "sweets", "hotel", "food", "tiffin", "canteen", "barbeque",
        "eats", "dining", "biryani", "juice", "bakery"
    ],
    "Transport": [
        "uber", "ola", "rapido", "fuel", "petrol", "diesel", "hpcl", "bpcl",
        "iocl", "shell", "metro", "irctc", "railway", "bus", "toll", "fastag",
        "flight", "indigo", "air india", "auto", "parking", "petroleum"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio", "zara", "h&m", "supermarket",
        "mart", "store", "mall", "retail", "d-mart", "dmart", "zepto", "blinkit",
        "instamart", "bigbasket", "trends", "decathlon", "reliancedigital", "croma",
        "footwear", "clothing", "bazaar"
    ],
    "Entertainment": [
        "netflix", "spotify", "hotstar", "prime", "youtube", "pvr", "inox",
        "cinema", "movie", "bookmyshow", "game", "playstation", "steam", "disney",
        "theatre", "fun"
    ],
    "Utilities": [
        "electricity", "bescom", "tneb", "mseb", "airtel", "jio", "vi",
        "vodafone", "recharge", "broadband", "wifi", "gas", "indane", "water",
        "rent", "maintenance", "bill", "postpaid", "dth", "tata play"
    ],
}


def classify_category(merchant_title: str) -> str:
    """
    Intelligently assigns a category based on the merchant name.
    Falls back to 'Other' if no keyword matches.
    """
    title_lower = merchant_title.lower()
    for category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in title_lower:
                return category
    return "Other"


def clean_merchant_title(raw_title: str) -> str:
    """
    Cleans raw UPI strings like 'Paid to Swiggy Bundl' or 'UPI/Swiggy/293847'
    into clean, human-readable merchant titles like 'Swiggy'.
    """
    if not raw_title:
        return "UPI Payment"

    title = raw_title.strip()

    # Remove standard GPay / UPI prefixes
    prefixes = [
        r"^paid\s+to\s+",
        r"^transfer\s+to\s+",
        r"^payment\s+to\s+",
        r"^upi\s*[-/:]\s*",
        r"^to\s*:\s*",
    ]
    for pattern in prefixes:
        title = re.sub(pattern, "", title, flags=re.IGNORECASE).strip()

    # If it contains UPI slash patterns like "UPI/SWIGGY/123", extract the merchant
    if "/" in title:
        parts = [p.strip() for p in title.split("/") if p.strip()]
        for p in parts:
            if not p.isdigit() and len(p) > 2 and p.upper() != "UPI":
                title = p
                break

    # Truncate overly long descriptions
    if len(title) > 50:
        title = title[:50].strip()

    return title.title() or "UPI Payment"


def normalize_date(date_str: str) -> str:
    """
    Converts various date formats (e.g. '05/10/2026', '5 Oct 2026', '2026-10-05')
    into standard ISO format 'YYYY-MM-DD'.
    """
    try:
        # dayfirst=True gives preference to DD/MM/YYYY (standard in India / UPI)
        dt = date_parser.parse(date_str, dayfirst=True)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return datetime.now().strftime("%Y-%m-%d")


def clean_amount(raw_amount: Any) -> float:
    """
    Cleans amount strings like '₹ 1,250.50', '-250', or '250.00 DR' into a positive float.
    """
    if isinstance(raw_amount, (int, float)):
        return abs(float(raw_amount))

    cleaned = re.sub(r"[^\d.]", "", str(raw_amount))
    try:
        return abs(float(cleaned))
    except (ValueError, TypeError):
        return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# CSV STATEMENT PARSER
# ─────────────────────────────────────────────────────────────────────────────

def parse_csv_content(content_str: str) -> List[Dict[str, Any]]:
    """
    Parses CSV/TSV statements, auto-detecting column mappings.
    """
    lines = [line.strip() for line in content_str.splitlines() if line.strip()]
    if not lines:
        return []

    # Detect delimiter (comma or tab)
    delimiter = "\t" if "\t" in lines[0] else ","
    reader = csv.reader(io.StringIO(content_str), delimiter=delimiter)
    all_rows = list(reader)

    if not all_rows:
        return []

    # Find the header row (row containing date and amount/description)
    header_idx = -1
    date_col = -1
    title_col = -1
    amount_col = -1
    type_col = -1
    status_col = -1

    for idx, row in enumerate(all_rows[:15]):  # Search top 15 rows for headers
        row_lower = [str(c).strip().lower() for c in row]
        for c_idx, col in enumerate(row_lower):
            if any(term in col for term in ["date", "time", "txn date", "transaction date"]):
                date_col = c_idx
            elif any(term in col for term in ["description", "narration", "paid to", "merchant", "particulars", "remarks", "name"]):
                title_col = c_idx
            elif any(term in col for term in ["amount", "debit", "withdrawal", "spent", "dr"]):
                amount_col = c_idx
            elif any(term in col for term in ["type", "cr/dr", "transaction type"]):
                type_col = c_idx
            elif any(term in col for term in ["status", "result"]):
                status_col = c_idx

        if date_col != -1 and (title_col != -1 or amount_col != -1):
            header_idx = idx
            break

    # If headers not found, fallback to standard column index assumption
    if header_idx == -1:
        header_idx = 0
        date_col = 0
        title_col = 1
        amount_col = 2

    # If title wasn't found separately, pick the largest text column
    if title_col == -1:
        title_col = 1 if len(all_rows[0]) > 1 else 0

    results = []
    for row in all_rows[header_idx + 1:]:
        if len(row) <= max(date_col, title_col, amount_col):
            continue

        raw_date = row[date_col].strip()
        raw_title = row[title_col].strip()
        raw_amt = row[amount_col].strip()

        if not raw_date or not raw_amt:
            continue

        # Skip failed transactions if status column is present
        if status_col != -1 and len(row) > status_col:
            status_val = row[status_col].lower()
            if any(s in status_val for s in ["failed", "declined", "cancelled"]):
                continue

        # Skip incoming credit/refund transactions if type column indicates "credit" / "cr"
        if type_col != -1 and len(row) > type_col:
            type_val = row[type_col].lower()
            if "cr" in type_val or "credit" in type_val or "received" in type_val:
                continue

        amt = clean_amount(raw_amt)
        if amt <= 0:
            continue

        cleaned_title = clean_merchant_title(raw_title)
        parsed_date = normalize_date(raw_date)
        category = classify_category(cleaned_title)

        results.append({
            "title": cleaned_title,
            "amount": amt,
            "category": category,
            "date": parsed_date,
            "notes": "Imported via GPay Statement",
            "raw_text": f"{raw_date} | {raw_title} | ₹{amt}",
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# PDF STATEMENT PARSER
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# PDF STATEMENT PARSER
# ─────────────────────────────────────────────────────────────────────────────

def parse_pdf_content(file_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extracts transaction records from a PDF statement using pypdf.
    Supports:
    1. Multi-line Google Pay transaction blocks (Merchant -> Date -> Amount -> Status)
    2. Bank statement tabular statements (HDFC, SBI, ICICI, Axis, etc.)
    3. Single-line UPI records
    Also provides explicit error messages for password-protected and image-only PDFs.
    """
    try:
        from pypdf import PdfReader
    except ImportError:
        raise RuntimeError("pypdf is not installed. Please install pypdf to parse PDF statements.")

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Unable to open PDF file: {str(e)}")

    # 1. Check if PDF is encrypted / password-protected
    if getattr(reader, "is_encrypted", False):
        raise ValueError(
            "This PDF statement is password-protected. Please remove the password "
            "(e.g. open in Chrome -> Print -> Save as PDF without password) and re-upload."
        )

    full_text = ""
    try:
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            full_text += page_text + "\n"
    except Exception as e:
        if "decrypt" in str(e).lower() or "password" in str(e).lower():
            raise ValueError(
                "This PDF statement is password-protected. Please unlock or re-save without a password before uploading."
            )
        raise ValueError(f"Failed to read PDF content: {str(e)}")

    # 2. Check if PDF has selectable text or is a scanned image
    cleaned_full_text = full_text.strip()
    if len(cleaned_full_text) < 15:
        raise ValueError(
            "Could not detect any selectable text in this PDF. It appears to be a scanned image or photo. "
            "Please upload an official statement with selectable text, or export a CSV from Google Pay."
        )

    results: List[Dict[str, Any]] = []
    seen_keys = set()

    def add_transaction(title: str, amt: float, date_str: str, raw_snippet: str):
        if amt <= 0 or not title:
            return
        cleaned_title = clean_merchant_title(title)
        parsed_date = normalize_date(date_str)
        category = classify_category(cleaned_title)
        
        # Deduplicate within this single document
        dedup_key = (parsed_date, amt, cleaned_title.lower())
        if dedup_key in seen_keys:
            return
        seen_keys.add(dedup_key)

        results.append({
            "title": cleaned_title,
            "amount": amt,
            "category": category,
            "date": parsed_date,
            "notes": "Imported via GPay PDF Statement",
            "raw_text": raw_snippet.strip()[:100],
        })

    # ─────────────────────────────────────────────────────────────────────────
    # STRATEGY 1: MULTI-LINE GPAY BLOCK REGEX
    # Google Pay statements typically lay out transactions across consecutive lines:
    # Line 1: "Paid to Swiggy" or "Swiggy"
    # Line 2: "Oct 12, 2024, 8:45 PM" or "12 Oct 2024"
    # Line 3: "₹350.00" or "₹ 350"
    # ─────────────────────────────────────────────────────────────────────────
    gpay_multi_pattern = re.compile(
        r"(?:Paid to|Payment to|Transfer to|To:?)\s+([^\r\n]+)[\r\n]+"
        r"([^\r\n]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}[/-]\d{1,2})[^\r\n]*)[\r\n]+"
        r"(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)",
        re.IGNORECASE,
    )
    for match in gpay_multi_pattern.finditer(full_text):
        m_title = match.group(1).strip()
        m_date = match.group(2).strip()
        m_amt = clean_amount(match.group(3))
        add_transaction(m_title, m_amt, m_date, match.group(0))

    # ─────────────────────────────────────────────────────────────────────────
    # STRATEGY 2: LINE-BY-LINE AND SLIDING-WINDOW PARSER
    # Covers Bank Statement tables (HDFC, SBI, ICICI) and GPay variations
    # ─────────────────────────────────────────────────────────────────────────
    lines = [line.strip() for line in full_text.splitlines() if line.strip()]
    
    date_regex = re.compile(
        r"(\b\d{1,2}[-/ ](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[-/ ]\d{2,4}\b|"
        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{2,4})?\b|"
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|"
        r"\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b)",
        re.IGNORECASE,
    )
    amount_regex = re.compile(r"(?:₹|INR|Rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|\d+\.\d{2})")

    for i, line in enumerate(lines):
        # Skip credit / incoming transaction indicators
        if re.search(r"\b(received from|refund from|credited to|cr\b|credit\b)\b", line, re.IGNORECASE):
            continue

        # Check if current line contains BOTH Date and Amount (Single-line statement)
        d_match = date_regex.search(line)
        a_matches = amount_regex.findall(line)

        if d_match and a_matches:
            raw_date = d_match.group(1)
            raw_amt = a_matches[-1]
            amt = clean_amount(raw_amt)
            if amt > 0:
                # Remove date and amount to isolate merchant
                title_cand = line.replace(raw_date, "").replace(raw_amt, "")
                title_cand = re.sub(
                    r"(?:₹|INR|Rs\.?|Completed|Success|Paid|Debit|DR|UPI|REF|TRANSACTION|TRANSFER)",
                    "",
                    title_cand,
                    flags=re.IGNORECASE,
                ).strip()
                if title_cand:
                    add_transaction(title_cand, amt, raw_date, line)
                    continue

        # Multi-line sliding window:
        # If current line has a Date, inspect neighbors (up to 3 lines before/after)
        if d_match:
            raw_date = d_match.group(1)
            # Look forward 1-3 lines for an amount
            cand_amount = 0.0
            cand_title = ""
            snippet = line

            # Look forward up to 3 lines
            for offset in [1, 2, 3]:
                if i + offset < len(lines):
                    next_line = lines[i + offset]
                    # Check for amount in next_line
                    next_amts = amount_regex.findall(next_line)
                    if next_amts and cand_amount == 0.0:
                        cand_amount = clean_amount(next_amts[-1])
                        snippet += " " + next_line
                    elif not cand_title and len(next_line) > 2 and not date_regex.search(next_line):
                        # Could be merchant title
                        if not re.search(r"\b(completed|failed|pending|upi ref|google txn|debited)\b", next_line, re.IGNORECASE):
                            cand_title = next_line
                            snippet += " " + next_line

            # If title was not found forward, look backward 1-2 lines
            if not cand_title:
                for offset in [1, 2]:
                    if i - offset >= 0:
                        prev_line = lines[i - offset]
                        if not date_regex.search(prev_line) and not amount_regex.search(prev_line):
                            if not re.search(r"\b(completed|failed|pending|statement|history|page)\b", prev_line, re.IGNORECASE):
                                cand_title = prev_line
                                snippet = prev_line + " " + snippet
                                break

            if cand_amount > 0 and cand_title:
                add_transaction(cand_title, cand_amount, raw_date, snippet)

    return results


# ─────────────────────────────────────────────────────────────────────────────
# MAIN PUBLIC PARSER ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────

def parse_gpay_document(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Main parser entrypoint. Inspects file type and runs the corresponding parser.
    Supports .csv, .txt, .tsv, and .pdf files.
    """
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        return parse_pdf_content(file_bytes)
    else:
        # Decode CSV / Text with UTF-8 (with fallback to Latin-1)
        try:
            content_str = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content_str = file_bytes.decode("latin-1", errors="ignore")
        return parse_csv_content(content_str)
