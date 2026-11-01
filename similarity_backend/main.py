from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File
)
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from pydantic import BaseModel

from services.ai_mentor import (
    verify_student_token,
    create_conversation,
    list_conversations,
    get_conversation,
    save_message
)

from urllib.parse import unquote

from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from services.project_processor import (
    process_approved_project
)

from services.similarity import (
    analyze_similarity
)

import os
import uuid

security = HTTPBearer(auto_error=False)

class ConversationCreateRequest(BaseModel):
    title: str = "New Conversation"


class ChatMessageRequest(BaseModel):
    message: str
# =========================================================
# DIRECTORIES
# =========================================================

TEMP_REPORTS_DIRECTORY = "temp_reports"
SIMILARITY_REPORTS_DIRECTORY = "similarity_reports"


# =========================================================
# MAKE SURE REQUIRED DIRECTORIES EXIST
# =========================================================

os.makedirs(
    TEMP_REPORTS_DIRECTORY,
    exist_ok=True
)

os.makedirs(
    SIMILARITY_REPORTS_DIRECTORY,
    exist_ok=True
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="ProjectVerse Similarity Analysis API",
    description="Backend API for ProjectVerse report similarity analysis",
    version="1.0.0"
)


# =========================================================
# STATIC SIMILARITY REPORTS
# =========================================================
#
# Generated reports can also be accessed through:
#
# http://YOUR_IP:8000/similarity-reports/<filename>
#
# =========================================================

app.mount(
    "/similarity-reports",
    StaticFiles(
        directory=SIMILARITY_REPORTS_DIRECTORY
    ),
    name="similarity-reports"
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


    # =====================================================
    # CHECK FILE
    # =====================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file was provided."
        )


    # =====================================================
    # DECODE FILENAME
    # =====================================================
    #
    # Example:
    #
    # Muhammed%20Irfan%20S%20Synopsis.pdf
    #
    # becomes:
    #
    # Muhammed Irfan S Synopsis.pdf
    #
    # =====================================================

    decoded_filename = unquote(
        file.filename
    )

    print(
        "Original filename:",
        file.filename
    )

    print(
        "Decoded filename:",
        decoded_filename
    )


    # =====================================================
    # CHECK PDF
    # =====================================================

    if not decoded_filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )


    # =====================================================
    # CREATE UNIQUE TEMP FILE
    # =====================================================

    temporary_filename = (
        f"similarity_{uuid.uuid4().hex}.pdf"
    )

    pdf_path = os.path.join(
        TEMP_REPORTS_DIRECTORY,
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
            
        )


        # =================================================
        # CHECK GENERATED REPORT
        # =================================================

        report = result.get(
            "report"
        )


        if report:

            report_filename = report.get(
                "filename"
            )


            if report_filename:

                report_path = os.path.join(
                    SIMILARITY_REPORTS_DIRECTORY,
                    report_filename
                )


                print(
                    "Generated similarity report:"
                )

                print(
                    "Filename:",
                    report_filename
                )

                print(
                    "Path:",
                    report_path
                )

                print(
                    "Exists:",
                    os.path.exists(
                        report_path
                    )
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
        # DELETE ONLY TEMPORARY UPLOAD
        # =================================================
        #
        # IMPORTANT:
        #
        # This deletes only the student's temporary
        # uploaded PDF.
        #
        # The generated similarity evidence PDF
        # remains inside similarity_reports.
        #
        # =================================================

        try:

            if os.path.exists(
                pdf_path
            ):

                os.remove(
                    pdf_path
                )

                print(
                    "Temporary uploaded PDF removed."
                )

        except Exception as cleanup_error:

            print(
                "⚠️ Could not remove temporary uploaded PDF:",
                cleanup_error
            )


# =========================================================
# DOWNLOAD SIMILARITY REPORT
# =========================================================

@app.get("/similarity-report/{filename}")
def download_similarity_report(
    filename: str
):

    print(
        "\n=========================================="
    )

    print(
        "Similarity report download requested"
    )

    print(
        "Filename:",
        filename
    )

    print(
        "=========================================="
    )


    # =====================================================
    # DECODE FILENAME
    # =====================================================
    #
    # This handles URLs such as:
    #
    # similarity_report_123.pdf
    #
    # and also safely handles encoded filenames.
    #
    # =====================================================

    filename = unquote(
        filename
    )


    # =====================================================
    # SECURITY
    # =====================================================

    filename = os.path.basename(
        filename
    )


    # =====================================================
    # BUILD FILE PATH
    # =====================================================

    file_path = os.path.join(
        SIMILARITY_REPORTS_DIRECTORY,
        filename
    )


    print(
        "File path:",
        file_path
    )

    print(
        "File exists:",
        os.path.exists(
            file_path
        )
    )


    # =====================================================
    # CHECK FILE
    # =====================================================

    if not os.path.exists(
        file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Similarity evidence report not found."
        )


    # =====================================================
    # RETURN PDF
    # =====================================================

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )


