import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
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

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../firebase/firebaseConfig";


// =====================================================
// STUDENT TYPE
// =====================================================

type Student = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentClass: string;
  createdAt?: any;
};


// =====================================================
// STUDENTS SCREEN
// =====================================================

export default function Students() {

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [removingStudentId, setRemovingStudentId] =
    useState<string | null>(null);


  // =====================================================
  // LOAD ASSIGNED STUDENTS
  // =====================================================

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

        const studentList: Student[] =
          snapshot.docs.map((studentDoc) => ({
            id: studentDoc.id,
            ...(studentDoc.data() as Omit<
              Student,
              "id"
            >),
          }));

        setStudents(studentList);

        setLoading(false);
      },

      (error) => {

        console.log(
          "Error fetching assigned students:",
          error,
        );

        Alert.alert(
          "Error",
          "Could not load your assigned students.",
        );

        setLoading(false);
      },
    );

    return unsubscribe;

  }, []);


  // =====================================================
  // REMOVE STUDENT
  // =====================================================

  const removeStudent = (student: Student) => {

    const guide = auth.currentUser;

    if (!guide) {

      Alert.alert(
        "Authentication Error",
        "Guide is not logged in.",
      );

      return;
    }


    Alert.alert(
      "Remove Student",

      `Are you sure you want to remove ${student.studentName} from your assigned students?`,

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Remove",
          style: "destructive",

          onPress: async () => {

            try {

              setRemovingStudentId(student.id);


              // -----------------------------------------
              // DELETE ASSIGNMENT
              // -----------------------------------------

              await deleteDoc(
                doc(
                  db,
                  "guideStudents",
                  student.id,
                ),
              );


              Alert.alert(
                "Student Removed",
                `${student.studentName} has been removed from your students.`,
              );


              // -----------------------------------------
              // No manual reload required.
              //
              // onSnapshot() above automatically
              // updates the student list.
              // -----------------------------------------

            } catch (error: any) {

              console.log(
                "Error removing student:",
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
                "Remove Failed",
                error.message ||
                  "Something went wrong while removing the student.",
              );

            } finally {

              setRemovingStudentId(null);

            }
          },
        },
      ],
    );
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#4338CA"
        />

        <Text style={styles.loadingText}>
          Loading students...
        </Text>

      </View>
    );
  }


  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

        <Text style={styles.label}>
          GUIDE
        </Text>

        <Text style={styles.title}>
          My Students
        </Text>

        <Text style={styles.subtitle}>
          Students assigned under your guidance
        </Text>

      </View>


      {/* =================================================
          STUDENT COUNT
      ================================================= */}

      {students.length > 0 && (

        <View style={styles.countCard}>

          <View style={styles.countIcon}>

            <Ionicons
              name="people-outline"
              size={25}
              color="#0F766E"
            />

          </View>


          <View style={styles.countContent}>

            <Text style={styles.countNumber}>
              {students.length}
            </Text>

            <Text style={styles.countLabel}>
              {students.length === 1
                ? "Student"
                : "Students"}
            </Text>

          </View>


          <View style={styles.countStatus}>

            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#0F766E"
            />

            <Text style={styles.countStatusText}>
              Assigned
            </Text>

          </View>

        </View>
      )}


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {students.length === 0 ? (

        <View style={styles.emptyContainer}>

          <View style={styles.emptyIcon}>

            <Ionicons
              name="people-outline"
              size={34}
              color="#4338CA"
            />

          </View>


          <Text style={styles.emptyTitle}>
            No Students Yet
          </Text>


          <Text style={styles.emptyText}>
            You haven't added any students yet.
            Add a student to start managing their
            projects and progress.
          </Text>


          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push("/guide/add-student")
            }
          >

            <Ionicons
              name="person-add-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              Add Student
            </Text>

          </Pressable>

        </View>

      ) : (

        <>

          {/* =================================================
              SECTION HEADER
          ================================================= */}

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>
              Assigned Students
            </Text>

            <Text style={styles.sectionSubtitle}>
              Students currently assigned to you
            </Text>

          </View>


          {/* =================================================
              STUDENT CARDS
          ================================================= */}

          {students.map((student) => (

            <View
              key={student.id}
              style={styles.studentCard}
            >

              {/* =================================================
                  STUDENT HEADER
              ================================================= */}

              <View style={styles.cardTop}>

                <View style={styles.avatar}>

                  <Text style={styles.avatarText}>

                    {student.studentName
                      ?.charAt(0)
                      .toUpperCase() || "S"}

                  </Text>

                </View>


                <View style={styles.studentHeader}>

                  <Text
                    style={styles.studentName}
                    numberOfLines={1}
                  >
                    {student.studentName}
                  </Text>


                  <View style={styles.classBadge}>

                    <Ionicons
                      name="school-outline"
                      size={13}
                      color="#4338CA"
                    />

                    <Text style={styles.classBadgeText}>
                      {student.studentClass ||
                        "Not provided"}
                    </Text>

                  </View>

                </View>

              </View>


              {/* =================================================
                  EMAIL
              ================================================= */}

              <View style={styles.infoRow}>

                <View style={styles.infoIcon}>

                  <Ionicons
                    name="mail-outline"
                    size={17}
                    color="#6B7280"
                  />

                </View>


                <View style={styles.infoContent}>

                  <Text style={styles.infoLabel}>
                    Email
                  </Text>

                  <Text
                    style={styles.infoValue}
                    numberOfLines={1}
                  >
                    {student.studentEmail}
                  </Text>

                </View>

              </View>


              {/* =================================================
                  VIEW PROJECTS
              ================================================= */}

              <Pressable
                style={({ pressed }) => [
                  styles.projectsButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => {

                  console.log(
                    "Selected student:",
                    student.studentId,
                  );

                  // -----------------------------------------
                  // Keep your existing View Projects logic
                  // here if it already exists.
                  // -----------------------------------------

                }}
              >

                <Text style={styles.projectsButtonText}>
                  View Projects
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#FFFFFF"
                />

              </Pressable>


              {/* =================================================
                  REMOVE STUDENT
              ================================================= */}

              <Pressable
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.pressed,
                  removingStudentId === student.id &&
                    styles.disabledButton,
                ]}
                onPress={() =>
                  removeStudent(student)
                }
                disabled={
                  removingStudentId === student.id
                }
              >

                {removingStudentId === student.id ? (

                  <ActivityIndicator
                    size="small"
                    color="#DC2626"
                  />

                ) : (

                  <Ionicons
                    name="person-remove-outline"
                    size={18}
                    color="#DC2626"
                  />

                )}

                <Text style={styles.removeButtonText}>

                  {removingStudentId === student.id
                    ? "Removing..."
                    : "Remove Student"}

                </Text>

              </Pressable>

            </View>

          ))}

        </>

      )}


      {/* =================================================
          FOOTER
      ================================================= */}

      <View style={styles.footer}>

        <Text style={styles.footerTitle}>
          ProjectVerse
        </Text>

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
  // CONTAINER
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
  // HEADER
  // =====================================================

  header: {
    marginBottom: 22,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#4338CA",
    marginBottom: 8,
  },

  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "700",
    color: "#574BC6",
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 6,
  },


  // =====================================================
  // COUNT CARD
  // =====================================================

  countCard: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E8E6",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  countIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  countContent: {
    flex: 1,
  },

  countNumber: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  countLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },

  countStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D5F5F2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
  },

  countStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F766E",
    marginLeft: 4,
  },


  // =====================================================
  // SECTION
  // =====================================================

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5C5599",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },


  // =====================================================
  // STUDENT CARD
  // =====================================================

  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDFF0",
    padding: 17,
    marginBottom: 13,
    overflow: "hidden",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4338CA",
  },

  studentHeader: {
    flex: 1,
  },

  studentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  classBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEF0FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 5,
  },

  classBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4338CA",
    marginLeft: 4,
  },


  // =====================================================
  // INFO
  // =====================================================

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },

  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 13,
    color: "#374151",
  },


  // =====================================================
  // VIEW PROJECTS
  // =====================================================

  projectsButton: {
    height: 42,
    backgroundColor: "#4338CA",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  projectsButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
  },


  // =====================================================
  // REMOVE STUDENT
  // =====================================================

  removeButton: {
    height: 42,
    backgroundColor: "#FEF2F2",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  removeButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },


  // =====================================================
  // EMPTY STATE
  // =====================================================

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCDFF0",
    marginTop: 5,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 21,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },

  addButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 11,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },


  // =====================================================
  // LOADING
  // =====================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },


  // =====================================================
  // FOOTER
  // =====================================================

  footer: {
    alignItems: "center",
    paddingTop: 18,
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


  // =====================================================
  // PRESS / DISABLED
  // =====================================================

  pressed: {
    opacity: 0.82,
  },

  disabledButton: {
    opacity: 0.6,
  },

});