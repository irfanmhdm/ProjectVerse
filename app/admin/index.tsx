import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { collection, getDocs, query, where } from "firebase/firestore";

import { auth, db } from "../../firebase/firebaseConfig";

// =====================================================
// ADMIN DASHBOARD
// =====================================================

export default function AdminDashboard() {
  const router = useRouter();

  // =====================================================
  // COUNTS
  // =====================================================

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalGuides, setTotalGuides] = useState(0);
  const [submittedProjects, setSubmittedProjects] = useState(0);
  const [approvedProjects, setApprovedProjects] = useState(0);

  // =====================================================
  // PENDING COUNTS
  // =====================================================

  const [pendingStudents, setPendingStudents] = useState(0);
  const [pendingGuides, setPendingGuides] = useState(0);

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {
    try {
      if (!auth.currentUser) {
        console.log("No authenticated admin");
        return;
      }

      if (!refreshing) {
        setLoading(true);
      }

      // =================================================
      // GET USERS
      // =================================================

      const usersSnapshot = await getDocs(collection(db, "users"));

      let approvedStudentCount = 0;
      let approvedGuideCount = 0;

      let pendingStudentCount = 0;
      let pendingGuideCount = 0;

      usersSnapshot.forEach((userDoc) => {
        const user = userDoc.data();

        const status = user.approvalStatus ?? user.status;

        // =================================================
        // STUDENTS
        // =================================================

        if (user.role === "student") {
          if (status === "approved") {
            approvedStudentCount++;
          }

          if (status === "pending") {
            pendingStudentCount++;
          }
        }

        // =================================================
        // GUIDES
        // =================================================

        if (user.role === "guide") {
          if (status === "approved") {
            approvedGuideCount++;
          }

          if (status === "pending") {
            pendingGuideCount++;
          }
        }
      });

      // =================================================
      // PROJECTS
      // =================================================

      const submittedQuery = query(
        collection(db, "projects"),
        where("status", "==", "submitted"),
      );

      const approvedQuery = query(
        collection(db, "projects"),
        where("status", "==", "approved"),
      );

      const [submittedSnapshot, approvedSnapshot] = await Promise.all([
        getDocs(submittedQuery),
        getDocs(approvedQuery),
      ]);

      // =================================================
      // UPDATE STATE
      // =================================================

      setTotalStudents(approvedStudentCount);
      setTotalGuides(approvedGuideCount);

      setPendingStudents(pendingStudentCount);
      setPendingGuides(pendingGuideCount);

      setSubmittedProjects(submittedSnapshot.size);
      setApprovedProjects(approvedSnapshot.size);

      // =================================================
      // DEBUG
      // =================================================

      console.log("=================================");
      console.log("ADMIN DASHBOARD");
      console.log("Approved Students:", approvedStudentCount);
      console.log("Approved Guides:", approvedGuideCount);
      console.log("Pending Students:", pendingStudentCount);
      console.log("Pending Guides:", pendingGuideCount);
      console.log("Submitted Projects:", submittedSnapshot.size);
      console.log("Approved Projects:", approvedSnapshot.size);
      console.log("=================================");
    } catch (error) {
      console.error("Error loading admin dashboard:", error);

      Alert.alert("Error", "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      await auth.signOut();

      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);

      Alert.alert("Logout Error", "Unable to logout. Please try again.");
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={30}
              color="#4338CA"
            />
          </View>

          <ActivityIndicator size="small" color="#4338CA" />

          <Text style={styles.loadingText}>Loading admin dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4338CA"
            />
          }
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* <View style={styles.headerIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={25}
                  color="#4338CA"
                />
              </View> */}
              <View style={styles.headerIcon}>
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
              </View>

              <View>
                <Text style={styles.title}>Admin Dashboard</Text>

                <Text style={styles.subtitle}>Manage ProjectVerse</Text>
              </View>
            </View>

            {/* <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#4338CA" />
            </TouchableOpacity> */}
          </View>

          {/* =================================================
              OVERVIEW
          ================================================= */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>

            <Text style={styles.sectionSubtitle}>
              Current ProjectVerse statistics
            </Text>
          </View>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <View style={styles.statsGrid}>
            {/* =================================================
                APPROVED STUDENTS
            ================================================= */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.statCard}
              onPress={() => router.push("/admin/approved-students")}
            >
              <View style={[styles.statIcon, styles.mintIcon]}>
                <Ionicons name="people-outline" size={23} color="#0F766E" />
              </View>

              <Text style={styles.statNumber}>{totalStudents}</Text>

              <Text style={styles.statLabel}>Students</Text>

              <View style={styles.statFooter}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color="#0F766E"
                />

                <Text style={styles.statFooterText}>
                  Approved • Tap to view
                </Text>
              </View>
            </TouchableOpacity>

            {/* =================================================
                APPROVED GUIDES
            ================================================= */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.statCard}
              onPress={() => router.push("/admin/approved-guides")}
            >
              <View style={[styles.statIcon, styles.indigoIcon]}>
                <Ionicons name="school-outline" size={23} color="#4338CA" />
              </View>

              <Text style={styles.statNumber}>{totalGuides}</Text>

              <Text style={styles.statLabel}>Guides</Text>

              <View style={styles.statFooter}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color="#4338CA"
                />

                <Text style={styles.statFooterText}>
                  Approved • Tap to view
                </Text>
              </View>
            </TouchableOpacity>

            {/* =================================================
                SUBMITTED PROJECTS
            ================================================= */}

            <View style={styles.statCard}>
              <View style={[styles.statIcon, styles.amberIcon]}>
                <Ionicons
                  name="document-text-outline"
                  size={23}
                  color="#B45309"
                />
              </View>

              <Text style={styles.statNumber}>{submittedProjects}</Text>

              <Text style={styles.statLabel}>Submitted</Text>

              <View style={styles.statFooter}>
                <Ionicons name="time-outline" size={13} color="#B45309" />

                <Text style={styles.statFooterText}>Projects</Text>
              </View>
            </View>

            {/* =================================================
                APPROVED PROJECTS
            ================================================= */}

            <View style={styles.statCard}>
              <View style={[styles.statIcon, styles.greenIcon]}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={23}
                  color="#15803D"
                />
              </View>

              <Text style={styles.statNumber}>{approvedProjects}</Text>

              <Text style={styles.statLabel}>Approved</Text>

              <View style={styles.statFooter}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={13}
                  color="#15803D"
                />

                <Text style={styles.statFooterText}>Projects</Text>
              </View>
            </View>
          </View>

          {/* =================================================
              APPROVAL MANAGEMENT
          ================================================= */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Approval Management</Text>

            <Text style={styles.sectionSubtitle}>
              Review new student and guide registrations
            </Text>
          </View>

          {/* =================================================
              STUDENT APPROVAL CARD
          ================================================= */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.approvalCard}
            onPress={() => router.push("/admin/student-approval")}
          >
            <View style={[styles.approvalIcon, styles.studentApprovalIcon]}>
              <Ionicons name="person-add-outline" size={25} color="#0F766E" />
            </View>

            <View style={styles.approvalInfo}>
              <Text style={styles.approvalTitle}>Student Approval</Text>

              <Text style={styles.approvalDescription}>
                Review and manage student registration requests.
              </Text>

              <View style={styles.approvalStatusRow}>
                <Ionicons
                  name={
                    pendingStudents > 0
                      ? "time-outline"
                      : "checkmark-circle-outline"
                  }
                  size={14}
                  color={pendingStudents > 0 ? "#B45309" : "#15803D"}
                />

                <Text
                  style={[
                    styles.approvalStatusText,
                    {
                      color: pendingStudents > 0 ? "#B45309" : "#15803D",
                    },
                  ]}
                >
                  {pendingStudents > 0
                    ? `${pendingStudents} pending request${
                        pendingStudents > 1 ? "s" : ""
                      }`
                    : "No pending requests"}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {/* =================================================
              GUIDE APPROVAL CARD
          ================================================= */}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.approvalCard}
            onPress={() => router.push("/admin/guide-approval")}
          >
            <View style={[styles.approvalIcon, styles.guideApprovalIcon]}>
              <Ionicons name="school-outline" size={25} color="#4338CA" />
            </View>

            <View style={styles.approvalInfo}>
              <Text style={styles.approvalTitle}>Guide Approval</Text>

              <Text style={styles.approvalDescription}>
                Review and manage guide registration requests.
              </Text>

              <View style={styles.approvalStatusRow}>
                <Ionicons
                  name={
                    pendingGuides > 0
                      ? "time-outline"
                      : "checkmark-circle-outline"
                  }
                  size={14}
                  color={pendingGuides > 0 ? "#B45309" : "#15803D"}
                />

                <Text
                  style={[
                    styles.approvalStatusText,
                    {
                      color: pendingGuides > 0 ? "#B45309" : "#15803D",
                    },
                  ]}
                >
                  {pendingGuides > 0
                    ? `${pendingGuides} pending request${
                        pendingGuides > 1 ? "s" : ""
                      }`
                    : "No pending requests"}
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>

          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <View style={styles.securityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#6B7280"
            />

            <Text style={styles.securityText}>
              Only approved students and guides can access their respective
              modules.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // ===================================================
  // SAFE AREA
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  // ===================================================
  // CONTAINER
  // ===================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    color: "#6B7280",
  },

  // ===================================================
  // STATISTICS
  // ===================================================

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  statCard: {
    width: "48.3%",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 16,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  mintIcon: {
    backgroundColor: "#D5F5F2",
  },

  indigoIcon: {
    backgroundColor: "#E0E7FF",
  },

  amberIcon: {
    backgroundColor: "#FEF3C7",
  },

  greenIcon: {
    backgroundColor: "#DCFCE7",
  },

  statNumber: {
    fontSize: 27,
    fontWeight: "700",
    color: "#1F2937",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },

  statFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
  },

  statFooterText: {
    marginLeft: 4,
    fontSize: 10.5,
    color: "#6B7280",
  },

  // ===================================================
  // APPROVAL CARDS
  // ===================================================

  approvalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  approvalIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  studentApprovalIcon: {
    backgroundColor: "#D5F5F2",
  },

  guideApprovalIcon: {
    backgroundColor: "#E0E7FF",
  },

  approvalInfo: {
    flex: 1,
  },

  approvalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  approvalDescription: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#6B7280",
  },

  approvalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  approvalStatusText: {
    marginLeft: 5,
    fontSize: 11.5,
    fontWeight: "600",
  },

  // ===================================================
  // SECURITY
  // ===================================================

  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    paddingHorizontal: 15,
  },

  securityText: {
    marginLeft: 6,
    fontSize: 11.5,
    color: "#6B7280",
    textAlign: "center",
  },

  headerLogo: {
    width: 34,
    height: 34,
  },
});
