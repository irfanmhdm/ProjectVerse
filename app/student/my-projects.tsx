import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { useRouter } from "expo-router";

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

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../firebase/firebaseConfig";

type Project = {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string;

  // Live demo
  liveDemoUrl?: string;

  // GitHub
  githubUrl?: string;

  // Report
  reportUrl?: string;
  reportPath?: string;
  reportName?: string;

  // Video
  videoUrl?: string;
  videoName?: string;

  // Screenshots
  screenshotUrls?: string[];

  // Status
  status?: string;

  createdAt?: any;
};

export default function MyProjects() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // FETCH STUDENT PROJECTS
  // =====================================================

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
          "Unable to Load",
          "Unable to load your projects. Please try again."
        );
      }
    );

    return unsubscribe;
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  // =====================================================
  // OPEN URL
  // =====================================================

  const openUrl = async (
    url: string,
    errorMessage: string
  ) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.log("Error opening URL:", error);

      Alert.alert("Error", errorMessage);
    }
  };

  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (
    status: string = "pending"
  ) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "Approved";

      case "revision_required":
      case "revision required":
        return "Revision Required";

      case "rejected":
        return "Rejected";

      case "pending":
      default:
        return "Pending Review";
    }
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (
    status: string = "pending"
  ) => {
    switch (status.toLowerCase()) {
      case "approved":
        return styles.approvedStatus;

      case "revision_required":
      case "revision required":
        return styles.revisionStatus;

      case "rejected":
        return styles.rejectedStatus;

      case "pending":
      default:
        return styles.pendingStatus;
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
          Loading your projects...
        </Text>
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
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#4338CA"
          colors={["#4338CA"]}
        />
      }
    >
      {/* =================================================
          HEADER
      ================================================= */}

      {/* <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#1F2937"
          />
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>
            My Projects
          </Text>

          <Text style={styles.subtitle}>
            Manage your submitted projects
          </Text>
        </View>
      </View>

      {/* =================================================
          PROJECT COUNT
      ================================================= 

      {projects.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.projectCount}>
            {projects.length}{" "}
            {projects.length === 1
              ? "Project"
              : "Projects"}
          </Text>
        </View>
      )}*/}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="folder-open-outline"
              size={32}
              color="#4338CA"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No Projects Yet
          </Text>

          <Text style={styles.emptyText}>
            You haven't submitted any projects yet.
            Create your first project to get started.
          </Text>

          <Pressable
            style={styles.emptyButton}
            onPress={() =>
              router.push("/student/add-project")
            }
          >
            <Ionicons
              name="add"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.emptyButtonText}>
              Add New Project
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* =================================================
              PROJECT CARDS
          ================================================= */}

          {projects.map((project) => (
            <Pressable
              key={project.id}
              style={({ pressed }) => [
                styles.projectCard,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname:
                    "/student/project-details",
                  params: {
                    id: project.id,
                  },
                })
              }
            >
              {/* =================================================
                  CARD HEADER
              ================================================= */}

              <View style={styles.cardHeader}>
                <View style={styles.projectTitleContainer}>
                  <Text
                    style={styles.projectTitle}
                    numberOfLines={2}
                  >
                    {project.title}
                  </Text>

                  <Text style={styles.projectDomain}>
                    {project.domain}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(project.status),
                  ]}
                >
                  <View style={styles.statusDot} />

                  <Text style={styles.statusText}>
                    {getStatusLabel(project.status)}
                  </Text>
                </View>
              </View>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              {project.description ? (
                <Text
                  style={styles.description}
                  numberOfLines={3}
                >
                  {project.description}
                </Text>
              ) : null}

              {/* =================================================
                  TECHNOLOGIES
              ================================================= */}

              {project.technologies ? (
                <View style={styles.technologySection}>
                  <Text style={styles.sectionLabel}>
                    Technologies
                  </Text>

                  <View style={styles.technologyBox}>
                    <Ionicons
                      name="code-slash-outline"
                      size={16}
                      color="#4338CA"
                    />

                    <Text
                      style={styles.technologyText}
                      numberOfLines={2}
                    >
                      {project.technologies}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* =================================================
                  PROJECT DEMONSTRATION
              ================================================= */}

              <View style={styles.demoSection}>
                <View style={styles.demoHeader}>
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color="#4338CA"
                  />

                  <Text style={styles.demoTitle}>
                    Project Demonstration
                  </Text>
                </View>

                <View style={styles.demoItems}>
                  {/* LIVE DEMO */}

                  {project.liveDemoUrl ? (
                    <View style={styles.demoItem}>
                      <View
                        style={[
                          styles.demoIconBox,
                          styles.demoMintIcon,
                        ]}
                      >
                        <Ionicons
                          name="globe-outline"
                          size={16}
                          color="#238F89"
                        />
                      </View>

                      <Text
                        style={styles.demoAvailable}
                      >
                        Live Demo
                      </Text>
                    </View>
                  ) : null}

                  {/* VIDEO */}

                  {project.videoUrl ? (
                    <View style={styles.demoItem}>
                      <View
                        style={[
                          styles.demoIconBox,
                          styles.demoIndigoIcon,
                        ]}
                      >
                        <Ionicons
                          name="videocam-outline"
                          size={16}
                          color="#4338CA"
                        />
                      </View>

                      <Text
                        style={styles.demoAvailable}
                      >
                        Demo Video
                      </Text>
                    </View>
                  ) : null}

                  {/* SCREENSHOTS */}

                  {project.screenshotUrls &&
                  project.screenshotUrls.length >
                    0 ? (
                    <View style={styles.demoItem}>
                      <View
                        style={[
                          styles.demoIconBox,
                          styles.demoMintIcon,
                        ]}
                      >
                        <Ionicons
                          name="images-outline"
                          size={16}
                          color="#238F89"
                        />
                      </View>

                      <Text
                        style={styles.demoAvailable}
                      >
                        {project.screenshotUrls.length}{" "}
                        {project.screenshotUrls.length ===
                        1
                          ? "Screenshot"
                          : "Screenshots"}
                      </Text>
                    </View>
                  ) : null}

                  {/* NOTHING PROVIDED */}

                  {!project.liveDemoUrl &&
                  !project.videoUrl &&
                  (!project.screenshotUrls ||
                    project.screenshotUrls.length ===
                      0) ? (
                    <Text style={styles.notAvailable}>
                      No demonstration provided.
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <View style={styles.buttonRow}>
                {/* LIVE DEMO */}

                {project.liveDemoUrl ? (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() =>
                      openUrl(
                        project.liveDemoUrl!,
                        "Unable to open live demo."
                      )
                    }
                  >
                    <Ionicons
                      name="open-outline"
                      size={17}
                      color="#FFFFFF"
                    />

                    <Text
                      style={styles.primaryButtonText}
                    >
                      Live Demo
                    </Text>
                  </Pressable>
                ) : null}

                {/* VIDEO */}

                {project.videoUrl ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() =>
                      openUrl(
                        project.videoUrl!,
                        "Unable to open project video."
                      )
                    }
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={17}
                      color="#4338CA"
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Video
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* =================================================
                  REPORT + GITHUB
              ================================================= */}

              <View style={styles.buttonRow}>
                {/* REPORT */}

                {project.reportUrl ? (
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() =>
                      openUrl(
                        project.reportUrl!,
                        "Unable to open project report."
                      )
                    }
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={17}
                      color="#4338CA"
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      View Report
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.unavailableButton}>
                    <Ionicons
                      name="document-outline"
                      size={17}
                      color="#9CA3AF"
                    />

                    <Text
                      style={styles.unavailableText}
                    >
                      No Report
                    </Text>
                  </View>
                )}

                {/* GITHUB */}

                {project.githubUrl ? (
                  <Pressable
                    style={styles.githubButton}
                    onPress={() =>
                      openUrl(
                        project.githubUrl!,
                        "Unable to open GitHub repository."
                      )
                    }
                  >
                    <Ionicons
                      name="logo-github"
                      size={17}
                      color="#FFFFFF"
                    />

                    <Text
                      style={styles.githubButtonText}
                    >
                      GitHub
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {/* =================================================
                  DETAILS HINT
              ================================================= */}

              <View style={styles.detailsHint}>
                <Text style={styles.detailsHintText}>
                  Tap anywhere on the project to view
                  complete details
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color="#4338CA"
                />
              </View>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = StyleSheet.create({
  // =====================================================
  // PAGE
  // =====================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  // // =====================================================
  // // HEADER
  // // =====================================================

  // header: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 22,
  // },

  // backButton: {
  //   width: 42,
  //   height: 42,
  //   borderRadius: 13,
  //   backgroundColor: "#FFFFFF",
  //   borderWidth: 1,
  //   borderColor: "#E1E5EC",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   marginRight: 12,
  // },

  // headerTextContainer: {
  //   flex: 1,
  // },

  // title: {
  //   fontSize: 27,
  //   fontWeight: "700",
  //   color: "#1F2937",
  // },

  // subtitle: {
  //   fontSize: 13,
  //   color: "#6B7280",
  //   marginTop: 3,
  // },

  // // =====================================================
  // // COUNT
  // // =====================================================

  // countRow: {
  //   marginBottom: 12,
  // },

  // projectCount: {
  //   fontSize: 13,
  //   fontWeight: "700",
  //   color: "#4338CA",
  // },

  // =====================================================
  // PROJECT CARD
  // =====================================================

  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E4EC",
    shadowColor: "#4338CA",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.9,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 13,
  },

  projectTitleContainer: {
    flex: 1,
    marginRight: 10,
  },

  projectTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#010101",
    lineHeight: 25,
  },

  projectDomain: {
    fontSize: 12,
    fontWeight: "600",
    color: "#238F89",
    marginTop: 4,
  },

  // =====================================================
  // STATUS
  // =====================================================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 5,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  pendingStatus: {
    backgroundColor: "#4338CA",
  },

  approvedStatus: {
    backgroundColor: "#669b88",
  },

  revisionStatus: {
    backgroundColor: "#C27A16",
  },

  rejectedStatus: {
    backgroundColor: "#C44747",
  },

  // =====================================================
  // DESCRIPTION
  // =====================================================

  description: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginBottom: 15,
  },

  // =====================================================
  // TECHNOLOGIES
  // =====================================================

  technologySection: {
    marginBottom: 14,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },

  technologyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E2F5",
    paddingHorizontal: 11,
    paddingVertical: 9,
  },

  technologyText: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    marginLeft: 8,
    lineHeight: 17,
  },

  // =====================================================
  // DEMONSTRATION
  // =====================================================

  demoSection: {
    backgroundColor: "#F8FAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDE8E6",
    padding: 12,
    marginBottom: 13,
  },

  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  demoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginLeft: 7,
  },

  demoItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  demoItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  demoIconBox: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  demoMintIcon: {
    backgroundColor: "#D5F5F2",
  },

  demoIndigoIcon: {
    backgroundColor: "#EEF0FF",
  },

  demoAvailable: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },

  notAvailable: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  // =====================================================
  // BUTTONS
  // =====================================================

  buttonRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 5,
  },

  primaryButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: "#4338CA",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: "#EEF0FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCDFF5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  secondaryButtonText: {
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  unavailableButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: "#F5F6F8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  unavailableText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },

  githubButton: {
    flex: 1,
    minHeight: 42,
    backgroundColor: "#1F2937",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  githubButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  // =====================================================
  // DETAILS HINT
  // =====================================================

  detailsHint: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E7E9EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsHintText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginRight: 4,
  },

  // =====================================================
  // EMPTY STATE
  // =====================================================

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E4EC",
    padding: 28,
    marginTop: 12,
    alignItems: "center",
  },

  emptyIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },

  emptyButton: {
    backgroundColor: "#4338CA",
    borderRadius: 10,
    paddingHorizontal: 17,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
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

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
  },
});