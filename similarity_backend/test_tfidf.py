from services.pdf_extractor import extract_text_from_pdf
from services.text_processor import preprocess_text
from similarity_backend.services.tfidf_service import generate_tfidf


pdf_path = "Muhammed Irfan S - Resume.pdf"


# Extract text
raw_text = extract_text_from_pdf(pdf_path)


# Preprocess text
cleaned_text = preprocess_text(raw_text)


# Temporary second document for testing
document_2 = """
Python Django MySQL web application software development
database management student project attendance system
"""


documents = [
    cleaned_text,
    document_2
]


# Generate TF-IDF
vectorizer, tfidf_matrix, feature_names = generate_tfidf(documents)


print("===== TF-IDF MATRIX =====")
print(tfidf_matrix.toarray())


print("\n===== FEATURES =====")
print(feature_names)


print("\n===== MATRIX SHAPE =====")
print(tfidf_matrix.shape)