
import time
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

from firebase_admin import auth, firestore
from services.firebase_service import db
import base64
import io

from pypdf import PdfReader
from PIL import Image

# ==========================================
# 1. GROQ CONFIGURATION
# ==========================================

# ProjectVerse root directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Load .env from the ProjectVerse root folder
load_dotenv(PROJECT_ROOT / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

if not GROQ_API_KEY:
    raise RuntimeError(
        "GROQ_API_KEY is missing from the ProjectVerse .env file."
    )

# Initialize Groq client.
# Manual retry handling is implemented below.
groq_client = Groq(
    api_key=GROQ_API_KEY,
    max_retries=0
)

print("Leo AI Provider: Groq")
print("Leo Model:", GROQ_MODEL)

# ==========================================
# ADDITIONAL FILE PROCESSING CONFIGURATION
# ==========================================

GROQ_VISION_MODEL = os.getenv(
    "GROQ_VISION_MODEL",
    "qwen/qwen3.8-27b"
)

MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024  # 15 MB
MAX_PDF_PAGES = 50
MAX_PDF_TEXT_LENGTH = 40000

# ==========================================
# 2. LEO SYSTEM INSTRUCTIONS
# ==========================================

LEO_SYSTEM_INSTRUCTION = """
You are Leo, the official AI Mentor of ProjectVerse.

ProjectVerse is an academic project discovery and management
platform developed for the FISAT MCA department.

Your personality:
- Friendly, supportive, and approachable.
- Act like a helpful senior or academic mentor.
- Explain technical concepts in simple language.
- Be patient with students who are learning.
- Encourage students to think independently.

Your responsibilities:
1. Help students understand project ideas and concepts.
2. Suggest meaningful project improvements and innovations.
3. Explain programming languages, frameworks, and technologies.
4. Help students understand errors and debug their code.
5. Guide students with project planning and implementation.
6. Assist with project documentation and presentations.
7. Explain algorithms and technical approaches.
8. Help students understand their uploaded project reports.

IMPORTANT RESPONSE-DEPTH RULE:
Use a two-level response style. Start concise and expand only when
the student clearly asks for more detail.

LEVEL 1 — QUICK DISCOVERY (DEFAULT):
Use this for requests such as:
- "Suggest 3 MCA projects."
- "Give me some AI project ideas."
- "Suggest final-year project topics."
- "Give me project ideas using Python."

For project suggestion requests:
- Give exactly the number of suggestions requested.
- If no number is specified, give 5 suggestions.
- Present each suggestion with a short, clear project title
  followed by only 1–2 concise sentences describing its purpose.
- Keep the entire response easy to scan.
- Do NOT include lengthy explanations, problem statements,
  objectives, modules, feature lists, architecture, database design,
  technology stacks, implementation steps, or code unless requested.
- Do NOT fully explain every suggested project.
- Do not add a long introduction or conclusion.
- If useful, finish with one short sentence inviting the student
  to choose an idea for a detailed explanation.

LEVEL 2 — DETAILED EXPLORATION (ONLY WHEN ASKED):
Switch to detailed mode only when the student explicitly asks to
elaborate, explain in detail, discuss features, plan implementation,
compare options, or explore a selected project further.

In detailed mode:
- Focus on the specific project or question the student selected.
- Include only sections relevant to the student's request.
- For an "elaborate" request, explain the project overview,
  problem it addresses, objectives, and how it could work.
- For a "features" request, focus on features. Separate core,
  advanced, and optional/innovative features where useful.
- For a "technology stack" request, explain suitable technologies
  and briefly justify each choice.
- For an "implementation" request, provide a practical step-by-step
  development plan.
- For an "architecture" request, explain the main components and
  how data moves between them.
- Do not repeat the full project description when the student asks
  a narrow follow-up question.

CONVERSATION CONTEXT:
- If the student selects one idea from an earlier list, understand
  which idea they mean and expand only that idea.
- A short follow-up such as "elaborate", "tell me its features",
  or "how can we implement it?" refers to the most recently
  discussed or selected project when that is clear.
- Do not return to the short-suggestion format after the student
  has explicitly requested a detailed explanation, unless they
  ask for a new list of suggestions.
- If the student's request is ambiguous, ask one brief clarifying
  question rather than giving a long answer.

GENERAL RESPONSE GUIDELINES:
- Be clear, practical, and appropriately concise.
- Match the amount of detail to what the student asked.
- Use examples when they improve understanding.
- Break complicated explanations into smaller steps.
- Use code blocks for programming examples.
- Ask for missing information when required.
- Never claim that code was executed or tested when it was not.
- Do not invent information about a student's project.
- If you are unsure, clearly say so.
- When analysing an uploaded report or image, answer the student's
  actual question and use the uploaded material as evidence.
  Do not apply the short project-suggestion format to document
  analysis or other tasks that genuinely require detail.

Important:
You are an academic mentor, not a replacement for the student's
own learning or project work.

Stay focused on helping students learn, develop, and improve
their academic projects.

Your name is Leo.
"""


# ==========================================
# 3. VERIFY FIREBASE ID TOKEN
# ==========================================

def verify_student_token(id_token: str) -> dict:
    """
    Verifies the Firebase ID token and checks
    whether the user is an approved student.
    """

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]

        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise ValueError("User account not found.")

        user_data = user_doc.to_dict()

        if user_data.get("role") != "student":
            raise ValueError("Leo is available only for students.")

        if user_data.get("status") != "approved":
            raise ValueError("Your student account is not approved.")

        return {
            "uid": uid,
            "user": user_data
        }

    except ValueError:
        raise

    except Exception as error:
        raise ValueError(
            "Invalid or expired authentication token."
        ) from error


