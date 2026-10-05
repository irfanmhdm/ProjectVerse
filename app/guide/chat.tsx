import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { auth, db } from "../../firebase/firebaseConfig";

// =====================================================
// CHAT ITEM TYPE
// =====================================================

type ChatItem = {
  studentId: string;
  studentName: string;
  studentEmail?: string;

  lastMessage: string;
  lastMessageAt?: any;

  hasChat: boolean;

  guideUnread: boolean;
};

// =====================================================
// GUIDE CHAT LIST
// =====================================================

export default function Chat() {
  const [students, setStudents] = useState<ChatItem[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  // =====================================================
  // CURRENT GUIDE
  // =====================================================

  const guide = auth.currentUser;

  // =====================================================
  // LOAD ASSIGNED STUDENTS IN REAL TIME
  // =====================================================

  useEffect(() => {
    if (!guide?.uid) {
      setStudents([]);
      setLoading(false);
      return;
    }

    console.log("====================================");

    console.log("STARTING GUIDE CHAT LISTENER");

    console.log("Guide UID:", guide.uid);

    console.log("====================================");

    setLoading(true);

    // =================================================
    // GUIDE STUDENTS QUERY
    //
    // IMPORTANT:
    // onSnapshot instead of getDocs.
    //
    // This means when a new student is assigned,
    // the chat list updates immediately.
    // =================================================

    const guideStudentsQuery = query(
      collection(db, "guideStudents"),
      where("guideId", "==", guide.uid),
    );

    // =================================================
    // CHAT LISTENERS
    // =================================================

    const chatUnsubscribers = new Map<string, () => void>();

    // =================================================
    // REAL-TIME ASSIGNMENT LISTENER
    // =================================================

    const unsubscribeAssignments = onSnapshot(
      guideStudentsQuery,

      (snapshot) => {
        console.log("====================================");

        console.log("GUIDE ASSIGNMENTS UPDATED");

        console.log("Assigned students:", snapshot.size);

        console.log("====================================");

        // =================================================
        // CREATE STUDENT LIST
        // =================================================

        const newStudents: ChatItem[] = snapshot.docs
          .map((studentDoc): ChatItem | null => {
            const data = studentDoc.data();

            const studentId = data.studentId || "";

            if (!studentId) {
              return null;
            }

            return {
              studentId,

              studentName: data.studentName || data.studentEmail || "Student",

              studentEmail: data.studentEmail || "",

              lastMessage: "",

              lastMessageAt: null,

              hasChat: false,

              guideUnread: false,
            };
          })
          .filter((student): student is ChatItem => student !== null);

        // =================================================
        // REMOVE DUPLICATES
        // =================================================

        const uniqueStudents = newStudents.filter(
          (student, index, self) =>
            index ===
            self.findIndex((item) => item.studentId === student.studentId),
        );

        console.log(
          "Students in chat list:",
          uniqueStudents.map(
            (student) => `${student.studentName} (${student.studentId})`,
          ),
        );

        // =================================================
        // UPDATE STUDENT LIST
        // =================================================

        setStudents((currentStudents) => {
          return uniqueStudents.map((newStudent) => {
            const existing = currentStudents.find(
              (current) => current.studentId === newStudent.studentId,
            );

            if (existing) {
              return {
                ...newStudent,

                lastMessage: existing.lastMessage,

                lastMessageAt: existing.lastMessageAt,

                hasChat: existing.hasChat,

                guideUnread: existing.guideUnread,
              };
            }

            return newStudent;
          });
        });

        setLoading(false);

        // =================================================
        // DETECT REMOVED STUDENTS
        // =================================================

        const currentStudentIds = new Set(
          uniqueStudents.map((student) => student.studentId),
        );

        chatUnsubscribers.forEach((unsubscribe, studentId) => {
          if (!currentStudentIds.has(studentId)) {
            console.log("Removing chat listener:", studentId);

            unsubscribe();

            chatUnsubscribers.delete(studentId);
          }
        });

        // =================================================
        // CREATE CHAT LISTENER FOR EACH STUDENT
        // =================================================

        uniqueStudents.forEach((student) => {
          if (chatUnsubscribers.has(student.studentId)) {
            return;
          }

          const chatId = `${guide.uid}_${student.studentId}`;

          console.log("Starting chat listener:", chatId);

          const chatRef = doc(db, "chats", chatId);

          const unsubscribeChat = onSnapshot(
            chatRef,

            (chatSnapshot) => {
              // =================================================
              // CHAT DOES NOT EXIST YET
              //
              // This is normal for a newly assigned student.
              // =================================================

              if (!chatSnapshot.exists()) {
                console.log("No chat yet for:", student.studentId);

                setStudents((currentStudents) =>
                  currentStudents.map((currentStudent) => {
                    if (currentStudent.studentId !== student.studentId) {
                      return currentStudent;
                    }

                    return {
                      ...currentStudent,

                      lastMessage: "",

                      lastMessageAt: null,

                      hasChat: false,

                      guideUnread: false,
                    };
                  }),
                );

                return;
              }

              // =================================================
              // CHAT EXISTS
              // =================================================

              const chatData = chatSnapshot.data();

              console.log("Chat updated:", chatId);

              setStudents((currentStudents) => {
                const updated = currentStudents.map((currentStudent) => {
                  if (currentStudent.studentId !== student.studentId) {
                    return currentStudent;
                  }

                  return {
                    ...currentStudent,

                    lastMessage: chatData.lastMessage || "",

                    lastMessageAt: chatData.lastMessageAt || null,

                    hasChat: true,

                    guideUnread: chatData.guideUnread === true,
                  };
                });

                // =================================================
                // SORT BY LATEST MESSAGE
                // =================================================

                return updated.sort((a, b) => {
                  const aTime = a.lastMessageAt?.toMillis?.() || 0;

                  const bTime = b.lastMessageAt?.toMillis?.() || 0;

                  return bTime - aTime;
                });
              });
            },

            (error) => {
              // =================================================
              // IMPORTANT
              //
              // A chat document may not exist yet.
              // Don't break the entire chat list because of it.
              // =================================================

              console.log(
                "Chat listener error:",
                student.studentId,
                error?.code || error,
              );
            },
          );

          chatUnsubscribers.set(student.studentId, unsubscribeChat);
        });
      },

      (error) => {
        console.log("Guide assignment listener error:", error);

        setLoading(false);
      },
    );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      console.log("Cleaning guide chat listeners...");

      unsubscribeAssignments();

      chatUnsubscribers.forEach((unsubscribe) => unsubscribe());

      chatUnsubscribers.clear();
    };
  }, [guide?.uid]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredStudents = students.filter((student) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return true;
    }

    return (
      student.studentName.toLowerCase().includes(searchText) ||
      student.studentEmail?.toLowerCase().includes(searchText) ||
      student.lastMessage.toLowerCase().includes(searchText)
    );
  });

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (timestamp: any) => {
    if (!timestamp) {
      return "";
    }

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

      const now = new Date();

      const sameDay = date.toDateString() === now.toDateString();

      if (sameDay) {
        return date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });
      }

      const yesterday = new Date();

      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }

      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // =====================================================
  // INITIALS
  // =====================================================

  const getInitials = (name: string) => {
    const words = name.trim().split(" ");

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // =====================================================
  // OPEN CHAT
  // =====================================================

  const openChat = (studentId: string) => {
    console.log("Opening chat:", studentId);

    router.push({
      pathname: "/guide/chat/[studentId]",

      params: {
        studentId,
      },
    });
  };

  // =====================================================
  // CHAT ITEM
  // =====================================================

  const renderStudent = ({ item }: { item: ChatItem }) => {
    return (
      <Pressable
        style={[styles.chatItem, item.guideUnread && styles.unreadChatItem]}
        onPress={() => openChat(item.studentId)}
      >
        {/* =================================================
            PROFILE
        ================================================= */}

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.studentName)}</Text>

          {/* UNREAD DOT */}

          {item.guideUnread && <View style={styles.unreadDot} />}
        </View>

        {/* =================================================
            CHAT INFORMATION
        ================================================= */}

        <View style={styles.chatInformation}>
          <View style={styles.topRow}>
            <Text
              style={[
                styles.studentName,

                item.guideUnread && styles.unreadStudentName,
              ]}
              numberOfLines={1}
            >
              {item.studentName}
            </Text>

            <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,

                !item.lastMessage && styles.noMessageText,

                item.guideUnread && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || "Start a conversation"}
            </Text>

            {item.guideUnread && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4338CA" />

        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <View style={styles.container}>
      {/* =================================================
          SEARCH
      ================================================= */}

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" />

        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={19} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      {/* =================================================
          CHAT LIST
      ================================================= */}

      {filteredStudents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={32} color="#4338CA" />
          </View>

          <Text style={styles.emptyTitle}>
            {search ? "No Students Found" : "No Students Assigned"}
          </Text>

          <Text style={styles.emptyText}>
            {search
              ? "Try searching with a different name."
              : "Students assigned to you will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudent}
          keyExtractor={(item) => item.studentId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
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

  // ===================================================
  // SEARCH
  // ===================================================

  searchContainer: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDE2EA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    marginLeft: 9,
    paddingVertical: 0,
  },

  // ===================================================
  // LIST
  // ===================================================

  list: {
    paddingBottom: 25,
  },

  // ===================================================
  // CHAT ITEM
  // ===================================================

  chatItem: {
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F3",
  },

  unreadChatItem: {
    backgroundColor: "#F8FAFF",
  },

  // ===================================================
  // AVATAR
  // ===================================================

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    position: "relative",
  },

  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4338CA",
  },

  unreadDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4338CA",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    top: -1,
    right: -1,
  },

  // ===================================================
  // CHAT INFORMATION
  // ===================================================

  chatInformation: {
    flex: 1,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  studentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginRight: 8,
  },

  unreadStudentName: {
    color: "#4338CA",
  },

  time: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    marginRight: 8,
  },

  unreadMessage: {
    color: "#374151",
    fontWeight: "600",
  },

  noMessageText: {
    color: "#9CA3AF",
    fontStyle: "italic",
  },

  // ===================================================
  // NEW BADGE
  // ===================================================

  newBadge: {
    backgroundColor: "#D5F5F2",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  newBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4338CA",
    letterSpacing: 0.4,
  },

  // ===================================================
  // LOADING
  // ===================================================

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

  // ===================================================
  // EMPTY
  // ===================================================

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    textAlign: "center",
  },
});
