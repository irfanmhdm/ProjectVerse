import * as DocumentPicker from "expo-document-picker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { auth, db } from "../../firebase/firebaseConfig";
import { supabase } from "../../supabase/supabaseConfig";

export default function AddProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // Selected PDF
  const [report, setReport] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // SELECT PROJECT REPORT
  // =========================================================

  const pickReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      // Make sure it is actually a PDF
      const isPdf =
        selectedFile.mimeType === "application/pdf" ||
        selectedFile.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        Alert.alert("Invalid File", "Only PDF project reports are allowed.");
        return;
      }

      // Maximum report size: 10 MB
      const maxSize = 10 * 1024 * 1024;

      if (selectedFile.size && selectedFile.size > maxSize) {
        Alert.alert(
          "File Too Large",
          "The project report must be smaller than 10 MB.",
        );
        return;
      }

      setReport(selectedFile);

      console.log("Selected report:", selectedFile.name);
    } catch (error) {
      console.log("Error selecting PDF:", error);

      Alert.alert("Error", "Could not select the project report.");
    }
  };

  // =========================================================
  // SUBMIT PROJECT
  // =========================================================

  const handleSubmit = async () => {
    // Check required text fields
    if (
      title.trim() === "" ||
      description.trim() === "" ||
      domain.trim() === "" ||
      technologies.trim() === "" ||
      githubUrl.trim() === ""
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    // Report is mandatory
    if (!report) {
      Alert.alert("Error", "Please select your project report PDF.");
      return;
    }

    const githubPattern = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i;

    if (!githubPattern.test(githubUrl.trim())) {
      Alert.alert(
        "Invalid GitHub URL",
        "Enter a valid GitHub repository URL.\n\nExample:\nhttps://github.com/username/project",
      );
      return;
    }

    // Get currently logged-in student
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You must be logged in to add a project.");
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // 1. READ THE PDF
      // =====================================================

      console.log("Reading PDF...");

      const response = await fetch(report.uri);

      if (!response.ok) {
        throw new Error("Could not read the selected PDF.");
      }

      const arrayBuffer = await response.arrayBuffer();

      // =====================================================
      // 2. CREATE UNIQUE FILE NAME
      // =====================================================

      const safeFileName = report.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      const filePath = `${user.uid}/${Date.now()}_${safeFileName}`;

      console.log("Uploading report:", filePath);

      // =====================================================
      // 3. UPLOAD PDF TO SUPABASE
      // =====================================================

      const { error: uploadError } = await supabase.storage
        .from("project-reports")
        .upload(filePath, arrayBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log("PDF uploaded successfully.");

      // =====================================================
      // 4. GET PUBLIC REPORT URL
      // =====================================================

      const { data: publicUrlData } = supabase.storage
        .from("project-reports")
        .getPublicUrl(filePath);

      const reportUrl = publicUrlData.publicUrl;

      console.log("Report URL:", reportUrl);

      // =====================================================
      // 5. CREATE PROJECT DOCUMENT IN FIRESTORE
      // =====================================================

      const projectRef = await addDoc(collection(db, "projects"), {
        title: title.trim(),
        description: description.trim(),
        domain: domain.trim(),
        technologies: technologies.trim(),

        githubUrl: githubUrl.trim(),

        // Report information
        reportUrl: reportUrl,
        reportName: report.name,
        reportPath: filePath,

        // Student
        studentId: user.uid,

        // Project workflow
        status: "pending",

        createdAt: serverTimestamp(),
      });

      console.log("Project created:", projectRef.id);

      Alert.alert("Success", "Project and report submitted successfully!");

      // =====================================================
      // 6. CLEAR FORM
      // =====================================================

      setTitle("");
      setDescription("");
      setDomain("");
      setTechnologies("");
      setGithubUrl("");
      setReport(null);
    } catch (error: any) {
      console.log("Error submitting project:", error);

      Alert.alert(
        "Submission Error",
        error?.message || "Something went wrong while submitting the project.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Project</Text>

      <Text style={styles.subtitle}>
        Submit your academic project for guide review
      </Text>

      {/* PROJECT TITLE */}

      <Text style={styles.label}>Project Title *</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter project title"
        placeholderTextColor="#777"
        value={title}
        onChangeText={setTitle}
      />

      {/* DESCRIPTION */}

      <Text style={styles.label}>Description *</Text>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Briefly describe your project"
        placeholderTextColor="#777"
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      {/* DOMAIN */}

      <Text style={styles.label}>Domain *</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: Artificial Intelligence"
        placeholderTextColor="#777"
        value={domain}
        onChangeText={setDomain}
      />

      {/* TECHNOLOGIES */}

      <Text style={styles.label}>Technologies Used *</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: React Native, Firebase"
        placeholderTextColor="#777"
        value={technologies}
        onChangeText={setTechnologies}
      />

      {/* GITHUB */}

      <Text style={styles.label}>GitHub Repository *</Text>

      <TextInput
        style={styles.input}
        placeholder="https://github.com/username/project"
        placeholderTextColor="#777"
        value={githubUrl}
        onChangeText={setGithubUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      {/* PROJECT REPORT */}

      <Text style={styles.label}>Project Report (PDF) *</Text>

      <Pressable
        style={styles.reportButton}
        onPress={pickReport}
        disabled={loading}
      >
        <Text style={styles.reportButtonText}>
          {report ? "Change Report" : "Select PDF Report"}
        </Text>
      </Pressable>

      {/* SELECTED FILE */}

      {report && (
        <>
          <Text style={styles.selectedFile}>📄 {report.name}</Text>

          {report.size && (
            <Text style={styles.fileSize}>
              {(report.size / (1024 * 1024)).toFixed(2)} MB
            </Text>
          )}
        </>
      )}
      {/* SUBMIT */}

      <Pressable
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Submitting..." : "Submit Project"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },

  content: {
    padding: 25,
    paddingBottom: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 6,
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    color: "#111",
    marginBottom: 18,
  },

  textArea: {
    height: 110,
  },

  reportButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    alignItems: "center",
  },

  reportButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },

  selectedFile: {
    fontSize: 14,
    color: "#444",
    marginTop: 10,
    marginBottom: 18,
  },

  submitButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 12,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  fileSize: {
  fontSize: 13,
  color: "#777",
  marginTop: -14,
  marginBottom: 18,
},
});
