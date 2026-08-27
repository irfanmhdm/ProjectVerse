import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import { auth, db } from "../../firebase/firebaseConfig";

type Project = {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string;

  studentId: string;
  studentName: string;
  studentEmail: string;

  liveDemoUrl?: string;

  videoUrl?: string;
  videoName?: string;

  screenshotUrls?: string[];

  reportUrl?: string;
  reportName?: string;

  githubUrl?: string;

  status?: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD GUIDE PROJECTS
  // =====================================================

  const loadProjects = async () => {
    try {
      const guide = auth.currentUser;

      if (!guide) {
        console.log("❌ Guide not logged in");
        setLoading(false);
        return;
      }

      // =================================================
      // 1. GET STUDENTS ASSIGNED TO GUIDE
      // =================================================

      const studentQuery = query(
        collection(db, "guideStudents"),
        where("guideId", "==", guide.uid)
      );

      const studentSnapshot = await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        console.log("No students assigned to this guide.");

        setProjects([]);
        setLoading(false);
        return;
      }

      const studentIds = studentSnapshot.docs.map(
        (studentDoc) => studentDoc.data().studentId
      );

      console.log("👨‍🎓 Guide's students:", studentIds);

      // =================================================
      // 2. GET PROJECTS
      // =================================================

      const projectSnapshot = await getDocs(
        collection(db, "projects")
      );

      const projectList: Project[] = [];

      projectSnapshot.docs.forEach((projectDoc) => {
        const data = projectDoc.data();

        // Only show projects belonging to this guide's students
        if (studentIds.includes(data.studentId)) {
          projectList.push({
            id: projectDoc.id,

            title: data.title || "Untitled Project",

            description:
              data.description ||
              "No description available.",

            domain:
              data.domain ||
              "Not specified",

            technologies:
              data.technologies ||
              "Not specified",

            studentId:
              data.studentId ||
              "",

            studentName:
              data.studentName ||
              "Unknown Student",

            studentEmail:
              data.studentEmail ||
              "",

            // ================================
            // DEMO INFORMATION
            // ================================

            liveDemoUrl:
              data.liveDemoUrl ||
              "",

            videoUrl:
              data.videoUrl ||
              "",

            videoName:
              data.videoName ||
              "",

            screenshotUrls:
              data.screenshotUrls ||
              [],

            // ================================
            // REPORT
            // ================================

            reportUrl:
              data.reportUrl ||
              "",

            reportName:
              data.reportName ||
              "",

            // ================================
            // GITHUB
            // ================================

            githubUrl:
              data.githubUrl ||
              "",

            // ================================
            // STATUS
            // ================================

            status:
              data.status ||
              "pending",
          });
        }
      });

      console.log(
        "📚 Guide projects found:",
        projectList.length
      );

      setProjects(projectList);

    } catch (error) {
      console.log(
        "❌ Error loading guide projects:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

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
  // STATUS TEXT
  // =====================================================

  const getStatusText = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "revision_required":
        return "Revision Required";

      case "approved":
        return "Approved";

      case "rejected":
        return "Rejected";

      default:
        return "Pending";
    }
  };

  // =====================================================
  // PROJECT CARD
  // =====================================================

  const renderProject = ({
    item,
  }: {
    item: Project;
  }) => {
    return (
      <Pressable
        style={styles.projectCard}
        onPress={() =>
          router.push({
            pathname: "/guide/project-details",
            params: {
              id: item.id,
            },
          })
        }
      >

        {/* ============================================
            HEADER
        ============================================ */}

        <View style={styles.cardHeader}>

          <View style={styles.titleContainer}>

            <Text style={styles.projectTitle}>
              {item.title}
            </Text>

            <Text style={styles.studentName}>
              👨‍🎓 {item.studentName}
            </Text>

            {item.studentEmail ? (
              <Text style={styles.studentEmail}>
                {item.studentEmail}
              </Text>
            ) : null}

          </View>

          {/* STATUS */}

          <View
            style={[
              styles.statusBadge,
              getStatusStyle(item.status),
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>

        </View>

        {/* ============================================
            DESCRIPTION
        ============================================ */}

        <Text
          style={styles.description}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        {/* ============================================
            PROJECT INFORMATION
        ============================================ */}

        <View style={styles.infoSection}>

          <Text style={styles.label}>
            Domain
          </Text>

          <Text style={styles.value}>
            {item.domain}
          </Text>

        </View>

        <View style={styles.infoSection}>

          <Text style={styles.label}>
            Technologies
          </Text>

          <Text style={styles.value}>
            {item.technologies}
          </Text>

        </View>

        {/* ============================================
            AVAILABLE RESOURCES
        ============================================ */}

        <View style={styles.resourcesSection}>

          <Text style={styles.resourcesTitle}>
            Project Resources
          </Text>

          <View style={styles.resourceRow}>

            {item.liveDemoUrl ? (
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceText}>
                  🌐 Live Demo
                </Text>
              </View>
            ) : null}

            {item.videoUrl ? (
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceText}>
                  🎥 Video
                </Text>
              </View>
            ) : null}

            {item.screenshotUrls &&
            item.screenshotUrls.length > 0 ? (
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceText}>
                  🖼 {item.screenshotUrls.length}{" "}
                  {item.screenshotUrls.length === 1
                    ? "Screenshot"
                    : "Screenshots"}
                </Text>
              </View>
            ) : null}

            {item.reportUrl ? (
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceText}>
                  📄 Report
                </Text>
              </View>
            ) : null}

            {item.githubUrl ? (
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceText}>
                  💻 GitHub
                </Text>
              </View>
            ) : null}

          </View>

        </View>

        {/* ============================================
            REVIEW BUTTON
        ============================================ */}

        <View style={styles.reviewRow}>

          <Text style={styles.reviewText}>
            Review Project
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>

        </View>

      </Pressable>
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
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading projects...
        </Text>

      </View>
    );
  }

  // =====================================================
  // MAIN SCREEN
  // =====================================================

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Student Projects
      </Text>

      <Text style={styles.subtitle}>
        Review projects submitted by your students.
      </Text>

      {projects.length === 0 ? (

        <View style={styles.emptyContainer}>

          <Text style={styles.emptyIcon}>
            📂
          </Text>

          <Text style={styles.emptyTitle}>
            No Projects Yet
          </Text>

          <Text style={styles.emptyText}>
            Projects submitted by your students
            will appear here.
          </Text>

        </View>

      ) : (

        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />

      )}

    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
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

  list: {
    paddingBottom: 30,
  },

  // ====================================================
  // PROJECT CARD
  // ====================================================

  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  titleContainer: {
    flex: 1,
  },

  projectTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },

  studentName: {
    fontSize: 14,
    color: "#2563EB",
    marginTop: 5,
  },

  studentEmail: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // ====================================================
  // STATUS
  // ====================================================

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },

  pending: {
    backgroundColor: "#F59E0B",
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

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  // ====================================================
  // DESCRIPTION
  // ====================================================

  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    marginBottom: 15,
  },

  // ====================================================
  // INFORMATION
  // ====================================================

  infoSection: {
    marginBottom: 10,
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

  // ====================================================
  // RESOURCES
  // ====================================================

  resourcesSection: {
    marginTop: 5,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  resourcesTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },

  resourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  resourceBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  resourceText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },

  // ====================================================
  // REVIEW
  // ====================================================

  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 15,
  },

  reviewText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "bold",
  },

  arrow: {
    color: "#2563EB",
    fontSize: 18,
    marginLeft: 5,
    fontWeight: "bold",
  },

  // ====================================================
  // LOADING
  // ====================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  // ====================================================
  // EMPTY
  // ====================================================

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
  },

});