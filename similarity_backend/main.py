from fastapi import FastAPI

app = FastAPI(
    title="ProjectVerse Similarity Analysis API",
    description="Backend API for ProjectVerse report similarity analysis",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "ProjectVerse Similarity Analysis API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }