import React, { useMemo, useState } from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import {
  useLocalSearchParams,
  router,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import {
  File,
  Directory,
  Paths,
} from "expo-file-system";

import * as Sharing from "expo-sharing";


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


// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL =
  "http://192.168.1.11:8000";


// =====================================================
// SAFE PARAMETER PARSER
// =====================================================

function parseParam<T>(
  value: unknown
): T | null {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }


  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {

    return value as T;
  }


  if (
    Array.isArray(value)
  ) {

    const firstValue =
      value[0];

    if (
      firstValue === undefined ||
      firstValue === null
    ) {
      return null;
    }

    if (
      typeof firstValue === "object"
    ) {
      return firstValue as T;
    }

    value = firstValue;
  }


  if (
    typeof value === "string"
  ) {

    try {

      return JSON.parse(
        value
      ) as T;

    } catch (error) {

      console.log(
        "Parameter is not valid JSON:",
        value
      );

      return null;
    }
  }


  return null;
}


// =====================================================
// NORMALIZE REPORT
// =====================================================

function normalizeReport(
  value: unknown
): SimilarityReport | null {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return null;
  }


  // ---------------------------------------------------
  // OBJECT
  // ---------------------------------------------------

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {

    const report =
      value as Partial<SimilarityReport>;

    if (
      report.filename
    ) {

      return {

        reportId:
          String(
            report.reportId || ""
          ),

        filename:
          String(
            report.filename
          ),

        filePath:
          report.filePath
            ? String(
                report.filePath
              )
            : undefined,
      };
    }
  }


  // ---------------------------------------------------
  // ARRAY
  // ---------------------------------------------------

  if (
    Array.isArray(value)
  ) {

    return normalizeReport(
      value[0]
    );
  }


  // ---------------------------------------------------
  // STRING
  // ---------------------------------------------------

  if (
    typeof value === "string"
  ) {

    try {

      const parsed =
        JSON.parse(value);

      return normalizeReport(
        parsed
      );

    } catch (error) {

      console.log(
        "Could not parse report JSON:",
        value
      );

      return null;
    }
  }


  return null;
}


// =====================================================
// SCREEN
// =====================================================

