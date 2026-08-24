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
import { router } from "expo-router";

import { auth, db } from "../../firebase/firebaseConfig";

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentClass: string;
  createdAt?: any;
};

export default function Students() {
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

        Alert.alert("Error", "Could not load your students.");

        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Students</Text>

      <Text style={styles.subtitle}>Students assigned under your guidance</Text>

      {students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Students Yet</Text>

          <Text style={styles.emptyText}>
            You haven't added any students yet.
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/guide/add-student")}
          >
            <Text style={styles.addButtonText}>+ Add Student</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.count}>
            {students.length} {students.length === 1 ? "Student" : "Students"}
          </Text>

          {students.map((student) => (
            <View key={student.id} style={styles.studentCard}>
              <Text style={styles.studentName}>{student.studentName}</Text>

              <View style={styles.infoSection}>
                <Text style={styles.label}>Email</Text>

                <Text style={styles.value}>{student.studentEmail}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.label}>Class</Text>

                <Text style={styles.value}>{student.studentClass}</Text>
              </View>

              <Pressable
                style={styles.projectsButton}
                onPress={() => {
                  console.log("Selected student:", student.studentId);

                  // We'll connect this next.
                }}
              >
                <Text style={styles.projectsButtonText}>View Projects</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 20,
  },

  count: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },

  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 2,
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
    padding: 30,
    marginTop: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },

  addButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
});
