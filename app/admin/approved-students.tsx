import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

type Student = {
  id: string;
  name?: string;
  email?: string;
  registerNumber?: string;
  phone?: string;
  college?: string;
  department?: string;
  classDepartment?: string;
  qualification?: string;
  role?: string;
  approvalStatus?: string;
  status?: string;
};

export default function ApprovedStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const loadStudents = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const approved: Student[] = [];

      snapshot.forEach((userDoc) => {
        const user = userDoc.data();

        const status =
          user.approvalStatus ?? user.status;

        if (
          user.role === "student" &&
          status === "approved"
        ) {
          approved.push({
            id: userDoc.id,
            ...user,
          } as Student);
        }
      });

      setStudents(approved);
    } catch (error) {
      console.error(
        "Error loading approved students:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsVisible(true);
  };

  const closeStudentDetails = () => {
    setDetailsVisible(false);
    setSelectedStudent(null);
  };

  const renderDetail = (label: string, value?: string) => {
    if (!value || !value.trim()) {
      return null;
    }

    return (
      <View style={styles.detailRow} key={label}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4338CA" />

        <Text style={styles.loadingText}>
          Loading approved students...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStudents();
            }}
            tintColor="#4338CA"
          />
        }
      >
        {/* <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons
              name="people-outline"
              size={26}
              color="#0F766E"
            />
          </View>

          <View>
            {/* <Text style={styles.title}>
              Approved Students
            </Text> *

            <Text style={styles.subtitle}>
              {students.length} approved student
              {students.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View> */}

        {students.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="people-outline"
              size={35}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              No Approved Students
            </Text>
          </View>
        ) : (
          students.map((student) => (
            <View
              key={student.id}
              style={styles.card}
            >
              <View style={styles.avatar}>
                <Ionicons
                  name="person-outline"
                  size={23}
                  color="#0F766E"
                />
              </View>

              <View style={styles.details}>
                <Text style={styles.name}>
                  {student.name || "Student"}
                </Text>

                <Text style={styles.register}>
                  {student.registerNumber ||
                    "No register number"}
                </Text>

                <Text style={styles.email}>
                  {student.email || "No email"}
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => openStudentDetails(student)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${student.name || "student"}`}
                  hitSlop={8}
                >
                  <Ionicons
                    name="eye-outline"
                    size={21}
                    color="#4338CA"
                  />
                </Pressable>

                <View style={styles.status}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#15803D"
                  />

                  <Text style={styles.statusText}>
                    Approved
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={detailsVisible}
        transparent
        animationType="fade"
        onRequestClose={closeStudentDetails}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closeStudentDetails}
            accessibilityLabel="Close student details"
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <View style={styles.modalAvatar}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color="#4338CA"
                  />
                </View>

                <View style={styles.modalHeadingText}>
                  <Text style={styles.modalTitle}>
                    Student Details
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Approved student
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={closeStudentDetails}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close popup"
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#4B5563"
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalDetails}
              showsVerticalScrollIndicator={false}
            >
              {selectedStudent ? (
                <>
                  {renderDetail("Full name", selectedStudent.name)}
                  {renderDetail("Email", selectedStudent.email)}
                  {renderDetail("Phone", selectedStudent.phone)}
                  {renderDetail("Register number", selectedStudent.registerNumber)}
                  {renderDetail("College", selectedStudent.college)}
                  {renderDetail(
                    "Department / Class",
                    selectedStudent.classDepartment || selectedStudent.department
                  )}
                  {renderDetail("Qualification", selectedStudent.qualification)}
                  {renderDetail("Role", selectedStudent.role)}
                  {renderDetail(
                    "Approval status",
                    selectedStudent.approvalStatus || selectedStudent.status
                  )}

                  {!selectedStudent.name &&
                  !selectedStudent.email &&
                  !selectedStudent.phone &&
                  !selectedStudent.registerNumber &&
                  !selectedStudent.college &&
                  !selectedStudent.classDepartment &&
                  !selectedStudent.department &&
                  !selectedStudent.qualification ? (
                    <Text style={styles.noDetailsText}>
                      No additional details are available for this student.
                    </Text>
                  ) : null}
                </>
              ) : null}
            </ScrollView>

            <Pressable
              style={styles.doneButton}
              onPress={closeStudentDetails}
              accessibilityRole="button"
            >
              <Text style={styles.doneButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  details: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  register: {
    marginTop: 4,
    fontSize: 12.5,
    color: "#374151",
  },

  email: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  actions: {
    alignItems: "center",
    marginLeft: 8,
  },

  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  status: {
    alignItems: "center",
  },

  statusText: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: "600",
    color: "#15803D",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 35,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },

  modalCard: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "82%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  modalAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  modalHeadingText: {
    marginLeft: 12,
    flex: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#15803D",
    fontWeight: "600",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  modalScroll: {
    marginTop: 8,
  },

  modalDetails: {
    paddingVertical: 8,
  },

  detailRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },

  detailLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 5,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },

  noDetailsText: {
    paddingVertical: 16,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },

  doneButton: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#4338CA",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
