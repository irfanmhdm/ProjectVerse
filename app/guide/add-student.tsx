import { router } from "expo-router";
import {
  collection,
  getDocs,
  doc,
  query,
  serverTimestamp,
  setDoc,
  where,
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

type Student = {
  id: string;
  name: string;
  email: string;
  class: string;
};

export default function AddStudent() {
  const [email, setEmail] = useState("");
  const [student, setStudent] = useState<Student | null>(null);

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // =====================================================
  // SEARCH STUDENT
  // =====================================================

  const searchStudent = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === "") {
      Alert.alert("Email Required", "Please enter the student's email.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid student email.");
      return;
    }

    setLoading(true);
    setStudent(null);

    try {
      const studentQuery = query(
        collection(db, "users"),
        where("email", "==", cleanEmail),
        where("role", "==", "student"),
      );

      const snapshot = await getDocs(studentQuery);

      if (snapshot.empty) {
        Alert.alert(
          "Student Not Found",
          "No registered student was found with this email.",
        );

        setLoading(false);
        return;
      }

      const studentDoc = snapshot.docs[0];
      const studentData = studentDoc.data();

      setStudent({
        id: studentDoc.id,
        name: studentData.name || "Unknown Student",
        email: studentData.email || cleanEmail,
        class: studentData.class || "Not provided",
      });
    } catch (error) {
      console.log("Error searching student:", error);

      Alert.alert(
        "Search Failed",
        "Something went wrong while searching for the student.",
      );
    }

    setLoading(false);
  };

  // =====================================================
  // ADD STUDENT
  // =====================================================

  const addStudent = async () => {
    const guide = auth.currentUser;

    if (!guide) {
      Alert.alert("Authentication Error", "Guide is not logged in.");
      return;
    }

    if (!student) {
      return;
    }

    setAdding(true);

    try {
      // =================================================
      // CHECK IF STUDENT IS ALREADY ASSIGNED
      // =================================================

      const existingAssignmentQuery = query(
        collection(db, "guideStudents"),
        where("studentId", "==", student.id),
      );

      const existingAssignmentSnapshot = await getDocs(existingAssignmentQuery);

      // =================================================
      // STUDENT ALREADY ASSIGNED
      // =================================================

      if (!existingAssignmentSnapshot.empty) {
        const existingAssignment = existingAssignmentSnapshot.docs[0].data();

        // Same guide
        if (existingAssignment.guideId === guide.uid) {
          Alert.alert(
            "Already Added",
            `${student.name} is already assigned to you.`,
          );
        }

        // Different guide
        else {
          Alert.alert(
            "Student Already Assigned",
            `${student.name} is already assigned to another guide.`,
          );
        }

        setAdding(false);
        return;
      }

      // =================================================
      // CREATE NEW ASSIGNMENT
      // =================================================

      const assignmentId = `${guide.uid}_${student.id}`;

      await setDoc(doc(db, "guideStudents", assignmentId), {
        guideId: guide.uid,
        studentId: student.id,

        studentName: student.name,
        studentEmail: student.email,
        studentClass: student.class || "Not provided",

        createdAt: serverTimestamp(),
      });

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
              setEmail("");
              setStudent(null);
            },
          },
        ],
      );
    } catch (error: any) {
      console.log("Error adding student:", error);

      console.log("Error code:", error.code);

      console.log("Error message:", error.message);

      Alert.alert(
        "Add Student Failed",
        error.message || "Something went wrong while adding the student.",
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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* =================================================
          SEARCH CARD
      ================================================= */}

      <View style={styles.searchCard}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add-outline" size={27} color="#4338CA" />
        </View>

        <View style={styles.searchHeading}>
          <Text style={styles.cardTitle}>Add a Student</Text>

          <Text style={styles.cardSubtitle}>
            Search for a registered student using their email address.
          </Text>
        </View>

        {/* =================================================
            EMAIL INPUT
        ================================================= */}

        <Text style={styles.inputLabel}>Student Email</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={19} color="#9CA3AF" />

          <TextInput
            style={styles.input}
            placeholder="student@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {email.length > 0 && (
            <Pressable
              onPress={() => {
                setEmail("");
                setStudent(null);
              }}
            >
              <Ionicons name="close-circle" size={19} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* =================================================
            SEARCH BUTTON
        ================================================= */}

        <Pressable
          style={({ pressed }) => [
            styles.searchButton,
            pressed && styles.pressed,
            loading && styles.disabledButton,
          ]}
          onPress={searchStudent}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="search-outline" size={18} color="#FFFFFF" />

              <Text style={styles.buttonText}>Search Student</Text>
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
              <Text style={styles.avatarText}>
                {student.name?.charAt(0).toUpperCase() || "S"}
              </Text>
            </View>

            <View style={styles.studentHeaderInfo}>
              <Text style={styles.studentName}>{student.name}</Text>

              <View style={styles.foundBadge}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color="#0F766E"
                />

                <Text style={styles.foundText}>Student Found</Text>
              </View>
            </View>
          </View>

          {/* =================================================
              STUDENT DETAILS
          ================================================= */}

          <View style={styles.detailsContainer}>
            {/* Email */}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="mail-outline" size={17} color="#4338CA" />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>

                <Text style={styles.detailValue} numberOfLines={1}>
                  {student.email}
                </Text>
              </View>
            </View>

            {/* Class */}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="school-outline" size={17} color="#4338CA" />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Class</Text>

                <Text style={styles.detailValue}>{student.class}</Text>
              </View>
            </View>
          </View>

          {/* =================================================
              ADD BUTTON
          ================================================= */}

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
              adding && styles.disabledButton,
            ]}
            onPress={addStudent}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />

                <Text style={styles.buttonText}>Add Student</Text>
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

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>

            <Text style={styles.infoText}>
              Enter the email address used by the student to register with
              ProjectVerse. Once found, you can add the student under your
              guidance.
            </Text>
          </View>
        </View>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>ProjectVerse</Text>

        <Text style={styles.footerSubtitle}>
          Academic Project Management Platform
        </Text>
      </View>
    </ScrollView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // =====================================================
  // PAGE
  // =====================================================

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