# ==========================================
# 4. CREATE A CONVERSATION
# ==========================================

def create_conversation(
    uid: str,
    title: str = "New Conversation"
) -> str:

    conversation_ref = db.collection(
        "aiMentorConversations"
    ).document()

    conversation_ref.set({
        "userId": uid,
        "title": title,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "hasReport": False,
        "reportName": None,
        "isPinned": False
    })

    return conversation_ref.id


# ==========================================
# 5. VERIFY CONVERSATION OWNERSHIP
# ==========================================

def verify_conversation_owner(
    conversation_id: str,
    uid: str
):

    conversation_ref = db.collection(
        "aiMentorConversations"
    ).document(conversation_id)

    conversation_doc = conversation_ref.get()

    if not conversation_doc.exists:
        raise ValueError("Conversation not found.")

    conversation_data = conversation_doc.to_dict()

    if conversation_data.get("userId") != uid:
        raise ValueError(
            "You are not authorized to access this conversation."
        )

    return conversation_ref, conversation_data


# ==========================================
# 6. SAVE A MESSAGE
# ==========================================

def save_message(
    conversation_id: str,
    uid: str,
    role: str,
    content: str,
    attachments: list = None
):

    if role not in ["user", "assistant"]:
        raise ValueError("Invalid message role.")

    conversation_ref, _ = verify_conversation_owner(
        conversation_id,
        uid
    )

    message_ref = conversation_ref.collection(
        "messages"
    ).document()

    message_ref.set({
        "role": role,
        "content": content,
        "timestamp": firestore.SERVER_TIMESTAMP,
        "attachments": attachments or []
    })

    conversation_ref.update({
        "updatedAt": firestore.SERVER_TIMESTAMP
    })

    return message_ref.id


# ==========================================
# 7. GET CONVERSATION MESSAGES
# ==========================================

def get_conversation(
    conversation_id: str,
    uid: str
):

    conversation_ref, conversation_data = verify_conversation_owner(
        conversation_id,
        uid
    )

    messages_query = (
        conversation_ref.collection("messages")
        .order_by("timestamp")
        .stream()
    )

    messages = []

    for message in messages_query:
        message_data = message.to_dict()
        message_data["id"] = message.id
        messages.append(message_data)

    return {
        "id": conversation_id,
        "conversation": conversation_data,
        "messages": messages
    }


# ==========================================
# 8. LIST STUDENT CONVERSATIONS
# ==========================================

def list_conversations(uid: str):

    conversations_query = (
        db.collection("aiMentorConversations")
        .where("userId", "==", uid)
        .stream()
    )

    conversations = []

    for conversation in conversations_query:
        data = conversation.to_dict()
        data["id"] = conversation.id
        conversations.append(data)

    conversations.sort(
        key=lambda item: (
            bool(item.get("isPinned", False)),
            item.get("updatedAt") or item.get("createdAt") or 0
        ),
        reverse=True
    )

    return conversations


# ==========================================
# 8A. RENAME A CONVERSATION
# ==========================================

