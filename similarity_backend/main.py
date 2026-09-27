from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.project_processor import process_approved_project


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
# REQUEST MODEL
# =========================================================

class ProcessProjectRequest(BaseModel):
    projectId: str


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "ProjectVerse Similarity Analysis API is running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# =========================================================
# PROCESS APPROVED PROJECT
# =========================================================

@app.post("/process-project")
def process_project(request: ProcessProjectRequest):

    print(
        "\n=========================================="
    )

    print(
        "Similarity processing requested"
    )

    print(
        "Project ID:",
        request.projectId
    )

    print(
        "=========================================="
    )

    try:

        result = process_approved_project(
            request.projectId
        )

        return {
            "success": True,
            "message": "Project processed successfully",
            "data": result
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