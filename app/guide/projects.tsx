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

import { Ionicons } from "@expo/vector-icons";

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
        console.log("Guide not logged in");
        setProjects([]);
        setLoading(false);
        return;
      }

      // =================================================
      // 1. GET STUDENTS ASSIGNED TO GUIDE
      // =================================================

      const studentQuery = query(
        collection(db, "guideStudents"),
        where("guideId", "==", guide.uid),
      );

      const studentSnapshot =
        await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        console.log(
          "No students assigned to this guide.",
        );

        setProjects([]);
        setLoading(false);
        return;
      }

      const studentIds =
        studentSnapshot.docs.map(
          (studentDoc) =>
            studentDoc.data().studentId,
        );

      console.log(
        "Guide's students:",
        studentIds,
      );

      // =================================================
      // 2. GET PROJECTS
      // =================================================

      const projectSnapshot = await getDocs(
        collection(db, "projects"),
      );

      const projectList: Project[] = [];

      projectSnapshot.docs.forEach(
        (projectDoc) => {
          const data = projectDoc.data();

          // Only projects belonging to
          // students assigned to this guide
          if (
            studentIds.includes(
              data.studentId,
            )
          ) {
            projectList.push({
              id: projectDoc.id,

              title:
                data.title ||
                "Untitled Project",

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

              reportUrl:
                data.reportUrl ||
                "",

              reportName:
                data.reportName ||
                "",

              githubUrl:
                data.githubUrl ||
                "",

              status:
                data.status ||
                "pending",
            });
          }
        },
      );

      console.log(
        "Guide projects found:",
        projectList.length,
      );

      setProjects(projectList);
    } catch (error) {
      console.log(
        "Error loading guide projects:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // =====================================================
  // STATUS
  // =====================================================

  const getStatusStyle = (
    status?: string,
  ) => {
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

  const getStatusIcon = (
    status?: string,
  ) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "checkmark-circle-outline";

      case "revision_required":
      case "revision required":
        return "refresh-circle-outline";

      case "rejected":
        return "close-circle-outline";

      default:
        return "time-outline";
    }
  };

  const getStatusText = (
    status?: string,
  ) => {
    switch (status?.toLowerCase()) {
      case "revision_required":
      case "revision required":
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
  // RESOURCE COUNT
  // =====================================================

  const getResourceCount = (
    project: Project,
  ) => {
    let count = 0;

    if (project.liveDemoUrl) count++;
    if (project.videoUrl) count++;
    if (
      project.screenshotUrls &&
      project.screenshotUrls.length > 0
    ) {
      count++;
    }
    if (project.reportUrl) count++;
    if (project.githubUrl) count++;

    return count;
  };

  // =====================================================
  // PROJECT CARD
  // =====================================================

  const renderProject = ({
    item,
  }: {
    item: Project;
  }) => {
    const resourceCount =
      getResourceCount(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.projectCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() =>
          router.push({
            pathname:
              "/guide/project-details",
            params: {
              id: item.id,
            },
          })
        }
      >
        {/* =================================================
            PROJECT TOP
        ================================================= */}

        <View style={styles.cardTop}>
          <View style={styles.projectIcon}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color="#4338CA"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text
              style={styles.projectTitle}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View style={styles.studentRow}>
              <Ionicons
                name="person-outline"
                size={13}
                color="#6B7280"
              />

              <Text
                style={styles.studentName}
                numberOfLines={1}
              >
                {item.studentName}
              </Text>
            </View>
          </View>

          {/* STATUS */}

          <View
            style={[
              styles.statusBadge,
              getStatusStyle(item.status),
            ]}
          >
            <Ionicons
              name={getStatusIcon(item.status)}
              size={13}
              color="#FFFFFF"
            />

            <Text style={styles.statusText}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* =================================================
            STUDENT EMAIL
        ================================================= */}

        {item.studentEmail ? (
          <View style={styles.emailRow}>
            <Ionicons
              name="mail-outline"
              size={15}
              color="#9CA3AF"
            />

            <Text
              style={styles.email}
              numberOfLines={1}
            >
              {item.studentEmail}
            </Text>
          </View>
        ) : null}

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <Text
          style={styles.description}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        {/* =================================================
            DOMAIN
        ================================================= */}

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons
              name="layers-outline"
              size={16}
              color="#4338CA"
            />
          </View>

          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>
              Domain
            </Text>

            <Text
              style={styles.detailValue}
              numberOfLines={1}
            >
              {item.domain}
            </Text>
          </View>
        </View>

        {/* =================================================
            TECHNOLOGIES
        ================================================= */}

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons
              name="code-slash-outline"
              size={16}
              color="#4338CA"
            />
          </View>

          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>
              Technologies
            </Text>

            <Text
              style={styles.detailValue}
              numberOfLines={2}
            >
              {item.technologies}
            </Text>
          </View>
        </View>

        {/* =================================================
            RESOURCES
        ================================================= */}

        <View style={styles.resourcesSection}>
          <View style={styles.resourcesHeader}>
            <View>
              <Text style={styles.resourcesTitle}>
                Project Resources
              </Text>

              <Text style={styles.resourcesSubtitle}>
                {resourceCount === 0
                  ? "No resources uploaded"
                  : `${resourceCount} ${
                      resourceCount === 1
                        ? "resource"
                        : "resources"
                    } available`}
              </Text>
            </View>

            <View style={styles.resourceCount}>
              <Text
                style={styles.resourceCountText}
              >
                {resourceCount}
              </Text>
            </View>
          </View>

          <View style={styles.resourceRow}>
            {item.liveDemoUrl ? (
              <View style={styles.resourceBadge}>
                <Ionicons
                  name="globe-outline"
                  size={14}
                  color="#0F766E"
                />

                <Text
                  style={styles.resourceText}
                >
                  Live Demo
                </Text>
              </View>
            ) : null}

            {item.videoUrl ? (
              <View style={styles.resourceBadge}>
                <Ionicons
                  name="videocam-outline"
                  size={14}
                  color="#4338CA"
                />

                <Text
                  style={styles.resourceText}
                >
                  Video
                </Text>
              </View>
            ) : null}

            {item.screenshotUrls &&
            item.screenshotUrls.length >
              0 ? (
              <View style={styles.resourceBadge}>
                <Ionicons
                  name="images-outline"
                  size={14}
                  color="#4338CA"
                />

                <Text
                  style={styles.resourceText}
                >
                  {item.screenshotUrls.length}{" "}
                  {item.screenshotUrls.length ===
                  1
                    ? "Screenshot"
                    : "Screenshots"}
                </Text>
              </View>
            ) : null}

            {item.reportUrl ? (
              <View style={styles.resourceBadge}>
                <Ionicons
                  name="document-outline"
                  size={14}
                  color="#4338CA"
                />

                <Text
                  style={styles.resourceText}
                >
                  Report
                </Text>
              </View>
            ) : null}

            {item.githubUrl ? (
              <View style={styles.resourceBadge}>
                <Ionicons
                  name="logo-github"
                  size={14}
                  color="#1F2937"
                />

                <Text
                  style={styles.resourceText}
                >
                  GitHub
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* =================================================
            REVIEW
        ================================================= */}

        <View style={styles.reviewRow}>
          <View>
            <Text style={styles.reviewTitle}>
              Review Project
            </Text>

            <Text style={styles.reviewSubtitle}>
              Open project details
            </Text>
          </View>

          <View style={styles.arrowCircle}>
            <Ionicons
              name="arrow-forward"
              size={17}
              color="#FFFFFF"
            />
          </View>
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
        <View style={styles.loadingIcon}>
          <Ionicons
            name="folder-open-outline"
            size={25}
            color="#4338CA"
          />
        </View>

        <ActivityIndicator
          size="small"
          color="#4338CA"
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
      {/* =================================================
          SUMMARY
      ================================================= */}

      {projects.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="folder-outline"
              size={24}
              color="#4338CA"
            />
          </View>

          <View style={styles.summaryContent}>
            <Text style={styles.summaryNumber}>
              {projects.length}
            </Text>

            <Text style={styles.summaryLabel}>
              {projects.length === 1
                ? "Student Project"
                : "Student Projects"}
            </Text>
          </View>

          <View style={styles.summaryStatus}>
            <Ionicons
              name="people-outline"
              size={15}
              color="#0F766E"
            />

            <Text style={styles.summaryStatusText}>
              Assigned Students
            </Text>
          </View>
        </View>
      )}

      {/* =================================================
          PROJECT LIST
      ================================================= */}

      {projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="folder-open-outline"
              size={34}
              color="#4338CA"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Projects Yet
          </Text>

          <Text style={styles.emptyText}>
            Projects submitted by your assigned
            students will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.list
          }
        />
      )}
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // =====================================================
  // PAGE
  // =====================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  list: {
    paddingTop: 14,
    paddingBottom: 35,
  },

  // =====================================================
  // SUMMARY
  // =====================================================

  summaryCard: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E8E6",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  summaryContent: {
    flex: 1,
  },

  summaryNumber: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 1,
  },

  summaryStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D5F5F2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
  },

  summaryStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0F766E",
    marginLeft: 4,
  },

  // =====================================================
  // PROJECT CARD
  // =====================================================

  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDFF0",
    padding: 17,
    marginBottom: 13,
  },

  cardPressed: {
    opacity: 0.82,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },

  projectTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  studentName: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 5,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 5,
  },

  pending: {
    backgroundColor: "#D97706",
  },

  approved: {
    backgroundColor: "#0F766E",
  },

  revision: {
    backgroundColor: "#EA580C",
  },

  rejected: {
    backgroundColor: "#DC2626",
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    marginLeft: 4,
  },

  // =====================================================
  // EMAIL
  // =====================================================

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  email: {
    flex: 1,
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 7,
  },

  // =====================================================
  // DESCRIPTION
  // =====================================================

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    marginBottom: 15,
  },

  // =====================================================
  // DETAILS
  // =====================================================

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 13,
    color: "#374151",
  },

  // =====================================================
  // RESOURCES
  // =====================================================

  resourcesSection: {
    marginTop: 5,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  resourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  resourcesTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  resourcesSubtitle: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },

  resourceCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
  },

  resourceCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F766E",
  },

  resourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  resourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  resourceText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
    marginLeft: 5,
  },

  // =====================================================
  // REVIEW
  // =====================================================

  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  reviewTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4338CA",
  },

  reviewSubtitle: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },

  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4338CA",
    alignItems: "center",
    justifyContent: "center",
  },

  // =====================================================
  // EMPTY
  // =====================================================

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
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
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
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

  loadingIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
  },
});