# ==========================================
# PROJECTVERSE AI MENTOR - LEO
# ==========================================

def get_authenticated_student(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is missing."
        )

    id_token = credentials.credentials

    try:
        student = verify_student_token(id_token)
        return student["uid"]

    except ValueError as error:
        message = str(error)

        status_code = (
            401 if "token" in message.lower()
            else 403
        )

        raise HTTPException(
            status_code=status_code,
            detail=message
        )


# ------------------------------------------
# 1. Create a New Conversation
# ------------------------------------------

@app.post("/ai-mentor/conversations")
def create_ai_mentor_conversation(
    request: ConversationCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    uid = get_authenticated_student(credentials)

    title = request.title.strip() or "New Conversation"

    conversation_id = create_conversation(uid, title)

    return {
        "success": True,
        "conversationId": conversation_id,
        "message": "Leo conversation created successfully."
    }


# ------------------------------------------
# 2. Get Student Conversation History
# ------------------------------------------

@app.get("/ai-mentor/conversations")
def get_ai_mentor_conversations(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    uid = get_authenticated_student(credentials)

    conversations = list_conversations(uid)

    return {
        "success": True,
        "conversations": conversations
    }


# ------------------------------------------
# 3. Get a Specific Conversation
# ------------------------------------------

@app.get("/ai-mentor/conversations/{conversation_id}")
def get_ai_mentor_conversation(
    conversation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    uid = get_authenticated_student(credentials)

    try:
        conversation = get_conversation(
            conversation_id,
            uid
        )

        return {
            "success": True,
            "data": conversation
        }

    except ValueError as error:

        message = str(error)

        status_code = (
            404 if "not found" in message.lower()
            else 403
        )

        raise HTTPException(
            status_code=status_code,
            detail=message
        )


# ==========================================
# 4. SEND MESSAGE TO LEO
# ==========================================

@app.post("/ai-mentor/conversations/{conversation_id}/messages")
def send_ai_mentor_message(
    conversation_id: str,
    request: ChatMessageRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # STEP 1: Verify student authentication
    uid = get_authenticated_student(credentials)

    # STEP 2: Validate message
    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    if len(user_message) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Message cannot exceed 5000 characters."
        )

    try:
        # STEP 3: Save student's message
        user_message_id = save_message(
            conversation_id=conversation_id,
            uid=uid,
            role="user",
            content=user_message
        )

        # STEP 4: Generate temporary mock response
        leo_response = (
            f"Hey! I'm Leo, your ProjectVerse AI Mentor. "
            f"I received your message: '{user_message}'. "
            "I'm currently running in test mode. "
            "Soon, I'll be able to provide intelligent "
            "academic project guidance and suggestions!"
        )

        # STEP 5: Save Leo's response
        leo_message_id = save_message(
            conversation_id=conversation_id,
            uid=uid,
            role="assistant",
            content=leo_response
        )

        # STEP 6: Return both messages
        return {
            "success": True,
            "conversationId": conversation_id,
            "messages": [
                {
                    "id": user_message_id,
                    "role": "user",
                    "content": user_message
                },
                {
                    "id": leo_message_id,
                    "role": "assistant",
                    "content": leo_response
                }
            ]
        }

    except ValueError as error:
        message = str(error)

        status_code = (
            404 if "not found" in message.lower()
            else 403
        )

        raise HTTPException(
            status_code=status_code,
            detail=message
        )

    except Exception as error:
        print("Leo message error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to process your message."
        )
