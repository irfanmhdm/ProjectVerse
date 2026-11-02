import time
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from firebase_admin import auth, firestore
from services.firebase_service import db


# ==========================================
# 1. GEMINI CONFIGURATION
# ==========================================

# ProjectVerse root directory
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Load .env from the ProjectVerse root folder
load_dotenv(PROJECT_ROOT / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from the ProjectVerse .env file."
    )

# Initialize Gemini client
gemini_client = genai.Client(api_key=GEMINI_API_KEY)


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

Response guidelines:
- Give clear and practical answers.
- Use examples when they improve understanding.
- Break complicated explanations into smaller steps.
- Use code blocks for programming examples.
- Do not unnecessarily make answers lengthy.
- Ask for missing information when required.
- Never claim that code was executed or tested when it was not.
- Do not invent information about a student's project.
- If you are unsure, clearly say so.

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
        "reportName": None
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
        key=lambda item: item.get("updatedAt"),
        reverse=True
    )

    return conversations


# ==========================================
# 9. GENERATE LEO'S GEMINI RESPONSE
# ==========================================


def generate_leo_response(
    conversation_history: list,
    user_message: str
) -> str:

    if not user_message or not user_message.strip():
        raise ValueError("Message cannot be empty.")

    contents = []

    recent_history = conversation_history[-20:]

    for message in recent_history:

        role = message.get("role")
        content = message.get("content", "")

        if not content or not content.strip():
            continue

        if role == "user":
            gemini_role = "user"

        elif role == "assistant":
            gemini_role = "model"

        else:
            continue

        contents.append(
            types.Content(
                role=gemini_role,
                parts=[
                    types.Part.from_text(text=content)
                ]
            )
        )

    contents.append(
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=user_message.strip()
                )
            ]
        )
    )

    # Retry temporary Gemini failures
    max_attempts = 3

    for attempt in range(max_attempts):

        try:

            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=LEO_SYSTEM_INSTRUCTION,
                    temperature=0.7,
                    max_output_tokens=2048
                )
            )

            if not response.text:
                raise RuntimeError(
                    "Leo could not generate a response."
                )

            return response.text.strip()

        except Exception as error:

            error_text = str(error)

            temporary_error = (
                "503" in error_text
                or "UNAVAILABLE" in error_text
                or "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
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
                f"Gemini temporarily unavailable. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)
