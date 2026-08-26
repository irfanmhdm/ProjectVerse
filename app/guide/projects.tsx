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
  reportUrl?: string;
  githubUrl?: string;
  status?: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const guide = auth.currentUser;

      if (!guide) {
        console.log("❌ Guide not logged in");
        setLoading(false);
        return;
      }

      // ==========================================
      // 1. Get students assigned to this guide
      // ==========================================

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

      // ==========================================
      // 2. Get all projects
      // ==========================================

      const projectSnapshot = await getDocs(
        collection(db, "projects")
      );

      const projectList: Project[] = [];

      projectSnapshot.docs.forEach((projectDoc) => {
        const data = projectDoc.data();

        // Only include projects from this guide's students
        if (studentIds.includes(data.studentId)) {
          projectList.push({
            id: projectDoc.id,

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

            reportUrl:
              data.reportUrl || "",

            githubUrl:
              data.githubUrl || "",

            status:
              data.status || "pending",
          });
        }
      });

      console.log("📚 Projects found:", projectList.length);

      setProjects(projectList);
    } catch (error) {
      console.log("❌ Error loading guide projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // ==========================================
  // PROJECT CARD
  // ==========================================

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
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.projectTitle}>
              {item.title}
            </Text>

            <Text style={styles.studentName}>
              👨‍🎓 {item.studentName}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.status === "approved"
                ? styles.approved
                : item.status === "revision_required"
                ? styles.revision
                : styles.pending,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status || "pending"}
            </Text>
          </View>
        </View>

        <Text
          style={styles.description}
          numberOfLines={3}
        >
          {item.description}
        </Text>

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

        <Text style={styles.reviewText}>
          Review Project →
        </Text>
      </Pressable>
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

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

  // ==========================================
  // MAIN SCREEN
  // ==========================================

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

  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
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

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    marginBottom: 15,
  },

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

  reviewText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },

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

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
});