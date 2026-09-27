import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

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
  // LOAD GUIDE STUDENTS + CHATS
  // =====================================================

  useEffect(() => {
    if (!guide) {
      setLoading(false);
      return;
    }

    let unsubscribeChatListeners: (() => void)[] = [];

    const loadStudents = async () => {
      try {
        setLoading(true);

        // =================================================
        // GET STUDENTS ASSIGNED TO THIS GUIDE
        // =================================================

        const guideStudentsQuery = query(
          collection(db, "guideStudents"),
          where("guideId", "==", guide.uid)
        );

        const snapshot = await getDocs(
          guideStudentsQuery
        );

        // =================================================
        // NO STUDENTS
        // =================================================

        if (snapshot.empty) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // =================================================
        // CREATE INITIAL STUDENT LIST
        // =================================================

        const initialStudents: ChatItem[] =
          snapshot.docs.map((studentDoc) => {
            const data = studentDoc.data();

            return {
              studentId:
                data.studentId || "",

              studentName:
                data.studentName ||
                data.studentEmail ||
                "Student",

              studentEmail:
                data.studentEmail || "",

              lastMessage: "",

              lastMessageAt: null,

              hasChat: false,
            };
          });

        // =================================================
        // REMOVE DUPLICATE STUDENTS
        // =================================================

        const uniqueStudents =
          initialStudents.filter(
            (student, index, self) =>
              index ===
              self.findIndex(
                (item) =>
                  item.studentId ===
                  student.studentId
              )
          );

        setStudents(uniqueStudents);

        setLoading(false);

        // =================================================
        // REAL-TIME CHAT LISTENERS
        // =================================================

        unsubscribeChatListeners.forEach(
          (unsubscribe) => unsubscribe()
        );

        unsubscribeChatListeners = [];

        uniqueStudents.forEach((student) => {
          if (!student.studentId) {
            return;
          }

          const chatId =
            `${guide.uid}_${student.studentId}`;

          const chatRef = doc(
            db,
            "chats",
            chatId
          );

          // ===============================================
          // LISTEN TO EACH CHAT DOCUMENT
          // ===============================================

          const unsubscribe =
            onSnapshot(
              chatRef,
              (chatSnapshot) => {
                if (!chatSnapshot.exists()) {
                  return;
                }

                const chatData =
                  chatSnapshot.data();

                setStudents((currentStudents) => {
                  const updated =
                    currentStudents.map(
                      (currentStudent) => {
                        if (
                          currentStudent.studentId !==
                          student.studentId
                        ) {
                          return currentStudent;
                        }

                        return {
                          ...currentStudent,

                          lastMessage:
                            chatData.lastMessage ||
                            "",

                          lastMessageAt:
                            chatData.lastMessageAt ||
                            null,

                          hasChat: true,
                        };
                      }
                    );

                  // =========================================
                  // SORT BY LATEST MESSAGE
                  // =========================================

                  return updated.sort(
                    (a, b) => {
                      const aTime =
                        a.lastMessageAt?.toMillis?.() ||
                        0;

                      const bTime =
                        b.lastMessageAt?.toMillis?.() ||
                        0;

                      return bTime - aTime;
                    }
                  );
                });
              },
              (error) => {
                console.log(
                  "Chat listener error:",
                  error
                );
              }
            );

          unsubscribeChatListeners.push(
            unsubscribe
          );
        });

      } catch (error) {
        console.log(
          "Error loading guide students:",
          error
        );

        setLoading(false);
      }
    };

    loadStudents();

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      unsubscribeChatListeners.forEach(
        (unsubscribe) => unsubscribe()
      );
    };
  }, [guide?.uid]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredStudents =
    students.filter((student) => {
      const searchText =
        search.trim().toLowerCase();

      if (!searchText) {
        return true;
      }

      return (
        student.studentName
          .toLowerCase()
          .includes(searchText) ||
        student.studentEmail
          ?.toLowerCase()
          .includes(searchText) ||
        student.lastMessage
          .toLowerCase()
          .includes(searchText)
      );
    });

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (
    timestamp: any
  ) => {
    if (!timestamp) {
      return "";
    }

    try {
      const date =
        timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);

      const now = new Date();

      const sameDay =
        date.toDateString() ===
        now.toDateString();

      if (sameDay) {
        return date.toLocaleTimeString(
          [],
          {
            hour: "numeric",
            minute: "2-digit",
          }
        );
      }

      const yesterday =
        new Date();

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      if (
        date.toDateString() ===
        yesterday.toDateString()
      ) {
        return "Yesterday";
      }

      return date.toLocaleDateString(
        [],
        {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }
      );
    } catch {
      return "";
    }
  };

  // =====================================================
  // INITIALS
  // =====================================================

  const getInitials = (
    name: string
  ) => {
    const words =
      name.trim().split(" ");

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  };

  // =====================================================
  // OPEN CHAT
  // =====================================================

  const openChat = (
    studentId: string
  ) => {
    router.push({
      pathname:
        "/guide/chat/[studentId]",
      params: {
        studentId,
      },
    });
  };

  // =====================================================
  // CHAT ITEM
  // =====================================================

  const renderStudent = ({
    item,
  }: {
    item: ChatItem;
  }) => {
    return (
      <Pressable
        style={styles.chatItem}
        onPress={() =>
          openChat(item.studentId)
        }
      >
        {/* =================================================
            PROFILE
        ================================================= */}

        <View
          style={styles.avatar}
        >
          <Text
            style={styles.avatarText}
          >
            {getInitials(
              item.studentName
            )}
          </Text>
        </View>

        {/* =================================================
            CHAT INFORMATION
        ================================================= */}

        <View
          style={styles.chatInformation}
        >
          <View
            style={styles.topRow}
          >
            <Text
              style={styles.studentName}
              numberOfLines={1}
            >
              {item.studentName}
            </Text>

            <Text
              style={styles.time}
            >
              {formatTime(
                item.lastMessageAt
              )}
            </Text>
          </View>

          <Text
            style={[
              styles.lastMessage,

              !item.lastMessage &&
                styles.noMessageText,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage ||
              "Start a conversation"}
          </Text>
        </View>
      </Pressable>
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
          Loading chats...
        </Text>
      </View>
    );
  }

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <View
      style={styles.container}
    >
      {/* =================================================
          SEARCH
      ================================================= */}

      <View
        style={styles.searchContainer}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color="#6B7280"
        />

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
          <Pressable
            onPress={() =>
              setSearch("")
            }
          >
            <Ionicons
              name="close-circle"
              size={19}
              color="#9CA3AF"
            />
          </Pressable>
        )}
      </View>

      {/* =================================================
          CHAT LIST
      ================================================= */}

      {filteredStudents.length === 0 ? (
        <View
          style={styles.emptyContainer}
        >
          <View
            style={styles.emptyIcon}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={32}
              color="#4338CA"
            />
          </View>

          <Text
            style={styles.emptyTitle}
          >
            {search
              ? "No Students Found"
              : "No Students Assigned"}
          </Text>

          <Text
            style={styles.emptyText}
          >
            {search
              ? "Try searching with a different name."
              : "Students assigned to you will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudent}
          keyExtractor={(item) =>
            item.studentId
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.list
          }
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

  // =====================================================
  // SEARCH
  // =====================================================

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

  // =====================================================
  // LIST
  // =====================================================

  list: {
    paddingBottom: 25,
  },

  // =====================================================
  // CHAT ITEM
  // =====================================================

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

  avatar: {
    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor: "#EEF0FF",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 13,
  },

  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4338CA",
  },

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

  time: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  lastMessage: {
    fontSize: 13,
    color: "#6B7280",
  },

  noMessageText: {
    color: "#9CA3AF",
    fontStyle: "italic",
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