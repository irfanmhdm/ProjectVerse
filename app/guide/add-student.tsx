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
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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

  // Search student by email
  const searchStudent = async () => {
    if (email.trim() === "") {
      Alert.alert("Error", "Please enter the student's email.");
      return;
    }

    setLoading(true);
    setStudent(null);

    try {
      const studentQuery = query(
        collection(db, "users"),
        where("email", "==", email.trim().toLowerCase()),
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
        name: studentData.name,
        email: studentData.email,
        class: studentData.class,
      });
    } catch (error) {
      console.log("Error searching student:", error);

      Alert.alert(
        "Error",
        "Something went wrong while searching for the student.",
      );
    }

    setLoading(false);
  };

  // Add student under current guide
  const addStudent = async () => {
    const guide = auth.currentUser;

    if (!guide) {
      Alert.alert("Error", "Guide is not logged in.");
      return;
    }

    if (!student) {
      return;
    }

    setAdding(true);

    try {
      // Unique ID for guide + student relationship
      const assignmentId = `${guide.uid}_${student.id}`;

      await setDoc(doc(db, "guideStudents", assignmentId), {
        guideId: guide.uid,
        studentId: student.id,

        studentName: student.name,
        studentEmail: student.email,
        studentClass: student.class || "Not provided",

        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Success",
        `${student.name} has been added to your students.`,
      );

      setEmail("");
      setStudent(null);
    } catch (error: any) {
      console.log("Error adding student:", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);

      Alert.alert(
        "Add Student Failed",
        error.message || "Something went wrong while adding the student.",
      );
    }

    setAdding(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Student</Text>

      <Text style={styles.subtitle}>
        Add a student under your guidance using their registered email.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Student Email"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable
        style={styles.searchButton}
        onPress={searchStudent}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Search Student</Text>
        )}
      </Pressable>

      {student && (
        <View style={styles.studentCard}>
          <Text style={styles.cardTitle}>Student Found</Text>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{student.name}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{student.email}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Class</Text>
            <Text style={styles.value}>{student.class}</Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={addStudent}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Add Student</Text>
            )}
          </Pressable>
        </View>
      )}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 25,
    lineHeight: 22,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 15,
  },

  searchButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  studentCard: {
    backgroundColor: "#FFFFFF",
    marginTop: 25,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 18,
  },

  infoSection: {
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 3,
  },

  value: {
    fontSize: 15,
    color: "#111827",
  },

  addButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  backButton: {
    marginTop: 20,
    alignItems: "center",
  },

  backButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});
