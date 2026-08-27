import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { auth, db } from "../../firebase/firebaseConfig";
import { supabase } from "../../supabase/supabaseConfig";

type SelectedImage = ImagePicker.ImagePickerAsset;

export default function AddProject() {
  // =========================================================
  // PROJECT DETAILS
  // =========================================================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  // =========================================================
  // PROJECT REPORT
  // =========================================================

  const [report, setReport] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // =========================================================
  // PROJECT DEMONSTRATION
  // =========================================================

  const [liveDemoUrl, setLiveDemoUrl] = useState("");

  const [demoVideo, setDemoVideo] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [screenshots, setScreenshots] = useState<SelectedImage[]>([]);

  // =========================================================
  // LOADING
  // =========================================================

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

      const isPdf =
        selectedFile.mimeType === "application/pdf" ||
        selectedFile.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        Alert.alert(
          "Invalid File",
          "Only PDF project reports are allowed.",
        );
        return;
      }

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

      Alert.alert(
        "Error",
        "Could not select the project report.",
      );
    }
  };

  // =========================================================
  // SELECT DEMO VIDEO
  // =========================================================

  const pickDemoVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      const isVideo =
        selectedFile.mimeType?.startsWith("video/") ||
        /\.(mp4|mov|avi|mkv|webm)$/i.test(selectedFile.name);

      if (!isVideo) {
        Alert.alert(
          "Invalid File",
          "Please select a valid video file.",
        );
        return;
      }

      // Maximum video size: 100 MB
      const maxSize = 100 * 1024 * 1024;

      if (selectedFile.size && selectedFile.size > maxSize) {
        Alert.alert(
          "Video Too Large",
          "The demo video must be smaller than 100 MB.",
        );
        return;
      }

      setDemoVideo(selectedFile);

      console.log("Selected demo video:", selectedFile.name);
    } catch (error) {
      console.log("Error selecting video:", error);

      Alert.alert(
        "Error",
        "Could not select the demo video.",
      );
    }
  };

  // =========================================================
  // SELECT SCREENSHOTS
  // =========================================================

  const pickScreenshots = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to select screenshots.",
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          quality: 0.8,
        });

      if (result.canceled) {
        return;
      }

      // Maximum 8 screenshots
      const newImages = result.assets.slice(0, 8);

      if (result.assets.length > 8) {
        Alert.alert(
          "Maximum Screenshots",
          "You can upload a maximum of 8 screenshots.",
        );
      }

      setScreenshots(newImages);

      console.log(
        "Selected screenshots:",
        newImages.length,
      );
    } catch (error) {
      console.log("Error selecting screenshots:", error);

      Alert.alert(
        "Error",
        "Could not select screenshots.",
      );
    }
  };

  // =========================================================
  // UPLOAD FILE TO SUPABASE
  // =========================================================

  const uploadFile = async (
    uri: string,
    filePath: string,
    contentType: string,
  ) => {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error("Could not read selected file.");
    }

    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from("project-demos")
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from("project-demos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // =========================================================
  // SUBMIT PROJECT
  // =========================================================

  const handleSubmit = async () => {
    // -------------------------------------------------------
    // REQUIRED TEXT FIELDS
    // -------------------------------------------------------

    if (
      title.trim() === "" ||
      description.trim() === "" ||
      domain.trim() === "" ||
      technologies.trim() === "" ||
      githubUrl.trim() === ""
    ) {
      Alert.alert(
        "Error",
        "Please fill in all required fields.",
      );
      return;
    }

    // -------------------------------------------------------
    // REPORT REQUIRED
    // -------------------------------------------------------

    if (!report) {
      Alert.alert(
        "Error",
        "Please select your project report PDF.",
      );
      return;
    }

    // -------------------------------------------------------
    // DEMONSTRATION VALIDATION
    // -------------------------------------------------------

    const hasLiveDemo =
      liveDemoUrl.trim() !== "";

    const hasVideo =
      demoVideo !== null;

    const hasScreenshots =
      screenshots.length > 0;

    if (
      !hasLiveDemo &&
      !hasVideo &&
      !hasScreenshots
    ) {
      Alert.alert(
        "Project Demonstration Required",
        "Please provide at least one demonstration:\n\n• Live Demo Link\n• Demo Video\n• Screenshots",
      );
      return;
    }

    // -------------------------------------------------------
    // GITHUB VALIDATION
    // -------------------------------------------------------

    const githubPattern =
      /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i;

    if (!githubPattern.test(githubUrl.trim())) {
      Alert.alert(
        "Invalid GitHub URL",
        "Enter a valid GitHub repository URL.\n\nExample:\nhttps://github.com/username/project",
      );
      return;
    }

    // -------------------------------------------------------
    // LIVE DEMO URL VALIDATION
    // -------------------------------------------------------

    if (hasLiveDemo) {
      try {
        const url = new URL(liveDemoUrl.trim());

        if (
          url.protocol !== "http:" &&
          url.protocol !== "https:"
        ) {
          throw new Error();
        }
      } catch {
        Alert.alert(
          "Invalid Live Demo URL",
          "Please enter a valid URL beginning with https://",
        );
        return;
      }
    }

    // -------------------------------------------------------
    // CURRENT USER
    // -------------------------------------------------------

    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Error",
        "You must be logged in to add a project.",
      );
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // 1. CREATE PROJECT DOCUMENT FIRST
      // =====================================================

      console.log("Creating project...");

      const projectRef = await addDoc(
        collection(db, "projects"),
        {
          title: title.trim(),
          description: description.trim(),
          domain: domain.trim(),
          technologies: technologies.trim(),

          githubUrl: githubUrl.trim(),

          // Report will be added below
          reportUrl: "",
          reportName: "",
          reportPath: "",

          // Demonstration
          liveDemoUrl: hasLiveDemo
            ? liveDemoUrl.trim()
            : "",

          videoUrl: "",
          videoName: "",

          screenshotUrls: [],

          // Student
          studentId: user.uid,

          // Workflow
          status: "pending",

          createdAt: serverTimestamp(),
        },
      );

      const projectId = projectRef.id;

      console.log(
        "Project created:",
        projectId,
      );

      // =====================================================
      // 2. UPLOAD PROJECT REPORT
      // =====================================================

      console.log("Uploading report...");

      const reportResponse =
        await fetch(report.uri);

      if (!reportResponse.ok) {
        throw new Error(
          "Could not read the selected PDF.",
        );
      }

      const reportArrayBuffer =
        await reportResponse.arrayBuffer();

      const safeReportName =
        report.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_",
        );

      const reportPath =
        `${user.uid}/${Date.now()}_${safeReportName}`;

      const { error: reportUploadError } =
        await supabase.storage
          .from("project-reports")
          .upload(
            reportPath,
            reportArrayBuffer,
            {
              contentType:
                "application/pdf",
              upsert: false,
            },
          );

      if (reportUploadError) {
        throw reportUploadError;
      }

      const { data: reportPublicData } =
        supabase.storage
          .from("project-reports")
          .getPublicUrl(reportPath);

      const reportUrl =
        reportPublicData.publicUrl;

      // =====================================================
      // 3. UPLOAD DEMO VIDEO
      // =====================================================

      let videoUrl = "";

      if (demoVideo) {
        console.log("Uploading demo video...");

        const safeVideoName =
          demoVideo.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_",
          );

        const videoPath =
          `${user.uid}/${projectId}/video_${Date.now()}_${safeVideoName}`;

        videoUrl = await uploadFile(
          demoVideo.uri,
          videoPath,
          demoVideo.mimeType ||
            "video/mp4",
        );

        console.log(
          "Video uploaded:",
          videoUrl,
        );
      }

      // =====================================================
      // 4. UPLOAD SCREENSHOTS
      // =====================================================

      const screenshotUrls: string[] = [];

      if (screenshots.length > 0) {
        console.log(
          "Uploading screenshots...",
        );

        for (
          let i = 0;
          i < screenshots.length;
          i++
        ) {
          const image =
            screenshots[i];

          const extension =
            image.fileName?.split(".").pop() ||
            "jpg";

          const imagePath =
            `${user.uid}/${projectId}/screenshot_${Date.now()}_${i}.${extension}`;

          const imageUrl =
            await uploadFile(
              image.uri,
              imagePath,
              image.mimeType ||
                "image/jpeg",
            );

          screenshotUrls.push(
            imageUrl,
          );
        }
      }

      // =====================================================
      // 5. UPDATE PROJECT DOCUMENT
      // =====================================================

      await updateDoc(
        doc(db, "projects", projectId),
        {
          reportUrl,
          reportName: report.name,
          reportPath,

          videoUrl,
          videoName:
            demoVideo?.name || "",

          screenshotUrls,
        },
      );

      console.log(
        "Project submitted successfully.",
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      Alert.alert(
        "Success",
        "Your project has been submitted successfully!",
      );

      // =====================================================
      // CLEAR FORM
      // =====================================================

      setTitle("");
      setDescription("");
      setDomain("");
      setTechnologies("");
      setGithubUrl("");

      setReport(null);

      setLiveDemoUrl("");
      setDemoVideo(null);
      setScreenshots([]);
    } catch (error: any) {
      console.log(
        "Error submitting project:",
        error,
      );

      Alert.alert(
        "Submission Error",
        error?.message ||
          "Something went wrong while submitting the project.",
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
      <Text style={styles.title}>
        Add Project
      </Text>

      <Text style={styles.subtitle}>
        Submit your academic project for guide review
      </Text>

      {/* =====================================================
          PROJECT DETAILS
      ====================================================== */}

      <Text style={styles.label}>
        Project Title *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter project title"
        placeholderTextColor="#777"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>
        Description *
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textArea,
        ]}
        placeholder="Briefly describe your project"
        placeholderTextColor="#777"
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>
        Domain *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Example: Artificial Intelligence"
        placeholderTextColor="#777"
        value={domain}
        onChangeText={setDomain}
      />

      <Text style={styles.label}>
        Technologies Used *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Example: React Native, Firebase"
        placeholderTextColor="#777"
        value={technologies}
        onChangeText={setTechnologies}
      />

      {/* =====================================================
          GITHUB
      ====================================================== */}

      <Text style={styles.label}>
        GitHub Repository *
      </Text>

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

      {/* =====================================================
          PROJECT REPORT
      ====================================================== */}

      <Text style={styles.sectionTitle}>
        Project Report
      </Text>

      <Text style={styles.label}>
        Project Report (PDF) *
      </Text>

      <Pressable
        style={styles.secondaryButton}
        onPress={pickReport}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>
          {report
            ? "Change Report"
            : "Select PDF Report"}
        </Text>
      </Pressable>

      {report && (
        <>
          <Text style={styles.selectedFile}>
            📄 {report.name}
          </Text>

          {report.size && (
            <Text style={styles.fileSize}>
              {(report.size /
                (1024 * 1024)
              ).toFixed(2)}{" "}
              MB
            </Text>
          )}
        </>
      )}

      {/* =====================================================
          PROJECT DEMONSTRATION
      ====================================================== */}

      <View style={styles.demoHeader}>
        <Text style={styles.sectionTitle}>
          Project Demonstration
        </Text>

        <Text style={styles.requiredHint}>
          * Provide at least one
        </Text>
      </View>

      <Text style={styles.demoDescription}>
        Choose how you want to demonstrate
        your project to your guide. You can
        provide a live link, video, screenshots,
        or any combination of them.
      </Text>

      {/* LIVE DEMO */}

      <Text style={styles.label}>
         Live Demo Link
      </Text>

      <TextInput
        style={styles.input}
        placeholder="https://your-project.com"
        placeholderTextColor="#777"
        value={liveDemoUrl}
        onChangeText={setLiveDemoUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      {/* VIDEO */}

      <Text style={styles.label}>
         Demo Video
      </Text>

      <Pressable
        style={styles.secondaryButton}
        onPress={pickDemoVideo}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>
          {demoVideo
            ? "Change Demo Video"
            : "Select Demo Video"}
        </Text>
      </Pressable>

      {demoVideo && (
        <Text style={styles.selectedFile}>
          🎥 {demoVideo.name}
        </Text>
      )}

      {/* SCREENSHOTS */}

      <Text style={styles.label}>
        Screenshots
      </Text>

      <Pressable
        style={styles.secondaryButton}
        onPress={pickScreenshots}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>
          {screenshots.length > 0
            ? "Change Screenshots"
            : "Select Screenshots"}
        </Text>
      </Pressable>

      {screenshots.length > 0 && (
        <>
          <Text style={styles.screenshotCount}>
            {screenshots.length} screenshot
            {screenshots.length > 1
              ? "s"
              : ""}{" "}
            selected
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            style={styles.previewContainer}
          >
            {screenshots.map(
              (image, index) => (
                <Image
                  key={`${image.uri}-${index}`}
                  source={{
                    uri: image.uri,
                  }}
                  style={
                    styles.previewImage
                  }
                />
              ),
            )}
          </ScrollView>
        </>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ At least one of Live Demo,
          Demo Video, or Screenshots is
          required.
        </Text>
      </View>

      {/* =====================================================
          SUBMIT
      ====================================================== */}

      <Pressable
        style={[
          styles.submitButton,
          loading &&
            styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <View
            style={
              styles.loadingContent
            }
          >
            <ActivityIndicator
              color="#FFFFFF"
            />

            <Text
              style={[
                styles.buttonText,
                {
                  marginLeft: 10,
                },
              ]}
            >
              Uploading...
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            Submit Project
          </Text>
        )}
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

  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#111",
    marginTop: 10,
    marginBottom: 15,
  },

  demoHeader: {
    marginTop: 10,
  },

  requiredHint: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },

  demoDescription: {
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    alignItems: "center",
    marginBottom: 10,
  },

  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },

  selectedFile: {
    fontSize: 14,
    color: "#444",
    marginTop: 5,
    marginBottom: 18,
  },

  fileSize: {
    fontSize: 13,
    color: "#777",
    marginTop: -14,
    marginBottom: 18,
  },

  screenshotCount: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
    marginBottom: 10,
  },

  previewContainer: {
    marginBottom: 15,
  },

  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#E5E7EB",
  },

  infoBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    padding: 13,
    marginTop: 5,
    marginBottom: 15,
  },

  infoText: {
    color: "#1E40AF",
    fontSize: 13,
    lineHeight: 19,
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

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});