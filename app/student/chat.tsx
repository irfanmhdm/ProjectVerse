import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";

import { router } from "expo-router";

import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../firebase/firebaseConfig";

// =====================================================
// MESSAGE TYPE
// =====================================================

type Message = {
  id: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  text: string;
  createdAt?: any;
};

// =====================================================
// STUDENT CHAT
// =====================================================

export default function StudentChat() {
  // =====================================================
  // SAFE AREA
  // =====================================================

  const insets = useSafeAreaInsets();

  // =====================================================
  // CURRENT STUDENT
  // =====================================================

  const student = auth.currentUser;

  // =====================================================
  // FLATLIST
  // =====================================================

  const flatListRef = useRef<FlatList<Message>>(null);

  // =====================================================
  // STATE
  // =====================================================

  const [messages, setMessages] = useState<Message[]>([]);

  const [messageText, setMessageText] = useState("");

  const [guideId, setGuideId] = useState("");

  const [guideName, setGuideName] = useState("Guide");

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  // =====================================================
  // MARK CHAT AS READ
  // =====================================================

  const markStudentMessagesAsRead = async (
    assignedGuideId: string
  ) => {
    if (!student?.uid || !assignedGuideId) {
      return;
    }

    try {
      const chatId =
        `${assignedGuideId}_${student.uid}`;

      const chatRef = doc(
        db,
        "chats",
        chatId
      );

      await setDoc(
        chatRef,
        {
          unreadStudentCount: 0,

          studentLastReadAt:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      console.log(
        "Student chat marked as read."
      );
    } catch (error: any) {
      console.log(
        "MARK CHAT READ ERROR:",
        error
      );
    }
  };

  // =====================================================
  // LOAD ASSIGNED GUIDE
  // =====================================================

  useEffect(() => {
    let isMounted = true;

    const loadGuide = async () => {
      // =================================================
      // CHECK LOGIN
      // =================================================

      if (!student?.uid) {
        if (isMounted) {
          setLoading(false);
        }

        Alert.alert(
          "Login Required",
          "Please login again."
        );

        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
        }

        console.log(
          "================================="
        );

        console.log(
          "Loading assigned guide..."
        );

        console.log(
          "Student UID:",
          student.uid
        );

        console.log(
          "================================="
        );

        // =================================================
        // FIND GUIDE ASSIGNMENT
        // =================================================

        const guideStudentsRef =
          collection(
            db,
            "guideStudents"
          );

        const guideQuery =
          query(
            guideStudentsRef,
            where(
              "studentId",
              "==",
              student.uid
            )
          );

        const snapshot =
          await getDocs(
            guideQuery
          );

        console.log(
          "Guide assignments found:",
          snapshot.docs.length
        );

        // =================================================
        // NO ASSIGNMENT
        // =================================================

        if (snapshot.empty) {
          console.log(
            "No guide assigned to student."
          );

          if (isMounted) {
            setGuideId("");
            setGuideName("Guide");
          }

          return;
        }

        // =================================================
        // GET ASSIGNMENT
        // =================================================

        const assignmentDoc =
          snapshot.docs[0];

        const assignmentData =
          assignmentDoc.data();

        console.log(
          "Assignment document:",
          assignmentDoc.id
        );

        console.log(
          "Assignment data:",
          assignmentData
        );

        // =================================================
        // GET GUIDE ID
        // =================================================

        const assignedGuideId =
          assignmentData.guideId || "";

        if (!assignedGuideId) {
          console.log(
            "ERROR: guideId missing."
          );

          if (isMounted) {
            setGuideId("");
            setGuideName("Guide");
          }

          return;
        }

        console.log(
          "Assigned Guide ID:",
          assignedGuideId
        );

        // =================================================
        // GET GUIDE NAME
        // =================================================

        let assignedGuideName =
          assignmentData.guideName ||
          assignmentData.guideEmail ||
          "";

        // =================================================
        // LOAD GUIDE PROFILE IF NAME NOT STORED
        // =================================================

        if (!assignedGuideName) {
          try {
            const guideRef =
              doc(
                db,
                "users",
                assignedGuideId
              );

            // IMPORTANT:
            // getDoc() is used for a document.
            // getDocs() is used for a query/collection.

            const guideSnapshot =
              await getDoc(
                guideRef
              );

            if (
              guideSnapshot.exists()
            ) {
              const guideData =
                guideSnapshot.data();

              console.log(
                "Guide profile:",
                guideData
              );

              assignedGuideName =
                guideData.name ||
                guideData.displayName ||
                guideData.email ||
                "Guide";
            } else {
              console.log(
                "Guide profile not found."
              );

              assignedGuideName =
                "Guide";
            }
          } catch (guideError) {
            console.log(
              "Unable to load guide profile:",
              guideError
            );

            assignedGuideName =
              assignmentData.guideEmail ||
              "Guide";
          }
        }

        // =================================================
        // SET GUIDE
        // =================================================

        if (isMounted) {
          setGuideId(
            assignedGuideId
          );

          setGuideName(
            assignedGuideName
          );
        }

        console.log(
          "Final Guide ID:",
          assignedGuideId
        );

        console.log(
          "Final Guide Name:",
          assignedGuideName
        );

      } catch (error: any) {
        console.log(
          "================================="
        );

        console.log(
          "ERROR LOADING GUIDE"
        );

        console.log(
          "Error:",
          error
        );

        console.log(
          "Error code:",
          error?.code
        );

        console.log(
          "Error message:",
          error?.message
        );

        console.log(
          "================================="
        );

        if (isMounted) {
          setGuideId("");
          setGuideName("Guide");
        }

        Alert.alert(
          "Guide Loading Error",
          "Unable to load your assigned guide."
        );

      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGuide();

    return () => {
      isMounted = false;
    };
  }, [student?.uid]);

  // =====================================================
  // MARK CHAT AS READ WHEN SCREEN OPENS
  // =====================================================

  useEffect(() => {
    if (!student?.uid || !guideId) {
      return;
    }

    markStudentMessagesAsRead(
      guideId
    );
  }, [
    student?.uid,
    guideId,
  ]);

  // =====================================================
  // LOAD CHAT MESSAGES
  // =====================================================

  useEffect(() => {
    if (!student?.uid) {
      return;
    }

    if (!guideId) {
      return;
    }

    // =================================================
    // CHAT ID
    // =================================================

    const chatId =
      `${guideId}_${student.uid}`;

    console.log(
      "================================="
    );

    console.log(
      "Opening Student Chat"
    );

    console.log(
      "Chat ID:",
      chatId
    );

    console.log(
      "================================="
    );

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
    // MESSAGES COLLECTION
    // =================================================

    const messagesRef =
      collection(
        chatRef,
        "messages"
      );

    // =================================================
    // REAL-TIME LISTENER
    // =================================================

    const unsubscribe =
      onSnapshot(
        messagesRef,

        async (snapshot) => {
          console.log(
            "Messages found:",
            snapshot.docs.length
          );

          const loadedMessages:
            Message[] =
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

          // =================================================
          // SORT MESSAGES
          // =================================================

          loadedMessages.sort(
            (a, b) => {
              const timeA =
                a.createdAt?.toMillis
                  ? a.createdAt.toMillis()
                  : 0;

              const timeB =
                b.createdAt?.toMillis
                  ? b.createdAt.toMillis()
                  : 0;

              return (
                timeA - timeB
              );
            }
          );

          // =================================================
          // UPDATE MESSAGES
          // =================================================

          setMessages(
            loadedMessages
          );

          // =================================================
          // MARK INCOMING GUIDE MESSAGE AS READ
          //
          // Since the student is currently inside the
          // chat screen, incoming messages are considered
          // read immediately.
          // =================================================

          const hasGuideMessage =
            loadedMessages.some(
              (message) =>
                message.senderId !==
                student.uid
            );

          if (hasGuideMessage) {
            try {
              await setDoc(
                chatRef,
                {
                  unreadStudentCount: 0,

                  studentLastReadAt:
                    serverTimestamp(),
                },
                {
                  merge: true,
                }
              );
            } catch (readError) {
              console.log(
                "Unable to clear unread count:",
                readError
              );
            }
          }

          // =================================================
          // SCROLL TO BOTTOM
          // =================================================

          setTimeout(() => {
            if (
              loadedMessages.length > 0
            ) {
              flatListRef.current?.scrollToEnd(
                {
                  animated: false,
                }
              );
            }
          }, 150);
        },

        (error: any) => {
          console.log(
            "================================="
          );

          console.log(
            "MESSAGE LISTENER ERROR"
          );

          console.log(
            error
          );

          console.log(
            "Error code:",
            error?.code
          );

          console.log(
            "Error message:",
            error?.message
          );

          console.log(
            "================================="
          );

          Alert.alert(
            "Chat Error",
            "Unable to load chat messages."
          );
        }
      );

    // =================================================
    // CLEANUP
    // =================================================

    return unsubscribe;

  }, [
    student?.uid,
    guideId,
  ]);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async () => {
    // =================================================
    // LOGIN CHECK
    // =================================================

    if (!student?.uid) {
      Alert.alert(
        "Login Required",
        "Please login again."
      );

      return;
    }

    // =================================================
    // GUIDE CHECK
    // =================================================

    if (!guideId) {
      Alert.alert(
        "Guide Not Found",
        "You are not currently assigned to a guide."
      );

      return;
    }

    // =================================================
    // MESSAGE VALIDATION
    // =================================================

    const text =
      messageText.trim();

    if (!text) {
      return;
    }

    try {
      setSending(true);

      // =================================================
      // CHAT ID
      // =================================================

      const chatId =
        `${guideId}_${student.uid}`;

      console.log(
        "Sending message to:",
        chatId
      );

      // =================================================
      // CHAT REFERENCE
      // =================================================

      const chatRef =
        doc(
          db,
          "chats",
          chatId
        );

      // =================================================
      // STUDENT NAME
      // =================================================

      const studentName =
        student.displayName ||
        student.email ||
        "Student";

      // =================================================
      // MESSAGE TIMESTAMP
      // =================================================

      const messageTimestamp =
        Timestamp.now();

      // =================================================
      // UPDATE CHAT DOCUMENT
      // =================================================

      await setDoc(
        chatRef,

        {
          guideId:
            guideId,

          studentId:
            student.uid,

          guideName:
            guideName,

          studentName:
            studentName,

          lastMessage:
            text,

          lastMessageAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          // =============================================
          // NOTIFICATION FOR GUIDE
          // =============================================

          unreadGuideCount:
            increment(1),

          // Student is currently inside the chat
          unreadStudentCount:
            0,

          lastMessageSenderId:
            student.uid,

          lastMessageSenderRole:
            "student",
        },

        {
          merge: true,
        }
      );

      // =================================================
      // ADD MESSAGE
      // =================================================

      const messageRef =
        await addDoc(
          collection(
            chatRef,
            "messages"
          ),

          {
            senderId:
              student.uid,

            senderName:
              studentName,

            senderRole:
              "student",

            text:
              text,

            createdAt:
              messageTimestamp,
          }
        );

      console.log(
        "Message sent:",
        messageRef.id
      );

      // =================================================
      // CLEAR INPUT
      // =================================================

      setMessageText("");

    } catch (error: any) {
      console.log(
        "================================="
      );

      console.log(
        "SEND MESSAGE ERROR"
      );

      console.log(
        error
      );

      console.log(
        "Error code:",
        error?.code
      );

      console.log(
        "Error message:",
        error?.message
      );

      console.log(
        "================================="
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
          STATUS BAR
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
        {/* BACK BUTTON */}

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

        {/* GUIDE AVATAR */}

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
            {guideName
              .substring(0, 2)
              .toUpperCase()}
          </Text>
        </View>

        {/* GUIDE INFORMATION */}

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
            {guideName}
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Guide
          </Text>
        </View>
      </View>

      {/* =================================================
          MESSAGES
      ================================================= */}

      <FlatList
        ref={
          flatListRef
        }

        data={
          messages
        }

        renderItem={
          renderMessage
        }

        keyExtractor={
          (item) =>
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

        // =================================================
        // CHAT INTRO
        // =================================================

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
              Chat with {guideName}
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

        // =================================================
        // EMPTY CHAT
        // =================================================

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
              Send a message to {guideName}.
            </Text>
          </View>
        }

        // =================================================
        // AUTO SCROLL
        // =================================================

        onContentSizeChange={() => {
          if (
            messages.length > 0
          ) {
            flatListRef.current?.scrollToEnd(
              {
                animated: false,
              }
            );
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

    // ===================================================
    // MAIN CONTAINER
    // ===================================================

    container: {
      flex: 1,
      backgroundColor: "#F5F7FB",
    },

    // ===================================================
    // HEADER
    // ===================================================

    chatHeader: {
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },

    // ===================================================
    // BACK BUTTON
    // ===================================================

    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 2,
    },

    // ===================================================
    // GUIDE AVATAR
    // ===================================================

    headerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#EEF0FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 11,
    },

    headerAvatarText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#4338CA",
    },

    // ===================================================
    // GUIDE INFO
    // ===================================================

    headerInfo: {
      flex: 1,
    },

    headerName: {
      fontSize: 17,
      fontWeight: "700",
      color: "#1F2937",
    },

    headerSubtitle: {
      fontSize: 11,
      color: "#9CA3AF",
      marginTop: 2,
    },

    // ===================================================
    // INTRO
    // ===================================================

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

    // ===================================================
    // MESSAGE LIST
    // ===================================================

    messagesList: {
      paddingHorizontal: 15,
      paddingBottom: 18,
    },

    emptyMessagesList: {
      flexGrow: 1,
    },

    // ===================================================
    // MESSAGE ROW
    // ===================================================

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

    // ===================================================
    // MESSAGE BUBBLE
    // ===================================================

    messageBubble: {
      maxWidth: "78%",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
    },

    myBubble: {
      backgroundColor: "#4338CA",
      borderBottomRightRadius: 4,
    },

    guideBubble: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderBottomLeftRadius: 4,
    },

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

    // ===================================================
    // INPUT
    // ===================================================

    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingHorizontal: 12,
      paddingTop: 10,
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

    // ===================================================
    // SEND BUTTON
    // ===================================================

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

    // ===================================================
    // LOADING
    // ===================================================

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

    // ===================================================
    // NO GUIDE
    // ===================================================

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

    // ===================================================
    // NO MESSAGES
    // ===================================================

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