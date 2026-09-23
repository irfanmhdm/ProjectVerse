from services.project_processor import (
    get_approved_projects,
    download_project_report
)

from services.pdf_extractor import extract_text_from_pdf
from services.text_processor import preprocess_text


print("===== APPROVED PROJECT PREPROCESSING =====")

projects = get_approved_projects()

print("Approved projects:", len(projects))


for project in projects:

    print("\n----------------------------")
    print("Project:", project["title"])

    # Step 1: Download report
    pdf_path = download_project_report(
        project["reportUrl"],
        project["id"]
    )

    print("PDF:", pdf_path)

    # Step 2: Extract raw text
    raw_text = extract_text_from_pdf(
        pdf_path
    )

    print(
        "Raw characters:",
        len(raw_text)
    )

    # Step 3: Preprocess text
    processed_text = preprocess_text(
        raw_text
    )

    print(
        "Processed characters:",
        len(processed_text)
    )

    print("\n===== PREPROCESSED TEXT =====")

    print(processed_text[:1500])

    print("\n==============================")


print("\n===== PREPROCESSING COMPLETE =====")