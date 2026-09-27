from services.firebase_service import db

from services.pdf_extractor import extract_text_from_pdf
from services.text_processor import preprocess_text
from services.tfidf_service import generate_tfidf
from services.similarity_pdf import generate_similarity_pdf

from sklearn.metrics.pairwise import cosine_similarity

import os


# =========================================================
# GET APPROVED PROJECTS
# =========================================================

def get_approved_projects():

    print("\n===== CHECKING APPROVED PROJECTS =====")

    projects_ref = db.collection("projects")

    approved_projects = []

    for document in projects_ref.stream():

        data = document.to_dict()

        project_id = document.id
        status = data.get("status", "")

        print(
            f"Project: {project_id} | "
            f"Title: {data.get('title', 'Untitled')} | "
            f"Status: {status}"
        )

        # -------------------------------------------------
        # ONLY APPROVED PROJECTS
        # -------------------------------------------------

        if status != "approved":
            continue

        approved_projects.append({

            "projectId":
                project_id,

            "title":
                data.get(
                    "title",
                    "Untitled Project"
                ),

            "description":
                data.get(
                    "description",
                    ""
                ),

            "domain":
                data.get(
                    "domain",
                    ""
                ),

            "technologies":
                data.get(
                    "technologies",
                    ""
                )
        })

    print(
        "\nApproved projects found:",
        len(approved_projects)
    )

    return approved_projects


# =========================================================
# GET PROCESSED PROJECT
# =========================================================

def get_processed_project(project_id):

    print(
        f"Checking processed data for: {project_id}"
    )

    processed_ref = (
        db.collection("processed_projects")
        .document(project_id)
    )

    processed_snapshot = processed_ref.get()

    if not processed_snapshot.exists:

        print(
            f"⚠️ No processed data found for {project_id}"
        )

        return None

    data = processed_snapshot.to_dict()

    return data


# =========================================================
# ANALYZE SIMILARITY
# =========================================================

def analyze_similarity(
    pdf_path,
    project_name="Uploaded Project"
):

    print(
        "\n===== STARTING SIMILARITY ANALYSIS ====="
    )

    # =====================================================
    # STEP 1: EXTRACT UPLOADED PDF TEXT
    # =====================================================

    print(
        "Extracting uploaded PDF text..."
    )

    uploaded_raw_text = extract_text_from_pdf(
        pdf_path
    )

    print(
        "Uploaded raw characters:",
        len(uploaded_raw_text)
    )

    if not uploaded_raw_text.strip():

        raise ValueError(
            "No text could be extracted from uploaded PDF."
        )

    # =====================================================
    # STEP 2: PREPROCESS UPLOADED TEXT
    # =====================================================

    print(
        "Preprocessing uploaded text..."
    )

    uploaded_processed_text = preprocess_text(
        uploaded_raw_text
    )

    print(
        "Uploaded processed characters:",
        len(uploaded_processed_text)
    )

    if not uploaded_processed_text.strip():

        raise ValueError(
            "No usable text remains after preprocessing."
        )

    # =====================================================
    # STEP 3: GET ALL APPROVED PROJECTS
    # =====================================================

    approved_projects = get_approved_projects()

    if not approved_projects:

        print(
            "No approved projects available."
        )

        return {

            "uploadedCharacters":
                len(uploaded_processed_text),

            "totalApprovedProjects":
                0,

            "processedProjects":
                0,

            "results":
                [],

            "report":
                None,

            "message":
                "No approved projects are available for comparison."
        }

    # =====================================================
    # STEP 4: COLLECT PROCESSED APPROVED PROJECTS
    # =====================================================

    comparison_projects = []

    for project in approved_projects:

        project_id = project["projectId"]

        processed_data = get_processed_project(
            project_id
        )

        if processed_data is None:

            print(
                f"Skipping {project_id} "
                "because processed data is missing."
            )

            continue

        tfidf_features = processed_data.get(
            "tfidfFeatures",
            []
        )

        tfidf_vector = processed_data.get(
            "tfidfVector",
            []
        )

        processed_text = processed_data.get(
            "processedText",
            ""
        )

        if not tfidf_features or not tfidf_vector:

            print(
                f"Skipping {project_id} "
                "because TF-IDF data is missing."
            )

            continue

        comparison_projects.append({

            "projectId":
                project_id,

            "title":
                project["title"],

            "description":
                project["description"],

            "domain":
                project["domain"],

            "technologies":
                project["technologies"],

            "processedText":
                processed_text,

            "tfidfFeatures":
                tfidf_features,

            "tfidfVector":
                tfidf_vector
        })

    print(
        "\nProcessed approved projects available:",
        len(comparison_projects)
    )

    if not comparison_projects:

        return {

            "uploadedCharacters":
                len(uploaded_processed_text),

            "totalApprovedProjects":
                len(approved_projects),

            "processedProjects":
                0,

            "results":
                [],

            "report":
                None,

            "message":
                "Approved projects exist, but none have processed TF-IDF data."
        }

    # =====================================================
    # STEP 5: BUILD COMMON TF-IDF VOCABULARY
    # =====================================================

    print(
        "\nGenerating TF-IDF for similarity comparison..."
    )

    documents = [
        uploaded_processed_text
    ]

    for project in comparison_projects:

        documents.append(
            project["processedText"]
        )

    vectorizer, tfidf_matrix = generate_tfidf(
        documents
    )

    print(
        "Total documents:",
        len(documents)
    )

    print(
        "TF-IDF features:",
        len(
            vectorizer.get_feature_names_out()
        )
    )

    # =====================================================
    # STEP 6: CALCULATE COSINE SIMILARITY
    # =====================================================

    print(
        "\nCalculating cosine similarity..."
    )

    uploaded_vector = tfidf_matrix[0]

    existing_vectors = tfidf_matrix[1:]

    similarity_scores = cosine_similarity(
        uploaded_vector,
        existing_vectors
    )[0]

    # =====================================================
    # STEP 7: BUILD RESULTS
    # =====================================================

    results = []

    for index, project in enumerate(
        comparison_projects
    ):

        similarity_score = (
            float(
                similarity_scores[index]
            ) * 100
        )

        results.append({

            "projectId":
                project["projectId"],

            "title":
                project["title"],

            "domain":
                project["domain"],

            "technologies":
                project["technologies"],

            "similarity":
                round(
                    similarity_score,
                    2
                )
        })

    # =====================================================
    # STEP 8: SORT RESULTS
    # =====================================================

    results.sort(
        key=lambda item:
            item["similarity"],
        reverse=True
    )

    # =====================================================
    # STEP 9: PRINT RESULTS
    # =====================================================

    print(
        "\n===== SIMILARITY RESULTS ====="
    )

    for result in results:

        print(
            f"{result['title']} "
            f"-> {result['similarity']}%"
        )

    # =====================================================
    # STEP 10: GENERATE EVIDENCE PDF
    # =====================================================

    print(
        "\n===== GENERATING SIMILARITY EVIDENCE PDF ====="
    )

    pdf_report = generate_similarity_pdf(

        project_name=
            project_name,

        results=
            results,

        total_projects_checked=
            len(comparison_projects)
    )

    print(
        "Evidence PDF generated:",
        pdf_report
    )

    # =====================================================
    # STEP 11: FINAL RESPONSE
    # =====================================================

    print(
        "\n===== SIMILARITY ANALYSIS COMPLETE ====="
    )

    return {

        "uploadedCharacters":
            len(uploaded_processed_text),

        "totalApprovedProjects":
            len(approved_projects),

        "processedProjects":
            len(comparison_projects),

        "results":
            results,

        "report":
            pdf_report
    }