import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";

export default function SimilarityScreen() {
  // =====================================================
  // STATE
  // =====================================================

  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [analyzing, setAnalyzing] = useState(false);

  // =====================================================
  // SELECT PDF
  // =====================================================

  const selectReport = async () => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
          multiple: false,
        });

      // User cancelled picker
      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // -------------------------------------------------
      // Validate PDF
      // -------------------------------------------------

      const isPdf =
        file.mimeType === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        Alert.alert(
          "Invalid File",
          "Only PDF project reports are allowed."
        );

        return;
      }

      // -------------------------------------------------
      // Validate file size
      // -------------------------------------------------

      const maxSize = 10 * 1024 * 1024; // 10 MB

      if (file.size && file.size > maxSize) {
        Alert.alert(
          "File Too Large",
          "The project report must be smaller than 10 MB."
        );

        return;
      }

      // -------------------------------------------------
      // Store selected file
      // -------------------------------------------------

      setSelectedFile(file);

      console.log(
        "Selected PDF:",
        file.name
      );

    } catch (error) {
      console.error(
        "Error selecting PDF:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to select the report."
      );
    }
  };

  // =====================================================
  // REMOVE PDF
  // =====================================================

  const removeReport = () => {
    Alert.alert(
      "Remove Report",
      "Are you sure you want to remove this PDF?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Remove",
          style: "destructive",

          onPress: () => {
            setSelectedFile(null);

            console.log(
              "PDF removed."
            );
          },
        },
      ]
    );
  };

  // =====================================================
  // ANALYZE REPORT
  // =====================================================

  const analyzeReport = async () => {
    if (!selectedFile) {
      Alert.alert(
        "Report Required",
        "Please upload your project report first."
      );

      return;
    }

    try {
      setAnalyzing(true);

      console.log(
        "================================="
      );

      console.log(
        "Starting similarity analysis..."
      );

      console.log(
        "Report:",
        selectedFile.name
      );

      console.log(
        "URI:",
        selectedFile.uri
      );

      console.log(
        "================================="
      );

      // =================================================
      // FASTAPI CONNECTION
      // =================================================
      //
      // We will connect this after confirming
      // the upload UI works correctly.
      //
      // Example:
      //
      // const formData = new FormData();
      //
      // formData.append(
      //   "file",
      //   {
      //     uri: selectedFile.uri,
      //     name: selectedFile.name,
      //     type: "application/pdf",
      //   } as any
      // );
      //
      // const response = await axios.post(
      //   "http://YOUR_IP:8000/analyze-similarity",
      //   formData,
      //   {
      //     headers: {
      //       "Content-Type":
      //         "multipart/form-data",
      //     },
      //   }
      // );
      //
      // const results = response.data.results;
      //
      // =================================================

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 1500)
      );

      Alert.alert(
        "Ready",
        "The report is ready for similarity analysis."
      );

    } catch (error) {
      console.error(
        "Similarity analysis error:",
        error
      );

      Alert.alert(
        "Analysis Failed",
        "Unable to analyze the report."
      );

    } finally {
      setAnalyzing(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <Text style={styles.title}>
            Similarity Analysis
          </Text>

          <Text style={styles.subtitle}>
            Compare your project report with
            existing ProjectVerse projects.
          </Text>

        </View>


        {/* =================================================
            UPLOAD / SELECTED PDF
        ================================================= */}

        {!selectedFile ? (

          // -------------------------------------------------
          // NO PDF SELECTED
          // -------------------------------------------------

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={selectReport}
            activeOpacity={0.8}
          >

            <View style={styles.uploadIcon}>

              <Ionicons
                name="cloud-upload-outline"
                size={34}
                color="#4338CA"
              />

            </View>


            <Text style={styles.uploadTitle}>
              Upload Project Report
            </Text>


            <Text style={styles.uploadDescription}>
              Select your project report in PDF
              format.
            </Text>


            <View style={styles.chooseButton}>

              <Ionicons
                name="document-outline"
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.chooseButtonText}>
                Choose PDF
              </Text>

            </View>

          </TouchableOpacity>

        ) : (

          // -------------------------------------------------
          // PDF SELECTED
          // -------------------------------------------------

          <View style={styles.fileCard}>

            {/* PDF ICON */}

            <View style={styles.fileIcon}>

              <Ionicons
                name="document-text-outline"
                size={30}
                color="#4338CA"
              />

            </View>


            {/* FILE DETAILS */}

            <View style={styles.fileInfo}>

              <Text
                style={styles.fileName}
                numberOfLines={2}
              >
                {selectedFile.name}
              </Text>


              <Text style={styles.fileType}>
                PDF Report
              </Text>


              {selectedFile.size ? (

                <Text style={styles.fileSize}>
                  {(
                    selectedFile.size /
                    (1024 * 1024)
                  ).toFixed(2)}{" "}
                  MB
                </Text>

              ) : null}

            </View>


            {/* CHANGE PDF */}

            <TouchableOpacity
              onPress={selectReport}
              style={styles.changeButton}
              activeOpacity={0.7}
            >

              <Ionicons
                name="refresh-outline"
                size={20}
                color="#4338CA"
              />

            </TouchableOpacity>


            {/* REMOVE PDF */}

            <TouchableOpacity
              onPress={removeReport}
              style={styles.removeButton}
              activeOpacity={0.7}
            >

              <Ionicons
                name="trash-outline"
                size={20}
                color="#DC2626"
              />

            </TouchableOpacity>

          </View>

        )}


        {/* =================================================
            INFORMATION
        ================================================= */}

        <View style={styles.infoCard}>

          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#4338CA"
          />


          <View style={styles.infoContent}>

            <Text style={styles.infoTitle}>
              How it works
            </Text>


            <Text style={styles.infoText}>
              Your report will be processed using
              text extraction, preprocessing,
              TF-IDF and cosine similarity.
            </Text>

          </View>

        </View>


        {/* =================================================
            ANALYZE BUTTON
        ================================================= */}

        <TouchableOpacity
          style={[
            styles.analyzeButton,

            !selectedFile &&
              styles.disabledButton,
          ]}
          onPress={analyzeReport}
          disabled={
            !selectedFile ||
            analyzing
          }
          activeOpacity={0.8}
        >

          {analyzing ? (

            <>
              <ActivityIndicator
                color="#FFFFFF"
              />

              <Text style={styles.analyzeText}>
                Analyzing...
              </Text>
            </>

          ) : (

            <>
              <Ionicons
                name="analytics-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.analyzeText}>
                Analyze Report
              </Text>
            </>

          )}

        </TouchableOpacity>

      </View>

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


  content: {
    flex: 1,
    padding: 20,
  },


  // ===================================================
  // HEADER
  // ===================================================

  header: {
    marginBottom: 24,
  },


  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },


  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
  },


  // ===================================================
  // UPLOAD CARD
  // ===================================================

  uploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },


  uploadIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },


  uploadTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },


  uploadDescription: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },


  chooseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4338CA",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },


  chooseButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },


  // ===================================================
  // SELECTED FILE CARD
  // ===================================================

  fileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },


  fileIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },


  fileInfo: {
    flex: 1,
  },


  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },


  fileType: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },


  fileSize: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
  },


  // ===================================================
  // CHANGE BUTTON
  // ===================================================

  changeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },


  // ===================================================
  // REMOVE BUTTON
  // ===================================================

  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },


  // ===================================================
  // INFORMATION CARD
  // ===================================================

  infoCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
  },


  infoContent: {
    flex: 1,
    marginLeft: 12,
  },


  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 5,
  },


  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
  },


  // ===================================================
  // ANALYZE BUTTON
  // ===================================================

  analyzeButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },


  disabledButton: {
    backgroundColor: "#A5B4FC",
  },


  analyzeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

});