from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File
)
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from services.project_processor import (
    process_approved_project
)

from services.similarity import (
    analyze_similarity
)

import os
import uuid


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="ProjectVerse Similarity Analysis API",
    description="Backend API for ProjectVerse report similarity analysis",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message":
            "ProjectVerse Similarity Analysis API is running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():

    return {
        "status":
            "healthy"
    }


# =========================================================
# PROCESS APPROVED PROJECT
# =========================================================

@app.post("/process-project/{project_id}")
def process_project(
    project_id: str
):

    print(
        "\n=========================================="
    )

    print(
        "Similarity processing requested"
    )

    print(
        "Project ID:",
        project_id
    )

    print(
        "=========================================="
    )

    try:

        result = process_approved_project(
            project_id
        )

        return {

            "success":
                True,

            "message":
                "Project processed successfully",

            "data":
                result

        }

    except Exception as error:

        print(
            "❌ Similarity processing failed:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# ANALYZE SIMILARITY
# =========================================================

@app.post("/analyze-similarity")
async def analyze_project_similarity(
    file: UploadFile = File(...)
):

    print(
        "\n=========================================="
    )

    print(
        "Similarity analysis requested"
    )

    print(
        "File:",
        file.filename
    )

    print(
        "=========================================="
    )


    # -----------------------------------------------------
    # CHECK FILE
    # -----------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file was provided."
        )


    # -----------------------------------------------------
    # CHECK PDF
    # -----------------------------------------------------

    if not file.filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )


    # -----------------------------------------------------
    # CREATE TEMP DIRECTORY
    # -----------------------------------------------------

    os.makedirs(
        "temp_reports",
        exist_ok=True
    )


    # -----------------------------------------------------
    # CREATE UNIQUE TEMP FILE
    # -----------------------------------------------------

    temporary_filename = (
        f"similarity_{uuid.uuid4().hex}.pdf"
    )

    pdf_path = os.path.join(
        "temp_reports",
        temporary_filename
    )


    try:

        # =================================================
        # SAVE UPLOADED PDF
        # =================================================

        with open(
            pdf_path,
            "wb"
        ) as buffer:

            while True:

                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:

                    break

                buffer.write(
                    chunk
                )


        print(
            "Uploaded PDF saved:",
            pdf_path
        )


        # =================================================
        # RUN SIMILARITY ANALYSIS
        # =================================================

        result = analyze_similarity(
            pdf_path,
            file.filename

        )


        # =================================================
        # RETURN RESULT
        # =================================================

        return {

            "success":
                True,

            "message":
                "Similarity analysis completed successfully",

            "data":
                result

        }


    except Exception as error:

        print(
            "❌ Similarity analysis failed:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


    finally:

        # =================================================
        # DELETE TEMPORARY PDF
        # =================================================

        try:

            if os.path.exists(
                pdf_path
            ):

                os.remove(
                    pdf_path
                )

                print(
                    "Temporary similarity PDF removed."
                )

        except Exception as cleanup_error:

            print(
                "⚠️ Could not remove temporary PDF:",
                cleanup_error
            )

# =========================================================
# DOWNLOAD SIMILARITY REPORT
# =========================================================

@app.get("/similarity-report/{filename}")
def download_similarity_report(
    filename: str
):

    file_path = os.path.join(
        "similarity_reports",
        filename
    )

    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="Similarity report not found."
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )