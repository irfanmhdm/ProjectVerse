import { doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
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

  githubUrl?: string;

  liveDemoUrl?: string;

  reportUrl?: string;
  reportName?: string;
  reportPath?: string;

  videoUrl?: string;
  videoName?: string;

  screenshotUrls?: string[];

  status?: string;
  createdAt?: any;
};

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH PROJECT
  // =====================================================

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (!id || typeof id !== "string") {
          console.log("❌ Project ID is missing");
          setLoading(false);
          return;
        }

        console.log("🔍 Fetching project with ID:", id);

        const projectRef = doc(db, "projects", id);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          console.log("✅ Project found");

          setProject(projectSnap.data() as Project);
        } else {
          console.log("❌ Project not found");
        }
      } catch (error) {
        console.log("❌ Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // =====================================================
  // OPEN URL
  // =====================================================

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("❌ Cannot open URL:", url);
      }
    } catch (error) {
      console.log("❌ Error opening URL:", error);
    }
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return styles.approved;

      case "revision_required":
      case "revision required":
        return styles.revision;

      case "rejected":
        return styles.rejected;

      default:
        return styles.pending;
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F7D4F" />

        <Text style={styles.loadingText}>
          Loading project...
        </Text>
      </View>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!project) {
    return (
      <View style={styles.loadingContainer}>
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

  // =====================================================
  // MAIN SCREEN
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >

      {/* =================================================
          BACK
      ================================================= */}

      <Pressable
        style={styles.backLink}
        onPress={() =>
          router.replace("/student/my-projects")
        }
      >
        <Text style={styles.backLinkText}>
          ← Back to My Projects
        </Text>
      </Pressable>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

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
            {project.status || "Pending"}
          </Text>
        </View>

      </View>

      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Project Description
        </Text>

        <Text style={styles.description}>
          {project.description ||
            "No description available."}
        </Text>

      </View>

      {/* =================================================
          PROJECT INFORMATION
      ================================================= */}

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
            {project.technologies ||
              "Not specified"}
          </Text>
        </View>

      </View>

      {/* =================================================
          PROJECT DEMONSTRATION
      ================================================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Project Demonstration
        </Text>

        <Text style={styles.sectionSubtitle}>
          View the project using the demonstration
          provided by the student.
        </Text>

        {/* LIVE DEMO */}

        {project.liveDemoUrl ? (
          <View style={styles.demoItem}>

            <Text style={styles.demoLabel}>
              🌐 Live Demo
            </Text>

            <Pressable
              style={styles.liveDemoButton}
              onPress={() =>
                openUrl(project.liveDemoUrl!)
              }
            >
              <Text style={styles.liveDemoButtonText}>
                Open Live Demo ↗
              </Text>
            </Pressable>

          </View>
        ) : null}

        {/* VIDEO */}

        {project.videoUrl ? (
          <View style={styles.demoItem}>

            <Text style={styles.demoLabel}>
              🎥 Demo Video
            </Text>

            <Pressable
              style={styles.videoButton}
              onPress={() =>
                openUrl(project.videoUrl!)
              }
            >
              <Text style={styles.videoButtonText}>
                Watch Demo Video ▶
              </Text>
            </Pressable>

            {project.videoName ? (
              <Text style={styles.fileName}>
                {project.videoName}
              </Text>
            ) : null}

          </View>
        ) : null}

        {/* SCREENSHOTS */}

        {project.screenshotUrls &&
        project.screenshotUrls.length > 0 ? (
          <View style={styles.demoItem}>

            <Text style={styles.demoLabel}>
              🖼 Screenshots
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.screenshotScroll}
            >
              {project.screenshotUrls.map(
                (url, index) => (
                  <Pressable
                    key={index}
                    onPress={() => openUrl(url)}
                  >
                    <Image
                      source={{ uri: url }}
                      style={styles.screenshot}
                    />
                  </Pressable>
                )
              )}
            </ScrollView>

            <Text style={styles.imageHint}>
              Tap an image to open it
            </Text>

          </View>
        ) : null}

        {/* NOTHING PROVIDED */}

        {!project.liveDemoUrl &&
        !project.videoUrl &&
        (!project.screenshotUrls ||
          project.screenshotUrls.length === 0) ? (
          <Text style={styles.notAvailable}>
            No project demonstration available.
          </Text>
        ) : null}

      </View>

      {/* =================================================
          PROJECT REPORT
      ================================================= */}

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

      {/* =================================================
          GITHUB
      ================================================= */}

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
              GitHub Repository ↗
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.notAvailable}>
            No GitHub repository available.
          </Text>
        )}

      </View>

      {/* =================================================
          GUIDE FEEDBACK
      ================================================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Guide Feedback
        </Text>

        <View style={styles.feedbackBox}>

          <Text style={styles.feedbackText}>
            Guide feedback will appear here after
            the project is reviewed.
          </Text>

        </View>

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
    backgroundColor: "#F4F8F3",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // ====================================================
  // LOADING
  // ====================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8F3",
  },

  loadingText: {
    marginTop: 12,
    color: "#718071",
    fontSize: 14,
  },

  notFoundTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#263626",
    marginBottom: 20,
  },

  // ====================================================
  // BACK
  // ====================================================

  backLink: {
    marginBottom: 20,
  },

  backLinkText: {
    color: "#4F7D4F",
    fontSize: 15,
    fontWeight: "600",
  },

  // ====================================================
  // HEADER
  // ====================================================

  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DDE7DB",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#263626",
    marginBottom: 12,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  pending: {
    backgroundColor: "#D99A28",
  },

  approved: {
    backgroundColor: "#4F8A4F",
  },

  revision: {
    backgroundColor: "#D46A32",
  },

  rejected: {
    backgroundColor: "#C94A4A",
  },

  // ====================================================
  // SECTION
  // ====================================================

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DDE7DB",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#263626",
    marginBottom: 12,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: "#718071",
    lineHeight: 19,
    marginBottom: 15,
  },

  // ====================================================
  // DESCRIPTION
  // ====================================================

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#536153",
  },

  // ====================================================
  // INFORMATION
  // ====================================================

  infoRow: {
    paddingVertical: 5,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A877A",
    marginBottom: 4,
  },

  value: {
    fontSize: 15,
    color: "#263626",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5EBE3",
    marginVertical: 12,
  },

  // ====================================================
  // DEMONSTRATION
  // ====================================================

  demoItem: {
    marginBottom: 20,
  },

  demoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#263626",
    marginBottom: 9,
  },

  liveDemoButton: {
    backgroundColor: "#E7F1E5",
    borderWidth: 1,
    borderColor: "#B8D0B5",
    borderRadius: 10,
    paddingVertical: 13,
  },

  liveDemoButtonText: {
    textAlign: "center",
    color: "#315C31",
    fontSize: 14,
    fontWeight: "600",
  },

  videoButton: {
    backgroundColor: "#263626",
    borderRadius: 10,
    paddingVertical: 13,
  },

  videoButtonText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  screenshotScroll: {
    marginTop: 4,
  },

  screenshot: {
    width: 220,
    height: 140,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#E5EBE3",
  },

  imageHint: {
    fontSize: 11,
    color: "#8A948A",
    marginTop: 6,
  },

  // ====================================================
  // REPORT
  // ====================================================

  reportButton: {
    backgroundColor: "#E7F1E5",
    borderWidth: 1,
    borderColor: "#B8D0B5",
    borderRadius: 10,
    paddingVertical: 13,
  },

  reportButtonText: {
    textAlign: "center",
    color: "#315C31",
    fontSize: 14,
    fontWeight: "600",
  },

  // ====================================================
  // GITHUB
  // ====================================================

  githubButton: {
    backgroundColor: "#263626",
    borderRadius: 10,
    paddingVertical: 13,
  },

  githubButtonText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // ====================================================
  // COMMON
  // ====================================================

  notAvailable: {
    color: "#9AA49A",
    fontSize: 14,
  },

  fileName: {
    marginTop: 8,
    color: "#718071",
    fontSize: 12,
  },

  // ====================================================
  // FEEDBACK
  // ====================================================

  feedbackBox: {
    backgroundColor: "#F4F8F3",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#DDE7DB",
  },

  feedbackText: {
    color: "#7A877A",
    fontSize: 14,
    lineHeight: 20,
  },

  // ====================================================
  // BACK BUTTON
  // ====================================================

  backButton: {
    backgroundColor: "#4F7D4F",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
