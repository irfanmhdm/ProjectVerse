import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

type Student = {
  id: string;
  [key: string]: any;
  name?: string;
  email?: string;
  registerNumber?: string;
  approvalStatus?: string;
  status?: string;
};

export default function StudentApproval() {
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [processingUser, setProcessingUser] =
    useState<string | null>(null);

  const [approvingAll, setApprovingAll] = useState(false);

  const loadStudents = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const pendingStudents: Student[] = [];

      snapshot.forEach((userDoc) => {
        const user = userDoc.data();

        const status =
          user.approvalStatus ?? user.status;

        if (
          user.role === "student" &&
          status === "pending"
        ) {
          pendingStudents.push({
            id: userDoc.id,
            ...user,
          });
        }
      });

      setStudents(pendingStudents);
    } catch (error) {
      console.error(
        "Error loading student approvals:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load student requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const approveStudent = async (
    studentId: string
  ) => {
    try {
      setProcessingUser(studentId);

      await updateDoc(
        doc(db, "users", studentId),
        {
          approvalStatus: "approved",
          status: "approved",
        }
      );

      setStudents((current) =>
        current.filter(
          (student) => student.id !== studentId
        )
      );

      Alert.alert(
        "Student Approved",
        "The student can now log in."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Unable to approve student."
      );
    } finally {
      setProcessingUser(null);
    }
  };

  const approveAllStudents = async () => {
    if (students.length === 0) {
      return;
    }

    try {
      setApprovingAll(true);

      await Promise.all(
        students.map((student) =>
          updateDoc(
            doc(db, "users", student.id),
            {
              approvalStatus: "approved",
              status: "approved",
            }
          )
        )
      );

      const approvedCount = students.length;

      setStudents([]);

      Alert.alert(
        "Students Approved",
        `${approvedCount} student${
          approvedCount === 1 ? "" : "s"
        } approved successfully.`
      );
    } catch (error) {
      console.error(
        "Error approving all students:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to approve all students. Please try again."
      );
    } finally {
      setApprovingAll(false);
    }
  };

  const rejectStudent = async (
    studentId: string
  ) => {
    try {
      setProcessingUser(studentId);

      await updateDoc(
        doc(db, "users", studentId),
        {
          approvalStatus: "rejected",
          status: "rejected",
        }
      );

      setStudents((current) =>
        current.filter(
          (student) => student.id !== studentId
        )
      );

      Alert.alert(
        "Student Rejected",
        "The student registration was rejected."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Unable to reject student."
      );
    } finally {
      setProcessingUser(null);
    }
  };


  const openDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsVisible(true);
  };

  const formatFieldLabel = (field: string) =>
    field
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/^\s*/, "")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "Not provided";
    if (typeof value === "object") {
      const possibleDate = value as { toDate?: () => Date };
      if (typeof possibleDate.toDate === "function") return possibleDate.toDate().toLocaleString();
      return JSON.stringify(value);
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const hiddenFields = ["id", "password", "confirmPassword", "newPassword", "currentPassword", "token", "fcmToken", "deviceToken"];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color="#4338CA"
        />

        <Text style={styles.loadingText}>
          Loading student requests...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4338CA"
          />
        }
      >
        

        

        

        <View style={styles.countCard}>
          <View style={styles.countInfo}>
            <Text style={styles.countNumber}>
              {students.length}
            </Text>

            <Text style={styles.countText}>
              Pending Student Requests
            </Text>
          </View>

          

          {students.length > 0 && (
            <TouchableOpacity
              style={styles.approveAllButton}
              disabled={approvingAll}
              onPress={approveAllStudents}
            >
              {approvingAll ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="checkmark-done-outline"
                  size={19}
                  color="#FFFFFF"
                />
              )}

              <Text style={styles.approveAllText}>
                {approvingAll
                  ? "Approving..."
                  : "Approve All"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        

        {students.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-done-outline"
                size={30}
                color="#0F766E"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Pending Requests
            </Text>

            <Text style={styles.emptyText}>
              There are no student registration
              requests waiting for approval.
            </Text>
          </View>
        ) : (
          students.map((student) => (
            <View
              key={student.id}
              style={styles.userCard}
            >
              <View style={styles.userInfo}>
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

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="card-outline"
                      size={14}
                      color="#6B7280"
                    />

                    <Text style={styles.infoText}>
                      {student.registerNumber ||
                        "No register number"}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="mail-outline"
                      size={14}
                      color="#6B7280"
                    />

                    <Text style={styles.infoText}>
                      {student.email || "No email"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => openDetails(student)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="View full student details"
                >
                  <Ionicons name="eye-outline" size={19} color="#4338CA" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  disabled={
                    processingUser === student.id ||
                    approvingAll
                  }
                  onPress={() =>
                    rejectStudent(student.id)
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={19}
                    color="#DC2626"
                  />

                  <Text style={styles.rejectText}>
                    Reject
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  disabled={
                    processingUser === student.id ||
                    approvingAll
                  }
                  onPress={() =>
                    approveStudent(student.id)
                  }
                >
                  {processingUser === student.id ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                  )}

                  <Text style={styles.approveText}>
                    Approve
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Modal
          visible={detailsVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Registration Details</Text>
                  <Text style={styles.modalSubtitle}>Review the complete profile before approval</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setDetailsVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close details"
                >
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
                {selectedStudent && ([
                  ["Register Number", selectedStudent.registerNumber ?? selectedStudent.register_number],
                  ["Name", selectedStudent.name],
                  ["Email", selectedStudent.email],
                  ["Phone", selectedStudent.phone ?? selectedStudent.phoneNumber ?? selectedStudent.mobile],
                  ["College", selectedStudent.college ?? selectedStudent.collegeName],
                  ["Class", selectedStudent.class ?? selectedStudent.department ?? selectedStudent.classDepartment],
                  ["Status", selectedStudent.approvalStatus ?? selectedStudent.status],
                  ["Created At", selectedStudent.createdAt ?? selectedStudent.created_at ?? selectedStudent.createdOn],
                ] as [string, unknown][]).map(([label, value]) => (
                  <View key={label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{label}</Text>
                    <Text selectable style={styles.detailValue}>{formatFieldValue(value)}</Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setDetailsVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
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

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12.5,
    color: "#6B7280",
  },

  countCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E7EAF0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  countInfo: {
    flex: 1,
  },

  countNumber: {
    fontSize: 27,
    fontWeight: "700",
    color: "#0F766E",
  },

  countText: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
  },

  approveAllButton: {
    minHeight: 44,
    paddingHorizontal: 15,
    borderRadius: 11,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  approveAllText: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },

  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  details: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  infoText: {
    marginLeft: 5,
    fontSize: 12.5,
    color: "#6B7280",
    flexShrink: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF0F4",
    marginVertical: 15,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  rejectButton: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  rejectText: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#DC2626",
  },

  approveButton: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  approveText: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  viewButton: {
    width: 44,
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  detailsScroll: {
    flexGrow: 0,
  },
  detailRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },
  detailLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1F2937",
  },
  modalDoneButton: {
    height: 44,
    borderRadius: 11,
    backgroundColor: "#4338CA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  modalDoneText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
});