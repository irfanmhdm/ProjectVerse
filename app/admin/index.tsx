import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db, auth } from "../../firebase/firebaseConfig";


// =====================================================
// TYPES
// =====================================================

type Guide = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
};


// =====================================================
// ADMIN DASHBOARD
// =====================================================

export default function AdminDashboard() {

  const router = useRouter();

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalGuides, setTotalGuides] = useState(0);
  const [submittedProjects, setSubmittedProjects] = useState(0);
  const [approvedProjects, setApprovedProjects] = useState(0);

  const [pendingGuides, setPendingGuides] = useState<Guide[]>([]);

  const [loading, setLoading] = useState(true);
  const [processingGuide, setProcessingGuide] = useState<string | null>(null);


  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const loadDashboard = async () => {

    try {

      setLoading(true);

      // -----------------------------------------------
      // GET USERS
      // -----------------------------------------------

      const usersSnapshot = await getDocs(
        collection(db, "users")
      );

      let students = 0;
      let guides = 0;

      usersSnapshot.forEach((userDoc) => {

        const user = userDoc.data();

        if (user.role === "student") {
          students++;
        }

        if (user.role === "guide") {
          guides++;
        }

      });

      setTotalStudents(students);
      setTotalGuides(guides);


      // -----------------------------------------------
      // SUBMITTED PROJECTS
      // -----------------------------------------------

      const submittedQuery = query(
        collection(db, "projects"),
        where("status", "==", "submitted")
      );

      const submittedSnapshot = await getDocs(
        submittedQuery
      );

      setSubmittedProjects(submittedSnapshot.size);


      // -----------------------------------------------
      // APPROVED PROJECTS
      // -----------------------------------------------

      const approvedQuery = query(
        collection(db, "projects"),
        where("status", "==", "approved")
      );

      const approvedSnapshot = await getDocs(
        approvedQuery
      );

      setApprovedProjects(approvedSnapshot.size);


      // -----------------------------------------------
      // PENDING GUIDES
      // -----------------------------------------------

      const pendingGuideQuery = query(
        collection(db, "users"),
        where("role", "==", "guide"),
        where("status", "==", "pending")
      );

      const pendingGuideSnapshot = await getDocs(
        pendingGuideQuery
      );

      const guidesList: Guide[] = [];

      pendingGuideSnapshot.forEach((guideDoc) => {

        guidesList.push({
          id: guideDoc.id,
          ...guideDoc.data(),
        } as Guide);

      });

      setPendingGuides(guidesList);

    } catch (error) {

      console.error(
        "Error loading admin dashboard:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load admin dashboard."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // LOAD WHEN SCREEN OPENS
  // =====================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  // =====================================================
  // APPROVE GUIDE
  // =====================================================

  const approveGuide = async (guideId: string) => {

    try {

      setProcessingGuide(guideId);

      await updateDoc(
        doc(db, "users", guideId),
        {
          status: "approved",
        }
      );

      Alert.alert(
        "Guide Approved",
        "The guide can now log in."
      );

      await loadDashboard();

    } catch (error) {

      console.error(
        "Error approving guide:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to approve guide."
      );

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

      await updateDoc(
        doc(db, "users", guideId),
        {
          status: "rejected",
        }
      );

      Alert.alert(
        "Guide Rejected",
        "The guide request has been rejected."
      );

      await loadDashboard();

    } catch (error) {

      console.error(
        "Error rejecting guide:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to reject guide."
      );

    } finally {

      setProcessingGuide(null);

    }

  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {

    try {

      await auth.signOut();

      router.replace("/login");

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    }

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
          Loading dashboard...
        </Text>

      </View>
    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* ============================================
            HEADER
        ============================================ */}

        <View style={styles.header}>

          <View>

            <Text style={styles.title}>
              Admin Dashboard
            </Text>

            <Text style={styles.subtitle}>
              Manage ProjectVerse
            </Text>

          </View>


          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >

            <Ionicons
              name="log-out-outline"
              size={22}
              color="#4338CA"
            />

          </TouchableOpacity>

        </View>


        {/* ============================================
            STATISTICS
        ============================================ */}

        <Text style={styles.sectionTitle}>
          Overview
        </Text>


        <View style={styles.statsGrid}>

          {/* STUDENTS */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.iconContainer,
                styles.mintIcon,
              ]}
            >

              <Ionicons
                name="people-outline"
                size={25}
                color="#0F766E"
              />

            </View>

            <Text style={styles.statNumber}>
              {totalStudents}
            </Text>

            <Text style={styles.statLabel}>
              Students
            </Text>

          </View>


          {/* GUIDES */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.iconContainer,
                styles.indigoIcon,
              ]}
            >

              <Ionicons
                name="school-outline"
                size={25}
                color="#4338CA"
              />

            </View>

            <Text style={styles.statNumber}>
              {totalGuides}
            </Text>

            <Text style={styles.statLabel}>
              Guides
            </Text>

          </View>


          {/* SUBMITTED */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.iconContainer,
                styles.orangeIcon,
              ]}
            >

              <Ionicons
                name="document-text-outline"
                size={25}
                color="#C2410C"
              />

            </View>

            <Text style={styles.statNumber}>
              {submittedProjects}
            </Text>

            <Text style={styles.statLabel}>
              Submitted Projects
            </Text>

          </View>


          {/* APPROVED */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.iconContainer,
                styles.greenIcon,
              ]}
            >

              <Ionicons
                name="checkmark-circle-outline"
                size={25}
                color="#15803D"
              />

            </View>

            <Text style={styles.statNumber}>
              {approvedProjects}
            </Text>

            <Text style={styles.statLabel}>
              Approved Projects
            </Text>

          </View>

        </View>


        {/* ============================================
            GUIDE APPROVAL
        ============================================ */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Guide Approval
          </Text>

          <View style={styles.pendingBadge}>

            <Text style={styles.pendingBadgeText}>
              {pendingGuides.length} Pending
            </Text>

          </View>

        </View>


        {pendingGuides.length === 0 ? (

          <View style={styles.emptyCard}>

            <Ionicons
              name="checkmark-done-outline"
              size={42}
              color="#0F766E"
            />

            <Text style={styles.emptyTitle}>
              No Pending Requests
            </Text>

            <Text style={styles.emptyText}>
              There are no guide approval requests at the moment.
            </Text>

          </View>

        ) : (

          pendingGuides.map((guide) => (

            <View
              key={guide.id}
              style={styles.guideCard}
            >

              <View style={styles.guideInfo}>

                <View style={styles.guideIcon}>

                  <Ionicons
                    name="person-outline"
                    size={24}
                    color="#4338CA"
                  />

                </View>


                <View style={styles.guideDetails}>

                  <Text style={styles.guideName}>
                    {guide.name || "Guide"}
                  </Text>

                  <Text style={styles.guideEmail}>
                    {guide.email || "No email"}
                  </Text>

                  <View style={styles.pendingStatus}>

                    <Ionicons
                      name="time-outline"
                      size={14}
                      color="#C2410C"
                    />

                    <Text style={styles.pendingStatusText}>
                      Pending approval
                    </Text>

                  </View>

                </View>

              </View>


              {/* ACTIONS */}

              <View style={styles.actionRow}>

                <TouchableOpacity
                  style={styles.rejectButton}
                  disabled={processingGuide === guide.id}
                  onPress={() => rejectGuide(guide.id)}
                >

                  <Ionicons
                    name="close-outline"
                    size={19}
                    color="#DC2626"
                  />

                  <Text style={styles.rejectText}>
                    Reject
                  </Text>

                </TouchableOpacity>


                <TouchableOpacity
                  style={styles.approveButton}
                  disabled={processingGuide === guide.id}
                  onPress={() => approveGuide(guide.id)}
                >

                  {processingGuide === guide.id ? (

                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                  ) : (

                    <Ionicons
                      name="checkmark-outline"
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

      </ScrollView>

    </View>

  );

}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
  },

  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  mintIcon: {
    backgroundColor: "#D5F5F2",
  },

  indigoIcon: {
    backgroundColor: "#E0E7FF",
  },

  orangeIcon: {
    backgroundColor: "#FFEDD5",
  },

  greenIcon: {
    backgroundColor: "#DCFCE7",
  },

  statNumber: {
    fontSize: 25,
    fontWeight: "700",
    color: "#1F2937",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },

  guideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  guideInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  guideIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  guideDetails: {
    flex: 1,
  },

  guideName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  guideEmail: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
  },

  pendingStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  pendingStatusText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#C2410C",
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },

  rejectButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  rejectText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },

  approveButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  approveText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

});