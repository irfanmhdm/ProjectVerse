import React, { useEffect, useMemo, useState } from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";

import { File, Directory, Paths } from "expo-file-system";

import * as Sharing from "expo-sharing";

import { Ionicons } from "@expo/vector-icons";

import { doc, getDoc } from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

// =====================================================
// TYPES
// =====================================================

type SimilarityResult = {
  projectId: string;

  title: string;

  domain: string;

  technologies: string;

  similarity: number;
};

type SimilarityReport = {
  reportId: string;

  filename: string;

  filePath?: string;
};

type ProjectDetails = {
  githubUrl?: string;

  reportUrl?: string;

  reportName?: string;
};

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL = "https://projectverse-backend-3cwn.onrender.com";

// =====================================================
// MAXIMUM RESULTS TO DISPLAY
// =====================================================

const MAX_SIMILAR_PROJECTS = 5;

// =====================================================
// SAFE PARAMETER PARSER
// =====================================================

function parseParam<T>(value: unknown): T | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  // ---------------------------------------------------
  // OBJECT
  // ---------------------------------------------------

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  // ---------------------------------------------------
  // ARRAY
  // ---------------------------------------------------

  if (Array.isArray(value)) {
    const firstValue = value[0];

    if (firstValue === undefined || firstValue === null) {
      return null;
    }

    if (typeof firstValue === "object") {
      return firstValue as T;
    }

    value = firstValue;
  }

  // ---------------------------------------------------
  // STRING
  // ---------------------------------------------------

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.log("Parameter is not valid JSON:", value);

      return null;
    }
  }

  return null;
}

// =====================================================
// NORMALIZE REPORT
// =====================================================

function normalizeReport(value: unknown): SimilarityReport | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  // ---------------------------------------------------
  // OBJECT
  // ---------------------------------------------------

  if (typeof value === "object" && !Array.isArray(value)) {
    const report = value as Partial<SimilarityReport>;

    if (report.filename) {
      return {
        reportId: String(report.reportId || ""),

        filename: String(report.filename),

        filePath: report.filePath ? String(report.filePath) : undefined,
      };
    }
  }

  // ---------------------------------------------------
  // ARRAY
  // ---------------------------------------------------

  if (Array.isArray(value)) {
    return normalizeReport(value[0]);
  }

  // ---------------------------------------------------
  // STRING
  // ---------------------------------------------------

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return normalizeReport(parsed);
    } catch (error) {
      console.log("Could not parse report JSON:", value);

      return null;
    }
  }

  return null;
}

// =====================================================
// SCREEN
// =====================================================

