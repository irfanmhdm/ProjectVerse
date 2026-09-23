from datetime import datetime

from services.firebase_service import db


def save_processed_project(
    project_id,
    processed_text,
    features,
    tfidf_vector
):
    """
    Store the processed representation of an approved project
    in Firestore.
    """

    processed_data = {
        "projectId": project_id,
        "processedText": processed_text,
        "tfidfFeatures": features,
        "tfidfVector": tfidf_vector,
        "processedAt": datetime.utcnow(),
    }

    db.collection("processed_projects").document(
        project_id
    ).set(processed_data)

    return processed_data