import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../../firebase/firebaseConfig";

// =====================================================
// TYPES
// =====================================================

type ApprovalStatus = "pending" | "approved" | "rejected";

type Guide = {
  id: string;
  name?: string;
  email?: string;
  role?: string;

  approvalStatus?: ApprovalStatus;

  // Kept for compatibility with older records
  status?: ApprovalStatus;
};

// =====================================================
// ADMIN DASHBOARD
// =====================================================

export default function AdminDashboard() {
  const router = useRouter();

  // =====================================================
  // DASHBOARD COUNTS
  // =====================================================

  const [totalStudents, setTotalStudents] = useState(0);

  const [totalGuides, setTotalGuides] = useState(0);

  const [submittedProjects, setSubmittedProjects] = useState(0);

  const [approvedProjects, setApprovedProjects] = useState(0);

  // =====================================================
  // PENDING GUIDE REQUESTS
  // =====================================================

  const [pendingGuides, setPendingGuides] = useState<Guide[]>([]);

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [processingGuide, setProcessingGuide] = useState<string | null>(null);

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {
    try {
      // =================================================
      // CHECK AUTHENTICATION FIRST
      // =================================================

      if (!auth.currentUser) {
        console.log("⏭️ Skipping dashboard load - no authenticated user");

        return;
      }

      if (!refreshing) {
        setLoading(true);
      }

      // =================================================
      // GET ALL USERS
      // =================================================

      const usersSnapshot = await getDocs(collection(db, "users"));

      let students = 0;
      let approvedGuides = 0;

      const pendingGuideList: Guide[] = [];

      // =================================================
      // PROCESS USERS
      // =================================================

      usersSnapshot.forEach((userDoc) => {
        const user = userDoc.data();

        // ---------------------------------------------
        // STUDENT
        // ---------------------------------------------

        if (user.role === "student") {
          students++;
        }

        // ---------------------------------------------
        // GUIDE
        // ---------------------------------------------

        if (user.role === "guide") {
          const approvalStatus = user.approvalStatus ?? user.status;

          // APPROVED GUIDE

          if (approvalStatus === "approved") {
            approvedGuides++;
          }

          // PENDING GUIDE

          if (approvalStatus === "pending") {
            pendingGuideList.push({
              id: userDoc.id,

              ...user,
            } as Guide);
          }
        }
      });

      // =================================================
      // SET COUNTS
      // =================================================

      setTotalStudents(students);

      setTotalGuides(approvedGuides);

      setPendingGuides(pendingGuideList);

      // =================================================
      // SUBMITTED PROJECTS
      // =================================================

      const submittedQuery = query(
        collection(db, "projects"),
        where("status", "==", "submitted"),
      );

      const submittedSnapshot = await getDocs(submittedQuery);

      setSubmittedProjects(submittedSnapshot.size);

      // =================================================
      // APPROVED PROJECTS
      // =================================================

      const approvedQuery = query(
        collection(db, "projects"),
        where("status", "==", "approved"),
      );

      const approvedSnapshot = await getDocs(approvedQuery);

      setApprovedProjects(approvedSnapshot.size);

      // =================================================
      // DEBUG
      // =================================================

      console.log("=================================");

      console.log("ADMIN DASHBOARD");

      console.log("Students:", students);

      console.log("Approved Guides:", approvedGuides);

      console.log("Pending Guides:", pendingGuideList.length);

      console.log("Submitted Projects:", submittedSnapshot.size);

      console.log("Approved Projects:", approvedSnapshot.size);

      console.log("=================================");
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
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
  // PULL TO REFRESH
  // =====================================================

  const handleRefresh = () => {
    setRefreshing(true);

    loadDashboard();
  };

  // =====================================================
  // APPROVE GUIDE
  // =====================================================

  const approveGuide = async (guideId: string) => {
    try {
      setProcessingGuide(guideId);

      await updateDoc(doc(db, "users", guideId), {
        approvalStatus: "approved",

        // Keep old field synchronized
        status: "approved",
      });

      // Remove immediately from pending list
      setPendingGuides((currentGuides) =>
        currentGuides.filter((guide) => guide.id !== guideId),
      );

      // Refresh counts
      await loadDashboard();

      Alert.alert("Guide Approved", "The guide can now log in.");
    } catch (error) {
      console.error("Error approving guide:", error);

      Alert.alert("Error", "Unable to approve guide.");
    } finally {
      setProcessingGuide(null);
    }
  };

  // =====================================================
  // REJECT GUIDE
  // =====================================================

  const rejectGuide = async (guideId: string) => {
    try {
      setProcessingGuide(guideId);

      await updateDoc(doc(db, "users", guideId), {
        approvalStatus: "rejected",

        // Keep old field synchronized
        status: "rejected",
      });

      // Remove immediately from pending list
      setPendingGuides((currentGuides) =>
        currentGuides.filter((guide) => guide.id !== guideId),
      );

      // Refresh counts
      await loadDashboard();

      Alert.alert("Guide Rejected", "The guide request has been rejected.");
    } catch (error) {
      console.error("Error rejecting guide:", error);

      Alert.alert("Error", "Unable to reject guide.");
    } finally {
      setProcessingGuide(null);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
  try {
    console.log("Logging out...");

    await auth.signOut();

    console.log("Admin logged out");

    router.replace("/");

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    Alert.alert(
      "Logout Error",
      "Unable to logout. Please try again."
    );
  }
};
  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIcon}>
          <Ionicons name="shield-checkmark-outline" size={30} color="#4338CA" />
        </View>

        <ActivityIndicator size="small" color="#4338CA" />

        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
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
            <View style={styles.headerIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={25}
                color="#4338CA"
              />
            </View>

            <View>
              <Text style={styles.title}>Admin Dashboard</Text>

              <Text style={styles.subtitle}>Manage ProjectVerse</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#4338CA" />
          </TouchableOpacity>
        </View>

        {/* =================================================
            OVERVIEW HEADER
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Overview</Text>

            <Text style={styles.sectionSubtitle}>
              Current ProjectVerse statistics
            </Text>
          </View>
        </View>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <View style={styles.statsGrid}>
          {/* ===============================================
              STUDENTS
          =============================================== */}

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.mintIcon]}>
              <Ionicons name="people-outline" size={23} color="#0F766E" />
            </View>

            <Text style={styles.statNumber}>{totalStudents}</Text>

            <Text style={styles.statLabel}>Students</Text>

            <View style={styles.statFooter}>
              <Ionicons name="person-outline" size={13} color="#0F766E" />

              <Text style={styles.statFooterText}>Registered</Text>
            </View>
          </View>

          {/* ===============================================
              GUIDES
          =============================================== */}

          <View style={styles.statCard}>
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

              <Text style={styles.statFooterText}>Approved</Text>
            </View>
          </View>

          {/* ===============================================
              SUBMITTED PROJECTS
          =============================================== */}

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

          {/* ===============================================
              APPROVED PROJECTS
          =============================================== */}

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
            GUIDE APPROVAL SECTION
        ================================================= */}

        <View style={styles.approvalHeader}>
          <View>
            <Text style={styles.sectionTitle}>Guide Approval</Text>

            <Text style={styles.sectionSubtitle}>
              Review new guide registrations
            </Text>
          </View>

          <View
            style={
              pendingGuides.length > 0
                ? styles.pendingBadge
                : styles.approvedBadge
            }
          >
            <Ionicons
              name={
                pendingGuides.length > 0
                  ? "time-outline"
                  : "checkmark-circle-outline"
              }
              size={14}
              color={pendingGuides.length > 0 ? "#B45309" : "#15803D"}
            />

            <Text
              style={
                pendingGuides.length > 0
                  ? styles.pendingBadgeText
                  : styles.approvedBadgeText
              }
            >
              {pendingGuides.length > 0
                ? `${pendingGuides.length} Pending`
                : "All Clear"}
            </Text>
          </View>
        </View>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {pendingGuides.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-done-outline"
                size={30}
                color="#0F766E"
              />
            </View>

            <Text style={styles.emptyTitle}>No Pending Requests</Text>

            <Text style={styles.emptyText}>
              There are no guide approval requests at the moment.
            </Text>
          </View>
        ) : (
          /* =================================================
             PENDING GUIDE LIST
          ================================================= */

          pendingGuides.map((guide) => (
            <View key={guide.id} style={styles.guideCard}>
              {/* =========================================
                    GUIDE INFORMATION
                ========================================= */}

              <View style={styles.guideInfo}>
                <View style={styles.guideAvatar}>
                  <Ionicons name="person-outline" size={23} color="#4338CA" />
                </View>

                <View style={styles.guideDetails}>
                  <Text style={styles.guideName}>{guide.name || "Guide"}</Text>

                  <View style={styles.emailRow}>
                    <Ionicons name="mail-outline" size={14} color="#6B7280" />

                    <Text style={styles.guideEmail}>
                      {guide.email || "No email"}
                    </Text>
                  </View>

                  <View style={styles.pendingStatus}>
                    <Ionicons name="time-outline" size={14} color="#B45309" />

                    <Text style={styles.pendingStatusText}>
                      Waiting for admin approval
                    </Text>
                  </View>
                </View>
              </View>

              {/* =========================================
                    DIVIDER
                ========================================= */}

              <View style={styles.divider} />

              {/* =========================================
                    ACTION BUTTONS
                ========================================= */}

              <View style={styles.actionRow}>
                {/* ---------------------------------------
                      REJECT
                  --------------------------------------- */}

                <TouchableOpacity
                  style={styles.rejectButton}
                  activeOpacity={0.75}
                  disabled={processingGuide === guide.id}
                  onPress={() => rejectGuide(guide.id)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={19}
                    color="#DC2626"
                  />

                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                {/* ---------------------------------------
                      APPROVE
                  --------------------------------------- */}

                <TouchableOpacity
                  style={styles.approveButton}
                  activeOpacity={0.8}
                  disabled={processingGuide === guide.id}
                  onPress={() => approveGuide(guide.id)}
                >
                  {processingGuide === guide.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                  )}

                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* =================================================
            FOOTER INFORMATION
        ================================================= */}

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />

          <Text style={styles.securityText}>
            Only approved guides can access the Guide module.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
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
    letterSpacing: -0.3,
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
    fontSize: 11,
    color: "#6B7280",
  },

  // ===================================================
  // GUIDE APPROVAL HEADER
  // ===================================================

  approvalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  pendingBadgeText: {
    marginLeft: 4,
    fontSize: 11.5,
    fontWeight: "700",
    color: "#B45309",
  },

  approvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  approvedBadgeText: {
    marginLeft: 4,
    fontSize: 11.5,
    fontWeight: "700",
    color: "#15803D",
  },

  // ===================================================
  // EMPTY STATE
  // ===================================================

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingVertical: 32,
    paddingHorizontal: 24,
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

  // ===================================================
  // GUIDE CARD
  // ===================================================

  guideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  guideInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  guideAvatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  guideDetails: {
    flex: 1,
  },

  guideName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  guideEmail: {
    marginLeft: 5,
    fontSize: 12.5,
    color: "#6B7280",
    flexShrink: 1,
  },

  pendingStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  pendingStatusText: {
    marginLeft: 4,
    fontSize: 11.5,
    fontWeight: "500",
    color: "#B45309",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF0F4",
    marginTop: 16,
    marginBottom: 14,
  },

  // ===================================================
  // ACTION BUTTONS
  // ===================================================

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

  // ===================================================
  // SECURITY NOTE
  // ===================================================

  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 15,
  },

  securityText: {
    marginLeft: 6,
    fontSize: 11.5,
    color: "#6B7280",
    textAlign: "center",
  },
});
