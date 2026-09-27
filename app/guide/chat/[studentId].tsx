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
  Timestamp,
} from "firebase/firestore";

import {
  useLocalSearchParams,
  router,
} from "expo-router";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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
  StatusBar,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  auth,
  db,
} from "../../../firebase/firebaseConfig";

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

  // =====================================================
  // PARAMS
  // =====================================================

  const params =
    useLocalSearchParams<{
      studentId: string | string[];
    }>();

  /*
   * Expo Router can sometimes return
   * a string OR an array.
   *
   * So we normalize it here.
   */

  const studentId = Array.isArray(params.studentId)
    ? params.studentId[0]
    : params.studentId;

  // =====================================================
  // SAFE AREA
  // =====================================================

  const insets =
    useSafeAreaInsets();

  // =====================================================
  // FLATLIST REF
  // =====================================================

  const flatListRef =
    useRef<FlatList<Message>>(null);

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

  const guide =
    auth.currentUser;

  // =====================================================
  // LOAD STUDENT NAME
  // =====================================================

  useEffect(() => {

    const loadStudent = async () => {

      if (!studentId) {

        console.log(
          "Student ID is missing"
        );

        setStudentName("Student");

        return;
      }

      try {

        console.log(
          "Loading student:",
          studentId
        );

        // =================================================
        // IMPORTANT:
        // Get student directly from USERS collection
        // =================================================

        const studentRef =
          doc(
            db,
            "users",
            studentId
          );

        const studentSnapshot =
          await getDoc(studentRef);

        // =================================================
        // CHECK STUDENT DOCUMENT
        // =================================================

        if (
          studentSnapshot.exists()
        ) {

          const studentData =
            studentSnapshot.data();

          console.log(
            "Student data:",
            studentData
          );

          /*
           * Try the common possible
           * name field names.
           *
           * Change this later if your
           * users collection uses one
           * specific field.
           */

          const name =
            studentData.name ||
            studentData.fullName ||
            studentData.displayName ||
            studentData.studentName ||
            studentData.username;

          if (name) {

            setStudentName(
              String(name)
            );

          } else {

            /*
             * If no name field exists,
             * use email as fallback.
             */

            setStudentName(
              studentData.email ||
              "Student"
            );
          }

        } else {

          console.log(
            "Student document does not exist:",
            studentId
          );

          setStudentName(
            "Student"
          );
        }

      } catch (error) {

        console.log(
          "Error loading student:",
          error
        );

        setStudentName(
          "Student"
        );
      }
    };

    loadStudent();

  }, [
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

      setLoading(false);

      return;
    }

    const currentChatId =
      `${guide.uid}_${studentId}`;

    console.log(
      "Listening to chat:",
      currentChatId
    );

    const chatRef =
      doc(
        db,
        "chats",
        currentChatId
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

    // =====================================================
    // FIRESTORE LISTENER
    // =====================================================

    const unsubscribe =
      onSnapshot(

        messagesQuery,

        (snapshot) => {

          console.log(
            "Messages received:",
            snapshot.size
          );

          const loadedMessages =
            snapshot.docs.map(
              (messageDoc) => {

                const data =
                  messageDoc.data();

                return {
                  id:
                    messageDoc.id,

                  senderId:
                    data.senderId ||
                    "",

                  senderName:
                    data.senderName ||
                    "",

                  senderRole:
                    data.senderRole ||
                    "",

                  text:
                    data.text ||
                    "",

                  createdAt:
                    data.createdAt,
                };
              }
            );

          setMessages(
            loadedMessages
          );

          setLoading(false);

          // =================================================
          // SCROLL TO BOTTOM
          // =================================================

          setTimeout(() => {

            flatListRef.current?.scrollToEnd({
              animated: true,
            });

          }, 150);
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

      // =================================================
      // CHECK GUIDE
      // =================================================

      if (!guide) {

        Alert.alert(
          "Login Required",
          "Please login again."
        );

        return;
      }

      // =================================================
      // CHECK STUDENT
      // =================================================

      if (!studentId) {

        Alert.alert(
          "Error",
          "Student information is missing."
        );

        return;
      }

      // =================================================
      // CLEAN MESSAGE
      // =================================================

      const text =
        messageText.trim();

      if (!text) {
        return;
      }

      setSending(true);

      // =================================================
      // CHAT ID
      // =================================================

      const currentChatId =
        `${guide.uid}_${studentId}`;

      const chatRef =
        doc(
          db,
          "chats",
          currentChatId
        );

      // =================================================
      // GUIDE NAME
      // =================================================

      const guideName =
        guide.displayName ||
        guide.email ||
        "Guide";

      // =================================================
      // MESSAGE TIMESTAMP
      // =================================================

      const messageTimestamp =
        Timestamp.now();

      // =================================================
      // MAKE SURE CHAT DOCUMENT EXISTS
      // =================================================

      await setDoc(
        chatRef,
        {
          guideId:
            guide.uid,

          studentId:
            studentId,

          /*
           * IMPORTANT:
           * Use the student name loaded
           * from users/{studentId}
           */

          studentName:
            studentName,

          guideName:
            guideName,

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
            guideName,

          senderRole:
            "guide",

          text:
            text,

          /*
           * Use Timestamp.now()
           * instead of serverTimestamp()
           *
           * This guarantees createdAt is immediately
           * available for orderBy().
           */

          createdAt:
            messageTimestamp,
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
              MESSAGE BUBBLE
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
  // LOADING SCREEN
  // =====================================================

  if (loading) {

    return (
      <View
        style={
          styles.loadingContainer
        }
      >

        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <ActivityIndicator
          size="large"
          color="#4338CA"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading conversation...
        </Text>

      </View>
    );
  }

  // =====================================================
  // MAIN SCREEN
  // =====================================================

  return (

    <KeyboardAvoidingView
      style={
        styles.container
      }

      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >

      {/* =================================================
          ANDROID STATUS BAR
      ================================================= */}

      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* =================================================
          CHAT HEADER
      ================================================= */}

      <View
        style={[
          styles.chatHeader,

          {
            paddingTop:
              insets.top,

            height:
              68 + insets.top,
          },
        ]}
      >

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <Pressable
          style={
            styles.backButton
          }

          onPress={() =>
            router.back()
          }
        >

          <Ionicons
            name="arrow-back"
            size={27}
            color="#1F2937"
          />

        </Pressable>

        {/* =================================================
            STUDENT AVATAR
        ================================================= */}

        <View
          style={
            styles.headerAvatar
          }
        >

          <Text
            style={
              styles.headerAvatarText
            }
          >

            {studentName
              .substring(0, 2)
              .toUpperCase()}

          </Text>

        </View>

        {/* =================================================
            STUDENT INFORMATION
        ================================================= */}

        <View
          style={
            styles.headerInfo
          }
        >

          <Text
            style={
              styles.headerName
            }

            numberOfLines={1}
          >

            {studentName}

          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Student
          </Text>

        </View>

      </View>

      {/* =================================================
          MESSAGES
      ================================================= */}

      <FlatList
        ref={flatListRef}

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

        keyboardShouldPersistTaps="handled"

        contentContainerStyle={[
          styles.messagesList,

          messages.length === 0 &&
            styles.emptyMessagesList,
        ]}

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

              Send a message to{" "}
              {studentName}.

            </Text>

          </View>
        }

        onContentSizeChange={() => {

          if (
            messages.length > 0
          ) {

            flatListRef.current?.scrollToEnd({
              animated: false,
            });

          }

        }}
      />

      {/* =================================================
          MESSAGE INPUT
      ================================================= */}

      <View
        style={[
          styles.inputContainer,

          {
            paddingBottom:
              Math.max(
                insets.bottom,
                10
              ),
          },
        ]}
      >

        <TextInput
          style={
            styles.input
          }

          placeholder="Type a message..."

          placeholderTextColor="#9CA3AF"

          value={
            messageText
          }

          onChangeText={
            setMessageText
          }

          multiline

          textAlignVertical="center"

          editable={
            !sending
          }
        />

        <Pressable
          style={[
            styles.sendButton,

            (
              !messageText.trim() ||
              sending
            ) &&
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

const styles =
  StyleSheet.create({

  // =====================================================
  // MAIN CONTAINER
  // =====================================================

  container: {
    flex: 1,

    backgroundColor:
      "#F5F7FB",
  },

  // =====================================================
  // HEADER
  // =====================================================

  chatHeader: {

    backgroundColor:
      "#FFFFFF",

    flexDirection:
      "row",

    alignItems:
      "center",

    paddingHorizontal:
      8,

    borderBottomWidth:
      1,

    borderBottomColor:
      "#E5E7EB",
  },

  backButton: {

    width: 44,

    height: 44,

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  headerAvatar: {

    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor:
      "#EEF0FF",

    alignItems:
      "center",

    justifyContent:
      "center",

    marginLeft: 2,

    marginRight: 10,
  },

  headerAvatarText: {

    fontSize: 13,

    fontWeight:
      "700",

    color:
      "#4338CA",
  },

  headerInfo: {

    flex: 1,
  },

  headerName: {

    fontSize: 16,

    fontWeight:
      "700",

    color:
      "#1F2937",
  },

  headerSubtitle: {

    fontSize: 11,

    color:
      "#9CA3AF",

    marginTop: 2,
  },

  // =====================================================
  // CHAT INTRO
  // =====================================================

  chatIntro: {

    alignItems:
      "center",

    paddingTop: 18,

    paddingBottom: 24,
  },

  chatIntroIcon: {

    width: 42,

    height: 42,

    borderRadius: 14,

    backgroundColor:
      "#EEF0FF",

    alignItems:
      "center",

    justifyContent:
      "center",

    marginBottom: 9,
  },

  chatIntroText: {

    fontSize: 16,

    fontWeight:
      "700",

    color:
      "#1F2937",

    textAlign:
      "center",
  },

  chatIntroSubText: {

    fontSize: 11,

    color:
      "#9CA3AF",

    marginTop: 4,

    textAlign:
      "center",

    paddingHorizontal: 30,
  },

  // =====================================================
  // MESSAGE LIST
  // =====================================================

  messagesList: {

    paddingHorizontal: 15,

    paddingBottom: 18,
  },

  emptyMessagesList: {

    flexGrow: 1,
  },

  // =====================================================
  // MESSAGE ROW
  // =====================================================

  messageRow: {

    width:
      "100%",

    marginBottom:
      14,
  },

  // =====================================================
  // STUDENT MESSAGE
  // =====================================================

  studentMessageRow: {

    alignItems:
      "flex-start",
  },

  studentMessageContent: {

    alignItems:
      "flex-start",

    maxWidth:
      "78%",
  },

  // =====================================================
  // GUIDE MESSAGE
  // =====================================================

  guideMessageRow: {

    alignItems:
      "flex-end",
  },

  guideMessageContent: {

    alignItems:
      "flex-end",

    maxWidth:
      "78%",
  },

  // =====================================================
  // MESSAGE CONTENT
  // =====================================================

  messageContent: {

    maxWidth:
      "78%",
  },

  // =====================================================
  // SENDER NAME
  // =====================================================

  senderName: {

    fontSize: 10,

    fontWeight:
      "700",

    marginBottom: 4,

    paddingHorizontal: 3,
  },

  studentSenderName: {

    color:
      "#6B7280",

    textAlign:
      "left",
  },

  guideSenderName: {

    color:
      "#4338CA",

    textAlign:
      "right",
  },

  // =====================================================
  // MESSAGE BUBBLE
  // =====================================================

  messageBubble: {

    paddingHorizontal: 14,

    paddingVertical: 10,

    borderRadius: 16,
  },

  studentBubble: {

    backgroundColor:
      "#FFFFFF",

    borderWidth: 1,

    borderColor:
      "#E5E7EB",

    borderBottomLeftRadius:
      4,
  },

  studentMessageText: {

    color:
      "#1F2937",
  },

  guideBubble: {

    backgroundColor:
      "#4338CA",

    borderBottomRightRadius:
      4,
  },

  guideMessageText: {

    color:
      "#FFFFFF",
  },

  messageText: {

    fontSize: 14,

    lineHeight: 20,
  },

  // =====================================================
  // INPUT
  // =====================================================

  inputContainer: {

    flexDirection:
      "row",

    alignItems:
      "flex-end",

    backgroundColor:
      "#FFFFFF",

    borderTopWidth:
      1,

    borderTopColor:
      "#E5E7EB",

    paddingHorizontal:
      12,

    paddingTop:
      10,
  },

  input: {

    flex: 1,

    minHeight: 44,

    maxHeight: 110,

    backgroundColor:
      "#F5F7FB",

    borderWidth: 1,

    borderColor:
      "#E0E4EC",

    borderRadius: 12,

    paddingHorizontal: 13,

    paddingVertical: 10,

    fontSize: 14,

    color:
      "#1F2937",
  },

  sendButton: {

    width: 44,

    height: 44,

    borderRadius: 12,

    backgroundColor:
      "#4338CA",

    alignItems:
      "center",

    justifyContent:
      "center",

    marginLeft: 8,
  },

  sendButtonDisabled: {

    opacity:
      0.45,
  },

  // =====================================================
  // LOADING
  // =====================================================

  loadingContainer: {

    flex: 1,

    backgroundColor:
      "#F5F7FB",

    alignItems:
      "center",

    justifyContent:
      "center",
  },

  loadingText: {

    marginTop: 12,

    fontSize: 13,

    color:
      "#6B7280",
  },

  // =====================================================
  // EMPTY
  // =====================================================

  noMessages: {

    alignItems:
      "center",

    paddingTop: 5,
  },

  noMessagesTitle: {

    fontSize: 14,

    fontWeight:
      "700",

    color:
      "#374151",
  },

  noMessagesText: {

    marginTop: 4,

    fontSize: 12,

    color:
      "#9CA3AF",
  },

});