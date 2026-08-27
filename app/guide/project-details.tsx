import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
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

  studentId?: string;
  studentName?: string;
  studentEmail?: string;

  githubUrl?: string;

  liveDemoUrl?: string;

  reportUrl?: string;
  reportName?: string;
  reportPath?: string;

  videoUrl?: string;
  videoName?: string;

  screenshotUrls?: string[];

  status?: string;
};

export default function GuideProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // ======================================================
  // LOAD PROJECT
  // ======================================================

  useEffect(() => {
    const loadProject = async () => {
      try {
        console.log("📌 Guide Project ID:", id);

        if (!id || typeof id !== "string") {
          console.log("❌ Project ID is missing");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching project with ID:", id);

        const projectRef = doc(db, "projects", id);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data = projectSnap.data();

          console.log("✅ Project found:", data);

          setProject({
            title: data.title || "Untitled Project",

            description:
              data.description || "No description available.",

            domain:
              data.domain || "Not specified",

            technologies:
              data.technologies || "Not specified",

            studentId:
              data.studentId || "",

            studentName:
              data.studentName || "Unknown Student",

            studentEmail:
              data.studentEmail || "",

            githubUrl:
              data.githubUrl || "",

            liveDemoUrl:
              data.liveDemoUrl || "",

            reportUrl:
              data.reportUrl || "",

            reportName:
              data.reportName || "",

            reportPath:
              data.reportPath || "",

            videoUrl:
              data.videoUrl || "",

            videoName:
              data.videoName || "",

            screenshotUrls:
              Array.isArray(data.screenshotUrls)
                ? data.screenshotUrls
                : [],

            status:
              data.status || "pending",
          });
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

  // ======================================================
  // OPEN URL
  // ======================================================

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Unable to Open",
          "This link cannot be opened."
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.log("❌ Error opening URL:", error);

      Alert.alert(
        "Error",
        "Something went wrong while opening the link."
      );
    }
  };

  // ======================================================
  // UPDATE STATUS
  // ======================================================

  const updateStatus = async (newStatus: string) => {
    if (!id || typeof id !== "string") {
      Alert.alert(
        "Error",
        "Project ID is missing."
      );
      return;
    }

    try {
      setUpdating(true);

      console.log(
        "🔄 Updating project status:",
        newStatus
      );

      const projectRef = doc(
        db,
        "projects",
        id
      );

      await updateDoc(projectRef, {
        status: newStatus,
      });

      console.log(
        "✅ Project status updated:",
        newStatus
      );

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
        `Project has been ${formatStatus(newStatus).toLowerCase()}.`
      );
    } catch (error: any) {
      console.log(
        "❌ Error updating project status:",
        error
      );

      Alert.alert(
        "Update Failed",
        "Unable to update the project status. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  // ======================================================
  // CONFIRM STATUS CHANGE
  // ======================================================

  const confirmStatusChange = (
    newStatus: string
  ) => {
    let title = "";
    let message = "";

    if (newStatus === "approved") {
      title = "Approve Project";
      message =
        "Are you sure you want to approve this project?";
    }

    if (newStatus === "revision_required") {
      title = "Request Revision";
      message =
        "Are you sure you want to request a revision for this project?";
    }

    if (newStatus === "rejected") {
      title = "Reject Project";
      message =
        "Are you sure you want to reject this project?";
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () =>
            updateStatus(newStatus),
        },
      ]
    );
  };

  // ======================================================
  // FORMAT STATUS
  // ======================================================

  const formatStatus = (
    status?: string
  ) => {
    if (!status) {
      return "Pending";
    }

    if (status === "revision_required") {
      return "Revision Required";
    }

    return status
      .replace("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  // ======================================================
  // STATUS STYLE
  // ======================================================

  const getStatusStyle = (
    status?: string
  ) => {
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

  // ======================================================
  // LOADING
  // ======================================================

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

  // ======================================================
  // PROJECT NOT FOUND
  // ======================================================

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

  // ======================================================
  // MAIN SCREEN
  // ======================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ================================================== */}
      {/* BACK */}
      {/* ================================================== */}

      <Pressable
        onPress={() => router.back()}
        style={styles.backLink}
      >
        <Text style={styles.backLinkText}>
          ← Back to Projects
        </Text>
      </Pressable>

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <View style={styles.headerCard}>
        <Text style={styles.title}>
          {project.title}
        </Text>

        {project.studentName ? (
          <Text style={styles.studentName}>
            👨‍🎓 {project.studentName}
          </Text>
        ) : null}

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

      {/* ================================================== */}
      {/* DESCRIPTION */}
      {/* ================================================== */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Project Description
        </Text>

        <Text style={styles.description}>
          {project.description}
        </Text>
      </View>

      {/* ================================================== */}
      {/* PROJECT INFORMATION */}
      {/* ================================================== */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Project Information
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Domain
          </Text>

          <Text style={styles.value}>
            {project.domain}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Technologies
          </Text>

          <Text style={styles.value}>
            {project.technologies}
          </Text>
        </View>

        {project.studentEmail ? (
          <>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>
                Student Email
              </Text>

              <Text style={styles.value}>
                {project.studentEmail}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {/* ================================================== */}
      {/* PROJECT DEMO */}
      {/* ================================================== */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Project Demo
        </Text>

        <Text style={styles.sectionDescription}>
          Review the student's project using the
          available demonstration materials.
        </Text>

        {/* LIVE DEMO */}

        {project.liveDemoUrl ? (
          <Pressable
            style={styles.liveDemoButton}
            onPress={() =>
              openUrl(project.liveDemoUrl!)
            }
          >
            <Text style={styles.liveDemoButtonText}>
              🌐 Open Live Demo
            </Text>
          </Pressable>
        ) : (
          <View style={styles.unavailableBox}>
            <Text style={styles.unavailableTitle}>
              Live Demo
            </Text>

            <Text style={styles.notAvailable}>
              No live demo link provided.
            </Text>
          </View>
        )}

        {/* VIDEO */}

        {project.videoUrl ? (
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>
              🎥 Video Demonstration
            </Text>

            {project.videoName ? (
              <Text style={styles.fileName}>
                {project.videoName}
              </Text>
            ) : null}

            <Pressable
              style={styles.videoButton}
              onPress={() =>
                openUrl(project.videoUrl!)
              }
            >
              <Text style={styles.videoButtonText}>
                ▶ Watch Project Video
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* SCREENSHOTS */}

        {project.screenshotUrls &&
        project.screenshotUrls.length > 0 ? (
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>
              🖼️ Project Screenshots
            </Text>

            <Text style={styles.screenshotCount}>
              {project.screenshotUrls.length} screenshot
              {project.screenshotUrls.length !== 1
                ? "s"
                : ""}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.screenshotScroll}
            >
              {project.screenshotUrls.map(
                (url, index) => (
                  <Pressable
                    key={`${url}-${index}`}
                    onPress={() =>
                      openUrl(url)
                    }
                    style={styles.screenshotCard}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.screenshot}
                      resizeMode="cover"
                    />

                    <Text
                      style={styles.screenshotNumber}
                    >
                      Screenshot {index + 1}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>
          </View>
        ) : null}

        {/* NOTHING AVAILABLE */}

        {!project.liveDemoUrl &&
        !project.videoUrl &&
        (!project.screenshotUrls ||
          project.screenshotUrls.length === 0) ? (
          <View style={styles.noDemoBox}>
            <Text style={styles.noDemoTitle}>
              No Demo Materials
            </Text>

            <Text style={styles.notAvailable}>
              The student has not provided a live
              demo, video, or screenshots.
            </Text>
          </View>
        ) : null}
      </View>

      {/* ================================================== */}
      {/* REPORT */}
      {/* ================================================== */}

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

            {project.reportName ? (
              <Text style={styles.fileName}>
                {project.reportName}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.notAvailable}>
            No report available.
          </Text>
        )}
      </View>

      {/* ================================================== */}
      {/* GITHUB */}
      {/* ================================================== */}

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

      {/* ================================================== */}
      {/* GUIDE REVIEW */}
      {/* ================================================== */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Guide Review
        </Text>

        <Text style={styles.reviewText}>
          Review the project carefully using the
          submitted materials and choose the
          appropriate action.
        </Text>

        {/* APPROVE */}

        <Pressable
          style={[
            styles.actionButton,
            styles.approveButton,
          ]}
          disabled={updating}
          onPress={() =>
            confirmStatusChange(
              "approved"
            )
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
            confirmStatusChange(
              "revision_required"
            )
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
            confirmStatusChange(
              "rejected"
            )
          }
        >
          <Text style={styles.actionButtonText}>
            ✕ Reject Project
          </Text>
        </Pressable>

        {updating ? (
          <View style={styles.updatingContainer}>
            <ActivityIndicator
              size="small"
              color="#2563EB"
            />

            <Text style={styles.updatingText}>
              Updating project status...
            </Text>
          </View>
        ) : null}
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
    paddingBottom: 50,
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
    marginBottom: 7,
  },

  studentName: {
    fontSize: 14,
    color: "#2563EB",
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

  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 15,
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

  // ====================================================
  // DEMO
  // ====================================================

  liveDemoButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  liveDemoButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  unavailableBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  unavailableTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
  },

  demoItem: {
    marginTop: 18,
  },

  demoLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5,
  },

  screenshotCount: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 10,
  },

  videoButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 10,
  },

  videoButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "bold",
  },

  screenshotScroll: {
    marginTop: 5,
  },

  screenshotCard: {
    width: 220,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  screenshot: {
    width: 220,
    height: 140,
  },

  screenshotNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    padding: 9,
  },

  noDemoBox: {
    backgroundColor: "#FFF7ED",
    borderRadius: 10,
    padding: 14,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },

  noDemoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#9A3412",
    marginBottom: 5,
  },

  // ====================================================
  // REPORT
  // ====================================================

  reportButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  reportButtonText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },

  fileName: {
    marginTop: 8,
    color: "#6B7280",
    fontSize: 12,
  },

  // ====================================================
  // GITHUB
  // ====================================================

  githubButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  githubButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  notAvailable: {
    color: "#9CA3AF",
    fontSize: 14,
  },

  // ====================================================
  // REVIEW
  // ====================================================

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