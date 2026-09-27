import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  useLocalSearchParams,
  router,
} from "expo-router";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../../firebase/firebaseConfig";

// =====================================================
// MESSAGE TYPE
// =====================================================

type Message = {
  id: string;

  senderId: string;
  senderName: string;
  senderRole: string;

  text: string;

  createdAt?: any;
};

// =====================================================
// GUIDE CHAT CONVERSATION
// =====================================================

export default function GuideChatConversation() {
  const params =
    useLocalSearchParams<{
      studentId: string;
    }>();

  const studentId =
    params.studentId;

  // =====================================================
  // STATE
  // =====================================================

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [studentName, setStudentName] =
    useState("Student");

  const [messageText, setMessageText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  // =====================================================
  // CURRENT GUIDE
  // =====================================================

  const guide = auth.currentUser;

  // =====================================================
  // LOAD STUDENT INFORMATION
  // =====================================================

  useEffect(() => {
    const loadStudent = async () => {
      if (!guide || !studentId) {
        setLoading(false);
        return;
      }

      try {
        // =================================================
        // CHAT DOCUMENT
        // =================================================

        const chatId =
          `${guide.uid}_${studentId}`;

        const chatRef = doc(
          db,
          "chats",
          chatId
        );

        const chatSnapshot =
          await getDoc(chatRef);

        if (chatSnapshot.exists()) {
          const data =
            chatSnapshot.data();

          setStudentName(
            data.studentName ||
              "Student"
          );

          return;
        }

        // =================================================
        // FALLBACK
        // =================================================

        setStudentName("Student");

      } catch (error) {
        console.log(
          "Error loading student:",
          error
        );
      }
    };

    loadStudent();
  }, [
    guide?.uid,
    studentId,
  ]);

  // =====================================================
  // REAL-TIME MESSAGE LISTENER
  // =====================================================

  useEffect(() => {
    if (
      !guide ||
      !studentId
    ) {
      return;
    }

    const chatId =
      `${guide.uid}_${studentId}`;

    const chatRef = doc(
      db,
      "chats",
      chatId
    );

    const messagesRef =
      collection(
        chatRef,
        "messages"
      );

    const messagesQuery =
      query(
        messagesRef,
        orderBy(
          "createdAt",
          "asc"
        )
      );

    // =================================================
    // LISTEN FOR MESSAGES
    // =================================================

    const unsubscribe =
      onSnapshot(
        messagesQuery,
        (snapshot) => {
          const loadedMessages =
            snapshot.docs.map(
              (messageDoc) => ({
                id: messageDoc.id,

                ...(messageDoc.data() as Omit<
                  Message,
                  "id"
                >),
              })
            );

          setMessages(
            loadedMessages
          );

          setLoading(false);
        },
        (error) => {
          console.log(
            "Message listener error:",
            error
          );

          setLoading(false);
        }
      );

    return unsubscribe;

  }, [
    guide?.uid,
    studentId,
  ]);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async () => {
    try {
      if (!guide) {
        Alert.alert(
          "Login Required",
          "Please login again."
        );

        return;
      }

      if (!studentId) {
        return;
      }

      const text =
        messageText.trim();

      if (!text) {
        return;
      }

      setSending(true);

      // =================================================
      // CHAT ID
      // =================================================

      const chatId =
        `${guide.uid}_${studentId}`;

      const chatRef =
        doc(
          db,
          "chats",
          chatId
        );

      // =================================================
      // UPDATE CHAT PREVIEW
      // =================================================

      await setDoc(
        chatRef,
        {
          guideId:
            guide.uid,

          studentId:
            studentId,

          studentName:
            studentName,

          guideName:
            guide.displayName ||
            guide.email ||
            "Guide",

          lastMessage:
            text,

          lastMessageAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      // =================================================
      // ADD MESSAGE
      // =================================================

      await addDoc(
        collection(
          chatRef,
          "messages"
        ),
        {
          senderId:
            guide.uid,

          senderName:
            guide.displayName ||
            guide.email ||
            "Guide",

          senderRole:
            "guide",

          text:
            text,

          createdAt:
            serverTimestamp(),
        }
      );

      // =================================================
      // CLEAR INPUT
      // =================================================

      setMessageText("");

    } catch (error) {
      console.log(
        "Send guide message error:",
        error
      );

      Alert.alert(
        "Message Failed",
        "Unable to send your message."
      );
    } finally {
      setSending(false);
    }
  };

  // =====================================================
  // MESSAGE ITEM
  // =====================================================

  const renderMessage = ({
    item,
  }: {
    item: Message;
  }) => {
    // =================================================
    // GUIDE MESSAGE = RIGHT
    // STUDENT MESSAGE = LEFT
    // =================================================

    const isMine =
      item.senderId ===
      guide?.uid;

    return (
      <View
        style={[
          styles.messageRow,

          isMine
            ? styles.guideMessageRow
            : styles.studentMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageContent,

            isMine
              ? styles.guideMessageContent
              : styles.studentMessageContent,
          ]}
        >
          {/* =================================================
              SENDER NAME
          ================================================= */}

          <Text
            style={[
              styles.senderName,

              isMine
                ? styles.guideSenderName
                : styles.studentSenderName,
            ]}
          >
            {isMine
              ? "Guide"
              : studentName}
          </Text>

          {/* =================================================
              MESSAGE
          ================================================= */}

          <View
            style={[
              styles.messageBubble,

              isMine
                ? styles.guideBubble
                : styles.studentBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,

                isMine
                  ? styles.guideMessageText
                  : styles.studentMessageText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#4338CA"
        />

        <Text
          style={styles.loadingText}
        >
          Loading conversation...
        </Text>
      </View>
    );
  }

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      {/* =================================================
          CHAT HEADER
      ================================================= */}

      <View
        style={styles.chatHeader}
      >
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color="#1F2937"
          />
        </Pressable>

        <View
          style={styles.headerAvatar}
        >
          <Text
            style={styles.headerAvatarText}
          >
            {studentName
              .substring(0, 2)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={styles.headerInfo}
        >
          <Text
            style={styles.headerName}
            numberOfLines={1}
          >
            {studentName}
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Student
          </Text>
        </View>
      </View>

      {/* =================================================
          MESSAGES
      ================================================= */}

      <FlatList
        data={messages}
        renderItem={
          renderMessage
        }
        keyExtractor={(item) =>
          item.id
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.messagesList,

          messages.length === 0 &&
            styles.emptyMessagesList,
        ]}
        ListHeaderComponent={
          <View
            style={styles.chatIntro}
          >
            <View
              style={styles.chatIntroIcon}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color="#4338CA"
              />
            </View>

            <Text
              style={styles.chatIntroText}
            >
              Chat with {studentName}
            </Text>

            <Text
              style={
                styles.chatIntroSubText
              }
            >
              Messages between you and
              this student appear here.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View
            style={styles.noMessages}
          >
            <Text
              style={
                styles.noMessagesTitle
              }
            >
              Start a conversation
            </Text>

            <Text
              style={
                styles.noMessagesText
              }
            >
              Send a message to{" "}
              {studentName}.
            </Text>
          </View>
        }
      />

      {/* =================================================
          MESSAGE INPUT
      ================================================= */}

      <View
        style={
          styles.inputContainer
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={messageText}
          onChangeText={
            setMessageText
          }
          multiline
        />

        <Pressable
          style={[
            styles.sendButton,

            (!messageText.trim() ||
              sending) &&
              styles.sendButtonDisabled,
          ]}
          onPress={
            sendMessage
          }
          disabled={
            !messageText.trim() ||
            sending
          }
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="send"
              size={19}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  messageContent: {
  maxWidth: "78%",
},

  // =====================================================
  // HEADER
  // =====================================================

  chatHeader: {
    height: 64,

    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,

    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",
  },

  headerAvatar: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: "#EEF0FF",

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 2,
    marginRight: 10,
  },

  headerAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4338CA",
  },

  headerInfo: {
    flex: 1,
  },

  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  headerSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // =====================================================
  // INTRO
  // =====================================================

  chatIntro: {
    alignItems: "center",

    paddingTop: 18,
    paddingBottom: 24,
  },

  chatIntroIcon: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: "#EEF0FF",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 9,
  },

  chatIntroText: {
    fontSize: 16,
    fontWeight: "700",

    color: "#1F2937",

    textAlign: "center",
  },

  chatIntroSubText: {
    fontSize: 11,

    color: "#9CA3AF",

    marginTop: 4,

    textAlign: "center",

    paddingHorizontal: 30,
  },

  // =====================================================
  // MESSAGES
  // =====================================================

  messagesList: {
    paddingHorizontal: 15,
    paddingBottom: 18,
  },

  emptyMessagesList: {
    flexGrow: 1,
  },

  messageRow: {
    width: "100%",

    marginBottom: 14,
  },

  // =====================================================
  // STUDENT = LEFT
  // =====================================================

  studentMessageRow: {
    alignItems: "flex-start",
  },

  studentMessageContent: {
    alignItems: "flex-start",

    maxWidth: "78%",
  },

  // =====================================================
  // GUIDE = RIGHT
  // =====================================================

  guideMessageRow: {
    alignItems: "flex-end",
  },

  guideMessageContent: {
    alignItems: "flex-end",

    maxWidth: "78%",
  },

  // =====================================================
  // SENDER NAME
  // =====================================================

  senderName: {
    fontSize: 10,
    fontWeight: "700",

    marginBottom: 4,

    paddingHorizontal: 3,
  },

  studentSenderName: {
    color: "#6B7280",

    textAlign: "left",
  },

  guideSenderName: {
    color: "#4338CA",

    textAlign: "right",
  },

  // =====================================================
  // BUBBLE
  // =====================================================

  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 16,
  },

  // =====================================================
  // STUDENT BUBBLE
  // =====================================================

  studentBubble: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E5E7EB",

    borderBottomLeftRadius: 4,
  },

  studentMessageText: {
    color: "#1F2937",
  },

  // =====================================================
  // GUIDE BUBBLE
  // =====================================================

  guideBubble: {
    backgroundColor: "#4338CA",

    borderBottomRightRadius: 4,
  },

  guideMessageText: {
    color: "#FFFFFF",
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // =====================================================
  // INPUT
  // =====================================================

  inputContainer: {
    flexDirection: "row",

    alignItems: "flex-end",

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",

    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  input: {
    flex: 1,

    minHeight: 44,
    maxHeight: 110,

    backgroundColor: "#F5F7FB",

    borderWidth: 1,
    borderColor: "#E0E4EC",

    borderRadius: 12,

    paddingHorizontal: 13,
    paddingVertical: 10,

    fontSize: 14,

    color: "#1F2937",
  },

  sendButton: {
    width: 44,
    height: 44,

    borderRadius: 12,

    backgroundColor: "#4338CA",

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 8,
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },

  // =====================================================
  // LOADING
  // =====================================================

  loadingContainer: {
    flex: 1,

    backgroundColor: "#F5F7FB",

    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,

    fontSize: 13,
    color: "#6B7280",
  },

  // =====================================================
  // EMPTY
  // =====================================================

  noMessages: {
    alignItems: "center",

    paddingTop: 5,
  },

  noMessagesTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: "#374151",
  },

  noMessagesText: {
    marginTop: 4,

    fontSize: 12,

    color: "#9CA3AF",
  },
});