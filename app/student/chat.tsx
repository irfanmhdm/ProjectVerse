import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

import { useEffect, useRef, useState } from "react";

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

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import {
  auth,
  db,
} from "../../firebase/firebaseConfig";

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
  // FLATLIST REF
  // =====================================================

  const flatListRef =
    useRef<FlatList<Message>>(null);

  // =====================================================
  // STATE
  // =====================================================

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [messageText, setMessageText] =
    useState("");

  const [guideId, setGuideId] =
    useState("");

  const [guideName, setGuideName] =
    useState("Guide");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  // =====================================================
  // LOAD ASSIGNED GUIDE
  // =====================================================

  useEffect(() => {

    const loadGuide = async () => {

      if (!student) {

        setLoading(false);

        Alert.alert(
          "Login Required",
          "Please login again."
        );

        return;
      }

      try {

        setLoading(true);

        // =================================================
        // GET GUIDE-STUDENT RELATIONSHIPS
        // =================================================

        const guideStudentsRef =
          collection(
            db,
            "guideStudents"
          );

        const snapshot =
          await getDocs(
            guideStudentsRef
          );

        let foundGuideId = "";

        let foundGuideName = "Guide";

        // =================================================
        // FIND CURRENT STUDENT
        // =================================================

        for (const studentDoc of snapshot.docs) {

          const data =
            studentDoc.data();

          if (
            data.studentId ===
            student.uid
          ) {

            foundGuideId =
              data.guideId || "";

            foundGuideName =
              data.guideName ||
              data.guideEmail ||
              "Guide";

            break;
          }
        }

        // =================================================
        // GUIDE NOT FOUND
        // =================================================

        if (!foundGuideId) {

          setGuideId("");

          setGuideName("Guide");

          return;
        }

        // =================================================
        // SAVE GUIDE INFORMATION
        // =================================================

        setGuideId(
          foundGuideId
        );

        setGuideName(
          foundGuideName
        );

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

    if (
      !student ||
      !guideId
    ) {
      return;
    }

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

        (snapshot) => {

          const loadedMessages =
            snapshot.docs.map(
              (messageDoc) => {

                const data =
                  messageDoc.data();

                return {
                  id:
                    messageDoc.id,

                  senderId:
                    data.senderId || "",

                  senderName:
                    data.senderName || "",

                  senderRole:
                    data.senderRole || "",

                  text:
                    data.text || "",

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

              return timeA - timeB;
            }
          );

          // =================================================
          // UPDATE STATE
          // =================================================

          setMessages(
            loadedMessages
          );

          // =================================================
          // SCROLL TO LATEST MESSAGE
          // =================================================

          setTimeout(() => {

            if (
              loadedMessages.length > 0
            ) {

              flatListRef.current?.scrollToEnd({
                animated: true,
              });

            }

          }, 100);

        },

        (error) => {

          console.log(
            "Chat listener error:",
            error
          );

          Alert.alert(
            "Chat Error",
            "Unable to load messages."
          );

        }
      );

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
    // CHECK LOGIN
    // =================================================

    if (!student) {

      Alert.alert(
        "Login Required",
        "Please login again."
      );

      return;
    }

    // =================================================
    // CHECK GUIDE
    // =================================================

    if (!guideId) {

      Alert.alert(
        "Guide Not Found",
        "You are not currently assigned to a guide."
      );

      return;
    }

    // =================================================
    // GET TEXT
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
      // MESSAGE TIME
      //
      // Timestamp.now() is intentionally used here.
      // This prevents createdAt from temporarily being
      // null while Firestore processes serverTimestamp().
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
            studentName,

          senderRole:
            "student",

          text:
            text,

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
  // MESSAGE ITEM
  // =====================================================

  const renderMessage = ({
    item,
  }: {
    item: Message;
  }) => {

    // =================================================
    // CURRENT STUDENT MESSAGE
    // =================================================

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
  // SCREEN
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
        // KEEP SCROLL AT BOTTOM
        // =================================================

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
      16,

    borderBottomWidth:
      1,

    borderBottomColor:
      "#E5E7EB",
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

    marginRight: 11,
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

    fontSize: 17,

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

    paddingBottom: 25,
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

  myMessageRow: {

    alignItems:
      "flex-end",
  },

  // =====================================================
  // GUIDE MESSAGE
  // =====================================================

  guideMessageRow: {

    alignItems:
      "flex-start",
  },

  // =====================================================
  // MESSAGE BUBBLE
  // =====================================================

  messageBubble: {

    maxWidth:
      "78%",

    paddingHorizontal:
      14,

    paddingVertical:
      10,

    borderRadius:
      16,
  },

  // =====================================================
  // STUDENT BUBBLE
  // =====================================================

  myBubble: {

    backgroundColor:
      "#4338CA",

    borderBottomRightRadius:
      4,
  },

  // =====================================================
  // GUIDE BUBBLE
  // =====================================================

  guideBubble: {

    backgroundColor:
      "#FFFFFF",

    borderWidth:
      1,

    borderColor:
      "#E5E7EB",

    borderBottomLeftRadius:
      4,
  },

  // =====================================================
  // MESSAGE TEXT
  // =====================================================

  messageText: {

    fontSize:
      14,

    lineHeight:
      20,
  },

  myMessageText: {

    color:
      "#FFFFFF",
  },

  guideMessageText: {

    color:
      "#1F2937",
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

    minHeight:
      44,

    maxHeight:
      110,

    backgroundColor:
      "#F5F7FB",

    borderWidth:
      1,

    borderColor:
      "#E0E4EC",

    borderRadius:
      12,

    paddingHorizontal:
      13,

    paddingVertical:
      10,

    fontSize:
      14,

    color:
      "#1F2937",
  },

  sendButton: {

    width:
      44,

    height:
      44,

    borderRadius:
      12,

    backgroundColor:
      "#4338CA",

    alignItems:
      "center",

    justifyContent:
      "center",

    marginLeft:
      8,
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

    justifyContent:
      "center",

    alignItems:
      "center",
  },

  loadingText: {

    marginTop:
      12,

    fontSize:
      13,

    color:
      "#6B7280",
  },

  // =====================================================
  // NO GUIDE
  // =====================================================

  emptyContainer: {

    flex: 1,

    backgroundColor:
      "#F5F7FB",

    justifyContent:
      "center",

    alignItems:
      "center",

    paddingHorizontal:
      30,
  },

  emptyIcon: {

    width:
      68,

    height:
      68,

    borderRadius:
      20,

    backgroundColor:
      "#EEF0FF",

    alignItems:
      "center",

    justifyContent:
      "center",

    marginBottom:
      16,
  },

  emptyTitle: {

    fontSize:
      19,

    fontWeight:
      "700",

    color:
      "#1F2937",
  },

  emptyText: {

    fontSize:
      13,

    lineHeight:
      19,

    color:
      "#6B7280",

    textAlign:
      "center",

    marginTop:
      7,
  },

  // =====================================================
  // NO MESSAGES
  // =====================================================

  noMessages: {

    alignItems:
      "center",

    paddingTop:
      5,
  },

  noMessagesTitle: {

    fontSize:
      14,

    fontWeight:
      "700",

    color:
      "#374151",
  },

  noMessagesText: {

    marginTop:
      4,

    fontSize:
      12,

    color:
      "#9CA3AF",
  },

});