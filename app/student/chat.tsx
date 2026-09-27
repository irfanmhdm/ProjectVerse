import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

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

import { auth, db } from "../../firebase/firebaseConfig";

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
// CHAT PAGE
// =====================================================

export default function StudentChat() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [messageText, setMessageText] = useState("");

  const [guideId, setGuideId] = useState("");

  const [guideName, setGuideName] = useState("Guide");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  // =====================================================
  // CURRENT STUDENT
  // =====================================================

  const student = auth.currentUser;

  // =====================================================
  // LOAD ASSIGNED GUIDE
  // =====================================================

  useEffect(() => {
    const loadGuide = async () => {
      try {
        if (!student) {
          Alert.alert(
            "Login Required",
            "Please login again."
          );

          return;
        }

        setLoading(true);

        // =================================================
        // LOAD GUIDE-STUDENT RELATIONSHIPS
        // =================================================

        const guideStudentsRef =
          collection(db, "guideStudents");

        const snapshot =
          await getDocs(guideStudentsRef);

        let foundGuideId = "";

        let foundGuideName = "Guide";

        snapshot.docs.forEach((studentDoc) => {
          const data = studentDoc.data();

          if (
            data.studentId === student.uid
          ) {
            foundGuideId =
              data.guideId || "";

            foundGuideName =
              data.guideName ||
              data.guideEmail ||
              "Guide";
          }
        });

        // =================================================
        // GUIDE NOT FOUND
        // =================================================

        if (!foundGuideId) {
          setGuideId("");

          setGuideName("Guide");

          return;
        }

        setGuideId(foundGuideId);

        setGuideName(foundGuideName);

      } catch (error) {
        console.log(
          "Error loading guide:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to load your guide."
        );
      } finally {
        setLoading(false);
      }
    };

    loadGuide();
  }, [student?.uid]);

  // =====================================================
  // CHAT LISTENER
  // =====================================================

  useEffect(() => {
    if (!student || !guideId) {
      return;
    }

    // =================================================
    // GENERAL CHAT ID
    // =================================================

    const chatId =
      `${guideId}_${student.uid}`;

    // =================================================
    // CHAT DOCUMENT
    // =================================================

    const chatRef = doc(
      db,
      "chats",
      chatId
    );

    // =================================================
    // MESSAGES
    // =================================================

    const messagesRef =
      collection(
        chatRef,
        "messages"
      );

    const messagesQuery =
      query(
        messagesRef,
        orderBy("createdAt", "asc")
      );

    // =================================================
    // REAL-TIME LISTENER
    // =================================================

    const unsubscribe =
      onSnapshot(
        messagesQuery,
        (snapshot) => {
          const loadedMessages: Message[] =
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
        },
        (error) => {
          console.log(
            "Chat listener error:",
            error
          );
        }
      );

    return unsubscribe;

  }, [student?.uid, guideId]);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async () => {
    try {
      if (!student) {
        Alert.alert(
          "Login Required",
          "Please login again."
        );

        return;
      }

      if (!guideId) {
        Alert.alert(
          "Guide Not Found",
          "You are not currently assigned to a guide."
        );

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
        `${guideId}_${student.uid}`;

      // =================================================
      // CHAT DOCUMENT
      // =================================================

      const chatRef =
        doc(
          db,
          "chats",
          chatId
        );

      // =================================================
      // CREATE / UPDATE CHAT
      // =================================================

      await setDoc(
        chatRef,
        {
          guideId: guideId,

          studentId:
            student.uid,

          guideName:
            guideName,

          studentName:
            student.displayName ||
            student.email ||
            "Student",

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
            student.uid,

          senderName:
            student.displayName ||
            student.email ||
            "Student",

          senderRole:
            "student",

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
        "Send message error:",
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
          style={
            styles.loadingText
          }
        >
          Loading chat...
        </Text>
      </View>
    );
  }

  // =====================================================
  // NO GUIDE
  // =====================================================

  if (!guideId) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <View
          style={
            styles.emptyIcon
          }
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={32}
            color="#4338CA"
          />
        </View>

        <Text
          style={
            styles.emptyTitle
          }
        >
          Chat with Your Guide
        </Text>

        <Text
          style={
            styles.emptyText
          }
        >
          Chat will be available once
          a guide is assigned to you.
        </Text>
      </View>
    );
  }

  // =====================================================
  // MESSAGE ITEM
  // =====================================================

  const renderMessage = ({
    item,
  }: {
    item: Message;
  }) => {
    const isMine =
      item.senderId ===
      student?.uid;

    return (
      <View
        style={[
          styles.messageRow,

          isMine
            ? styles.myMessageRow
            : styles.guideMessageRow,
        ]}
      >

        {/* =================================================
            MESSAGE CONTENT
        ================================================= */}

        <View
          style={[
            styles.messageContent,

            isMine
              ? styles.myMessageContent
              : styles.guideMessageContent,
          ]}
        >

          {/* =================================================
              SENDER NAME
          ================================================= */}

          <Text
            style={[
              styles.senderName,

              isMine
                ? styles.mySenderName
                : styles.guideSenderName,
            ]}
          >
            {isMine
              ? item.senderName
              : item.senderName || "Guide"}
          </Text>

          {/* =================================================
              MESSAGE BUBBLE
          ================================================= */}

          <View
            style={[
              styles.messageBubble,

              isMine
                ? styles.myBubble
                : styles.guideBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,

                isMine
                  ? styles.myMessageText
                  : styles.guideMessageText,
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
          MESSAGES
      ================================================= */}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) =>
          item.id
        }
        contentContainerStyle={[
          styles.messagesList,

          messages.length === 0 &&
            styles.emptyMessagesList,
        ]}
        showsVerticalScrollIndicator={
          false
        }

        /* =================================================
           INTRO TEXT
           
           This is NOT a message.
           It only appears before conversation starts.
        ================================================= */

        ListHeaderComponent={
          <View
            style={
              styles.chatIntro
            }
          >
            <View
              style={
                styles.chatIntroIcon
              }
            >
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color="#4338CA"
              />
            </View>

            <Text
              style={
                styles.chatIntroText
              }
            >
              Chat with your guide
            </Text>

            <Text
              style={
                styles.chatIntroSubText
              }
            >
              You can discuss your project,
              feedback and questions here.
            </Text>
          </View>
        }

        ListEmptyComponent={
          <View
            style={
              styles.noMessages
            }
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
              Send a message to your guide.
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

  // =====================================================
  // CONTAINER
  // =====================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  // =====================================================
  // CHAT INTRO
  // =====================================================

  chatIntro: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 25,
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
    paddingTop: 0,
    paddingBottom: 18,
  },

  emptyMessagesList: {
    flexGrow: 1,
  },

  // =====================================================
  // MESSAGE ROW
  // =====================================================

  messageRow: {
    width: "100%",
    marginBottom: 14,
  },

  myMessageRow: {
    alignItems: "flex-end",
  },

  guideMessageRow: {
    alignItems: "flex-start",
  },

  // =====================================================
  // MESSAGE CONTENT
  // =====================================================

  messageContent: {
    maxWidth: "78%",
  },

  myMessageContent: {
    alignItems: "flex-end",
  },

  guideMessageContent: {
    alignItems: "flex-start",
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

  mySenderName: {
    color: "#4338CA",
    textAlign: "right",
  },

  guideSenderName: {
    color: "#6B7280",
    textAlign: "left",
  },

  // =====================================================
  // MESSAGE BUBBLE
  // =====================================================

  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },

  // =====================================================
  // STUDENT MESSAGE
  // =====================================================

  myBubble: {
    backgroundColor: "#4338CA",

    borderBottomRightRadius: 4,
  },

  // =====================================================
  // GUIDE MESSAGE
  // =====================================================

  guideBubble: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E5E7EB",

    borderBottomLeftRadius: 4,
  },

  // =====================================================
  // MESSAGE TEXT
  // =====================================================

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },

  myMessageText: {
    color: "#FFFFFF",
  },

  guideMessageText: {
    color: "#1F2937",
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

    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,

    fontSize: 13,

    color: "#6B7280",
  },

  // =====================================================
  // NO GUIDE
  // =====================================================

  emptyContainer: {
    flex: 1,

    backgroundColor: "#F5F7FB",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 68,
    height: 68,

    borderRadius: 20,

    backgroundColor: "#EEF0FF",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 19,

    fontWeight: "700",

    color: "#1F2937",
  },

  emptyText: {
    fontSize: 13,

    lineHeight: 19,

    color: "#6B7280",

    textAlign: "center",

    marginTop: 7,
  },

  // =====================================================
  // NO MESSAGES
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