import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../firebase/firebaseConfig";

// =====================================================
// STUDENT TYPE
// =====================================================

type Student = {
  id: string;
  name: string;
  email: string;
  class: string;
  registerNumber: string;
};

// =====================================================
// ADD STUDENT
// =====================================================

export default function AddStudent() {
  const [registerNumber, setRegisterNumber] = useState("");
  const [student, setStudent] = useState<Student | null>(null);

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // =====================================================
  // SEARCH STUDENT
  // =====================================================

  const searchStudent = async () => {
    const cleanRegisterNumber = registerNumber.trim().toUpperCase();

    if (cleanRegisterNumber === "") {
      Alert.alert(
        "Register Number Required",
        "Please enter the student's register number.",
      );
      return;
    }

    // ===================================================
    // REGISTER NUMBER FORMAT
    // ===================================================

    const registerNumberRegex = /^FIT25MCA-\d{4}$/;

    if (!registerNumberRegex.test(cleanRegisterNumber)) {
      Alert.alert(
        "Invalid Register Number",
        "Please enter a valid register number in the format FIT25MCA-0000.",
      );
      return;
    }

    setLoading(true);
    setStudent(null);

    try {
      // =================================================
      // SEARCH ONLY APPROVED STUDENTS
      // =================================================

      const studentQuery = query(
        collection(db, "users"),
        where("registerNumber", "==", cleanRegisterNumber),
        where("role", "==", "student"),
        where("status", "==", "approved"),
      );

      const snapshot = await getDocs(studentQuery);

      // =================================================
      // STUDENT NOT FOUND
      // =================================================

      if (snapshot.empty) {
        Alert.alert(
          "Student Not Found",
          "No approved student was found with this register number.",
        );

        setLoading(false);
        return;
      }

      // =================================================
      // STUDENT FOUND
      // =================================================

      const studentDoc = snapshot.docs[0];

      const studentData = studentDoc.data();

      setStudent({
        id: studentDoc.id,

        name: studentData.name || "Unknown Student",

        email: studentData.email || "Not provided",

        class: studentData.class || "Not provided",

        registerNumber:
          studentData.registerNumber || cleanRegisterNumber,
      });
    } catch (error) {
      console.log("Error searching student:", error);

      Alert.alert(
        "Search Failed",
        "Something went wrong while searching for the student.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE OLD CHAT
  // =====================================================
  //
  // This is the important part.
  //
  // If the student was previously assigned and later
  // removed, the old chat may still exist.
  //
  // When the student is added again, we delete:
  //
  // chats/{guideId}_{studentId}/messages/*
  //
  // and then:
  //
  // chats/{guideId}_{studentId}
  //
  // This gives the student a completely fresh chat.
  //
  // =====================================================

  const deleteOldChat = async (
    guideId: string,
    studentId: string,
  ) => {
    try {
      const chatId = `${guideId}_${studentId}`;

      const chatRef = doc(
        db,
        "chats",
        chatId,
      );

      const messagesRef = collection(
        chatRef,
        "messages",
      );

      // =================================================
      // GET OLD MESSAGES
      // =================================================

      const messagesSnapshot = await getDocs(
        messagesRef,
      );

      // =================================================
      // NOTHING TO DELETE
      // =================================================

      if (messagesSnapshot.empty) {
        // The chat document itself may still exist.
        await deleteDoc(chatRef).catch(() => {
          // Ignore if the document does not exist.
        });

        return;
      }

      // =================================================
      // DELETE ALL OLD MESSAGES
      // =================================================

      const batch = writeBatch(db);

      messagesSnapshot.docs.forEach(
        (messageDoc) => {
          batch.delete(messageDoc.ref);
        },
      );

      // =================================================
      // DELETE CHAT DOCUMENT
      // =================================================

      batch.delete(chatRef);

      // =================================================
      // COMMIT
      // =================================================

      await batch.commit();

      console.log(
        "Old chat deleted successfully:",
        chatId,
      );
    } catch (error) {
      console.log(
        "Error deleting old chat:",
        error,
      );

      throw error;
    }
  };

  // =====================================================
  // ADD STUDENT
  // =====================================================

  const addStudent = async () => {
    const guide = auth.currentUser;

    // =================================================
    // CHECK GUIDE
    // =================================================

    if (!guide) {
      Alert.alert(
        "Authentication Error",
        "Guide is not logged in.",
      );

      return;
    }

    // =================================================
    // CHECK STUDENT
    // =================================================

    if (!student) {
      return;
    }

    setAdding(true);

    try {
      // =================================================
      // CHECK WHETHER STUDENT IS ALREADY ASSIGNED
      // =================================================
      //
      // We search using studentId only.
      //
      // This allows us to detect if the student is already
      // assigned to another guide as well.
      //
      // =================================================

      const existingAssignmentQuery = query(
        collection(db, "guideStudents"),
        where(
          "studentId",
          "==",
          student.id,
        ),
      );

      const existingAssignmentSnapshot =
        await getDocs(
          existingAssignmentQuery,
        );

      // =================================================
      // CHECK EXISTING ASSIGNMENT
      // =================================================

      if (
        !existingAssignmentSnapshot.empty
      ) {
        const existingAssignment =
          existingAssignmentSnapshot.docs[0].data();

        // =================================================
        // SAME GUIDE
        // =================================================

        if (
          existingAssignment.guideId ===
          guide.uid
        ) {
          Alert.alert(
            "Already Added",
            `${student.name} is already assigned to you.`,
          );

          setAdding(false);

          return;
        }

        // =================================================
        // DIFFERENT GUIDE
        // =================================================

        Alert.alert(
          "Student Already Assigned",
          `${student.name} is already assigned to another guide.`,
        );

        setAdding(false);

        return;
      }

      // =================================================
      // STUDENT IS NOT CURRENTLY ASSIGNED
      // =================================================
      //
      // At this point the student has either:
      //
      // 1. Never been assigned before
      //
      // OR
      //
      // 2. Was assigned previously and removed.
      //
      // In case #2, the old chat may still exist.
      //
      // =================================================

      const assignmentId =
        `${guide.uid}_${student.id}`;

      // =================================================
      // REMOVE OLD CHAT
      // =================================================
      //
      // This ensures that if the student was removed and
      // later added again, the previous conversation does
      // NOT come back.
      //
      // =================================================

      await deleteOldChat(
        guide.uid,
        student.id,
      );

      // =================================================
      // CREATE NEW ASSIGNMENT
      // =================================================

      await setDoc(
        doc(
          db,
          "guideStudents",
          assignmentId,
        ),
        {
          guideId: guide.uid,

          studentId: student.id,

          studentName: student.name,

          studentEmail: student.email,

          studentClass:
            student.class ||
            "Not provided",

          studentRegisterNumber:
            student.registerNumber,

          createdAt:
            serverTimestamp(),
        },
      );

      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        "Student Added",
        `${student.name} has been added to your students.`,
        [
          {
            text: "OK",

            onPress: () => {
              setRegisterNumber("");

              setStudent(null);
            },
          },
        ],
      );
    } catch (error: any) {
      console.log(
        "Error adding student:",
        error,
      );

      console.log(
        "Error code:",
        error.code,
      );

      console.log(
        "Error message:",
        error.message,
      );

      Alert.alert(
        "Add Student Failed",
        error.message ||
          "Something went wrong while adding the student.",
      );
    } finally {
      setAdding(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* =================================================
          SEARCH CARD
      ================================================= */}

      <View style={styles.searchCard}>
        <View style={styles.iconContainer}>
          <Ionicons
            name="person-add-outline"
            size={27}
            color="#4338CA"
          />
        </View>

        <View style={styles.searchHeading}>
          <Text style={styles.cardTitle}>
            Add a Student
          </Text>

          <Text style={styles.cardSubtitle}>
            Search for an approved student
            using their register number.
          </Text>
        </View>

        {/* =================================================
            REGISTER NUMBER INPUT
        ================================================= */}

        <Text style={styles.inputLabel}>
          Student Register Number
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="card-outline"
            size={19}
            color="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            placeholder="FIT25MCA-2000"
            placeholderTextColor="#9CA3AF"
            value={registerNumber}
            onChangeText={(text) =>
              setRegisterNumber(
                text.toUpperCase(),
              )
            }
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {registerNumber.length > 0 && (
            <Pressable
              onPress={() => {
                setRegisterNumber("");
                setStudent(null);
              }}
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
            SEARCH BUTTON
        ================================================= */}

        <Pressable
          style={({ pressed }) => [
            styles.searchButton,
            pressed &&
              styles.pressed,
            loading &&
              styles.disabledButton,
          ]}
          onPress={searchStudent}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
              size="small"
            />
          ) : (
            <>
              <Ionicons
                name="search-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.buttonText
                }
              >
                Search Student
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* =================================================
          STUDENT FOUND
      ================================================= */}

      {student && (
        <View style={styles.studentCard}>
          {/* Student Header */}

          <View style={styles.studentHeader}>
            <View style={styles.avatar}>
              <Text
                style={
                  styles.avatarText
                }
              >
                {student.name
                  ?.charAt(0)
                  .toUpperCase() ||
                  "S"}
              </Text>
            </View>

            <View
              style={
                styles.studentHeaderInfo
              }
            >
              <Text
                style={
                  styles.studentName
                }
              >
                {student.name}
              </Text>

              <View
                style={
                  styles.foundBadge
                }
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color="#0F766E"
                />

                <Text
                  style={
                    styles.foundText
                  }
                >
                  Approved Student
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              STUDENT DETAILS
          ================================================= */}

          <View
            style={
              styles.detailsContainer
            }
          >
            {/* Register Number */}

            <View style={styles.detailRow}>
              <View
                style={
                  styles.detailIcon
                }
              >
                <Ionicons
                  name="card-outline"
                  size={17}
                  color="#4338CA"
                />
              </View>

              <View
                style={
                  styles.detailContent
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Register Number
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {
                    student.registerNumber
                  }
                </Text>
              </View>
            </View>

            {/* Email */}

            <View style={styles.detailRow}>
              <View
                style={
                  styles.detailIcon
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color="#4338CA"
                />
              </View>

              <View
                style={
                  styles.detailContent
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Email
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                  numberOfLines={1}
                >
                  {student.email}
                </Text>
              </View>
            </View>

            {/* Class */}

            <View style={styles.detailRow}>
              <View
                style={
                  styles.detailIcon
                }
              >
                <Ionicons
                  name="school-outline"
                  size={17}
                  color="#4338CA"
                />
              </View>

              <View
                style={
                  styles.detailContent
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Class
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {student.class}
                </Text>
              </View>
            </View>
          </View>

          {/* =================================================
              ADD BUTTON
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed &&
                styles.pressed,
              adding &&
                styles.disabledButton,
            ]}
            onPress={addStudent}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />
            ) : (
              <>
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Add Student
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* =================================================
          INFORMATION CARD
      ================================================= */}

      {!student && (
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="information-circle-outline"
              size={23}
              color="#4338CA"
            />
          </View>

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoTitle
              }
            >
              How it works
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              Enter the student's
              register number. Only
              students whose registration
              has been approved by the
              administrator can be found
              and added to your students.
            </Text>
          </View>
        </View>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <View style={styles.footer}>
        <Text
          style={
            styles.footerTitle
          }
        >
          ProjectVerse
        </Text>

        <Text
          style={
            styles.footerSubtitle
          }
        >
          Academic Project Management
          Platform
        </Text>
      </View>
    </ScrollView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 18,
    paddingBottom: 35,
  },

  // =====================================================
  // SEARCH CARD
  // =====================================================

  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDFF0",
    padding: 18,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  searchHeading: {
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },

  cardSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 5,
  },

  // =====================================================
  // INPUT
  // =====================================================

  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  inputContainer: {
    height: 48,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DCDFF0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    marginLeft: 9,
    paddingVertical: 0,
  },

  // =====================================================
  // BUTTONS
  // =====================================================

  searchButton: {
    height: 45,
    borderRadius: 12,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },

  addButton: {
    height: 45,
    borderRadius: 12,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },

  pressed: {
    opacity: 0.82,
  },

  // =====================================================
  // STUDENT CARD
  // =====================================================

  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDFF0",
    padding: 18,
    marginTop: 14,
  },

  studentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 21,
    fontWeight: "700",
    color: "#4338CA",
  },

  studentHeaderInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
  },

  foundBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#D5F5F2",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 6,
  },

  foundText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0F766E",
    marginLeft: 4,
  },

  // =====================================================
  // STUDENT DETAILS
  // =====================================================

  detailsContainer: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 13,
    color: "#374151",
  },

  // =====================================================
  // INFO CARD
  // =====================================================

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E8E6",
    padding: 16,
    marginTop: 14,
    flexDirection: "row",
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },

  // =====================================================
  // FOOTER
  // =====================================================

  footer: {
    alignItems: "center",
    paddingTop: 25,
    paddingBottom: 8,
  },

  footerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4338CA",
    marginBottom: 4,
  },

  footerSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});