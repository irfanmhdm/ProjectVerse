from services.firebase_service import db

from google.cloud.firestore_v1.base_query import FieldFilter

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

    # Create temporary folder
    os.makedirs(
        "temp_reports",
        exist_ok=True
    )

    # Temporary PDF path
    file_path = os.path.join(
        "temp_reports",
        f"{project_id}.pdf"
    )

    # Download PDF
    response = requests.get(
        report_url,
        timeout=60
    )

    response.raise_for_status()

    # Save PDF
    with open(
        file_path,
        "wb"
    ) as file:

        file.write(
            response.content
        )

    return file_path