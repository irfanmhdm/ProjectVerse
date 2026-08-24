import { router } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { auth, db } from "../../firebase/firebaseConfig";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentClass: string;
  createdAt?: any;
};

export default function GuideDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const guide = auth.currentUser;

    if (!guide) {
      setLoading(false);
      return;
    }

    const studentsQuery = query(
      collection(db, "guideStudents"),
      where("guideId", "==", guide.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot) => {
        const studentList: Student[] = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })) as Student[];

        setStudents(studentList);
        setLoading(false);
      },
      (error) => {
        console.log("Error fetching students:", error);

        Alert.alert(
          "Error",
          "Could not load your students."
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not logout.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.appName}>ProjectVerse</Text>

      <Text style={styles.title}>Guide Dashboard</Text>

      <Text style={styles.subtitle}>
        Welcome to the ProjectVerse Guide Portal
      </Text>

      <Pressable
        style={styles.addStudentButton}
        onPress={() => router.push("/guide/add-student")}
      >
        <Text style={styles.addStudentButtonText}>
          + Add Student
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>
        My Students
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Loading students...
          </Text>
        </View>
      ) : students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            No Students Yet
          </Text>

          <Text style={styles.emptyText}>
            Add students to start managing their projects.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.studentCount}>
            {students.length}{" "}
            {students.length === 1
              ? "Student"
              : "Students"}
          </Text>

          {students.map((student) => (
            <View
              key={student.id}
              style={styles.studentCard}
            >
              <Text style={styles.studentName}>
                {student.studentName}
              </Text>

              <View style={styles.infoSection}>
                <Text style={styles.label}>
                  Email
                </Text>

                <Text style={styles.value}>
                  {student.studentEmail}
                </Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.label}>
                  Class
                </Text>

                <Text style={styles.value}>
                  {student.studentClass}
                </Text>
              </View>

              <Pressable
                style={styles.projectsButton}
                onPress={() => {
                  // We'll connect this to the student's
                  // projects page next.
                  console.log(
                    "Selected student:",
                    student.studentId
                  );
                }}
              >
                <Text style={styles.projectsButtonText}>
                  View Projects
                </Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 25,
    paddingBottom: 40,
  },

  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563EB",
    marginTop: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
  },

  addStudentButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },

  addStudentButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 30,
    marginBottom: 12,
  },

  studentCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
  },

  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  studentName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 15,
  },

  infoSection: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 3,
  },

  value: {
    fontSize: 14,
    color: "#111827",
  },

  projectsButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 5,
  },

  projectsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
  },

  logoutButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },

  logoutText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});