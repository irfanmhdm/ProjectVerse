import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { db } from "../../firebase/firebaseConfig";

type Project = {
  title?: string;
  description?: string;
  domain?: string;
  technologies?: string;
  githubUrl?: string;
  reportUrl?: string;
  reportName?: string;
  status?: string;
  studentId?: string;
};

export default function GuideProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // ==========================================
  // LOAD PROJECT
  // ==========================================

  useEffect(() => {
    const loadProject = async () => {
      try {
        console.log("📌 Guide Project ID:", id);

        if (!id || typeof id !== "string") {
          console.log("❌ Project ID is missing");
          setLoading(false);
          return;
        }

        const projectRef = doc(db, "projects", id);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          console.log("✅ Project found");

          setProject(projectSnap.data() as Project);
        } else {
          console.log("❌ Project not found");
        }
      } catch (error) {
        console.log("❌ Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  // ==========================================
  // UPDATE PROJECT STATUS
  // ==========================================

  const updateStatus = async (newStatus: string) => {
    if (!id || typeof id !== "string") {
      Alert.alert("Error", "Project ID is missing.");
      return;
    }

    try {
      setUpdating(true);

      const projectRef = doc(db, "projects", id);

      await updateDoc(projectRef, {
        status: newStatus,
      });

      setProject((previousProject) => {
        if (!previousProject) {
          return previousProject;
        }

        return {
          ...previousProject,
          status: newStatus,
        };
      });

      Alert.alert(
        "Success",
        `Project status updated to "${formatStatus(newStatus)}".`
      );
    } catch (error) {
      console.log("❌ Error updating status:", error);

      Alert.alert(
        "Update Failed",
        "Unable to update the project status."
      );
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // CONFIRM STATUS CHANGE
  // ==========================================

  const confirmStatusChange = (newStatus: string) => {
    const message =
      newStatus === "approved"
        ? "Are you sure you want to approve this project?"
        : newStatus === "revision_required"
        ? "Do you want to request a revision for this project?"
        : "Are you sure you want to reject this project?";

    Alert.alert(
      formatStatus(newStatus),
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () => updateStatus(newStatus),
        },
      ]
    );
  };

  // ==========================================
  // OPEN URL
  // ==========================================

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link.");
      }
    } catch (error) {
      console.log("❌ Error opening URL:", error);
    }
  };

  // ==========================================
  // FORMAT STATUS
  // ==========================================

  const formatStatus = (status?: string) => {
    if (!status) {
      return "Pending";
    }

    if (status === "revision_required") {
      return "Revision Required";
    }

    return status
      .replace("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return styles.approved;

      case "revision_required":
        return styles.revision;

      case "rejected":
        return styles.rejected;

      default:
        return styles.pending;
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading project...
        </Text>
      </View>
    );
  }

  // ==========================================
  // PROJECT NOT FOUND
  // ==========================================

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notFoundTitle}>
          Project Not Found
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  // ==========================================
  // MAIN SCREEN
  // ==========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* BACK */}

      <Pressable
        onPress={() => router.back()}
        style={styles.backLink}
      >
        <Text style={styles.backLinkText}>
          ← Back to Projects
        </Text>
      </Pressable>

      {/* HEADER */}

      <View style={styles.headerCard}>
        <Text style={styles.title}>
          {project.title || "Untitled Project"}
        </Text>

        <View
          style={[
            styles.statusBadge,
            getStatusStyle(project.status),
          ]}
        >
          <Text style={styles.statusText}>
            {formatStatus(project.status)}
          </Text>
        </View>
      </View>

      {/* DESCRIPTION */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Project Description
        </Text>

        <Text style={styles.description}>
          {project.description ||
            "No description available."}
        </Text>
      </View>

      {/* INFORMATION */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Project Information
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Domain
          </Text>

          <Text style={styles.value}>
            {project.domain || "Not specified"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Technologies
          </Text>

          <Text style={styles.value}>
            {project.technologies || "Not specified"}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Student ID
          </Text>

          <Text style={styles.value}>
            {project.studentId || "Not available"}
          </Text>
        </View>
      </View>

      {/* REPORT */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Project Report
        </Text>

        {project.reportUrl ? (
          <>
            <Pressable
              style={styles.reportButton}
              onPress={() =>
                openUrl(project.reportUrl!)
              }
            >
              <Text style={styles.reportButtonText}>
                📄 View Project Report
              </Text>
            </Pressable>

            {project.reportName && (
              <Text style={styles.fileName}>
                {project.reportName}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.notAvailable}>
            No report available.
          </Text>
        )}
      </View>

      {/* GITHUB */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Source Code
        </Text>

        {project.githubUrl ? (
          <Pressable
            style={styles.githubButton}
            onPress={() =>
              openUrl(project.githubUrl!)
            }
          >
            <Text style={styles.githubButtonText}>
              GitHub ↗
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.notAvailable}>
            No GitHub repository available.
          </Text>
        )}
      </View>

      {/* GUIDE REVIEW */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Guide Review
        </Text>

        <Text style={styles.reviewText}>
          Review the submitted project and choose
          the appropriate action.
        </Text>

        {/* APPROVE */}

        <Pressable
          style={[
            styles.actionButton,
            styles.approveButton,
          ]}
          disabled={updating}
          onPress={() =>
            confirmStatusChange("approved")
          }
        >
          <Text style={styles.actionButtonText}>
            ✓ Approve Project
          </Text>
        </Pressable>

        {/* REVISION */}

        <Pressable
          style={[
            styles.actionButton,
            styles.revisionButton,
          ]}
          disabled={updating}
          onPress={() =>
            confirmStatusChange("revision_required")
          }
        >
          <Text style={styles.actionButtonText}>
            ↻ Request Revision
          </Text>
        </Pressable>

        {/* REJECT */}

        <Pressable
          style={[
            styles.actionButton,
            styles.rejectButton,
          ]}
          disabled={updating}
          onPress={() =>
            confirmStatusChange("rejected")
          }
        >
          <Text style={styles.actionButtonText}>
            ✕ Reject Project
          </Text>
        </Pressable>

        {updating && (
          <View style={styles.updatingContainer}>
            <ActivityIndicator
              size="small"
              color="#2563EB"
            />

            <Text style={styles.updatingText}>
              Updating project status...
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  notFoundTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  backLink: {
    marginBottom: 15,
  },

  backLinkText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },

  pending: {
    backgroundColor: "#D97706",
  },

  approved: {
    backgroundColor: "#16A34A",
  },

  revision: {
    backgroundColor: "#EA580C",
  },

  rejected: {
    backgroundColor: "#DC2626",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#4B5563",
  },

  infoRow: {
    paddingVertical: 5,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    color: "#111827",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  reportButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingVertical: 13,
  },

  reportButtonText: {
    textAlign: "center",
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },

  fileName: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 12,
  },

  githubButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 13,
  },

  githubButtonText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  notAvailable: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  reviewText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },

  actionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  approveButton: {
    backgroundColor: "#16A34A",
  },

  revisionButton: {
    backgroundColor: "#EA580C",
  },

  rejectButton: {
    backgroundColor: "#DC2626",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  updatingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  updatingText: {
    marginLeft: 8,
    color: "#6B7280",
    fontSize: 13,
  },
});