export default function SimilarityResultsScreen() {
  const params = useLocalSearchParams();

  // ===================================================
  // DOWNLOAD STATE
  // ===================================================

  const [isDownloading, setIsDownloading] = useState(false);

  // ===================================================
  // PROJECT DETAILS STATE
  // ===================================================

  const [projectDetails, setProjectDetails] = useState<
    Record<string, ProjectDetails>
  >({});

  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);

  // ===================================================
  // BACK TO SIMILARITY PAGE
  // ===================================================

  const goBackToSimilarity = () => {
    router.replace("/student/similarity");
  };

  // ===================================================
  // PARSE RESULTS
  // ===================================================

  const results: SimilarityResult[] = useMemo(() => {
    const parsed = parseParam<SimilarityResult[]>(params.results);

    if (!parsed || !Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  }, [params.results]);

  // ===================================================
  // TOP 5 RESULTS ONLY
  // ===================================================

  const topResults = useMemo(() => {
    return results
      .sort((a, b) => Number(b.similarity || 0) - Number(a.similarity || 0))
      .slice(0, MAX_SIMILAR_PROJECTS);
  }, [results]);

  // ===================================================
  // TOTAL APPROVED PROJECTS
  // ===================================================

  const totalApprovedProjects = Number(
    Array.isArray(params.totalApprovedProjects)
      ? params.totalApprovedProjects[0]
      : params.totalApprovedProjects || 0,
  );

  // ===================================================
  // PROCESSED PROJECTS
  // ===================================================

  const processedProjects = Number(
    Array.isArray(params.processedProjects)
      ? params.processedProjects[0]
      : params.processedProjects || 0,
  );

  // ===================================================
  // UPLOADED CHARACTERS
  // ===================================================

  const uploadedCharacters = Number(
    Array.isArray(params.uploadedCharacters)
      ? params.uploadedCharacters[0]
      : params.uploadedCharacters || 0,
  );

  // ===================================================
  // PDF REPORT
  // ===================================================

  const report = useMemo(() => {
    console.log("=================================");

    console.log("Similarity results parameters:");

    console.log(params);

    console.log("Report raw parameter:", params.report);

    const parsed = normalizeReport(params.report);

    if (!parsed) {
      console.log("❌ No valid similarity report received.");

      return null;
    }

    console.log("✅ Similarity PDF report:", parsed);

    return parsed;
  }, [params.report]);

  // ===================================================
  // LOAD PROJECT DETAILS
  // ===================================================

  useEffect(() => {
    const loadProjectDetails = async () => {
      if (topResults.length === 0) {
        return;
      }

      try {
        setLoadingProjectDetails(true);

        console.log("=================================");

        console.log("Loading project details...");

        const detailsMap: Record<string, ProjectDetails> = {};

        // -----------------------------------------------
        // LOAD TOP 5 PROJECT DOCUMENTS
        // -----------------------------------------------

        await Promise.all(
          topResults.map(async (result) => {
            try {
              const projectRef = doc(db, "projects", result.projectId);

              const projectSnap = await getDoc(projectRef);

              if (projectSnap.exists()) {
                const data = projectSnap.data();

                detailsMap[result.projectId] = {
                  githubUrl: data.githubUrl || "",

                  reportUrl: data.reportUrl || "",

                  reportName: data.reportName || "",
                };

                console.log("Project details loaded:", result.title);
              } else {
                console.log("Project not found:", result.projectId);
              }
            } catch (projectError) {
              console.log(
                "Failed to load project:",
                result.projectId,
                projectError,
              );
            }
          }),
        );

        setProjectDetails(detailsMap);

        console.log("Project details map:", detailsMap);
      } catch (error) {
        console.error("Error loading project details:", error);
      } finally {
        setLoadingProjectDetails(false);
      }
    };

    loadProjectDetails();
  }, [topResults]);

  // ===================================================
  // OPEN GITHUB
  // ===================================================

  const openGithub = async (githubUrl?: string) => {
    if (!githubUrl) {
      Alert.alert(
        "GitHub Not Available",
        "This project does not have a GitHub repository.",
      );

      return;
    }

    try {
      const supported = await Linking.canOpenURL(githubUrl);

      if (!supported) {
        Alert.alert("Unable to Open", "The GitHub URL could not be opened.");

        return;
      }

      await Linking.openURL(githubUrl);
    } catch (error) {
      console.error("GitHub open error:", error);

      Alert.alert("Error", "Unable to open the GitHub repository.");
    }
  };

  // ===================================================
  // OPEN PROJECT REPORT
  // ===================================================

  const openProjectReport = async (reportUrl?: string) => {
    if (!reportUrl) {
      Alert.alert(
        "Report Not Available",
        "This project does not have an uploaded project report.",
      );

      return;
    }

    try {
      const supported = await Linking.canOpenURL(reportUrl);

      if (!supported) {
        Alert.alert(
          "Unable to Open",
          "The project report URL could not be opened.",
        );

        return;
      }

      await Linking.openURL(reportUrl);
    } catch (error) {
      console.error("Report open error:", error);

      Alert.alert("Error", "Unable to open the project report.");
    }
  };

  // ===================================================
  // DOWNLOAD EVIDENCE PDF
  // ===================================================

  const downloadEvidence = async () => {
    try {
      if (!report) {
        Alert.alert(
          "Evidence Not Available",
          "The similarity evidence report is not available.",
        );

        return;
      }

      if (!report.filename) {
        Alert.alert(
          "PDF Error",
          "The generated PDF filename was not received.",
        );

        return;
      }

      if (isDownloading) {
        return;
      }

      setIsDownloading(true);

      // ------------------------------------------------
      // BUILD SERVER URL
      // ------------------------------------------------

      const encodedFilename = encodeURIComponent(report.filename);

      const pdfUrl = `${API_BASE_URL}/similarity-report/${encodedFilename}`;

      console.log("=================================");

      console.log("Starting PDF download...");

      console.log("PDF filename:", report.filename);

      console.log("PDF report ID:", report.reportId);

      console.log("PDF URL:", pdfUrl);

      console.log("=================================");

      // ------------------------------------------------
      // LOCAL DIRECTORY
      // ------------------------------------------------

      const pdfDirectory = new Directory(Paths.cache, "similarity_reports");

      if (!pdfDirectory.exists) {
        pdfDirectory.create({
          intermediates: true,
        });
      }

      console.log("Local PDF directory:", pdfDirectory.uri);

      // ------------------------------------------------
      // LOCAL FILE
      // ------------------------------------------------

      const localFile = new File(pdfDirectory, report.filename);

      console.log("Local PDF path:", localFile.uri);

      // ------------------------------------------------
      // DOWNLOAD
      // ------------------------------------------------

      const downloadedFile = await File.downloadFileAsync(pdfUrl, localFile, {
        idempotent: true,
      });

      console.log("PDF downloaded successfully");

      console.log("Local URI:", downloadedFile.uri);

      console.log("File exists:", downloadedFile.exists);

      // ------------------------------------------------
      // CHECK FILE
      // ------------------------------------------------

      if (!downloadedFile.exists) {
        throw new Error("Downloaded PDF file does not exist.");
      }

      // ------------------------------------------------
      // SHARING
      // ------------------------------------------------

      const sharingAvailable = await Sharing.isAvailableAsync();

      console.log("Sharing available:", sharingAvailable);

      if (!sharingAvailable) {
        Alert.alert(
          "PDF Downloaded",
          `The similarity report was downloaded successfully.\n\nFile:\n${downloadedFile.uri}`,
        );

        return;
      }

      // ------------------------------------------------
      // SHARE / SAVE
      // ------------------------------------------------

      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: "application/pdf",

        dialogTitle: "Save Similarity Evidence PDF",
      });
    } catch (error) {
      console.error("=================================");

      console.error("❌ PDF DOWNLOAD ERROR");

      console.error(error);

      console.error("=================================");

      Alert.alert(
        "PDF Error",
        "Unable to download the similarity evidence PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // ===================================================
  // RENDER RESULT
  // ===================================================

  const renderResult = ({
    item,
    index,
  }: {
    item: SimilarityResult;

    index: number;
  }) => {
    const details = projectDetails[item.projectId];

    return (
      <View style={styles.resultCard}>
        {/* =============================================
            NUMBER
        ============================================== */}

        <View style={styles.rankCircle}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>

        {/* =============================================
            PROJECT INFORMATION
        ============================================== */}

        <View style={styles.resultContent}>
          <Text style={styles.projectTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* DOMAIN */}

          {item.domain ? (
            <View style={styles.metaRow}>
              <Ionicons name="layers-outline" size={14} color="#6B7280" />

              <Text style={styles.metaText}>{item.domain}</Text>
            </View>
          ) : null}

          {/* TECHNOLOGIES */}

          {item.technologies ? (
            <View style={styles.metaRow}>
              <Ionicons name="code-slash-outline" size={14} color="#6B7280" />

              <Text style={styles.metaText} numberOfLines={2}>
                {item.technologies}
              </Text>
            </View>
          ) : null}

          {/* ==========================================
              FILE / GITHUB BUTTONS
          =========================================== */}

          <View style={styles.actionRow}>
            {/* GITHUB */}

            {details?.githubUrl ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openGithub(details.githubUrl)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-github" size={15} color="#4338CA" />

                <Text style={styles.actionButtonText}>GitHub</Text>
              </TouchableOpacity>
            ) : null}

            {/* PROJECT REPORT */}

            {details?.reportUrl ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openProjectReport(details.reportUrl)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="document-text-outline"
                  size={15}
                  color="#4338CA"
                />

                <Text style={styles.actionButtonText}>Report</Text>
              </TouchableOpacity>
            ) : null}

            {/* LOADING */}

            {!details && loadingProjectDetails && (
              <ActivityIndicator
                size="small"
                color="#4338CA"
                style={{
                  marginTop: 6,
                }}
              />
            )}
          </View>
        </View>

        {/* =============================================
            SIMILARITY
        ============================================== */}

        <View style={styles.similarityBox}>
          <Text style={styles.similarityValue}>{item.similarity}%</Text>

          <Text style={styles.similarityLabel}>Similar</Text>
        </View>
      </View>
    );
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <SafeAreaView style={styles.container}>
      {/* ===============================================
          TOP NAVIGATION
      ================================================ */}

      {/* <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackToSimilarity}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={23} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.topBarContent}>
          <Text style={styles.topBarTitle}>Similarity Results</Text>

          <Text style={styles.topBarSubtitle}>Top 5 most similar projects</Text>
        </View>
      </View> */}

      {/* ===============================================
          RESULTS
      ================================================ */}

      <FlatList
        data={topResults}
        renderItem={renderResult}
        keyExtractor={(item, index) => item.projectId || `result-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        // =============================================
        // HEADER
        // =============================================

        ListHeaderComponent={
          <>
            {/* SUMMARY */}

            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="analytics-outline" size={27} color="#4338CA" />
              </View>

              <View style={styles.summaryContent}>
                <Text style={styles.summaryNumber}>{processedProjects}</Text>

                <Text style={styles.summaryLabel}>Total Projects Analyzed</Text>
              </View>
              <View style={styles.summaryStatus}>
                <Ionicons name="checkmark-circle" size={17} color="#0F766E" />

                <Text style={styles.summaryStatusText}>Analysis Complete</Text>
              </View>
            </View>

            {/* INFORMATION */}

            <View style={styles.infoCard}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#4338CA"
              />

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Analysis Summary</Text>

                <Text style={styles.infoText}>
                  {totalApprovedProjects} approved{" "}
                  {totalApprovedProjects === 1
                    ? "project was"
                    : "projects were"}{" "}
                  available for comparison.
                </Text>

                {uploadedCharacters > 0 && (
                  <Text
                    style={[
                      styles.infoText,
                      {
                        marginTop: 4,
                      },
                    ]}
                  >
                    Processed report characters: {uploadedCharacters}
                  </Text>
                )}

                <Text
                  style={[
                    styles.infoText,
                    {
                      marginTop: 4,
                    },
                  ]}
                >
                  Showing the top{" "}
                  {Math.min(results.length, MAX_SIMILAR_PROJECTS)} most similar
                  projects.
                </Text>
              </View>
            </View>

            {/* RESULTS TITLE */}

            {topResults.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Compared Projects</Text>

                <Text style={styles.sectionSubtitle}>
                  Highest similarity first
                </Text>
              </View>
            )}
          </>
        }
        // =============================================
        // EMPTY
        // =============================================

        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="search-outline" size={35} color="#4338CA" />

            <Text style={styles.emptyTitle}>No Comparison Results</Text>

            <Text style={styles.emptyText}>
              No processed approved projects were available for comparison.
            </Text>
          </View>
        }
        // =============================================
        // FOOTER
        // =============================================

        ListFooterComponent={
          topResults.length > 0 ? (
            <View style={styles.evidenceCard}>
              <View style={styles.evidenceIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color="#4338CA"
                />
              </View>

              <View style={styles.evidenceContent}>
                <Text style={styles.evidenceTitle}>Similarity Evidence</Text>

                <Text style={styles.evidenceText}>
                  Download the similarity analysis report as evidence for your
                  project submission.
                </Text>

                {/* PDF BUTTON */}

                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    isDownloading && styles.downloadButtonDisabled,
                  ]}
                  onPress={downloadEvidence}
                  activeOpacity={0.8}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="download-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                  )}

                  <Text style={styles.downloadText}>
                    {isDownloading
                      ? "Downloading PDF..."
                      : "Download Evidence PDF"}
                  </Text>
                </TouchableOpacity>

                {/* PDF STATUS */}

                {report && (
                  <View style={styles.pdfReadyRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color="#0F766E"
                    />

                    <Text style={styles.pdfReadyText} numberOfLines={1}>
                      PDF ready: {report.filename}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#F5F7FB",
  },

  // =================================================
  // TOP BAR
  // =================================================

  topBar: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 12,

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 42,

    height: 42,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#F1F5F9",
  },

  topBarContent: {
    flex: 1,

    marginLeft: 11,
  },

  topBarTitle: {
    fontSize: 17,

    fontWeight: "700",

    color: "#111827",
  },

  topBarSubtitle: {
    fontSize: 11,

    color: "#9CA3AF",

    marginTop: 2,
  },

  // =================================================
  // LIST
  // =================================================

  list: {
    padding: 20,

    paddingBottom: 35,
  },

  // =================================================
  // SUMMARY
  // =================================================

  summaryCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 17,

    borderWidth: 1,

    borderColor: "#DCDFF0",

    padding: 15,

    flexDirection: "row",

    alignItems: "center",
  },

  summaryIcon: {
    width: 52,

    height: 52,

    borderRadius: 15,

    backgroundColor: "#EEF0FF",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 12,
  },

  summaryContent: {
    flex: 1,
  },

  summaryNumber: {
    fontSize: 22,

    fontWeight: "700",

    color: "#1F2937",
  },

  summaryLabel: {
    fontSize: 11,

    color: "#6B7280",

    marginTop: 2,
  },

  summaryStatus: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#D5F5F2",

    borderRadius: 14,

    paddingHorizontal: 9,

    paddingVertical: 7,
  },

  summaryStatusText: {
    fontSize: 9,

    fontWeight: "700",

    color: "#0F766E",

    marginLeft: 4,
  },

  // =================================================
  // INFO
  // =================================================

  infoCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 15,

    borderWidth: 1,

    borderColor: "#E5E7EB",

    padding: 15,

    marginTop: 13,

    flexDirection: "row",
  },

  infoContent: {
    flex: 1,

    marginLeft: 10,
  },

  infoTitle: {
    fontSize: 13,

    fontWeight: "700",

    color: "#374151",

    marginBottom: 4,
  },

  infoText: {
    fontSize: 12,

    lineHeight: 18,

    color: "#6B7280",
  },

  // =================================================
  // SECTION
  // =================================================

  sectionHeader: {
    marginTop: 22,

    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,

    fontWeight: "700",

    color: "#1F2937",
  },

  sectionSubtitle: {
    fontSize: 11,

    color: "#9CA3AF",

    marginTop: 3,
  },

  // =================================================
  // RESULT CARD
  // =================================================

  resultCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    borderWidth: 1,

    borderColor: "#DCDFF0",

    padding: 14,

    marginBottom: 10,

    flexDirection: "row",

    alignItems: "center",
  },

  rankCircle: {
    width: 34,

    height: 34,

    borderRadius: 17,

    backgroundColor: "#EEF0FF",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 11,
  },

  rankText: {
    fontSize: 13,

    fontWeight: "700",

    color: "#4338CA",
  },

  resultContent: {
    flex: 1,

    paddingRight: 8,
  },

  projectTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: "#1F2937",

    marginBottom: 5,
  },

  metaRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 3,
  },

  metaText: {
    flex: 1,

    fontSize: 10,

    color: "#6B7280",

    marginLeft: 5,
  },

  // =================================================
  // ACTION BUTTONS
  // =================================================

  actionRow: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",

    marginTop: 8,

    gap: 6,
  },

  actionButton: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#EEF0FF",

    borderRadius: 8,

    paddingHorizontal: 9,

    paddingVertical: 6,
  },

  actionButtonText: {
    fontSize: 10,

    fontWeight: "700",

    color: "#4338CA",

    marginLeft: 4,
  },

  // =================================================
  // SIMILARITY
  // =================================================

  similarityBox: {
    minWidth: 65,

    alignItems: "center",

    backgroundColor: "#D5F5F2",

    borderRadius: 12,

    paddingHorizontal: 8,

    paddingVertical: 8,
  },

  similarityValue: {
    fontSize: 14,

    fontWeight: "800",

    color: "#0F766E",
  },

  similarityLabel: {
    fontSize: 9,

    color: "#0F766E",

    marginTop: 2,
  },

  // =================================================
  // EMPTY
  // =================================================

  emptyCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    padding: 30,

    alignItems: "center",

    marginTop: 12,
  },

  emptyTitle: {
    fontSize: 16,

    fontWeight: "700",

    color: "#1F2937",

    marginTop: 12,
  },

  emptyText: {
    fontSize: 12,

    lineHeight: 18,

    color: "#6B7280",

    textAlign: "center",

    marginTop: 6,
  },

  // =================================================
  // EVIDENCE
  // =================================================

  evidenceCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 17,

    borderWidth: 1,

    borderColor: "#DCDFF0",

    padding: 16,

    marginTop: 20,

    flexDirection: "row",
  },

  evidenceIcon: {
    width: 48,

    height: 48,

    borderRadius: 13,

    backgroundColor: "#EEF0FF",

    alignItems: "center",

    justifyContent: "center",

    marginRight: 12,
  },

  evidenceContent: {
    flex: 1,
  },

  evidenceTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: "#1F2937",
  },

  evidenceText: {
    fontSize: 11,

    lineHeight: 17,

    color: "#6B7280",

    marginTop: 4,
  },

  downloadButton: {
    height: 42,

    borderRadius: 10,

    backgroundColor: "#4338CA",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 12,

    paddingHorizontal: 14,
  },

  downloadButtonDisabled: {
    opacity: 0.7,
  },

  downloadText: {
    color: "#FFFFFF",

    fontSize: 12,

    fontWeight: "700",

    marginLeft: 7,
  },

  // =================================================
  // PDF READY
  // =================================================

  pdfReadyRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 10,
  },

  pdfReadyText: {
    flex: 1,

    fontSize: 10,

    color: "#0F766E",

    marginLeft: 5,
  },
});
