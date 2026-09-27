import React, { useMemo } from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";

import { Ionicons } from "@expo/vector-icons";


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


// =====================================================
// SCREEN
// =====================================================

export default function SimilarityResultsScreen() {

  const params = useLocalSearchParams();

  // ===================================================
  // PARSE RESULTS
  // ===================================================

  const results: SimilarityResult[] =
    useMemo(() => {

      try {

        if (!params.results) {
          return [];
        }

        return JSON.parse(
          String(params.results)
        );

      } catch (error) {

        console.error(
          "Failed to parse similarity results:",
          error
        );

        return [];

      }

    }, [params.results]);


  const totalApprovedProjects =
    Number(
      params.totalApprovedProjects || 0
    );


  const processedProjects =
    Number(
      params.processedProjects || 0
    );


  // ===================================================
  // PDF REPORT
  // ===================================================

  const report = useMemo(() => {

    try {

      if (!params.report) {
        return null;
      }

      return JSON.parse(
        String(params.report)
      );

    } catch (error) {

      console.error(
        "Failed to parse PDF report:",
        error
      );

      return null;

    }

  }, [params.report]);


  // ===================================================
  // DOWNLOAD EVIDENCE
  // ===================================================

  const downloadEvidence = () => {

    if (!report) {

      Alert.alert(
        "Evidence Not Available",
        "The similarity evidence report is not available."
      );

      return;
    }

    console.log(
      "Evidence report:",
      report
    );

    /*
      We will connect the actual
      PDF download here after
      confirming the API response
      contains the correct report URL.
    */

    Alert.alert(
      "Evidence Report",
      "Evidence PDF is ready."
    );

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

      <View style={styles.resultCard}>

        {/* NUMBER */}

        <View style={styles.rankCircle}>

          <Text style={styles.rankText}>
            {index + 1}
          </Text>

        </View>


        {/* PROJECT INFORMATION */}

        <View style={styles.resultContent}>

          <Text
            style={styles.projectTitle}
            numberOfLines={2}
          >
            {item.title}
          </Text>


          {item.domain ? (

            <View style={styles.metaRow}>

              <Ionicons
                name="layers-outline"
                size={14}
                color="#6B7280"
              />

              <Text style={styles.metaText}>
                {item.domain}
              </Text>

            </View>

          ) : null}


          {item.technologies ? (

            <View style={styles.metaRow}>

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

        <View style={styles.similarityBox}>

          <Text style={styles.similarityValue}>
            {item.similarity}%
          </Text>

          <Text style={styles.similarityLabel}>
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

    <SafeAreaView style={styles.container}>

      <View style={styles.header}>

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


        <View style={styles.headerContent}>

          <Text style={styles.title}>
            Similarity Results
          </Text>

          <Text style={styles.subtitle}>
            Your report was compared with
            approved ProjectVerse projects.
          </Text>

        </View>

      </View>


      <FlatList

        data={results}

        renderItem={renderResult}

        keyExtractor={(item) =>
          item.projectId
        }

        showsVerticalScrollIndicator={false}

        contentContainerStyle={
          styles.list
        }

        ListHeaderComponent={

          <>

            {/* =========================================
                SUMMARY
            ========================================= */}

            <View style={styles.summaryCard}>

              <View style={styles.summaryIcon}>

                <Ionicons
                  name="analytics-outline"
                  size={27}
                  color="#4338CA"
                />

              </View>


              <View style={styles.summaryContent}>

                <Text style={styles.summaryNumber}>
                  {processedProjects}
                </Text>

                <Text style={styles.summaryLabel}>
                  Projects Compared
                </Text>

              </View>


              <View style={styles.summaryStatus}>

                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color="#0F766E"
                />

                <Text style={styles.summaryStatusText}>
                  Analysis Complete
                </Text>

              </View>

            </View>


            {/* =========================================
                CHECK INFORMATION
            ========================================= */}

            <View style={styles.infoCard}>

              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#4338CA"
              />


              <View style={styles.infoContent}>

                <Text style={styles.infoTitle}>
                  Analysis Summary
                </Text>


                <Text style={styles.infoText}>
                  {totalApprovedProjects} approved{" "}
                  {totalApprovedProjects === 1
                    ? "project was"
                    : "projects were"}{" "}
                  available for comparison.
                </Text>

              </View>

            </View>


            {/* =========================================
                RESULTS TITLE
            ========================================= */}

            {results.length > 0 && (

              <View style={styles.sectionHeader}>

                <Text style={styles.sectionTitle}>
                  Compared Projects
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Highest similarity first
                </Text>

              </View>

            )}

          </>

        }


        ListEmptyComponent={

          <View style={styles.emptyCard}>

            <Ionicons
              name="search-outline"
              size={35}
              color="#4338CA"
            />

            <Text style={styles.emptyTitle}>
              No Comparison Results
            </Text>

            <Text style={styles.emptyText}>
              No processed approved projects
              were available for comparison.
            </Text>

          </View>

        }


        ListFooterComponent={

          results.length > 0 ? (

            <View style={styles.evidenceCard}>

              <View style={styles.evidenceIcon}>

                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color="#4338CA"
                />

              </View>


              <View style={styles.evidenceContent}>

                <Text style={styles.evidenceTitle}>
                  Similarity Evidence
                </Text>

                <Text style={styles.evidenceText}>
                  Download the similarity analysis
                  report as evidence for your
                  project submission.
                </Text>


                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={downloadEvidence}
                  activeOpacity={0.8}
                >

                  <Ionicons
                    name="download-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.downloadText}>
                    Download Similarity Analysis Report
                  </Text>

                </TouchableOpacity>

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


  // ===================================================
  // HEADER
  // ===================================================

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


  // ===================================================
  // LIST
  // ===================================================

  list: {
    padding: 20,
    paddingBottom: 35,
  },


  // ===================================================
  // SUMMARY
  // ===================================================

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


  // ===================================================
  // INFO
  // ===================================================

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


  // ===================================================
  // SECTION
  // ===================================================

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


  // ===================================================
  // RESULT CARD
  // ===================================================

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


  // ===================================================
  // EMPTY
  // ===================================================

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


  // ===================================================
  // EVIDENCE
  // ===================================================

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


  downloadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 7,
  },

});