def rename_conversation(conversation_id: str, uid: str, title: str):
    title = title.strip()
    if not title:
        raise ValueError("Conversation title cannot be empty.")
    if len(title) > 60:
        raise ValueError("Conversation title cannot exceed 60 characters.")
    conversation_ref, _ = verify_conversation_owner(conversation_id, uid)
    conversation_ref.update({
        "title": title,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    return title


# ==========================================
# 8B. PIN / UNPIN A CONVERSATION (MAX 10)
# ==========================================

def set_conversation_pin(conversation_id: str, uid: str, is_pinned: bool):
    conversation_ref, _ = verify_conversation_owner(conversation_id, uid)

    if is_pinned:
        # Query only by userId, then count pinned records in Python.
        # This avoids requiring a Firestore composite index for userId + isPinned.
        student_conversations = (
            db.collection("aiMentorConversations")
            .where("userId", "==", uid)
            .stream()
        )
        pinned_ids = [
            doc.id for doc in student_conversations
            if doc.to_dict().get("isPinned", False) is True
        ]
        if conversation_id not in pinned_ids and len(pinned_ids) >= 10:
            raise ValueError("You can pin a maximum of 10 conversations.")

    conversation_ref.update({
        "isPinned": bool(is_pinned),
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    return bool(is_pinned)


# ==========================================
# 8C. DELETE A CONVERSATION AND ITS MESSAGES
# ==========================================

def delete_conversation(conversation_id: str, uid: str):
    conversation_ref, _ = verify_conversation_owner(conversation_id, uid)

    # Firestore does not automatically delete subcollection documents.
    # Delete messages in batches before deleting the parent conversation.
    messages_ref = conversation_ref.collection("messages")
    while True:
        message_docs = list(messages_ref.limit(400).stream())
        if not message_docs:
            break
        batch = db.batch()
        for message_doc in message_docs:
            batch.delete(message_doc.reference)
        batch.commit()

    conversation_ref.delete()
    return True


# ==========================================
# 9. GENERATE LEO'S GROQ RESPONSE
# ==========================================

def generate_leo_response(
    conversation_history: list,
    user_message: str
) -> str:

    if not user_message or not user_message.strip():
        raise ValueError("Message cannot be empty.")

    # Keep only the most recent 20 conversation messages
    recent_history = conversation_history[-20:]

    messages = [
        {
            "role": "system",
            "content": LEO_SYSTEM_INSTRUCTION
        }
    ]

    for message in recent_history:

        role = message.get("role")
        content = message.get("content", "")

        if not content or not content.strip():
            continue

        if role in ["user", "assistant"]:
            messages.append({
                "role": role,
                "content": content.strip()
            })

    # Add the current user message
    messages.append({
        "role": "user",
        "content": user_message.strip()
    })

    # Retry temporary Groq failures
    max_attempts = 3

    for attempt in range(max_attempts):

        try:

            response = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                max_completion_tokens=2048
            )

            answer = response.choices[0].message.content

            if not answer or not answer.strip():
                raise RuntimeError(
                    "Leo could not generate a response."
                )

            return answer.strip()

        except Exception as error:

            status_code = getattr(error, "status_code", None)

            temporary_error = (
                status_code in [408, 409, 429, 500, 502, 503, 504]
                or error.__class__.__name__ in [
                    "APIConnectionError",
                    "APITimeoutError"
                ]
            )

            if not temporary_error:
                raise

            if attempt == max_attempts - 1:
                raise RuntimeError(
                    "Leo is temporarily unavailable. "
                    "Please try again in a moment."
                ) from error

            wait_time = 2 ** attempt

            print(
                f"Groq temporarily unavailable. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)


# =========================================================
# 10. EXTRACT TEXT FROM UPLOADED PDF
# =========================================================

def extract_pdf_text(pdf_bytes: bytes) -> str:

    if not pdf_bytes:
        raise ValueError("The uploaded PDF is empty.")

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))

        if reader.is_encrypted:
            raise ValueError(
                "Password-protected PDFs are not supported."
            )

        if len(reader.pages) > MAX_PDF_PAGES:
            raise ValueError(
                f"PDF cannot contain more than {MAX_PDF_PAGES} pages."
            )

        extracted_pages = []

        for page_number, page in enumerate(reader.pages, start=1):

            page_text = page.extract_text() or ""

            if page_text.strip():
                extracted_pages.append(
                    f"Page {page_number}:\n{page_text}"
                )

        extracted_text = "\n\n".join(extracted_pages)

        if not extracted_text.strip():
            raise ValueError(
                "No readable text was found in this PDF. "
                "Scanned PDFs currently require OCR."
            )

        return extracted_text[:MAX_PDF_TEXT_LENGTH]

    except ValueError:
        raise

    except Exception as error:
        raise ValueError(
            "Unable to read this PDF. Please upload a valid PDF."
        ) from error


# =========================================================
# 11. GENERATE LEO RESPONSE WITH PDF
# =========================================================

def generate_leo_pdf_response(
    conversation_history: list,
    user_message: str,
    pdf_bytes: bytes,
    filename: str
) -> str:

    extracted_text = extract_pdf_text(pdf_bytes)

    document_prompt = f"""
The student has uploaded a PDF document.

Filename: {filename}

The following is the extracted text from the document.

Use this document as context when answering the student's question.
Do not claim that information is present if it is not in the text.
If something cannot be determined from the extracted content,
clearly explain that.

---------------- DOCUMENT CONTENT ----------------

{extracted_text}

---------------- END OF DOCUMENT ----------------

Student's question:
{user_message}
"""

    return generate_leo_response(
        conversation_history=conversation_history,
        user_message=document_prompt
    )


# =========================================================
# 12. GENERATE LEO RESPONSE WITH IMAGE
# =========================================================

def generate_leo_image_response(
    conversation_history: list,
    user_message: str,
    image_bytes: bytes,
    mime_type: str
) -> str:

    if not image_bytes:
        raise ValueError("The uploaded image is empty.")

    if mime_type not in [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]:
        raise ValueError(
            "Only JPEG, PNG and WEBP images are supported."
        )

    if len(image_bytes) > MAX_ATTACHMENT_SIZE:
        raise ValueError(
            "Image size cannot exceed 15 MB."
        )

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()

    except Exception as error:
        raise ValueError(
            "The uploaded image is invalid or corrupted."
        ) from error

    encoded_image = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    image_data_url = (
        f"data:{mime_type};base64,{encoded_image}"
    )

    messages = [
        {
            "role": "system",
            "content": LEO_SYSTEM_INSTRUCTION
        }
    ]

    recent_history = conversation_history[-20:]

    for message in recent_history:

        role = message.get("role")
        content = message.get("content", "")

        if role not in ["user", "assistant"]:
            continue

        if not isinstance(content, str) or not content.strip():
            continue

        messages.append({
            "role": role,
            "content": content.strip()
        })

    messages.append({
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": (
                    f"{user_message.strip()}\n\n"
                    "Please carefully analyse the attached image "
                    "and answer the student's question."
                )
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": image_data_url
                }
            }
        ]
    })

    try:

        response = groq_client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=messages,
            max_completion_tokens=2048
        )

        answer = response.choices[0].message.content

        if not answer or not answer.strip():
            raise RuntimeError(
                "Leo could not analyse the uploaded image."
            )

        return answer.strip()

    except Exception as error:

        status_code = getattr(error, "status_code", None)

        if status_code == 429:
            raise RuntimeError(
                "Leo has temporarily reached the image-analysis "
                "request limit. Please try again later."
            ) from error

        print("❌ Groq vision error:", error)

        raise RuntimeError(
            "Leo could not analyse this image. Please try again."
        ) from error


# =========================================================
# 13. GENERATE LEO RESPONSE WITH ATTACHMENT
# =========================================================

def generate_leo_attachment_response(
    conversation_history: list,
    user_message: str,
    file_bytes: bytes,
    filename: str,
    mime_type: str
) -> str:

    if not file_bytes:
        raise ValueError("Uploaded file is empty.")

    if len(file_bytes) > MAX_ATTACHMENT_SIZE:
        raise ValueError(
            "File size cannot exceed 15 MB."
        )

    if mime_type == "application/pdf":

        return generate_leo_pdf_response(
            conversation_history=conversation_history,
            user_message=user_message,
            pdf_bytes=file_bytes,
            filename=filename
        )

    if mime_type in [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]:

        return generate_leo_image_response(
            conversation_history=conversation_history,
            user_message=user_message,
            image_bytes=file_bytes,
            mime_type=mime_type
        )

    raise ValueError(
        "Unsupported file type. Upload a PDF, JPEG, PNG or WEBP image."
    )
