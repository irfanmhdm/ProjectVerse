import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { auth, db } from "../../firebase/firebaseConfig";

type Project = {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string;

  githubUrl?: string;

  // Report information
  reportUrl?: string;
  reportPath?: string;
  reportName?: string;

  status?: string;
  createdAt?: any;
};

export default function MyProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ==============================
  // FETCH STUDENT PROJECTS
  // ==============================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    const projectsQuery = query(
      collection(db, "projects"),
      where("studentId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const projectList: Project[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];

        setProjects(projectList);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.log("Error fetching projects:", error);
        setLoading(false);
        setRefreshing(false);

        Alert.alert(
          "Error",
          "Unable to load your projects."
        );
      }
    );

    return unsubscribe;
  }, []);

  // ==============================
  // REFRESH
  // ==============================

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  // ==============================
  // OPEN GITHUB
  // ==============================

  const openGithub = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Unable to open GitHub repository."
        );
      }
    } catch (error) {
      console.log("Error opening GitHub:", error);

      Alert.alert(
        "Error",
        "Something went wrong while opening GitHub."
      );
    }
  };

  // ==============================
  // OPEN REPORT
  // ==============================

  const openReport = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Unable to open project report."
        );
      }
    } catch (error) {
      console.log("Error opening report:", error);

      Alert.alert(
        "Error",
        "Something went wrong while opening the report."
      );
    }
  };

  // ==============================
  // STATUS STYLE
  // ==============================

  const getStatusStyle = (status: string = "pending") => {
    switch (status.toLowerCase()) {
      case "approved":
        return styles.approvedStatus;

      case "revision_required":
      case "revision required":
        return styles.revisionStatus;

      case "rejected":
        return styles.rejectedStatus;

      default:
        return styles.pendingStatus;
    }
  };

  // ==============================
  // LOADING SCREEN
  // ==============================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4F7D4F"
        />

        <Text style={styles.loadingText}>
          Loading your projects...
        </Text>
      </View>
    );
  }

  // ==============================
  // MAIN SCREEN
  // ==============================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      {/* PAGE HEADER */}

      <Text style={styles.title}>
        My Projects
      </Text>

      <Text style={styles.subtitle}>
        Projects submitted by you
      </Text>

      {/* NO PROJECTS */}

      {projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            📁
          </Text>

          <Text style={styles.emptyTitle}>
            No Projects Yet
          </Text>

          <Text style={styles.emptyText}>
            You haven't submitted any projects yet.
          </Text>
        </View>
      ) : (
        <>
          {/* PROJECT COUNT */}

          <Text style={styles.projectCount}>
            {projects.length}{" "}
            {projects.length === 1
              ? "Project"
              : "Projects"}
          </Text>

          {/* PROJECT CARDS */}

          {projects.map((project) => (
            <View
              key={project.id}
              style={styles.projectCard}
            >
              {/* CARD HEADER */}

              <View style={styles.cardHeader}>
                <Text
                  style={styles.projectTitle}
                >
                  {project.title}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(
                      project.status
                    ),
                  ]}
                >
                  <Text
                    style={styles.statusText}
                  >
                    {project.status ||
                      "Pending"}
                  </Text>
                </View>
              </View>

              {/* DESCRIPTION */}

              <Text
                style={styles.description}
              >
                {project.description}
              </Text>

              {/* DOMAIN */}

              <View
                style={styles.infoSection}
              >
                <Text style={styles.label}>
                  Domain
                </Text>

                <Text style={styles.value}>
                  {project.domain}
                </Text>
              </View>

              {/* TECHNOLOGIES */}

              <View
                style={styles.infoSection}
              >
                <Text style={styles.label}>
                  Technologies
                </Text>

                <Text style={styles.value}>
                  {project.technologies}
                </Text>
              </View>

              {/* BUTTONS */}

              <View style={styles.buttonRow}>

                {/* REPORT */}

                {project.reportUrl ? (
                  <Pressable
                    style={
                      styles.reportButton
                    }
                    onPress={() =>
                      openReport(
                        project.reportUrl!
                      )
                    }
                  >
                    <Text
                      style={
                        styles.reportButtonText
                      }
                    >
                      View Report
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    style={
                      styles.noReportContainer
                    }
                  >
                    <Text
                      style={styles.noGithub}
                    >
                      No report uploaded
                    </Text>
                  </View>
                )}

                {/* GITHUB */}

                {project.githubUrl ? (
                  <Pressable
                    style={
                      styles.githubButton
                    }
                    onPress={() =>
                      openGithub(
                        project.githubUrl!
                      )
                    }
                  >
                    <Text
                      style={
                        styles.githubButtonText
                      }
                    >
                      GitHub ↗
                    </Text>
                  </Pressable>
                ) : null}

              </View>
            </View>
          ))}
        </>
      )}
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

  // ------------------------------
  // HEADER
  // ------------------------------

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#263626",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#718071",
    marginTop: 5,
    marginBottom: 20,
  },

  projectCount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#465546",
    marginBottom: 12,
  },

  // ------------------------------
  // PROJECT CARD
  // ------------------------------

  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#DDE7DB",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  projectTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#263626",
    marginRight: 10,
  },

  // ------------------------------
  // STATUS
  // ------------------------------

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },

  pendingStatus: {
    backgroundColor: "#D99A28",
  },

  approvedStatus: {
    backgroundColor: "#4F8A4F",
  },

  revisionStatus: {
    backgroundColor: "#D46A32",
  },

  rejectedStatus: {
    backgroundColor: "#C94A4A",
  },

  // ------------------------------
  // DESCRIPTION
  // ------------------------------

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#536153",
    marginBottom: 16,
  },

  // ------------------------------
  // PROJECT INFORMATION
  // ------------------------------

  infoSection: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A877A",
    marginBottom: 3,
  },

  value: {
    fontSize: 14,
    color: "#263626",
  },

  // ------------------------------
  // BUTTONS
  // ------------------------------

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
  },

  reportButton: {
    flex: 1,
    backgroundColor: "#E7F1E5",
    paddingVertical: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#B8D0B5",
  },

  reportButtonText: {
    color: "#315C31",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  githubButton: {
    flex: 1,
    backgroundColor: "#263626",
    paddingVertical: 12,
    borderRadius: 9,
  },

  githubButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  noReportContainer: {
    flex: 1,
    justifyContent: "center",
  },

  noGithub: {
    fontSize: 13,
    color: "#9AA49A",
  },

  // ------------------------------
  // EMPTY STATE
  // ------------------------------

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    marginTop: 20,
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#DDE7DB",
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#263626",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#718071",
    textAlign: "center",
  },

  // ------------------------------
  // LOADING
  // ------------------------------

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8F3",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#718071",
  },
});