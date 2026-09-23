from services.project_processor import (
    get_approved_projects,
    download_project_report
)

from services.pdf_extractor import extract_text_from_pdf

from services.text_processor import preprocess_text

from services.tfidf_service import generate_tfidf

from services.processed_project_service import save_processed_project


print("===== STORE PROCESSED PROJECT TEST =====")


# =========================================================
# GET APPROVED PROJECTS
# =========================================================

projects = get_approved_projects()

print(f"Approved projects: {len(projects)}")


# =========================================================
# PROCESS EACH APPROVED PROJECT
# =========================================================

for project in projects:

    print("\n----------------------------")

    print(
        f"Project: {project['title']}"
    )


    # =====================================================
    # DOWNLOAD REPORT
    # =====================================================

    pdf_path = download_project_report(
        project["reportUrl"],
        project["id"]
    )

    print(
        f"PDF: {pdf_path}"
    )


    # =====================================================
    # EXTRACT PDF TEXT
    # =====================================================

    raw_text = extract_text_from_pdf(
        pdf_path
    )

    print(
        f"Raw characters: {len(raw_text)}"
    )


    # =====================================================
    # PREPROCESS TEXT
    # =====================================================

    processed_text = preprocess_text(
        raw_text
    )

    print(
        f"Processed characters: "
        f"{len(processed_text)}"
    )


    # =====================================================
    # GENERATE TF-IDF
    # =====================================================

    vectorizer, tfidf_matrix = generate_tfidf(
        [processed_text]
    )

    print(
        f"TF-IDF matrix shape: "
        f"{tfidf_matrix.shape}"
    )


    # =====================================================
    # GET TF-IDF FEATURES
    # =====================================================

    features = (
        vectorizer
        .get_feature_names_out()
        .tolist()
    )


    # =====================================================
    # GET TF-IDF VECTOR
    # =====================================================

    tfidf_vector = (
        tfidf_matrix[0]
        .toarray()[0]
        .tolist()
    )


    print(
        f"Features: {len(features)}"
    )

    print(
        f"Vector values: "
        f"{len(tfidf_vector)}"
    )


    # =====================================================
    # STORE PROCESSED PROJECT
    # =====================================================

    saved_project = save_processed_project(
        project_id=project["id"],
        processed_text=processed_text,
        features=features,
        tfidf_vector=tfidf_vector
    )


    # =====================================================
    # SUCCESS OUTPUT
    # =====================================================

    print("\n===== STORED SUCCESSFULLY =====")

    print(
        f"Project ID: "
        f"{saved_project['projectId']}"
    )

    print(
        f"Processed text length: "
        f"{len(saved_project['processedText'])}"
    )

    print(
        f"TF-IDF features: "
        f"{len(saved_project['tfidfFeatures'])}"
    )

    print(
        f"TF-IDF vector values: "
        f"{len(saved_project['tfidfVector'])}"
    )


print("\n===== COMPLETE =====")