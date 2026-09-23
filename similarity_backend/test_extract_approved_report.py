from services.project_processor import (
    get_approved_projects,
    download_project_report
)

from services.pdf_extractor import extract_text_from_pdf


print("===== APPROVED REPORT TEXT EXTRACTION =====")

projects = get_approved_projects()

print("Approved projects:", len(projects))


for project in projects:

    print("\n----------------------------")

    print("Project:", project["title"])

    # Download the report
    pdf_path = download_project_report(
        project["reportUrl"],
        project["id"]
    )

    print("PDF:", pdf_path)

    # Extract text
    extracted_text = extract_text_from_pdf(
        pdf_path
    )

    print(
        "Extracted characters:",
        len(extracted_text)
    )

    print("\n===== EXTRACTED TEXT =====")

    print(extracted_text[:1000])

    print("\n===========================")


print("\n===== EXTRACTION COMPLETE =====")