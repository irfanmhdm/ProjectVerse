import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { db } from "../../firebase/firebaseConfig";

type Project = {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string;
  studentId: string;
  githubUrl: string;
  reportUrl: string;
  reportName: string;
};

export default function ExploreProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const projectsQuery = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(projectsQuery);

      const projectList: Project[] = snapshot.docs.map((projectDoc) => {
        const data = projectDoc.data();

        return {
          id: projectDoc.id,
          title: data.title || "",
          description: data.description || "",
          domain: data.domain || "",
          technologies: data.technologies || "",
          studentId: data.studentId || "",
          githubUrl: data.githubUrl || "",
          reportUrl: data.reportUrl || "",
          reportName: data.reportName || "",
        };
      });

      setProjects(projectList);
    } catch (error) {
      console.log("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const searchText = search.toLowerCase();

    return (
      project.title.toLowerCase().includes(searchText) ||
      project.description.toLowerCase().includes(searchText) ||
      project.domain.toLowerCase().includes(searchText) ||
      project.technologies.toLowerCase().includes(searchText)
    );
  });

  const openReport = async (reportUrl: string) => {
    if (!reportUrl) {
      Alert.alert("Report Not Available", "This project has no report.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(reportUrl);

      if (supported) {
        await Linking.openURL(reportUrl);
      } else {
        Alert.alert("Error", "Cannot open the project report.");
      }
    } catch (error) {
      console.log("Error opening report:", error);

      Alert.alert("Error", "Could not open the project report.");
    }
  };

  const openGithub = async (githubUrl: string) => {
    if (!githubUrl) {
      Alert.alert(
        "GitHub Not Available",
        "This project has no GitHub repository."
      );
      return;
    }

    try {
      await Linking.openURL(githubUrl);
    } catch (error) {
      console.log("Error opening GitHub:", error);

      Alert.alert("Error", "Could not open the GitHub repository.");
    }
  };

  const renderProject = ({ item }: { item: Project }) => {
    return (
      <View style={styles.projectCard}>

        {/* Project Title */}
        <Text style={styles.projectTitle}>
          {item.title}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {item.description}
        </Text>

        {/* Domain */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>
            Domain
          </Text>

          <Text style={styles.value}>
            {item.domain || "Not specified"}
          </Text>
        </View>

        {/* Technologies */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>
            Technologies
          </Text>

          <Text style={styles.value}>
            {item.technologies || "Not specified"}
          </Text>
        </View>

        {/* GitHub */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>
            GitHub Repository
          </Text>

          {item.githubUrl ? (
            <Pressable
              onPress={() => openGithub(item.githubUrl)}
            >
              <Text style={styles.link}>
                Open GitHub Repository →
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.value}>
              Not available
            </Text>
          )}
        </View>

        {/* Report */}
        <View style={styles.reportSection}>

          <Text style={styles.reportTitle}>
            📄 Project Report
          </Text>

          <Text
            style={styles.reportName}
            numberOfLines={1}
          >
            {item.reportName || "Report not available"}
          </Text>

          {item.reportUrl && (
            <Pressable
              style={styles.reportButton}
              onPress={() => openReport(item.reportUrl)}
            >
              <Text style={styles.reportButtonText}>
                Open Report
              </Text>
            </Pressable>
          )}

        </View>

      </View>
    );
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Explore Projects
      </Text>

      <Text style={styles.subtitle}>
        Discover academic projects from other students
      </Text>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search projects..."
        placeholderTextColor="#777"
        value={search}
        onChangeText={setSearch}
      />

      {/* Project Count */}
      {!loading && (
        <Text style={styles.count}>
          {filteredProjects.length}{" "}
          {filteredProjects.length === 1
            ? "Project"
            : "Projects"}
        </Text>
      )}

      {/* Loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text style={styles.loadingText}>
            Loading projects...
          </Text>
        </View>
      ) : filteredProjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            No Projects Found
          </Text>

          <Text style={styles.emptyText}>
            Try searching with a different keyword.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
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

  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },

  count: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 18,
    marginBottom: 10,
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

  projectTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    marginBottom: 18,
  },

  infoSection: {
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    color: "#111827",
  },

  link: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },

  reportSection: {
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  reportTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5,
  },

  reportName: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },

  reportButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },

  reportButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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