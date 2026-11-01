
from firebase_admin import auth, firestore
from services.firebase_service import db


# -----------------------------------
# 1. Verify Firebase ID Token
# -----------------------------------

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
        raise ValueError("Invalid or expired authentication token.") from error


# -----------------------------------
# 2. Create a Conversation
# -----------------------------------

def create_conversation(uid: str, title: str = "New Conversation") -> str:

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


# -----------------------------------
# 3. Verify Conversation Ownership
# -----------------------------------

def verify_conversation_owner(conversation_id: str, uid: str):

    conversation_ref = db.collection(
        "aiMentorConversations"
    ).document(conversation_id)

    conversation_doc = conversation_ref.get()

    if not conversation_doc.exists:
        raise ValueError("Conversation not found.")

    conversation_data = conversation_doc.to_dict()

    if conversation_data.get("userId") != uid:
        raise ValueError("You are not authorized to access this conversation.")

    return conversation_ref, conversation_data


# -----------------------------------
# 4. Save a Message
# -----------------------------------

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

    message_ref = conversation_ref.collection("messages").document()

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


# -----------------------------------
# 5. Get Conversation Messages
# -----------------------------------

def get_conversation(conversation_id: str, uid: str):

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


# -----------------------------------
# 6. List Student Conversations
# -----------------------------------

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