export default function SimilarityResultsScreen() {

  const params =
    useLocalSearchParams();


  const [isDownloading, setIsDownloading] =
    useState(false);


  // ===================================================
  // PARSE RESULTS
  // ===================================================

  const results:
    SimilarityResult[] =
    useMemo(() => {

      const parsed =
        parseParam<SimilarityResult[]>(
          params.results
        );


      if (
        !parsed ||
        !Array.isArray(parsed)
      ) {

        return [];
      }


      return parsed;

    }, [
      params.results
    ]);


  // ===================================================
  // TOTAL APPROVED PROJECTS
  // ===================================================

  const totalApprovedProjects =
    Number(
      Array.isArray(
        params.totalApprovedProjects
      )
        ? params.totalApprovedProjects[0]
        : params.totalApprovedProjects || 0
    );


  // ===================================================
  // PROCESSED PROJECTS
  // ===================================================

  const processedProjects =
    Number(
      Array.isArray(
        params.processedProjects
      )
        ? params.processedProjects[0]
        : params.processedProjects || 0
    );


  // ===================================================
  // UPLOADED CHARACTERS
  // ===================================================

  const uploadedCharacters =
    Number(
      Array.isArray(
        params.uploadedCharacters
      )
        ? params.uploadedCharacters[0]
        : params.uploadedCharacters || 0
    );


  // ===================================================
  // PDF REPORT
  // ===================================================

  const report =
    useMemo(() => {

      console.log(
        "================================="
      );

      console.log(
        "Similarity results parameters:"
      );

      console.log(
        params
      );

      console.log(
        "Report raw parameter:",
        params.report
      );

      const parsed =
        normalizeReport(
          params.report
        );


      if (!parsed) {

        console.log(
          "❌ No valid similarity report received."
        );

        return null;
      }


      console.log(
        "✅ Similarity PDF report:",
        parsed
      );


      return parsed;

    }, [
      params.report
    ]);


  // ===================================================
  // DOWNLOAD EVIDENCE PDF
  // ===================================================

  const downloadEvidence =
    async () => {

      try {

        // ------------------------------------------------
        // CHECK REPORT
        // ------------------------------------------------

        if (!report) {

          Alert.alert(
            "Evidence Not Available",
            "The similarity evidence report is not available."
          );

          return;
        }


        // ------------------------------------------------
        // CHECK FILENAME
        // ------------------------------------------------

        if (
          !report.filename
        ) {

          Alert.alert(
            "PDF Error",
            "The generated PDF filename was not received."
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

        const encodedFilename =
          encodeURIComponent(
            report.filename
          );


        const pdfUrl =
          `${API_BASE_URL}/similarity-report/${encodedFilename}`;


        console.log(
          "================================="
        );

        console.log(
          "Starting PDF download..."
        );

        console.log(
          "PDF filename:",
          report.filename
        );

        console.log(
          "PDF report ID:",
          report.reportId
        );

        console.log(
          "PDF URL:",
          pdfUrl
        );

        console.log(
          "================================="
        );


        // ------------------------------------------------
        // DOWNLOAD TO LOCAL APP STORAGE
        // ------------------------------------------------

        const pdfDirectory =
          new Directory(
            Paths.cache,
            "similarity_reports"
          );


        // Create directory if required

        if (
          !pdfDirectory.exists
        ) {

          pdfDirectory.create({
            intermediates: true,
          });

        }


        console.log(
          "Local PDF directory:",
          pdfDirectory.uri
        );


        // ------------------------------------------------
        // CREATE LOCAL FILE
        // ------------------------------------------------

        const localFile =
          new File(
            pdfDirectory,
            report.filename
          );


        console.log(
          "Local PDF path:",
          localFile.uri
        );


        // ------------------------------------------------
        // DOWNLOAD PDF
        // ------------------------------------------------

        const downloadedFile =
          await File.downloadFileAsync(
            pdfUrl,
            localFile,
            {
              idempotent: true,
            }
          );


        console.log(
          "================================="
        );

        console.log(
          "PDF downloaded successfully"
        );

        console.log(
          "Local URI:",
          downloadedFile.uri
        );

        console.log(
          "File exists:",
          downloadedFile.exists
        );

        console.log(
          "================================="
        );


        // ------------------------------------------------
        // CHECK FILE
        // ------------------------------------------------

        if (
          !downloadedFile.exists
        ) {

          throw new Error(
            "Downloaded PDF file does not exist."
          );
        }


        // ------------------------------------------------
        // CHECK SHARING
        // ------------------------------------------------

        const sharingAvailable =
          await Sharing.isAvailableAsync();


        console.log(
          "Sharing available:",
          sharingAvailable
        );


        if (
          !sharingAvailable
        ) {

          Alert.alert(
            "PDF Downloaded",
            `The similarity report was downloaded successfully.\n\nFile:\n${downloadedFile.uri}`
          );

          return;
        }


        // ------------------------------------------------
        // OPEN ANDROID SHARE / SAVE SHEET
        // ------------------------------------------------

        await Sharing.shareAsync(
          downloadedFile.uri,
          {
            mimeType:
              "application/pdf",

            dialogTitle:
              "Save Similarity Evidence PDF",
          }
        );


      } catch (error) {

        console.error(
          "================================="
        );

        console.error(
          "❌ PDF DOWNLOAD ERROR"
        );

        console.error(
          error
        );

        console.error(
          "================================="
        );


        Alert.alert(
          "PDF Error",
          "Unable to download the similarity evidence PDF."
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

    return (

      <View
        style={styles.resultCard}
      >

        {/* NUMBER */}

        <View
          style={styles.rankCircle}
        >

          <Text
            style={styles.rankText}
          >
            {index + 1}
          </Text>

        </View>


        {/* PROJECT INFORMATION */}

        <View
          style={styles.resultContent}
        >

          <Text
            style={styles.projectTitle}
            numberOfLines={2}
          >
            {item.title}
          </Text>


          {item.domain ? (

            <View
              style={styles.metaRow}
            >

              <Ionicons
                name="layers-outline"
                size={14}
                color="#6B7280"
              />

              <Text
                style={styles.metaText}
              >
                {item.domain}
              </Text>

            </View>

          ) : null}


          {item.technologies ? (

            <View
              style={styles.metaRow}
            >

              <Ionicons
                name="code-slash-outline"
                size={14}
                color="#6B7280"
              />

              <Text
                style={styles.metaText}
                numberOfLines={2}
              >
                {item.technologies}
              </Text>

            </View>

          ) : null}

        </View>


        {/* SIMILARITY */}

        <View
          style={styles.similarityBox}
        >

          <Text
            style={styles.similarityValue}
          >
            {item.similarity}%
          </Text>

          <Text
            style={styles.similarityLabel}
          >
            Similar
          </Text>

        </View>

      </View>
    );
  };


  // ===================================================
  // UI
  // ===================================================

  return (

    <SafeAreaView
      style={styles.container}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={styles.header}
      >

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >

          <Ionicons
            name="arrow-back"
            size={22}
            color="#1F2937"
          />

        </TouchableOpacity>


        <View
          style={styles.headerContent}
        >

          <Text
            style={styles.title}
          >
            Similarity Results
          </Text>

          <Text
            style={styles.subtitle}
          >
            Your report was compared with approved
            ProjectVerse projects.
          </Text>

        </View>

      </View>


      {/* =================================================
          RESULTS
      ================================================= */}

      <FlatList
        data={results}

        renderItem={renderResult}

        keyExtractor={(item, index) =>
          item.projectId ||
          `result-${index}`
        }

        showsVerticalScrollIndicator={false}

        contentContainerStyle={
          styles.list
        }


        // =================================================
        // HEADER
        // =================================================

        ListHeaderComponent={

          <>

            {/* SUMMARY */}

            <View
              style={styles.summaryCard}
            >

              <View
                style={styles.summaryIcon}
              >

                <Ionicons
                  name="analytics-outline"
                  size={27}
                  color="#4338CA"
                />

              </View>


              <View
                style={styles.summaryContent}
              >

                <Text
                  style={styles.summaryNumber}
                >
                  {processedProjects}
                </Text>

                <Text
                  style={styles.summaryLabel}
                >
                  Projects Compared
                </Text>

              </View>


              <View
                style={styles.summaryStatus}
              >

                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color="#0F766E"
                />

                <Text
                  style={styles.summaryStatusText}
                >
                  Analysis Complete
                </Text>

              </View>

            </View>


            {/* INFORMATION */}

            <View
              style={styles.infoCard}
            >

              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#4338CA"
              />


              <View
                style={styles.infoContent}
              >

                <Text
                  style={styles.infoTitle}
                >
                  Analysis Summary
                </Text>


                <Text
                  style={styles.infoText}
                >

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

                    Processed report characters:{" "}
                    {uploadedCharacters}

                  </Text>

                )}

              </View>

            </View>


            {/* RESULTS TITLE */}

            {results.length > 0 && (

              <View
                style={styles.sectionHeader}
              >

                <Text
                  style={styles.sectionTitle}
                >
                  Compared Projects
                </Text>


                <Text
                  style={styles.sectionSubtitle}
                >
                  Highest similarity first
                </Text>

              </View>

            )}

          </>

        }


        // =================================================
        // EMPTY
        // =================================================

        ListEmptyComponent={

          <View
            style={styles.emptyCard}
          >

            <Ionicons
              name="search-outline"
              size={35}
              color="#4338CA"
            />


            <Text
              style={styles.emptyTitle}
            >
              No Comparison Results
            </Text>


            <Text
              style={styles.emptyText}
            >
              No processed approved projects
              were available for comparison.
            </Text>

          </View>

        }


        // =================================================
        // FOOTER
        // =================================================

        ListFooterComponent={

          results.length > 0 ? (

            <View
              style={styles.evidenceCard}
            >

              <View
                style={styles.evidenceIcon}
              >

                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color="#4338CA"
                />

              </View>


              <View
                style={styles.evidenceContent}
              >

                <Text
                  style={styles.evidenceTitle}
                >
                  Similarity Evidence
                </Text>


                <Text
                  style={styles.evidenceText}
                >
                  Download the similarity analysis
                  report as evidence for your
                  project submission.
                </Text>


                {/* PDF BUTTON */}

                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    isDownloading &&
                      styles.downloadButtonDisabled,
                  ]}
                  onPress={
                    downloadEvidence
                  }
                  activeOpacity={0.8}
                  disabled={
                    isDownloading
                  }
                >

                  {isDownloading ? (

                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                  ) : (

                    <Ionicons
                      name="download-outline"
                      size={19}
                      color="#FFFFFF"
                    />

                  )}


                  <Text
                    style={
                      styles.downloadText
                    }
                  >

                    {isDownloading
                      ? "Downloading PDF..."
                      : "Download Evidence PDF"}

                  </Text>

                </TouchableOpacity>


                {/* PDF STATUS */}

                {report && (

                  <View
                    style={
                      styles.pdfReadyRow
                    }
                  >

                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color="#0F766E"
                    />


                    <Text
                      style={
                        styles.pdfReadyText
                      }
                      numberOfLines={1}
                    >

                      PDF ready:{" "}
                      {report.filename}

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

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor: "#F5F7FB",
    },


    // =================================================
    // HEADER
    // =================================================

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },


    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },


    headerContent: {
      flex: 1,
    },


    title: {
      fontSize: 22,
      fontWeight: "700",
      color: "#111827",
    },


    subtitle: {
      fontSize: 12,
      lineHeight: 17,
      color: "#6B7280",
      marginTop: 3,
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