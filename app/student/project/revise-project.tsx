import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useEffect, useState } from "react";

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

import { auth, db } from "../../../firebase/firebaseConfig";
import { supabase } from "../../../supabase/supabaseConfig";

// ======================================================
// TYPES
// ======================================================

type Project = {
  title?: string;
  description?: string;
  domain?: string;
  technologies?: string;

  githubUrl?: string;
  liveDemoUrl?: string;

  reportUrl?: string;
  reportName?: string;
  reportPath?: string;

  videoUrl?: string;
  videoName?: string;

  screenshotUrls?: string[];

  status?: string;

  guideFeedback?: string;

  guideFeedbackAttachmentUrls?: string[];
  guideFeedbackAttachmentNames?: string[];

  reviewedBy?: string;
  reviewedAt?: any;

  studentId?: string;
};

type SelectedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

// ======================================================
// COMPONENT
// ======================================================

export default function ReviseProject() {
  const { id } = useLocalSearchParams();

  const router = useRouter();

  // ======================================================
  // PROJECT
  // ======================================================

  const [project, setProject] = useState<Project | null>(null);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  // ======================================================
  // FORM
  // ======================================================

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [domain, setDomain] = useState("");

  const [technologies, setTechnologies] = useState("");

  const [githubUrl, setGithubUrl] = useState("");

  const [liveDemoUrl, setLiveDemoUrl] = useState("");

  // ======================================================
  // NEW FILES
  // ======================================================

  const [newReport, setNewReport] = useState<SelectedFile | null>(null);

  const [newVideo, setNewVideo] = useState<SelectedFile | null>(null);

  const [newScreenshots, setNewScreenshots] = useState<SelectedFile[]>([]);

  // ======================================================
  // LOAD PROJECT
  // ======================================================

  useEffect(() => {
    const loadProject = async () => {
      try {
        if (!id || typeof id !== "string") {
          Alert.alert("Error", "Project ID is missing.");

          return;
        }

        console.log("Loading project for revision:", id);

        const projectRef = doc(db, "projects", id);

        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          Alert.alert("Project Not Found", "The project could not be found.");

          router.back();

          return;
        }

        const data = projectSnap.data();

        const loadedProject: Project = {
          ...data,
          screenshotUrls: Array.isArray(data.screenshotUrls)
            ? data.screenshotUrls
            : [],
        };

        // ------------------------------------------------
        // CHECK STATUS
        // ------------------------------------------------

        if (data.status !== "revision_required") {
          Alert.alert(
            "Revision Not Available",
            "This project does not currently require a revision.",
          );

          router.back();

          return;
        }

        setProject(loadedProject);

        // ------------------------------------------------
        // PRE-FILL FORM
        // ------------------------------------------------

        setTitle(data.title || "");

        setDescription(data.description || "");

        setDomain(data.domain || "");

        setTechnologies(data.technologies || "");

        setGithubUrl(data.githubUrl || "");

        setLiveDemoUrl(data.liveDemoUrl || "");

        console.log("Project loaded for revision");
      } catch (error) {
        console.log("Error loading revision project:", error);

        Alert.alert("Error", "Unable to load the project.");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  // ======================================================
  // PICK REPORT
  // ======================================================

  const pickReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",

        copyToCacheDirectory: true,

        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      const maxSize = 50 * 1024 * 1024;

      if (file.size && file.size > maxSize) {
        Alert.alert("File Too Large", "The report must be smaller than 50 MB.");

        return;
      }

      setNewReport({
        uri: file.uri,

        name: file.name,

        mimeType: file.mimeType || "application/pdf",

        size: file.size,
      });

      console.log("New report selected:", file.name);
    } catch (error) {
      console.log("Error selecting report:", error);

      Alert.alert("Error", "Unable to select the report.");
    }
  };

  // ======================================================
  // PICK VIDEO
  // ======================================================

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",

        copyToCacheDirectory: true,

        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      const maxSize = 50 * 1024 * 1024;

      if (file.size && file.size > maxSize) {
        Alert.alert(
          "File Too Large",
          "The demo video must be smaller than 50 MB.",
        );

        return;
      }

      setNewVideo({
        uri: file.uri,

        name: file.name,

        mimeType: file.mimeType || "video/mp4",

        size: file.size,
      });

      console.log("New video selected:", file.name);
    } catch (error) {
      console.log("Error selecting video:", error);

      Alert.alert("Error", "Unable to select the demo video.");
    }
  };

  // ======================================================
  // PICK SCREENSHOTS
  // ======================================================

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

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],

        allowsMultipleSelection: true,

        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const selected = result.assets || [];

      if (selected.length === 0) {
        return;
      }

      const maxSize = 10 * 1024 * 1024;

      const validFiles: SelectedFile[] = selected
        .slice(0, 8)
        .filter((image) => {
          if (image.fileSize && image.fileSize > maxSize) {
            return false;
          }

          return true;
        })
        .map((image) => ({
          uri: image.uri,

          name: image.fileName || `screenshot_${Date.now()}.jpg`,

          mimeType: image.mimeType || "image/jpeg",

          size: image.fileSize,
        }));

      if (selected.length > 8) {
        Alert.alert(
          "Maximum Screenshots",
          "You can select a maximum of 8 screenshots.",
        );
      }

      if (validFiles.length !== Math.min(selected.length, 8)) {
        Alert.alert(
          "Invalid Screenshot",
          "Some screenshots were larger than 10 MB and were not selected.",
        );
      }

      setNewScreenshots(validFiles);

      console.log("New screenshots selected:", validFiles.length);
    } catch (error) {
      console.log("Error selecting screenshots:", error);

      Alert.alert("Error", "Unable to select screenshots.");
    }
  };

  // ======================================================
  // REMOVE FILES
  // ======================================================

  const removeReport = () => {
    setNewReport(null);
  };

  const removeVideo = () => {
    setNewVideo(null);
  };

  const removeScreenshot = (index: number) => {
    setNewScreenshots((previous) => previous.filter((_, i) => i !== index));
  };

  // ======================================================
  // UPLOAD FILE
  // ======================================================

  const uploadFile = async (
    file: SelectedFile,
    projectId: string,
    folder: string,
  ) => {
    console.log("Uploading:", file.name);

    const response = await fetch(file.uri);

    if (!response.ok) {
      throw new Error(`Unable to read ${file.name}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const uniqueId = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    const path = `project-demos/${projectId}/${folder}/${uniqueId}_${safeName}`;

    const { error } = await supabase.storage
      .from("project-demos")
      .upload(path, arrayBuffer, {
        contentType: file.mimeType,

        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("project-demos").getPublicUrl(path);

    console.log("Uploaded:", data.publicUrl);

    return {
      url: data.publicUrl,

      name: file.name,

      path: path,
    };
  };

  // ======================================================
  // SUBMIT REVISION
  // ======================================================

  const submitRevision = async () => {
    if (!id || typeof id !== "string") {
      Alert.alert("Error", "Project ID is missing.");

      return;
    }

    const student = auth.currentUser;

    if (!student) {
      Alert.alert("Session Expired", "Please login again.");

      return;
    }

    // ------------------------------------------------
    // REQUIRED VALIDATION
    // ------------------------------------------------

    if (title.trim() === "") {
      Alert.alert("Title Required", "Please enter the project title.");

      return;
    }

    if (description.trim() === "") {
      Alert.alert(
        "Description Required",
        "Please enter the project description.",
      );

      return;
    }

    if (domain.trim() === "") {
      Alert.alert("Domain Required", "Please enter the project domain.");

      return;
    }

    if (technologies.trim() === "") {
      Alert.alert(
        "Technologies Required",
        "Please enter the technologies used.",
      );

      return;
    }

    if (githubUrl.trim() === "") {
      Alert.alert(
        "GitHub Required",
        "Please provide the GitHub repository URL.",
      );

      return;
    }

    try {
      setSubmitting(true);

      console.log("Starting revision submission...");

      // ==================================================
      // GET CURRENT PROJECT
      // ==================================================

      const projectRef = doc(db, "projects", id);

      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        throw new Error("Project no longer exists.");
      }

      const currentProject = projectSnap.data();

      // ==================================================
      // ENSURE REVISION IS STILL ALLOWED
      // ==================================================

      if (currentProject.status !== "revision_required") {
        Alert.alert(
          "Revision Not Available",
          "This project is no longer waiting for a revision.",
        );

        return;
      }

      // ==================================================
      // CURRENT FILES
      // ==================================================

      let reportUrl = currentProject.reportUrl || "";

      let reportName = currentProject.reportName || "";

      let reportPath = currentProject.reportPath || "";

      let videoUrl = currentProject.videoUrl || "";

      let videoName = currentProject.videoName || "";

      let screenshotUrls: string[] = Array.isArray(
        currentProject.screenshotUrls,
      )
        ? currentProject.screenshotUrls
        : [];

      // ==================================================
      // NEW REPORT
      // ==================================================

      if (newReport) {
        console.log("Uploading new report...");

        const uploadedReport = await uploadFile(newReport, id, "reports");

        reportUrl = uploadedReport.url;

        reportName = uploadedReport.name;

        reportPath = uploadedReport.path;
      }

      // ==================================================
      // NEW VIDEO
      // ==================================================

      if (newVideo) {
        console.log("Uploading new video...");

        const uploadedVideo = await uploadFile(newVideo, id, "videos");

        videoUrl = uploadedVideo.url;

        videoName = uploadedVideo.name;
      }

      // ==================================================
      // NEW SCREENSHOTS
      // ==================================================

      if (newScreenshots.length > 0) {
        console.log("Uploading new screenshots:", newScreenshots.length);

        const uploadedScreenshots: string[] = [];

        for (let i = 0; i < newScreenshots.length; i++) {
          const uploaded = await uploadFile(
            newScreenshots[i],
            id,
            "screenshots",
          );

          uploadedScreenshots.push(uploaded.url);
        }

        // Replace existing screenshots
        screenshotUrls = uploadedScreenshots;
      }

      // ==================================================
      // CREATE REVISION HISTORY
      // ==================================================

      console.log("Creating revision history...");

      const revisionRef = await addDoc(
        collection(db, "projects", id, "revisions"),
        {
          title: title.trim(),

          description: description.trim(),

          domain: domain.trim(),

          technologies: technologies.trim(),

          githubUrl: githubUrl.trim(),

          liveDemoUrl: liveDemoUrl.trim(),

          reportUrl: reportUrl,

          reportName: reportName,

          reportPath: reportPath,

          videoUrl: videoUrl,

          videoName: videoName,

          screenshotUrls: screenshotUrls,

          previousStatus: currentProject.status || "revision_required",

          previousGuideFeedback: currentProject.guideFeedback || "",

          previousGuideFeedbackAttachmentUrls: Array.isArray(
            currentProject.guideFeedbackAttachmentUrls,
          )
            ? currentProject.guideFeedbackAttachmentUrls
            : [],

          submittedBy: student.uid,

          submittedAt: serverTimestamp(),

          status: "pending",
        },
      );

      console.log("Revision history created:", revisionRef.id);

      // ==================================================
      // UPDATE MAIN PROJECT
      // ==================================================

      await updateDoc(projectRef, {
        title: title.trim(),

        description: description.trim(),

        domain: domain.trim(),

        technologies: technologies.trim(),

        githubUrl: githubUrl.trim(),

        liveDemoUrl: liveDemoUrl.trim(),

        reportUrl: reportUrl,

        reportName: reportName,

        reportPath: reportPath,

        videoUrl: videoUrl,

        videoName: videoName,

        screenshotUrls: screenshotUrls,

        // RESET REVIEW STATUS

        status: "pending",

        // CLEAR OLD FEEDBACK

        guideFeedback: "",

        guideFeedbackAttachmentUrls: [],

        guideFeedbackAttachmentNames: [],

        reviewedBy: "",

        reviewedAt: null,

        // REVISION INFO

        lastRevisionId: revisionRef.id,

        lastRevisionSubmittedAt: serverTimestamp(),

        lastRevisionSubmittedBy: student.uid,
      });

      console.log("Main project updated successfully");

      // ==================================================
      // CLEAR NEW FILES
      // ==================================================

      setNewReport(null);

      setNewVideo(null);

      setNewScreenshots([]);

      // ==================================================
      // SUCCESS
      // ==================================================

      Alert.alert(
        "Revision Submitted",
        "Your revised project has been submitted successfully. The guide can now review it again.",
        [
          {
            text: "View Project",

            onPress: () =>
              router.replace({
                pathname: "/student/project/project-details",
                params: {
                  id: id,
                },
              }),
          },
        ],
      );
    } catch (error: any) {
      console.log("Revision submission failed:", error);

      Alert.alert(
        "Submission Failed",
        error?.message || "Unable to submit the revision.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // CONFIRM SUBMISSION
  // ======================================================

  const confirmSubmission = () => {
    Alert.alert(
      "Submit Revision",
      "Are you sure you want to submit this revision for guide review?",
      [
        {
          text: "Cancel",

          style: "cancel",
        },

        {
          text: "Submit",

          onPress: submitRevision,
        },
      ],
    );
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4338CA" />

        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  // ======================================================
  // PROJECT NOT FOUND
  // ======================================================

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.notFoundIcon}>
          <Ionicons name="document-outline" size={30} color="#4338CA" />
        </View>

        <Text style={styles.notFoundTitle}>Project Not Found</Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={17} color="#FFFFFF" />

          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ==================================================
          BACK
      ================================================== */}

      <Pressable
        style={styles.backLink}
        onPress={() => router.back()}
        disabled={submitting}
      >
        <Ionicons name="arrow-back" size={17} color="#4338CA" />

        <Text style={styles.backLinkText}>Back to Project</Text>
      </Pressable>

      {/* ==================================================
          HEADER
      ================================================== */}

      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="create-outline" size={25} color="#4338CA" />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Revise Project</Text>

          <Text style={styles.subtitle}>
            Update your project based on the guide's feedback.
          </Text>
        </View>
      </View>

      {/* ==================================================
          GUIDE FEEDBACK
      ================================================== */}

      <View style={styles.feedbackSection}>
        <View style={styles.feedbackHeader}>
          <View style={styles.feedbackIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#C27A16"
            />
          </View>

          <View style={styles.feedbackHeaderContent}>
            <Text style={styles.feedbackTitle}>Guide Feedback</Text>

            <Text style={styles.feedbackSubtitle}>
              Review these comments before making your changes.
            </Text>
          </View>
        </View>

        {project.guideFeedback ? (
          <View style={styles.feedbackMessage}>
            <Text style={styles.feedbackMessageText}>
              {project.guideFeedback}
            </Text>
          </View>
        ) : (
          <View style={styles.noFeedback}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#9CA3AF"
            />

            <Text style={styles.noFeedbackText}>
              No written feedback was provided.
            </Text>
          </View>
        )}

        {/* GUIDE SCREENSHOTS */}

        {project.guideFeedbackAttachmentUrls &&
        project.guideFeedbackAttachmentUrls.length > 0 ? (
          <View style={styles.guideAttachments}>
            <View style={styles.attachmentHeader}>
              <Ionicons name="images-outline" size={18} color="#4338CA" />

              <Text style={styles.attachmentTitle}>Screenshots from Guide</Text>
            </View>

            <Text style={styles.attachmentDescription}>
              These images show areas that need changes or improvement.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {project.guideFeedbackAttachmentUrls.map((url, index) => (
                <View key={`${url}-${index}`} style={styles.guideImageCard}>
                  <Image
                    source={{
                      uri: url,
                    }}
                    style={styles.guideImage}
                    resizeMode="cover"
                  />

                  <View style={styles.guideImageInfo}>
                    <Text style={styles.guideImageNumber}>
                      Screenshot {index + 1}
                    </Text>

                    {project.guideFeedbackAttachmentNames?.[index] ? (
                      <Text style={styles.guideImageName} numberOfLines={2}>
                        {project.guideFeedbackAttachmentNames[index]}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* ==================================================
          PROJECT DETAILS
      ================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="document-text-outline" size={19} color="#4338CA" />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Project Details</Text>

            <Text style={styles.sectionSubtitle}>
              Update the information requested by your guide.
            </Text>
          </View>
        </View>

        {/* TITLE */}

        <Text style={styles.label}>
          Project Title
          <Text style={styles.required}> *</Text>
        </Text>

        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          editable={!submitting}
          placeholder="Project title"
          placeholderTextColor="#9CA3AF"
        />

        {/* DESCRIPTION */}

        <Text style={styles.label}>
          Description
          <Text style={styles.required}> *</Text>
        </Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          editable={!submitting}
          multiline
          textAlignVertical="top"
          placeholder="Project description"
          placeholderTextColor="#9CA3AF"
        />

        {/* DOMAIN */}

        <Text style={styles.label}>
          Domain
          <Text style={styles.required}> *</Text>
        </Text>

        <TextInput
          style={styles.input}
          value={domain}
          onChangeText={setDomain}
          editable={!submitting}
          placeholder="Project domain"
          placeholderTextColor="#9CA3AF"
        />

        {/* TECHNOLOGIES */}

        <Text style={styles.label}>
          Technologies
          <Text style={styles.required}> *</Text>
        </Text>

        <TextInput
          style={styles.input}
          value={technologies}
          onChangeText={setTechnologies}
          editable={!submitting}
          placeholder="Technologies used"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* ==================================================
          SOURCE CODE
      ================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="logo-github" size={19} color="#4338CA" />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Source Code</Text>

            <Text style={styles.sectionSubtitle}>
              Update the repository if your code has changed.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>
          GitHub Repository
          <Text style={styles.required}> *</Text>
        </Text>

        <View style={styles.inputWithIcon}>
          <Ionicons name="logo-github" size={18} color="#6B7280" />

          <TextInput
            style={styles.iconInput}
            value={githubUrl}
            onChangeText={setGithubUrl}
            editable={!submitting}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://github.com/username/project"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* ==================================================
          LIVE DEMO
      ================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.mintSectionIcon}>
            <Ionicons name="globe-outline" size={19} color="#238F89" />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Live Demo</Text>

            <Text style={styles.sectionSubtitle}>
              Optional project demonstration link.
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Live Demo URL</Text>

        <View style={styles.inputWithIcon}>
          <Ionicons name="link-outline" size={18} color="#6B7280" />

          <TextInput
            style={styles.iconInput}
            value={liveDemoUrl}
            onChangeText={setLiveDemoUrl}
            editable={!submitting}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://your-demo-link.com"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* ==================================================
          REPORT
      ================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons
              name="document-attach-outline"
              size={19}
              color="#4338CA"
            />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Project Report</Text>

            <Text style={styles.sectionSubtitle}>
              Keep the existing report or upload an updated version.
            </Text>
          </View>
        </View>

        {/* CURRENT FILE */}

        <View style={styles.currentFileBox}>
          <Ionicons name="document-text-outline" size={19} color="#238F89" />

          <View style={styles.currentFileContent}>
            <Text style={styles.currentFileLabel}>Current report</Text>

            <Text style={styles.currentFileName} numberOfLines={2}>
              {project.reportName || "No report"}
            </Text>
          </View>

          <Ionicons name="checkmark-circle" size={19} color="#238F89" />
        </View>

        <Pressable
          style={styles.fileButton}
          onPress={pickReport}
          disabled={submitting}
        >
          <Ionicons name="cloud-upload-outline" size={19} color="#4338CA" />

          <Text style={styles.fileButtonText}>Replace Report</Text>
        </Pressable>

        {newReport ? (
          <View style={styles.selectedFile}>
            <View style={styles.selectedFileLeft}>
              <Ionicons
                name="document-text-outline"
                size={19}
                color="#238F89"
              />

              <Text style={styles.selectedFileText} numberOfLines={2}>
                {newReport.name}
              </Text>
            </View>

            <Pressable onPress={removeReport}>
              <Ionicons name="close-circle-outline" size={21} color="#C44747" />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ==================================================
          VIDEO
      ================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="videocam-outline" size={19} color="#4338CA" />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Demo Video</Text>

            <Text style={styles.sectionSubtitle}>
              Keep the existing video or upload an updated version.
            </Text>
          </View>
        </View>

        <View style={styles.currentFileBox}>
          <Ionicons name="videocam-outline" size={19} color="#238F89" />

          <View style={styles.currentFileContent}>
            <Text style={styles.currentFileLabel}>Current video</Text>

            <Text style={styles.currentFileName} numberOfLines={2}>
              {project.videoName || "No video"}
            </Text>
          </View>

          <Ionicons name="checkmark-circle" size={19} color="#238F89" />
        </View>

        <Pressable
          style={styles.fileButton}
          onPress={pickVideo}
          disabled={submitting}
        >
          <Ionicons name="cloud-upload-outline" size={19} color="#4338CA" />

          <Text style={styles.fileButtonText}>Replace Demo Video</Text>
        </Pressable>

        {newVideo ? (
          <View style={styles.selectedFile}>
            <View style={styles.selectedFileLeft}>
              <Ionicons name="videocam-outline" size={19} color="#238F89" />

              <Text style={styles.selectedFileText} numberOfLines={2}>
                {newVideo.name}
              </Text>
            </View>

            <Pressable onPress={removeVideo}>
              <Ionicons name="close-circle-outline" size={21} color="#C44747" />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ==================================================
          SCREENSHOTS
      ================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="images-outline" size={19} color="#4338CA" />
          </View>

          <View>
            <Text style={styles.sectionTitle}>Project Screenshots</Text>

            <Text style={styles.sectionSubtitle}>
              Replace the current screenshots if your UI has changed.
            </Text>
          </View>
        </View>

        <View style={styles.currentFileBox}>
          <Ionicons name="images-outline" size={19} color="#238F89" />

          <View style={styles.currentFileContent}>
            <Text style={styles.currentFileLabel}>Current screenshots</Text>

            <Text style={styles.currentFileName}>
              {project.screenshotUrls?.length || 0} screenshot
              {(project.screenshotUrls?.length || 0) !== 1 ? "s" : ""}
            </Text>
          </View>

          <Ionicons name="checkmark-circle" size={19} color="#238F89" />
        </View>

        <Text style={styles.helpText}>
          Selecting new screenshots will replace the existing screenshots.
        </Text>

        <Pressable
          style={styles.fileButton}
          onPress={pickScreenshots}
          disabled={submitting}
        >
          <Ionicons name="images-outline" size={19} color="#4338CA" />

          <Text style={styles.fileButtonText}>Replace Screenshots</Text>
        </Pressable>

        {newScreenshots.length > 0 ? (
          <View style={styles.selectedScreenshots}>
            <View style={styles.selectedTitleRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color="#238F89"
              />

              <Text style={styles.selectedTitle}>
                {newScreenshots.length} new screenshot
                {newScreenshots.length !== 1 ? "s" : ""} selected
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {newScreenshots.map((image, index) => (
                <View
                  key={`${image.uri}-${index}`}
                  style={styles.selectedScreenshot}
                >
                  <Image
                    source={{
                      uri: image.uri,
                    }}
                    style={styles.previewImage}
                  />

                  <View style={styles.previewFooter}>
                    <Text style={styles.previewNumber}>
                      Screenshot {index + 1}
                    </Text>

                    <Pressable onPress={() => removeScreenshot(index)}>
                      <Ionicons
                        name="close-circle-outline"
                        size={19}
                        color="#C44747"
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* ==================================================
          SUBMIT
      ================================================== */}

      <View style={styles.submitSection}>
        <View style={styles.submitHeader}>
          <View style={styles.submitIcon}>
            <Ionicons name="refresh-outline" size={22} color="#4338CA" />
          </View>

          <View style={styles.submitHeaderContent}>
            <Text style={styles.submitTitle}>Ready to Resubmit?</Text>

            <Text style={styles.submitSubtitle}>
              Your changes will be sent back to the guide.
            </Text>
          </View>
        </View>

        <Text style={styles.submitDescription}>
          Your current project will be updated and sent for another review. The
          previous revision will remain in the revision history.
        </Text>

        <Pressable
          style={[styles.submitButton, submitting && styles.disabledButton]}
          disabled={submitting}
          onPress={confirmSubmission}
        >
          {submitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />

              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={19} color="#FFFFFF" />

              <Text style={styles.submitButtonText}>Submit Revision</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // ==================================================
  // PAGE
  // ==================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 18,
    paddingBottom: 45,
  },

  // ==================================================
  // CENTER
  // ==================================================

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  notFoundIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  notFoundTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 18,
  },

  // ==================================================
  // BACK
  // ==================================================

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 5,
  },

  backLinkText: {
    color: "#4338CA",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  // ==================================================
  // HEADER
  // ==================================================

  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E4EC",
    padding: 17,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },

  // ==================================================
  // FEEDBACK
  // ==================================================

  feedbackSection: {
    backgroundColor: "#FFF9ED",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3D9A2",
    padding: 17,
    marginBottom: 14,
  },

  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  feedbackIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF0D2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  feedbackHeaderContent: {
    flex: 1,
  },

  feedbackTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9A6700",
  },

  feedbackSubtitle: {
    fontSize: 11,
    color: "#A17A27",
    marginTop: 3,
    lineHeight: 16,
  },

  feedbackMessage: {
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#F3D9A2",
    padding: 13,
  },

  feedbackMessageText: {
    color: "#7C5A13",
    fontSize: 13,
    lineHeight: 20,
  },

  noFeedback: {
    minHeight: 45,
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  noFeedbackText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginLeft: 8,
  },

  // ==================================================
  // GUIDE ATTACHMENTS
  // ==================================================

  guideAttachments: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3D9A2",
  },

  attachmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  attachmentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4338CA",
    marginLeft: 7,
  },

  attachmentDescription: {
    fontSize: 11,
    color: "#7C5A13",
    lineHeight: 17,
    marginBottom: 11,
  },

  guideImageCard: {
    width: 170,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E4EC",
    padding: 7,
    marginRight: 10,
  },

  guideImage: {
    width: 154,
    height: 150,
    borderRadius: 9,
    backgroundColor: "#E5E7EB",
  },

  guideImageInfo: {
    paddingTop: 7,
    paddingHorizontal: 2,
  },

  guideImageNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },

  guideImageName: {
    fontSize: 9,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 3,
  },

  // ==================================================
  // SECTION
  // ==================================================

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E4EC",
    padding: 17,
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  mintSectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 17,
    marginTop: 3,
  },

  // ==================================================
  // FORM
  // ==================================================

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  required: {
    color: "#C44747",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2EA",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 16,
  },

  textArea: {
    minHeight: 115,
    paddingTop: 12,
  },

  inputWithIcon: {
    minHeight: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2EA",
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  iconInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    marginLeft: 9,
    paddingVertical: 0,
  },

  // ==================================================
  // CURRENT FILE
  // ==================================================

  currentFileBox: {
    minHeight: 52,
    backgroundColor: "#F8FAFA",
    borderWidth: 1,
    borderColor: "#DDE8E6",
    borderRadius: 11,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  currentFileContent: {
    flex: 1,
    marginLeft: 9,
  },

  currentFileLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginBottom: 2,
  },

  currentFileName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },

  // ==================================================
  // FILE BUTTON
  // ==================================================

  fileButton: {
    minHeight: 46,
    backgroundColor: "#EEF0FF",
    borderWidth: 1,
    borderColor: "#DCDFF5",
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  fileButtonText: {
    color: "#4338CA",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 7,
  },

  selectedFile: {
    marginTop: 10,
    minHeight: 48,
    backgroundColor: "#D5F5F2",
    borderWidth: 1,
    borderColor: "#B7E5E1",
    borderRadius: 11,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedFileLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  selectedFileText: {
    flex: 1,
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },

  // ==================================================
  // HELP
  // ==================================================

  helpText: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 17,
    marginBottom: 11,
  },

  // ==================================================
  // SCREENSHOTS
  // ==================================================

  selectedScreenshots: {
    marginTop: 14,
  },

  selectedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  selectedTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#238F89",
    marginLeft: 6,
  },

  selectedScreenshot: {
    width: 130,
    marginRight: 10,
  },

  previewImage: {
    width: 130,
    height: 125,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },

  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 5,
    paddingHorizontal: 2,
  },

  previewNumber: {
    flex: 1,
    fontSize: 10,
    color: "#6B7280",
  },

  // ==================================================
  // SUBMIT
  // ==================================================

  submitSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCDFF5",
    padding: 17,
    marginBottom: 15,
  },

  submitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  submitIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  submitHeaderContent: {
    flex: 1,
  },

  submitTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  submitSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 3,
  },

  submitDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 19,
    marginBottom: 15,
  },

  submitButton: {
    minHeight: 49,
    backgroundColor: "#4338CA",
    borderRadius: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4338CA",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
