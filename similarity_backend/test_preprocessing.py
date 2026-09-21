from services.pdf_extractor import extract_text_from_pdf
from services.text_processor import preprocess_text


pdf_path = "Muhammed Irfan S - Resume.pdf"

# Step 1: Extract text from PDF
raw_text = extract_text_from_pdf(pdf_path)

# Step 2: Preprocess extracted text
cleaned_text = preprocess_text(raw_text)

print("===== PREPROCESSED TEXT =====")
print(cleaned_text)
print("=============================")