import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
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
  registerNumber: string;
  status: string;
  createdAt?: any;
};

type ProjectTab = "approved" | "rejected";

export default function ApprovedRejectedProjects() {
  const [activeTab, setActiveTab] = useState<ProjectTab>("approved");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProjects: (() => void) | undefined;
    let isMounted = true;

    const setupListener = async () => {
      try {
        const guide = auth.currentUser;
        if (!guide) {
          if (isMounted) {
            setProjects([]);
            setLoading(false);
          }
          return;
        }

        const assignments = await getDocs(
          query(
            collection(db, "guideStudents"),
            where("guideId", "==", guide.uid),
          ),
        );
        const studentIds = [
          ...new Set(
            assignments.docs
              .map((assignment) => assignment.data().studentId)
              .filter(
                (id): id is string => typeof id === "string" && id.length > 0,
              ),
          ),
        ];

        if (studentIds.length === 0) {
          if (isMounted) {
            setProjects([]);
            setLoading(false);
          }
          return;
        }

        unsubscribeProjects = onSnapshot(
          collection(db, "projects"),
          async (snapshot) => {
            try {
              const guideProjects = snapshot.docs.filter((projectDoc) => {
                const data = projectDoc.data();
                const status = String(data.status || "pending")
                  .trim()
                  .toLowerCase();
                return (
                  studentIds.includes(data.studentId) &&
                  (status === "approved" || status === "rejected")
                );
              });

              const loadedProjects = await Promise.all(
                guideProjects.map(async (projectDoc) => {
                  const data = projectDoc.data();
                  let registerNumber = "";
                  if (data.studentId) {
                    try {
                      const studentSnapshot = await getDoc(
                        doc(db, "users", data.studentId),
                      );
                      if (studentSnapshot.exists()) {
                        registerNumber =
                          studentSnapshot.data().registerNumber || "";
                      }
                    } catch (error) {
                      console.log(
                        "Error fetching student register number:",
                        error,
                      );
                    }
                  }
                  return {
                    id: projectDoc.id,
                    title: data.title || "Untitled Project",
                    description:
                      data.description || "No description available.",
                    domain: data.domain || "Not specified",
                    technologies: data.technologies || "Not specified",
                    studentId: data.studentId || "",
                    registerNumber,
                    status: String(data.status || "pending")
                      .trim()
                      .toLowerCase(),
                    createdAt: data.createdAt,
                  } as Project;
                }),
              );

              // Newest projects first when a timestamp is available.
              loadedProjects.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() ?? 0;
                const bTime = b.createdAt?.toMillis?.() ?? 0;
                return bTime - aTime;
              });

              if (isMounted) setProjects(loadedProjects);
            } catch (error) {
              console.log("Error loading approved/rejected projects:", error);
            } finally {
              if (isMounted) setLoading(false);
            }
          },
          (error) => {
            console.log(
              "Error listening to approved/rejected projects:",
              error,
            );
            if (isMounted) setLoading(false);
          },
        );
      } catch (error) {
        console.log(
          "Error setting up approved/rejected project listener:",
          error,
        );
        if (isMounted) setLoading(false);
      }
    };

    setupListener();
    return () => {
      isMounted = false;
      unsubscribeProjects?.();
    };
  }, []);

  const visibleProjects = useMemo(
    () => projects.filter((project) => project.status === activeTab),
    [projects, activeTab],
  );

  const renderProject = ({ item }: { item: Project }) => {
    const approved = item.status === "approved";
    return (
      <Pressable
        style={({ pressed }) => [
          styles.projectCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() =>
          router.push({
            pathname: "/guide/project-details",
            params: { id: item.id },
          })
        }
      >
        <View style={styles.cardTop}>
          <View
            style={[
              styles.projectIcon,
              approved ? styles.approvedIcon : styles.rejectedIcon,
            ]}
          >
            <Ionicons
              name={
                approved ? "checkmark-done-outline" : "close-circle-outline"
              }
              size={23}
              color={approved ? "#0F766E" : "#DC2626"}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.projectTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.studentRow}>
              <Ionicons name="card-outline" size={13} color="#6B7280" />
              <Text style={styles.registerNumber} numberOfLines={1}>
                {item.registerNumber || "Register number unavailable"}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              approved ? styles.approvedBadge : styles.rejectedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {approved ? "Approved" : "Rejected"}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="layers-outline" size={16} color="#4338CA" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Domain</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {item.domain}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="code-slash-outline" size={16} color="#4338CA" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Technologies</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {item.technologies}
            </Text>
          </View>
        </View>

        <View style={styles.reviewRow}>
          <View>
            <Text
              style={[
                styles.reviewTitle,
                approved ? styles.approvedText : styles.rejectedText,
              ]}
            >
              View Project Details
            </Text>
            <Text style={styles.reviewSubtitle}>Open project record</Text>
          </View>
          <View
            style={[
              styles.arrowCircle,
              approved ? styles.approvedArrow : styles.rejectedArrow,
            ]}
          >
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="archive-outline" size={25} color="#4338CA" />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Project History</Text>
          <Text style={styles.headerSubtitle}>
            Browse reviewed projects by status
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab("approved")}
          style={[
            styles.tab,
            activeTab === "approved" && styles.activeApprovedTab,
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={activeTab === "approved" ? "#FFFFFF" : "#0F766E"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "approved" && styles.activeTabText,
            ]}
          >
            Approved Projects
          </Text>
          <View
            style={[
              styles.countBadge,
              activeTab === "approved" && styles.activeCountBadge,
            ]}
          >
            <Text
              style={[
                styles.countText,
                activeTab === "approved" && styles.activeCountText,
              ]}
            >
              {
                projects.filter((project) => project.status === "approved")
                  .length
              }
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab("rejected")}
          style={[
            styles.tab,
            activeTab === "rejected" && styles.activeRejectedTab,
          ]}
        >
          <Ionicons
            name="close-circle-outline"
            size={18}
            color={activeTab === "rejected" ? "#FFFFFF" : "#DC2626"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "rejected" && styles.activeTabText,
            ]}
          >
            Rejected Projects
          </Text>
          <View
            style={[
              styles.countBadge,
              activeTab === "rejected" && styles.activeCountBadge,
            ]}
          >
            <Text
              style={[
                styles.countText,
                activeTab === "rejected" && styles.activeCountText,
              ]}
            >
              {
                projects.filter((project) => project.status === "rejected")
                  .length
              }
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {activeTab === "approved"
              ? "Approved Projects"
              : "Rejected Projects"}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {visibleProjects.length}{" "}
            {visibleProjects.length === 1 ? "project" : "projects"}
          </Text>
        </View>
        <View
          style={[
            styles.sectionStatus,
            activeTab === "approved"
              ? styles.approvedStatus
              : styles.rejectedStatus,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              activeTab === "approved"
                ? styles.approvedDot
                : styles.rejectedDot,
            ]}
          />
          <Text
            style={[
              styles.sectionStatusText,
              activeTab === "approved"
                ? styles.approvedText
                : styles.rejectedText,
            ]}
          >
            {activeTab === "approved" ? "Approved" : "Rejected"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4338CA" />
          <Text style={styles.loadingText}>Loading project history...</Text>
        </View>
      ) : visibleProjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIcon,
              activeTab === "approved"
                ? styles.approvedIcon
                : styles.rejectedIcon,
            ]}
          >
            <Ionicons
              name={
                activeTab === "approved"
                  ? "checkmark-done-outline"
                  : "close-circle-outline"
              }
              size={34}
              color={activeTab === "approved" ? "#0F766E" : "#DC2626"}
            />
          </View>
          <Text style={styles.emptyTitle}>No {activeTab} projects</Text>
          <Text style={styles.emptyText}>
            {activeTab === "approved"
              ? "Projects approved by you will appear here."
              : "Projects rejected by you will appear here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleProjects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  headerCard: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDFF0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 19, fontWeight: "700", color: "#1F2937" },
  headerSubtitle: { fontSize: 11, color: "#8A909D", marginTop: 4 },
  tabContainer: { gap: 10, marginBottom: 18 },
  tab: {
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCDFF0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  activeApprovedTab: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  activeRejectedTab: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
  tabText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#374151" },
  activeTabText: { color: "#FFFFFF" },
  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  activeCountBadge: { backgroundColor: "rgba(255,255,255,0.22)" },
  countText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  activeCountText: { color: "#FFFFFF" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  sectionSubtitle: { fontSize: 11, color: "#9CA3AF", marginTop: 3 },
  sectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  approvedStatus: { backgroundColor: "#D5F5F2" },
  rejectedStatus: { backgroundColor: "#FEF2F2" },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  approvedDot: { backgroundColor: "#0F766E" },
  rejectedDot: { backgroundColor: "#DC2626" },
  sectionStatusText: { fontSize: 10, fontWeight: "700" },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDFF0",
    padding: 17,
    marginBottom: 13,
  },
  cardPressed: { opacity: 0.82 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  projectIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  approvedIcon: { backgroundColor: "#D5F5F2" },
  rejectedIcon: { backgroundColor: "#FEF2F2" },
  titleContainer: { flex: 1, paddingRight: 6 },
  projectTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  studentRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  registerNumber: { flex: 1, fontSize: 11, color: "#6B7280", marginLeft: 5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  approvedBadge: { backgroundColor: "#0F766E" },
  rejectedBadge: { backgroundColor: "#DC2626" },
  statusText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  description: {
    fontSize: 12,
    lineHeight: 19,
    color: "#6B7280",
    marginBottom: 13,
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  detailContent: { flex: 1 },
  detailLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 2,
  },
  detailValue: { fontSize: 12, color: "#374151" },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  reviewTitle: { fontSize: 12, fontWeight: "700" },
  approvedText: { color: "#0F766E" },
  rejectedText: { color: "#DC2626" },
  reviewSubtitle: { fontSize: 10, color: "#9CA3AF", marginTop: 3 },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  approvedArrow: { backgroundColor: "#0F766E" },
  rejectedArrow: { backgroundColor: "#DC2626" },
  list: { paddingTop: 8, paddingBottom: 35 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 12, color: "#6B7280" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    textTransform: "capitalize",
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 7,
    textAlign: "center",
  },
});
