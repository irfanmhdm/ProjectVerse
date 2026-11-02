
from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Depends
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from pydantic import BaseModel

from urllib.parse import unquote

from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from services.ai_mentor import (
    verify_student_token,
    create_conversation,
    list_conversations,
    get_conversation,
    save_message,
    generate_leo_response
)

from services.project_processor import (
    process_approved_project
)

from services.similarity import (
    analyze_similarity
)

import os
import uuid


# =========================================================
# AUTHENTICATION
# =========================================================

security = HTTPBearer(auto_error=False)


# =========================================================
# REQUEST MODELS
# =========================================================

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
    title="ProjectVerse API",
    description=(
        "Backend API for ProjectVerse Similarity Analysis "
        "and AI Mentor Leo"
    ),
    version="1.0.0"
)


# =========================================================
# STATIC SIMILARITY REPORTS
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
        "message": "ProjectVerse API is running"
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

    if not decoded_filename.lower().endswith(".pdf"):

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
            pdf_path
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

            "success": True,

            "message": (
                "Similarity analysis completed successfully"
            ),

            "data": result

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

        try:

            if os.path.exists(pdf_path):

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
        os.path.exists(file_path)
    )

    # =====================================================
    # CHECK FILE
    # =====================================================

    if not os.path.exists(file_path):

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


# =========================================================
# PROJECTVERSE AI MENTOR - LEO
# =========================================================


# =========================================================
# AUTHENTICATE STUDENT
# =========================================================

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

        student = verify_student_token(
            id_token
        )

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


# =========================================================
# 1. CREATE A NEW CONVERSATION
# =========================================================

@app.post("/ai-mentor/conversations")
def create_ai_mentor_conversation(
    request: ConversationCreateRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    uid = get_authenticated_student(
        credentials
    )

    title = (
        request.title.strip()
        or "New Conversation"
    )

    conversation_id = create_conversation(
        uid,
        title
    )

    return {

        "success": True,

        "conversationId": conversation_id,

        "message": (
            "Leo conversation created successfully."
        )

    }


# =========================================================
# 2. GET STUDENT CONVERSATION HISTORY
# =========================================================

@app.get("/ai-mentor/conversations")
def get_ai_mentor_conversations(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    uid = get_authenticated_student(
        credentials
    )

    conversations = list_conversations(
        uid
    )

    return {

        "success": True,

        "conversations": conversations

    }


# =========================================================
# 3. GET A SPECIFIC CONVERSATION
# =========================================================

@app.get("/ai-mentor/conversations/{conversation_id}")
def get_ai_mentor_conversation(
    conversation_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    uid = get_authenticated_student(
        credentials
    )

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


# =========================================================
# 4. SEND MESSAGE TO LEO - GEMINI INTEGRATION
# =========================================================

@app.post(
    "/ai-mentor/conversations/{conversation_id}/messages"
)
def send_ai_mentor_message(
    conversation_id: str,
    request: ChatMessageRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # =====================================================
    # STEP 1: VERIFY STUDENT AUTHENTICATION
    # =====================================================

    uid = get_authenticated_student(
        credentials
    )

    # =====================================================
    # STEP 2: VALIDATE MESSAGE
    # =====================================================

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

        # =================================================
        # STEP 3: VERIFY CONVERSATION OWNERSHIP
        # =================================================

        conversation = get_conversation(
            conversation_id,
            uid
        )

        # =================================================
        # STEP 4: GET PREVIOUS CONVERSATION HISTORY
        # =================================================

        conversation_history = conversation.get(
            "messages",
            []
        )

        # =================================================
        # STEP 5: GENERATE Groq RESPONSE
        # =================================================

        print(
            "\n=========================================="
        )

        print(
            "Leo is generating a Groq response..."
        )

        print(
            "Conversation ID:",
            conversation_id
        )

        print(
            "=========================================="
        )

        leo_response = generate_leo_response(
            conversation_history=conversation_history,
            user_message=user_message
        )

        # =================================================
        # STEP 6: SAVE STUDENT MESSAGE
        # =================================================

        user_message_id = save_message(
            conversation_id=conversation_id,
            uid=uid,
            role="user",
            content=user_message
        )

        # =================================================
        # STEP 7: SAVE LEO RESPONSE
        # =================================================

        leo_message_id = save_message(
            conversation_id=conversation_id,
            uid=uid,
            role="assistant",
            content=leo_response
        )

        print(
            "Leo response generated and saved successfully."
        )

        # =================================================
        # STEP 8: RETURN BOTH MESSAGES
        # =================================================

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

        print(
            "❌ Leo message error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process your message."
        )
