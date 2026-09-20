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

import { Ionicons } from "@expo/vector-icons";

import { db } from "../../../firebase/firebaseConfig";

type Project = {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string;
  studentId: string;

  // GitHub
  githubUrl?: string;

  // Report
  reportUrl?: string;
  reportName?: string;
};

export default function ExploreProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD PROJECTS
  // =====================================================

  const loadProjects = async () => {
    try {
      setLoading(true);

      const projectsQuery = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(
        projectsQuery
      );

      const projectList: Project[] =
        snapshot.docs.map((projectDoc) => {
          const data = projectDoc.data();

          return {
            id: projectDoc.id,

            title: data.title || "",
            description: data.description || "",
            domain: data.domain || "",
            technologies:
              data.technologies || "",
            studentId:
              data.studentId || "",

            githubUrl:
              data.githubUrl || "",

            reportUrl:
              data.reportUrl || "",

            reportName:
              data.reportName || "",
          };
        });

      setProjects(projectList);
    } catch (error) {
      console.log(
        "Error loading projects:",
        error
      );

      Alert.alert(
        "Unable to Load",
        "Unable to load projects. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD WHEN SCREEN OPENS
  // =====================================================

  useEffect(() => {
    loadProjects();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredProjects =
    projects.filter((project) => {
      const searchText = search
        .trim()
        .toLowerCase();

      if (!searchText) {
        return true;
      }

      return (
        project.title
          .toLowerCase()
          .includes(searchText) ||

        project.description
          .toLowerCase()
          .includes(searchText) ||

        project.domain
          .toLowerCase()
          .includes(searchText) ||

        project.technologies
          .toLowerCase()
          .includes(searchText)
      );
    });

  // =====================================================
  // OPEN URL
  // =====================================================

  const openUrl = async (
    url: string,
    errorMessage: string
  ) => {
    if (!url) {
      Alert.alert(
        "Not Available",
        errorMessage
      );

      return;
    }

    try {
      const supported =
        await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          errorMessage
        );
      }
    } catch (error) {
      console.log(
        "Error opening URL:",
        error
      );

      Alert.alert(
        "Error",
        errorMessage
      );
    }
  };

  // =====================================================
  // RENDER PROJECT
  // =====================================================

  const renderProject = ({
    item,
  }: {
    item: Project;
  }) => {
    return (
      <View style={styles.projectCard}>

        {/* =================================================
            CARD HEADER
        ================================================= */}

        <View style={styles.cardHeader}>

          <View style={styles.titleContainer}>

            <Text
              style={styles.projectTitle}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View style={styles.domainBadge}>

              <Text style={styles.domainText}>
                {item.domain ||
                  "Domain not specified"}
              </Text>

            </View>

          </View>

          <View style={styles.projectIcon}>

            <Ionicons
              name="folder-open-outline"
              size={21}
              color="#4338CA"
            />

          </View>

        </View>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        {item.description ? (
          <Text
            style={styles.description}
            numberOfLines={3}
          >
            {item.description}
          </Text>
        ) : null}

        {/* =================================================
            TECHNOLOGIES
        ================================================= */}

        <View style={styles.infoSection}>

          <Text style={styles.label}>
            Technologies
          </Text>

          <View style={styles.technologyBox}>

            <Ionicons
              name="code-slash-outline"
              size={16}
              color="#4338CA"
            />

            <Text
              style={styles.value}
              numberOfLines={2}
            >
              {item.technologies ||
                "Not specified"}
            </Text>

          </View>

        </View>

        {/* =================================================
            REPORT + GITHUB
        ================================================= */}

        <View style={styles.buttonRow}>

          {/* REPORT */}

          {item.reportUrl ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                openUrl(
                  item.reportUrl!,
                  "Unable to open the project report."
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
            <View
              style={styles.unavailableButton}
            >

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

          {item.githubUrl ? (
            <Pressable
              style={styles.githubButton}
              onPress={() =>
                openUrl(
                  item.githubUrl!,
                  "Unable to open the GitHub repository."
                )
              }
            >

              <Ionicons
                name="logo-github"
                size={17}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.githubButtonText
                }
              >
                GitHub
              </Text>

            </Pressable>
          ) : (
            <View
              style={styles.unavailableButton}
            >

              <Ionicons
                name="logo-github"
                size={17}
                color="#9CA3AF"
              />

              <Text
                style={styles.unavailableText}
              >
                No GitHub
              </Text>

            </View>
          )}

        </View>

      </View>
    );
  };

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <View style={styles.container}>

      {/* =================================================
          SEARCH
      ================================================= */}

      <View style={styles.searchContainer}>

        <Ionicons
          name="search-outline"
          size={20}
          color="#6B7280"
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {search.length > 0 && (
          <Pressable
            onPress={() => setSearch("")}
          >
            <Ionicons
              name="close-circle"
              size={19}
              color="#9CA3AF"
            />
          </Pressable>
        )}

      </View>

      {/* =================================================
          PROJECT COUNT
      ================================================= */}

      {!loading && (
        <View style={styles.countRow}>

          <Text style={styles.count}>
            {filteredProjects.length}{" "}
            {filteredProjects.length === 1
              ? "Project"
              : "Projects"}
          </Text>

          {search.length > 0 && (
            <Text
              style={styles.searchResultText}
            >
              Results for "{search}"
            </Text>
          )}

        </View>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (
        <View style={styles.loadingContainer}>

          <ActivityIndicator
            size="large"
            color="#4338CA"
          />

          <Text style={styles.loadingText}>
            Loading projects...
          </Text>

        </View>

      ) : filteredProjects.length === 0 ? (

        /* =================================================
            EMPTY STATE
        ================================================= */

        <View style={styles.emptyContainer}>

          <View style={styles.emptyIcon}>

            <Ionicons
              name="search-outline"
              size={31}
              color="#4338CA"
            />

          </View>

          <Text style={styles.emptyTitle}>
            No Projects Found
          </Text>

          <Text style={styles.emptyText}>
            {search
              ? "Try searching with a different keyword."
              : "There are no projects available to explore yet."}
          </Text>

          {search && (
            <Pressable
              style={styles.clearButton}
              onPress={() => setSearch("")}
            >
              <Text
                style={styles.clearButtonText}
              >
                Clear Search
              </Text>
            </Pressable>
          )}

        </View>

      ) : (

        /* =================================================
            PROJECT LIST
        ================================================= */

        <FlatList
          data={filteredProjects}
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
    paddingHorizontal: 18,
  },

  // =====================================================
  // SEARCH
  // =====================================================

  searchContainer: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#DDE2EA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginTop: 18,
    marginBottom: 13,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    marginLeft: 9,
    paddingVertical: 0,
  },

  // =====================================================
  // COUNT
  // =====================================================

  countRow: {
    marginBottom: 12,
  },

  count: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4338CA",
  },

  searchResultText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
  },

  // =====================================================
  // LIST
  // =====================================================

  list: {
    paddingBottom: 35,
  },

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
    shadowOpacity: 0.04,
    shadowRadius: 7,

    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 13,
  },

  titleContainer: {
    flex: 1,
    marginRight: 10,
  },

  projectTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 7,
  },

  domainBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D5F5F2",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  domainText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#238F89",
  },

  projectIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
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
  // INFORMATION
  // =====================================================

  infoSection: {
    marginBottom: 14,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 6,
  },

  technologyBox: {
    minHeight: 39,
    backgroundColor: "#F5F6FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E2F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  value: {
    flex: 1,
    fontSize: 12,
    color: "#374151",
    marginLeft: 8,
    lineHeight: 17,
  },

  // =====================================================
  // BUTTONS
  // =====================================================

  buttonRow: {
    flexDirection: "row",
    gap: 9,
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
  },

  secondaryButtonText: {
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "700",
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
  },

  githubButtonText: {
    color: "#FFFFFF",
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

  // =====================================================
  // LOADING
  // =====================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
  },

  // =====================================================
  // EMPTY
  // =====================================================

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  emptyIcon: {
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
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 7,
    textAlign: "center",
  },

  clearButton: {
    marginTop: 18,
    backgroundColor: "#4338CA",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});