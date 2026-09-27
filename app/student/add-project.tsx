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

import { Ionicons } from "@expo/vector-icons";

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
  // SIMILARITY ANALYSIS REPORT
  // =========================================================

  const [similarityReport, setSimilarityReport] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // =========================================================
  // PROJECT DEMONSTRATION
  // =========================================================

  const [liveDemoUrl, setLiveDemoUrl] = useState("");

  const [demoVideo, setDemoVideo] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [screenshots, setScreenshots] =
    useState<SelectedImage[]>([]);

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(false);

  // =========================================================
  // SELECT PROJECT REPORT
  // =========================================================

  const pickReport = async () => {

    try {

      const result =
        await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const selectedFile =
        result.assets[0];

      const isPdf =
        selectedFile.mimeType === "application/pdf" ||
        selectedFile.name
          .toLowerCase()
          .endsWith(".pdf");

      if (!isPdf) {

        Alert.alert(
          "Invalid File",
          "Only PDF project reports are allowed."
        );

        return;
      }

      const maxSize =
        10 * 1024 * 1024;

      if (
        selectedFile.size &&
        selectedFile.size > maxSize
      ) {

        Alert.alert(
          "File Too Large",
          "The project report must be smaller than 10 MB."
        );

        return;
      }

      setReport(selectedFile);

      console.log(
        "Selected report:",
        selectedFile.name
      );

    } catch (error) {

      console.log(
        "Error selecting PDF:",
        error
      );

      Alert.alert(
        "Error",
        "Could not select the project report."
      );
    }
  };

  // =========================================================
  // SELECT SIMILARITY ANALYSIS REPORT
  // =========================================================

  const pickSimilarityReport = async () => {

    try {

      const result =
        await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const selectedFile =
        result.assets[0];

      const isPdf =
        selectedFile.mimeType ===
          "application/pdf" ||
        selectedFile.name
          .toLowerCase()
          .endsWith(".pdf");

      if (!isPdf) {

        Alert.alert(
          "Invalid File",
          "Only PDF similarity analysis reports are allowed."
        );

        return;
      }

      const maxSize =
        10 * 1024 * 1024;

      if (
        selectedFile.size &&
        selectedFile.size > maxSize
      ) {

        Alert.alert(
          "File Too Large",
          "The similarity analysis report must be smaller than 10 MB."
        );

        return;
      }

      setSimilarityReport(
        selectedFile
      );

      console.log(
        "Selected similarity analysis report:",
        selectedFile.name
      );

    } catch (error) {

      console.log(
        "Error selecting similarity report:",
        error
      );

      Alert.alert(
        "Error",
        "Could not select the similarity analysis report."
      );
    }
  };

  // =========================================================
  // SELECT DEMO VIDEO
  // =========================================================

  const pickDemoVideo = async () => {

    try {

      const result =
        await DocumentPicker.getDocumentAsync({
          type: "video/*",
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (result.canceled) {
        return;
      }

      const selectedFile =
        result.assets[0];

      const isVideo =
        selectedFile.mimeType?.startsWith(
          "video/"
        ) ||
        /\.(mp4|mov|avi|mkv|webm)$/i.test(
          selectedFile.name
        );

      if (!isVideo) {

        Alert.alert(
          "Invalid File",
          "Please select a valid video file."
        );

        return;
      }

      // Maximum video size: 100 MB
      const maxSize =
        100 * 1024 * 1024;

      if (
        selectedFile.size &&
        selectedFile.size > maxSize
      ) {

        Alert.alert(
          "Video Too Large",
          "The demo video must be smaller than 100 MB."
        );

        return;
      }

      setDemoVideo(
        selectedFile
      );

      console.log(
        "Selected demo video:",
        selectedFile.name
      );

    } catch (error) {

      console.log(
        "Error selecting video:",
        error
      );

      Alert.alert(
        "Error",
        "Could not select the demo video."
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
          "Please allow photo library access to select screenshots."
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

      // =====================================================
      // MAXIMUM 3 SCREENSHOTS
      // =====================================================

      const newImages =
        result.assets.slice(0, 3);

      if (result.assets.length > 3) {

        Alert.alert(
          "Maximum Screenshots",
          "You can upload a maximum of 3 screenshots."
        );
      }

      setScreenshots(
        newImages
      );

      console.log(
        "Selected screenshots:",
        newImages.length
      );

    } catch (error) {

      console.log(
        "Error selecting screenshots:",
        error
      );

      Alert.alert(
        "Error",
        "Could not select screenshots."
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

    const response =
      await fetch(uri);

    if (!response.ok) {

      throw new Error(
        "Could not read selected file."
      );
    }

    const arrayBuffer =
      await response.arrayBuffer();

    const { error } =
      await supabase.storage
        .from("project-demos")
        .upload(
          filePath,
          arrayBuffer,
          {
            contentType,
            upsert: false,
          },
        );

    if (error) {
      throw error;
    }

    const { data } =
      supabase.storage
        .from("project-demos")
        .getPublicUrl(
          filePath,
        );

    return data.publicUrl;
  };

  // =========================================================
  // SUBMIT PROJECT
  // =========================================================

  const handleSubmit = async () => {

    // =======================================================
    // REQUIRED TEXT FIELDS
    // =======================================================

    if (
      title.trim() === "" ||
      description.trim() === "" ||
      domain.trim() === "" ||
      technologies.trim() === "" ||
      githubUrl.trim() === ""
    ) {

      Alert.alert(
        "Required Fields",
        "Please fill in all required project details."
      );

      return;
    }

    // =======================================================
    // PROJECT REPORT REQUIRED
    // =======================================================

    if (!report) {

      Alert.alert(
        "Project Report Required",
        "Please select your project report PDF."
      );

      return;
    }

    // =======================================================
    // SIMILARITY ANALYSIS REQUIRED
    // =======================================================

    if (!similarityReport) {

      Alert.alert(
        "Similarity Analysis Required",
        "Please upload the similarity analysis report PDF."
      );

      return;
    }

    // =======================================================
    // DEMONSTRATION VALIDATION
    // =======================================================

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
        "Please provide at least one:\n\n• Live Demo Link\n• Demo Video\n• Screenshots"
      );

      return;
    }

    // =======================================================
    // GITHUB VALIDATION
    // =======================================================

    const githubPattern =
      /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/i;

    if (
      !githubPattern.test(
        githubUrl.trim()
      )
    ) {

      Alert.alert(
        "Invalid GitHub URL",
        "Enter a valid GitHub repository URL.\n\nExample:\nhttps://github.com/username/project"
      );

      return;
    }

    // =======================================================
    // LIVE DEMO URL VALIDATION
    // =======================================================

    if (hasLiveDemo) {

      try {

        const url =
          new URL(
            liveDemoUrl.trim()
          );

        if (
          url.protocol !== "http:" &&
          url.protocol !== "https:"
        ) {
          throw new Error();
        }

      } catch {

        Alert.alert(
          "Invalid Live Demo URL",
          "Please enter a valid URL beginning with https://"
        );

        return;
      }
    }

    // =======================================================
    // CURRENT USER
    // =======================================================

    const user =
      auth.currentUser;

    if (!user) {

      Alert.alert(
        "Error",
        "You must be logged in to add a project."
      );

      return;
    }

    try {

      setLoading(true);

      // =====================================================
      // 1. CREATE PROJECT DOCUMENT
      // =====================================================

      console.log(
        "Creating project..."
      );

      const projectRef =
        await addDoc(
          collection(
            db,
            "projects",
          ),
          {

            title:
              title.trim(),

            description:
              description.trim(),

            domain:
              domain.trim(),

            technologies:
              technologies.trim(),

            githubUrl:
              githubUrl.trim(),

            // -------------------------------------------------
            // PROJECT REPORT
            // -------------------------------------------------

            reportUrl: "",
            reportName: "",
            reportPath: "",

            // -------------------------------------------------
            // SIMILARITY ANALYSIS REPORT
            // -------------------------------------------------

            similarityReportUrl: "",
            similarityReportName: "",
            similarityReportPath: "",

            // -------------------------------------------------
            // DEMONSTRATION
            // -------------------------------------------------

            liveDemoUrl:
              hasLiveDemo
                ? liveDemoUrl.trim()
                : "",

            videoUrl: "",
            videoName: "",

            screenshotUrls: [],

            // -------------------------------------------------
            // STUDENT
            // -------------------------------------------------

            studentId:
              user.uid,

            // -------------------------------------------------
            // WORKFLOW
            // -------------------------------------------------

            status:
              "pending",

            createdAt:
              serverTimestamp(),
          },
        );

      const projectId =
        projectRef.id;

      console.log(
        "Project created:",
        projectId
      );

      // =====================================================
      // 2. UPLOAD PROJECT REPORT
      // =====================================================

      console.log(
        "Uploading project report..."
      );

      const reportResponse =
        await fetch(
          report.uri
        );

      if (!reportResponse.ok) {

        throw new Error(
          "Could not read the selected project report PDF."
        );
      }

      const reportArrayBuffer =
        await reportResponse.arrayBuffer();

      const safeReportName =
        report.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const reportPath =
        `${user.uid}/${projectId}/report_${Date.now()}_${safeReportName}`;

      const {
        error: reportUploadError,
      } =
        await supabase.storage
          .from(
            "project-reports"
          )
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

      const {
        data: reportPublicData,
      } =
        supabase.storage
          .from(
            "project-reports"
          )
          .getPublicUrl(
            reportPath
          );

      const reportUrl =
        reportPublicData.publicUrl;

      console.log(
        "Project report uploaded:",
        reportUrl
      );

      // =====================================================
      // 3. UPLOAD SIMILARITY ANALYSIS REPORT
      // =====================================================

      console.log(
        "Uploading similarity analysis report..."
      );

      const similarityResponse =
        await fetch(
          similarityReport.uri
        );

      if (!similarityResponse.ok) {

        throw new Error(
          "Could not read the selected similarity analysis report PDF."
        );
      }

      const similarityArrayBuffer =
        await similarityResponse.arrayBuffer();

      const safeSimilarityName =
        similarityReport.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const similarityReportPath =
        `${user.uid}/${projectId}/similarity_${Date.now()}_${safeSimilarityName}`;

      const {
        error:
          similarityUploadError,
      } =
        await supabase.storage
          .from(
            "project-reports"
          )
          .upload(
            similarityReportPath,
            similarityArrayBuffer,
            {
              contentType:
                "application/pdf",
              upsert: false,
            },
          );

      if (similarityUploadError) {
        throw similarityUploadError;
      }

      const {
        data:
          similarityPublicData,
      } =
        supabase.storage
          .from(
            "project-reports"
          )
          .getPublicUrl(
            similarityReportPath
          );

      const similarityReportUrl =
        similarityPublicData.publicUrl;

      console.log(
        "Similarity analysis report uploaded:",
        similarityReportUrl
      );

      // =====================================================
      // 4. UPLOAD DEMO VIDEO
      // =====================================================

      let videoUrl = "";

      if (demoVideo) {

        console.log(
          "Uploading demo video..."
        );

        const safeVideoName =
          demoVideo.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

        const videoPath =
          `${user.uid}/${projectId}/video_${Date.now()}_${safeVideoName}`;

        videoUrl =
          await uploadFile(
            demoVideo.uri,
            videoPath,
            demoVideo.mimeType ||
              "video/mp4",
          );

        console.log(
          "Video uploaded:",
          videoUrl
        );
      }

      // =====================================================
      // 5. UPLOAD SCREENSHOTS
      // =====================================================

      const screenshotUrls: string[] =
        [];

      if (
        screenshots.length > 0
      ) {

        console.log(
          "Uploading screenshots..."
        );

        for (
          let i = 0;
          i < screenshots.length;
          i++
        ) {

          const image =
            screenshots[i];

          const extension =
            image.fileName
              ?.split(".")
              .pop() ||
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
            imageUrl
          );
        }
      }

      // =====================================================
      // 6. UPDATE PROJECT DOCUMENT
      // =====================================================

      await updateDoc(
        doc(
          db,
          "projects",
          projectId,
        ),
        {

          // -------------------------------------------------
          // PROJECT REPORT
          // -------------------------------------------------

          reportUrl,
          reportName:
            report.name,
          reportPath,

          // -------------------------------------------------
          // SIMILARITY ANALYSIS REPORT
          // -------------------------------------------------

          similarityReportUrl,
          similarityReportName:
            similarityReport.name,
          similarityReportPath,

          // -------------------------------------------------
          // DEMONSTRATION
          // -------------------------------------------------

          videoUrl,

          videoName:
            demoVideo?.name ||
            "",

          screenshotUrls,
        },
      );

      console.log(
        "Project submitted successfully."
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      Alert.alert(
        "Success",
        "Your project has been submitted successfully!"
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

      setSimilarityReport(
        null
      );

      setLiveDemoUrl("");
      setDemoVideo(null);
      setScreenshots([]);

    } catch (error: any) {

      console.log(
        "Error submitting project:",
        error
      );

      Alert.alert(
        "Submission Error",
        error?.message ||
          "Something went wrong while submitting the project."
      );

    } finally {

      setLoading(false);
    }
  };

  // =========================================================
  // FILE CARD
  // =========================================================

  const FileSelected = ({
    name,
    icon,
    color,
  }: {
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
  }) => {

    return (
      <View
        style={styles.selectedFileCard}
      >

        <View
          style={styles.selectedFileIcon}
        >

          <Ionicons
            name={icon}
            size={23}
            color={color || "#4338CA"}
          />

        </View>

        <View
          style={styles.selectedFileContent}
        >

          <Text
            style={styles.selectedFileName}
            numberOfLines={2}
          >
            {name}
          </Text>

          <Text
            style={styles.selectedFileLabel}
          >
            File selected
          </Text>

        </View>

        <Ionicons
          name="checkmark-circle"
          size={22}
          color="#0F766E"
        />

      </View>
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (

    <View
      style={styles.container}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          styles.content
        }
      >

        {/* ===================================================
            PROJECT DETAILS CARD
        =================================================== */}

        <View
          style={styles.card}
        >

          <View
            style={styles.cardHeader}
          >

            <View
              style={[
                styles.cardIcon,
                styles.indigoIcon,
              ]}
            >

              <Ionicons
                name="document-text-outline"
                size={25}
                color="#4338CA"
              />

            </View>

            <View
              style={styles.cardHeaderText}
            >

              <Text
                style={styles.cardTitle}
              >
                Project Details
              </Text>

              <Text
                style={styles.cardSubtitle}
              >
                Basic information about your project
              </Text>

            </View>

          </View>

          {/* PROJECT TITLE */}

          <Text
            style={styles.label}
          >
            Project Title
            <Text style={styles.required}>
              {" "}*
            </Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter project title"
            placeholderTextColor="#A1A7B3"
            value={title}
            onChangeText={setTitle}
          />

          {/* DESCRIPTION */}

          <Text
            style={styles.label}
          >
            Description
            <Text style={styles.required}>
              {" "}*
            </Text>
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
            placeholder="Briefly describe your project"
            placeholderTextColor="#A1A7B3"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          {/* DOMAIN */}

          <Text
            style={styles.label}
          >
            Domain
            <Text style={styles.required}>
              {" "}*
            </Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: Artificial Intelligence"
            placeholderTextColor="#A1A7B3"
            value={domain}
            onChangeText={setDomain}
          />

          {/* TECHNOLOGIES */}

          <Text
            style={styles.label}
          >
            Technologies Used
            <Text style={styles.required}>
              {" "}*
            </Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: React Native, Firebase"
            placeholderTextColor="#A1A7B3"
            value={technologies}
            onChangeText={setTechnologies}
          />

          {/* GITHUB */}

          <Text
            style={styles.label}
          >
            GitHub Repository
            <Text style={styles.required}>
              {" "}*
            </Text>
          </Text>

          <View
            style={styles.inputWithIcon}
          >

            <Ionicons
              name="logo-github"
              size={20}
              color="#6B7280"
            />

            <TextInput
              style={styles.iconInput}
              placeholder="https://github.com/username/project"
              placeholderTextColor="#A1A7B3"
              value={githubUrl}
              onChangeText={setGithubUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

          </View>

        </View>

        {/* ===================================================
            PROJECT REPORT CARD
        =================================================== */}

        <View
          style={styles.card}
        >

          <View
            style={styles.cardHeader}
          >

            <View
              style={[
                styles.cardIcon,
                styles.mintIcon,
              ]}
            >

              <Ionicons
                name="document-attach-outline"
                size={25}
                color="#0F766E"
              />

            </View>

            <View
              style={styles.cardHeaderText}
            >

              <Text
                style={styles.cardTitle}
              >
                Project Report
              </Text>

              <Text
                style={styles.cardSubtitle}
              >
                Upload your project report
              </Text>

            </View>

          </View>

          <Text
            style={styles.label}
          >
            Project Report (PDF)
            <Text style={styles.required}>
              {" "}*
            </Text>
          </Text>

          {!report ? (

            <Pressable
              style={styles.uploadButton}
              onPress={pickReport}
              disabled={loading}
            >

              <Ionicons
                name="cloud-upload-outline"
                size={21}
                color="#4338CA"
              />

              <Text
                style={styles.uploadButtonText}
              >
                Select PDF Report
              </Text>

            </Pressable>

          ) : (

            <Pressable
              onPress={pickReport}
              disabled={loading}
            >

              <FileSelected
                name={report.name}
                icon="document-text-outline"
              />

            </Pressable>

          )}

        </View>

        {/* ===================================================
            SIMILARITY ANALYSIS CARD
        =================================================== */}

        <View
          style={styles.card}
        >

          <View
            style={styles.cardHeader}
          >

            <View
              style={[
                styles.cardIcon,
                styles.indigoIcon,
              ]}
            >

              <Ionicons
                name="analytics-outline"
                size={25}
                color="#4338CA"
              />

            </View>

            <View
              style={styles.cardHeaderText}
            >

              <Text
                style={styles.cardTitle}
              >
                Similarity Analysis
              </Text>

              <Text
                style={styles.cardSubtitle}
              >
                Upload your similarity analysis report
              </Text>

            </View>

          </View>

          <View
            style={styles.requiredBanner}
          >

            <Ionicons
              name="information-circle-outline"
              size={17}
              color="#4338CA"
            />

            <Text
              style={styles.requiredBannerText}
            >
              Similarity analysis report is required
              for project submission.
            </Text>

          </View>

          <Text
            style={styles.label}
          >
            Similarity Analysis Report (PDF)
            <Text style={styles.required}>
              {" "}*
            </Text>
          </Text>

          {!similarityReport ? (

            <Pressable
              style={styles.uploadButton}
              onPress={pickSimilarityReport}
              disabled={loading}
            >

              <Ionicons
                name="cloud-upload-outline"
                size={21}
                color="#4338CA"
              />

              <Text
                style={styles.uploadButtonText}
              >
                Select Similarity Report
              </Text>

            </Pressable>

          ) : (

            <Pressable
              onPress={pickSimilarityReport}
              disabled={loading}
            >

              <FileSelected
                name={similarityReport.name}
                icon="analytics-outline"
              />

            </Pressable>

          )}

        </View>

        {/* ===================================================
            PROJECT DEMONSTRATION CARD
        =================================================== */}

        <View
          style={styles.card}
        >

          <View
            style={styles.cardHeader}
          >

            <View
              style={[
                styles.cardIcon,
                styles.indigoIcon,
              ]}
            >

              <Ionicons
                name="eye-outline"
                size={25}
                color="#4338CA"
              />

            </View>

            <View
              style={styles.cardHeaderText}
            >

              <Text
                style={styles.cardTitle}
              >
                Project Demonstration
              </Text>

              <Text
                style={styles.requiredOrange}
              >
                At least one option required
              </Text>

            </View>

          </View>

          <Text
            style={styles.demoDescription}
          >
            Choose how you want to present your
            project to your guide. You can provide
            one or more options.
          </Text>

          {/* =================================================
              LIVE DEMO
          ================================================= */}

          <Text
            style={styles.label}
          >
            Live Demo Link
          </Text>

          <View
            style={styles.inputWithIcon}
          >

            <Ionicons
              name="globe-outline"
              size={20}
              color="#6B7280"
            />

            <TextInput
              style={styles.iconInput}
              placeholder="https://your-project.com"
              placeholderTextColor="#A1A7B3"
              value={liveDemoUrl}
              onChangeText={setLiveDemoUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

          </View>

          {/* =================================================
              VIDEO
          ================================================= */}

          <Text
            style={styles.label}
          >
            Demo Video
          </Text>

          {!demoVideo ? (

            <Pressable
              style={styles.uploadButton}
              onPress={pickDemoVideo}
              disabled={loading}
            >

              <Ionicons
                name="videocam-outline"
                size={21}
                color="#4338CA"
              />

              <Text
                style={styles.uploadButtonText}
              >
                Select Demo Video
              </Text>

            </Pressable>

          ) : (

            <Pressable
              onPress={pickDemoVideo}
              disabled={loading}
            >

              <FileSelected
                name={demoVideo.name}
                icon="videocam-outline"
              />

            </Pressable>

          )}

          {/* =================================================
              SCREENSHOTS
          ================================================= */}

          <Text
            style={styles.label}
          >
            Screenshots
          </Text>

          <Pressable
            style={styles.uploadButton}
            onPress={pickScreenshots}
            disabled={loading}
          >

            <Ionicons
              name="images-outline"
              size={21}
              color="#4338CA"
            />

            <Text
              style={styles.uploadButtonText}
            >
              {screenshots.length > 0
                ? "Change Screenshots"
                : "Select Screenshots"}
            </Text>

          </Pressable>

          {screenshots.length > 0 && (

            <>

              <Text
                style={styles.screenshotCount}
              >
                {screenshots.length} of 3 screenshots selected
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.previewContainer}
              >

                {screenshots.map(
                  (image, index) => (

                    <View
                      key={`${image.uri}-${index}`}
                      style={styles.previewWrapper}
                    >

                      <Image
                        source={{
                          uri: image.uri,
                        }}
                        style={styles.previewImage}
                      />

                      <View
                        style={styles.previewNumber}
                      >

                        <Text
                          style={styles.previewNumberText}
                        >
                          {index + 1}
                        </Text>

                      </View>

                    </View>

                  )
                )}

              </ScrollView>

            </>

          )}

          {/* =================================================
              DEMO INFO
          ================================================= */}

          <View
            style={styles.demoInfoBox}
          >

            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#4338CA"
            />

            <Text
              style={styles.demoInfoText}
            >
              At least one of Live Demo, Demo Video,
              or Screenshots is required.
            </Text>

          </View>

        </View>

        {/* ===================================================
            FINAL REQUIREMENTS
        =================================================== */}

        <View
          style={styles.requirementCard}
        >

          <Text
            style={styles.requirementTitle}
          >
            Submission Requirements
          </Text>

          <View
            style={styles.requirementRow}
          >

            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#0F766E"
            />

            <Text
              style={styles.requirementText}
            >
              Project details
            </Text>

          </View>

          <View
            style={styles.requirementRow}
          >

            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#0F766E"
            />

            <Text
              style={styles.requirementText}
            >
              GitHub repository
            </Text>

          </View>

          <View
            style={styles.requirementRow}
          >

            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#0F766E"
            />

            <Text
              style={styles.requirementText}
            >
              Project report
            </Text>

          </View>

          <View
            style={styles.requirementRow}
          >

            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#0F766E"
            />

            <Text
              style={styles.requirementText}
            >
              Similarity analysis report
            </Text>

          </View>

          <View
            style={styles.requirementRow}
          >

            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#0F766E"
            />

            <Text
              style={styles.requirementText}
            >
              At least one project demonstration
            </Text>

          </View>

        </View>

        {/* ===================================================
            SUBMIT BUTTON
        =================================================== */}

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
              style={styles.loadingContent}
            >

              <ActivityIndicator
                color="#FFFFFF"
              />

              <Text
                style={[
                  styles.submitText,
                  {
                    marginLeft: 9,
                  },
                ]}
              >
                Uploading...
              </Text>

            </View>

          ) : (

            <View
              style={styles.submitContent}
            >

              <Ionicons
                name="send-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={styles.submitText}
              >
                Submit Project
              </Text>

            </View>

          )}

        </Pressable>

      </ScrollView>

    </View>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles =
  StyleSheet.create({

    // =======================================================
    // CONTAINER
    // =======================================================

    container: {
      flex: 1,
      backgroundColor: "#F5F7FB",
    },

    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 45,
    },

    // =======================================================
    // HEADER
    // =======================================================

    topHeader: {
      height: 72,
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },

    menuButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 13,
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#111827",
    },

    // =======================================================
    // CARD
    // =======================================================

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#E1E4EF",
      padding: 20,
      marginBottom: 20,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 22,
    },

    cardIcon: {
      width: 54,
      height: 54,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 13,
    },

    indigoIcon: {
      backgroundColor: "#EEF0FF",
    },

    mintIcon: {
      backgroundColor: "#D5F5F2",
    },

    cardHeaderText: {
      flex: 1,
    },

    cardTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: "#1F2937",
    },

    cardSubtitle: {
      fontSize: 12,
      color: "#8A909D",
      marginTop: 4,
    },

    // =======================================================
    // LABELS
    // =======================================================

    label: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 8,
    },

    required: {
      color: "#DC2626",
    },

    requiredOrange: {
      fontSize: 11,
      fontWeight: "700",
      color: "#B45309",
      marginTop: 4,
    },

    // =======================================================
    // INPUT
    // =======================================================

    input: {
      height: 60,
      borderWidth: 1,
      borderColor: "#DDE1EA",
      borderRadius: 14,
      paddingHorizontal: 17,
      fontSize: 14,
      color: "#1F2937",
      backgroundColor: "#FFFFFF",
      marginBottom: 19,
    },

    textArea: {
      height: 125,
      paddingTop: 16,
    },

    inputWithIcon: {
      height: 60,
      borderWidth: 1,
      borderColor: "#DDE1EA",
      borderRadius: 14,
      paddingHorizontal: 15,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 19,
      backgroundColor: "#FFFFFF",
    },

    iconInput: {
      flex: 1,
      height: "100%",
      paddingHorizontal: 11,
      fontSize: 14,
      color: "#1F2937",
    },

    // =======================================================
    // UPLOAD BUTTON
    // =======================================================

    uploadButton: {
      height: 52,
      borderRadius: 13,
      backgroundColor: "#EEF0FF",
      borderWidth: 1,
      borderColor: "#DADDF7",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 15,
      marginBottom: 8,
    },

    uploadButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#4338CA",
      marginLeft: 8,
    },

    // =======================================================
    // SELECTED FILE
    // =======================================================

    selectedFileCard: {
      minHeight: 68,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: "#D5F5F2",
      backgroundColor: "#F5FFFE",
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },

    selectedFileIcon: {
      width: 43,
      height: 43,
      borderRadius: 11,
      backgroundColor: "#EEF0FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    selectedFileContent: {
      flex: 1,
      paddingRight: 8,
    },

    selectedFileName: {
      fontSize: 12,
      fontWeight: "700",
      color: "#374151",
    },

    selectedFileLabel: {
      fontSize: 10,
      color: "#0F766E",
      marginTop: 3,
    },

    // =======================================================
    // SIMILARITY
    // =======================================================

    requiredBanner: {
      backgroundColor: "#F0F1FF",
      borderRadius: 12,
      padding: 11,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 17,
    },

    requiredBannerText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: "#4338CA",
      marginLeft: 7,
    },

    // =======================================================
    // DEMONSTRATION
    // =======================================================

    demoDescription: {
      fontSize: 12,
      lineHeight: 19,
      color: "#6B7280",
      marginBottom: 20,
    },

    demoInfoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: "#F4F5FF",
      borderWidth: 1,
      borderColor: "#DFE1F7",
      borderRadius: 13,
      padding: 12,
      marginTop: 6,
    },

    demoInfoText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: "#5961A4",
      marginLeft: 7,
    },

    // =======================================================
    // SCREENSHOTS
    // =======================================================

    screenshotCount: {
      fontSize: 11,
      color: "#6B7280",
      marginTop: 5,
      marginBottom: 9,
    },

    previewContainer: {
      marginBottom: 15,
    },

    previewWrapper: {
      position: "relative",
      marginRight: 10,
    },

    previewImage: {
      width: 88,
      height: 88,
      borderRadius: 12,
      backgroundColor: "#E5E7EB",
    },

    previewNumber: {
      position: "absolute",
      bottom: 5,
      left: 5,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#4338CA",
      alignItems: "center",
      justifyContent: "center",
    },

    previewNumberText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    // =======================================================
    // REQUIREMENTS
    // =======================================================

    requirementCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "#DCDFF0",
      padding: 17,
      marginBottom: 18,
    },

    requirementTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 12,
    },

    requirementRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 9,
    },

    requirementText: {
      fontSize: 11,
      color: "#6B7280",
      marginLeft: 8,
    },

    // =======================================================
    // SUBMIT
    // =======================================================

    submitButton: {
      height: 56,
      borderRadius: 14,
      backgroundColor: "#4338CA",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      shadowColor: "#4338CA",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 7,
      elevation: 4,
    },

    submitContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    submitText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
      marginLeft: 8,
    },

    disabledButton: {
      opacity: 0.65,
    },

    loadingContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

  });