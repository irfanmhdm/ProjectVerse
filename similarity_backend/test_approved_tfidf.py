from services.project_processor import (
    get_approved_projects,
    download_project_report
)

from services.pdf_extractor import extract_text_from_pdf
from services.text_processor import preprocess_text
from services.tfidf_service import generate_tfidf


print("===== APPROVED PROJECT TF-IDF =====")

projects = get_approved_projects()

print("Approved projects:", len(projects))

processed_texts = []


for project in projects:

    print("\n----------------------------")
    print("Project:", project["title"])

    # Download report
    pdf_path = download_project_report(
        project["reportUrl"],
        project["id"]
    )

    # Extract text
    raw_text = extract_text_from_pdf(
        pdf_path
    )

    # Preprocess text
    processed_text = preprocess_text(
        raw_text
    )

    processed_texts.append(processed_text)


# Generate TF-IDF
vectorizer, matrix = generate_tfidf(
    processed_texts
)


print("\n===== TF-IDF MATRIX =====")
print(matrix.toarray())


print("\n===== FEATURES =====")
print(vectorizer.get_feature_names_out())


print("\n===== MATRIX SHAPE =====")
print(matrix.shape)


print("\n===== TF-IDF COMPLETE =====")