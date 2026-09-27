from services.firebase_service import db

from google.cloud.firestore_v1.base_query import FieldFilter

from services.pdf_extractor import extract_text_from_pdf
from services.text_processor import preprocess_text
from services.tfidf_service import generate_tfidf

from firebase_admin import firestore

import os
import requests


# =========================================================
# GET APPROVED PROJECTS
# =========================================================

def get_approved_projects():
    """
    Retrieve all approved projects from Firestore.
    """

    projects_ref = (
        db.collection("projects")
        .where(
            filter=FieldFilter(
                "status",
                "==",
                "approved"
            )
        )
    )

    projects = []

    for document in projects_ref.stream():

        data = document.to_dict()

        project = {
            "id": document.id,

            "title": data.get(
                "title",
                "Untitled Project"
            ),

            "description": data.get(
                "description",
                ""
            ),

            "domain": data.get(
                "domain",
                ""
            ),

            "technologies": data.get(
                "technologies",
                ""
            ),

            "studentId": data.get(
                "studentId",
                ""
            ),

            "reportUrl": data.get(
                "reportUrl",
                ""
            ),

            "reportName": data.get(
                "reportName",
                ""
            ),
        }

        projects.append(project)

    return projects


# =========================================================
# GET SINGLE PROJECT
# =========================================================

def get_project(project_id: str):
    """
    Retrieve one project from Firestore.
    """

    project_ref = db.collection(
        "projects"
    ).document(
        project_id
    )

    project_snapshot = project_ref.get()

    if not project_snapshot.exists:

        raise ValueError(
            f"Project '{project_id}' was not found."
        )

    data = project_snapshot.to_dict()

    return {
        "id": project_snapshot.id,

        "title": data.get(
            "title",
            "Untitled Project"
        ),

        "description": data.get(
            "description",
            ""
        ),

        "domain": data.get(
            "domain",
            ""
        ),

        "technologies": data.get(
            "technologies",
            ""
        ),

        "studentId": data.get(
            "studentId",
            ""
        ),

        "reportUrl": data.get(
            "reportUrl",
            ""
        ),

        "reportName": data.get(
            "reportName",
            ""
        ),

        "status": data.get(
            "status",
            ""
        ),
    }


# =========================================================
# DOWNLOAD PROJECT REPORT
# =========================================================

def download_project_report(
    report_url: str,
    project_id: str
):
    """
    Download an approved project report
    from its Supabase public URL.
    """

    if not report_url:

        raise ValueError(
            "Project does not have a report URL."
        )

    os.makedirs(
        "temp_reports",
        exist_ok=True
    )

    file_path = os.path.join(
        "temp_reports",
        f"{project_id}.pdf"
    )

    print(
        "Downloading report..."
    )

    response = requests.get(
        report_url,
        timeout=60
    )

    response.raise_for_status()

    with open(
        file_path,
        "wb"
    ) as file:

        file.write(
            response.content
        )

    print(
        "Report downloaded:",
        file_path
    )

    return file_path


# =========================================================
# PROCESS APPROVED PROJECT
# =========================================================

def process_approved_project(
    project_id: str
):
    """
    Process one approved project's PDF.

    Flow:

    Firestore project
        ↓
    Download PDF
        ↓
    Extract text
        ↓
    Preprocess text
        ↓
    TF-IDF
        ↓
    Store processed data
    """

    print(
        "\n===== PROCESSING PROJECT ====="
    )

    # -----------------------------------------------------
    # STEP 1: GET PROJECT
    # -----------------------------------------------------

    project = get_project(
        project_id
    )

    print(
        "Project:",
        project["title"]
    )

    # -----------------------------------------------------
    # CHECK APPROVAL
    # -----------------------------------------------------

    if project.get("status") != "approved":

        raise ValueError(
            "Project is not approved."
        )

    # -----------------------------------------------------
    # CHECK REPORT
    # -----------------------------------------------------

    report_url = project.get(
        "reportUrl",
        ""
    )

    if not report_url:

        raise ValueError(
            "Approved project does not contain a report URL."
        )

    # -----------------------------------------------------
    # STEP 2: DOWNLOAD PDF
    # -----------------------------------------------------

    pdf_path = download_project_report(
        report_url,
        project_id
    )

    # -----------------------------------------------------
    # STEP 3: EXTRACT TEXT
    # -----------------------------------------------------

    print(
        "Extracting PDF text..."
    )

    raw_text = extract_text_from_pdf(
        pdf_path
    )

    print(
        "Raw characters:",
        len(raw_text)
    )

    if not raw_text.strip():

        raise ValueError(
            "No text could be extracted from the PDF."
        )

    # -----------------------------------------------------
    # STEP 4: PREPROCESS TEXT
    # -----------------------------------------------------

    print(
        "Preprocessing text..."
    )

    processed_text = preprocess_text(
        raw_text
    )

    print(
        "Processed characters:",
        len(processed_text)
    )

    if not processed_text.strip():

        raise ValueError(
            "No usable text remains after preprocessing."
        )

    # -----------------------------------------------------
    # STEP 5: GENERATE TF-IDF
    # -----------------------------------------------------

    print(
        "Generating TF-IDF..."
    )

    vectorizer, tfidf_matrix = generate_tfidf(
        [processed_text]
    )

    feature_names = (
        vectorizer
        .get_feature_names_out()
        .tolist()
    )

    # Convert sparse vector into normal list
    tfidf_vector = (
        tfidf_matrix
        .toarray()[0]
        .tolist()
    )

    print(
        "TF-IDF features:",
        len(feature_names)
    )

    print(
        "TF-IDF vector length:",
        len(tfidf_vector)
    )

    # -----------------------------------------------------
    # STEP 6: STORE IN FIRESTORE
    # -----------------------------------------------------

    print(
        "Saving processed project..."
    )

    processed_ref = (
        db.collection(
            "processedProjects"
        )
        .document(
            project_id
        )
    )

    processed_ref.set({

        "projectId":
            project_id,

        "processedText":
            processed_text,

        "tfidfFeatures":
            feature_names,

        "tfidfVector":
            tfidf_vector,

        "processedAt":
            firestore.SERVER_TIMESTAMP,

    })

    print(
        "✅ Processed project saved."
    )

    # -----------------------------------------------------
    # STEP 7: CLEAN TEMP PDF
    # -----------------------------------------------------

    try:

        if os.path.exists(
            pdf_path
        ):

            os.remove(
                pdf_path
            )

            print(
                "Temporary PDF removed."
            )

    except Exception as cleanup_error:

        print(
            "⚠️ Could not remove temporary PDF:",
            cleanup_error
        )

    print(
        "\n===== PROCESSING COMPLETE ====="
    )

    return {

        "projectId":
            project_id,

        "title":
            project["title"],

        "processedCharacters":
            len(processed_text),

        "tfidfFeatures":
            len(feature_names),

        "message":
            "Project processed and stored successfully"
    }