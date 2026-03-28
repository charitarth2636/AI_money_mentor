import pdfplumber
import re

def extract_investments_from_pdf(file_path: str) -> list:
    """
    Extracts Mutual Fund details using regex from a standard PDF format.
    """
    investments = []
    
    # We look for lines containing "Scheme Name" or regular funds like:
    # Parag Parikh Flexi Cap Fund    1,50,000.00
    # Generic regex format applied against table contents: ([A-Za-z\s]+Fund)[\s\S]*?(\d{1,3}(?:,\d{2,3})*\.\d{2})
    
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
                
            lines = text.split('\n')
            for line in lines:
                # Basic Generic matching logic that filters by "Fund" followed anywhere by a trailing Rupee format value (e.g 1,50,000.00)
                match = re.search(r'([A-Za-z\s&]+(?:Fund|Plan))[\s\S]*?(\d{1,3}(?:,\d{2,3})*\.\d{2})', line, re.IGNORECASE)
                if match:
                    scheme_name = match.group(1).strip()
                    amount_str = match.group(2).replace(',', '')
                    investments.append({
                        "scheme_name": scheme_name,
                        "current_value": float(amount_str)
                    })
                    
    return investments
