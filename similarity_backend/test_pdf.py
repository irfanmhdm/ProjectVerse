from services.pdf_extractor import extract_text_from_pdf


pdf_path = "Muhammed Irfan S - Resume.pdf"

text = extract_text_from_pdf(pdf_path)

print("===== EXTRACTED TEXT =====")
print(text)
print("==========================")