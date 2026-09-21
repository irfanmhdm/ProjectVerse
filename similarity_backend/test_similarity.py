from services.pdf_extractor import extract_text_from_pdf
from services.text_processor import preprocess_text
from services.tfidf_processor import generate_tfidf
from services.similarity import calculate_similarity


pdf_path = "Muhammed Irfan S - Resume.pdf"


# Extract PDF text
raw_text = extract_text_from_pdf(pdf_path)


# Preprocess text
cleaned_text = preprocess_text(raw_text)


# Temporary second document
document_2 = """
Python Django MySQL web application software development
database management student project attendance system
"""


documents = [
    cleaned_text,
    document_2
]


# Generate TF-IDF vectors
vectorizer, tfidf_matrix, feature_names = generate_tfidf(documents)


# Calculate cosine similarity
similarity_matrix = calculate_similarity(tfidf_matrix)


print("===== COSINE SIMILARITY MATRIX =====")
print(similarity_matrix)


print("\n===== SIMILARITY PERCENTAGE =====")

similarity_percentage = similarity_matrix[0][1] * 100

print(f"Document 1 vs Document 2: {similarity_percentage:.2f}%")