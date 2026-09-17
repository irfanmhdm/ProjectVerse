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

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

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

import { auth, db } from "../../firebase/firebaseConfig";

import { supabase } from "../../supabase/supabaseConfig";

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
  const { id } =
    useLocalSearchParams();

  const router =
    useRouter();

  // ======================================================
  // PROJECT
  // ======================================================

  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  // ======================================================
  // FORM
  // ======================================================

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [domain, setDomain] =
    useState("");

  const [technologies, setTechnologies] =
    useState("");

  const [githubUrl, setGithubUrl] =
    useState("");

  const [liveDemoUrl, setLiveDemoUrl] =
    useState("");

  // ======================================================
  // NEW FILES
  // ======================================================

  const [newReport, setNewReport] =
    useState<SelectedFile | null>(
      null
    );

  const [newVideo, setNewVideo] =
    useState<SelectedFile | null>(
      null
    );

  const [newScreenshots, setNewScreenshots] =
    useState<SelectedFile[]>([]);

  // ======================================================
  // LOAD PROJECT
  // ======================================================

  useEffect(() => {
    const loadProject =
      async () => {
        try {
          if (
            !id ||
            typeof id !== "string"
          ) {
            Alert.alert(
              "Error",
              "Project ID is missing."
            );

            return;
          }

          console.log(
            "🔄 Loading project for revision:",
            id
          );

          const projectRef =
            doc(
              db,
              "projects",
              id
            );

          const projectSnap =
            await getDoc(
              projectRef
            );

          if (
            !projectSnap.exists()
          ) {
            Alert.alert(
              "Project Not Found",
              "The project could not be found."
            );

            router.back();

            return;
          }

          const data =
            projectSnap.data();

          const loadedProject: Project =
            {
              ...data,
              screenshotUrls:
                Array.isArray(
                  data.screenshotUrls
                )
                  ? data.screenshotUrls
                  : [],
            };

          // ------------------------------------------------
          // CHECK STATUS
          // ------------------------------------------------

          if (
            data.status !==
            "revision_required"
          ) {
            Alert.alert(
              "Revision Not Available",
              "This project does not currently require a revision."
            );

            router.back();

            return;
          }

          // ------------------------------------------------
          // SET PROJECT
          // ------------------------------------------------

          setProject(
            loadedProject
          );

          // ------------------------------------------------
          // PRE-FILL FORM
          // ------------------------------------------------

          setTitle(
            data.title || ""
          );

          setDescription(
            data.description || ""
          );

          setDomain(
            data.domain || ""
          );

          setTechnologies(
            data.technologies || ""
          );

          setGithubUrl(
            data.githubUrl || ""
          );

          setLiveDemoUrl(
            data.liveDemoUrl || ""
          );

          console.log(
            "✅ Project loaded for revision"
          );
        } catch (error) {
          console.log(
            "❌ Error loading revision project:",
            error
          );

          Alert.alert(
            "Error",
            "Unable to load the project."
          );
        } finally {
          setLoading(false);
        }
      };

    loadProject();
  }, [id]);

  // ======================================================
  // PICK REPORT
  // ======================================================

  const pickReport =
    async () => {
      try {
        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type:
                "application/pdf",

              copyToCacheDirectory:
                true,

              multiple:
                false,
            }
          );

        if (
          result.canceled
        ) {
          return;
        }

        const file =
          result.assets[0];

        const maxSize =
          50 * 1024 * 1024;

        if (
          file.size &&
          file.size >
            maxSize
        ) {
          Alert.alert(
            "File Too Large",
            "The report must be smaller than 50 MB."
          );

          return;
        }

        setNewReport({
          uri:
            file.uri,

          name:
            file.name,

          mimeType:
            file.mimeType ||
            "application/pdf",

          size:
            file.size,
        });

        console.log(
          "📄 New report selected:",
          file.name
        );
      } catch (error) {
        console.log(
          "❌ Error selecting report:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to select the report."
        );
      }
    };

  // ======================================================
  // PICK VIDEO
  // ======================================================

  const pickVideo =
    async () => {
      try {
        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type:
                "video/*",

              copyToCacheDirectory:
                true,

              multiple:
                false,
            }
          );

        if (
          result.canceled
        ) {
          return;
        }

        const file =
          result.assets[0];

        const maxSize =
          50 * 1024 * 1024;

        if (
          file.size &&
          file.size >
            maxSize
        ) {
          Alert.alert(
            "File Too Large",
            "The demo video must be smaller than 50 MB."
          );

          return;
        }

        setNewVideo({
          uri:
            file.uri,

          name:
            file.name,

          mimeType:
            file.mimeType ||
            "video/mp4",

          size:
            file.size,
        });

        console.log(
          "🎥 New video selected:",
          file.name
        );
      } catch (error) {
        console.log(
          "❌ Error selecting video:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to select the demo video."
        );
      }
    };

  // ======================================================
  // PICK SCREENSHOTS
  // ======================================================

  const pickScreenshots =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            "Permission Required",
            "Please allow photo library access to select screenshots."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ["images"],

              allowsMultipleSelection:
                true,

              quality:
                0.8,
            }
          );

        if (
          result.canceled
        ) {
          return;
        }

        const selected =
          result.assets || [];

        if (
          selected.length ===
          0
        ) {
          return;
        }

        const maxSize =
          10 * 1024 * 1024;

        const validFiles:
          SelectedFile[] =
          selected
            .slice(
              0,
              8
            )
            .filter(
              (image) => {
                if (
                  image.fileSize &&
                  image.fileSize >
                    maxSize
                ) {
                  return false;
                }

                return true;
              }
            )
            .map(
              (image) => ({
                uri:
                  image.uri,

                name:
                  image.fileName ||
                  `screenshot_${Date.now()}.jpg`,

                mimeType:
                  image.mimeType ||
                  "image/jpeg",

                size:
                  image.fileSize,
              })
            );

        if (
          selected.length >
          8
        ) {
          Alert.alert(
            "Maximum Screenshots",
            "You can select a maximum of 8 screenshots."
          );
        }

        if (
          validFiles.length !==
          selected.length
        ) {
          Alert.alert(
            "Invalid Screenshot",
            "Some screenshots were larger than 10 MB and were not selected."
          );
        }

        setNewScreenshots(
          validFiles
        );

        console.log(
          "🖼 New screenshots selected:",
          validFiles.length
        );
      } catch (error) {
        console.log(
          "❌ Error selecting screenshots:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to select screenshots."
        );
      }
    };

  // ======================================================
  // REMOVE REPORT
  // ======================================================

  const removeReport =
    () => {
      setNewReport(
        null
      );
    };

  // ======================================================
  // REMOVE VIDEO
  // ======================================================

  const removeVideo =
    () => {
      setNewVideo(
        null
      );
    };

  // ======================================================
  // REMOVE SCREENSHOT
  // ======================================================

  const removeScreenshot =
    (
      index: number
    ) => {
      setNewScreenshots(
        (previous) =>
          previous.filter(
            (_, i) =>
              i !== index
          )
      );
    };

  // ======================================================
  // UPLOAD FILE TO SUPABASE
  // ======================================================

  const uploadFile =
    async (
      file: SelectedFile,
      projectId: string,
      folder: string
    ) => {
      console.log(
        "📤 Uploading:",
        file.name
      );

      const response =
        await fetch(
          file.uri
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `Unable to read ${file.name}`
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      const safeName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const extension =
        safeName
          .split(".")
          .pop() ||
        "file";

      const uniqueId =
        `${Date.now()}_${Math.random()
          .toString(36)
          .substring(
            2,
            8
          )}`;

      const path =
        `project-demos/${projectId}/${folder}/${uniqueId}_${safeName}`;

      const {
        error,
      } =
        await supabase.storage
          .from(
            "project-demos"
          )
          .upload(
            path,
            arrayBuffer,
            {
              contentType:
                file.mimeType,

              upsert:
                false,
            }
          );

      if (
        error
      ) {
        throw error;
      }

      const {
        data,
      } =
        supabase.storage
          .from(
            "project-demos"
          )
          .getPublicUrl(
            path
          );

      console.log(
        "✅ Uploaded:",
        data.publicUrl
      );

      return {
        url:
          data.publicUrl,

        name:
          file.name,

        path:
          path,
      };
    };

  // ======================================================
  // SUBMIT REVISION
  // ======================================================

  const submitRevision =
    async () => {
      // ------------------------------------------------
      // VALIDATE ID
      // ------------------------------------------------

      if (
        !id ||
        typeof id !== "string"
      ) {
        Alert.alert(
          "Error",
          "Project ID is missing."
        );

        return;
      }

      // ------------------------------------------------
      // VALIDATE USER
      // ------------------------------------------------

      const student =
        auth.currentUser;

      if (!student) {
        Alert.alert(
          "Session Expired",
          "Please login again."
        );

        return;
      }

      // ------------------------------------------------
      // VALIDATION
      // ------------------------------------------------

      if (
        title.trim() === ""
      ) {
        Alert.alert(
          "Title Required",
          "Please enter the project title."
        );

        return;
      }

      if (
        description.trim() === ""
      ) {
        Alert.alert(
          "Description Required",
          "Please enter the project description."
        );

        return;
      }

      if (
        domain.trim() === ""
      ) {
        Alert.alert(
          "Domain Required",
          "Please enter the project domain."
        );

        return;
      }

      if (
        technologies.trim() === ""
      ) {
        Alert.alert(
          "Technologies Required",
          "Please enter the technologies used."
        );

        return;
      }

      if (
        githubUrl.trim() === ""
      ) {
        Alert.alert(
          "GitHub Required",
          "Please provide the GitHub repository URL."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        console.log(
          "🔄 Starting revision submission..."
        );

        // ==================================================
        // GET CURRENT PROJECT
        // ==================================================

        const projectRef =
          doc(
            db,
            "projects",
            id
          );

        const projectSnap =
          await getDoc(
            projectRef
          );

        if (
          !projectSnap.exists()
        ) {
          throw new Error(
            "Project no longer exists."
          );
        }

        const currentProject =
          projectSnap.data();

        // ==================================================
        // ENSURE REVISION IS STILL ALLOWED
        // ==================================================

        if (
          currentProject.status !==
          "revision_required"
        ) {
          Alert.alert(
            "Revision Not Available",
            "This project is no longer waiting for a revision."
          );

          return;
        }

        // ==================================================
        // CURRENT FILES
        // ==================================================

        let reportUrl =
          currentProject.reportUrl ||
          "";

        let reportName =
          currentProject.reportName ||
          "";

        let reportPath =
          currentProject.reportPath ||
          "";

        let videoUrl =
          currentProject.videoUrl ||
          "";

        let videoName =
          currentProject.videoName ||
          "";

        let screenshotUrls:
          string[] =
          Array.isArray(
            currentProject.screenshotUrls
          )
            ? currentProject.screenshotUrls
            : [];

        // ==================================================
        // UPLOAD NEW REPORT
        // ==================================================

        if (
          newReport
        ) {
          console.log(
            "📄 Uploading new report..."
          );

          const uploadedReport =
            await uploadFile(
              newReport,
              id,
              "reports"
            );

          reportUrl =
            uploadedReport.url;

          reportName =
            uploadedReport.name;

          reportPath =
            uploadedReport.path;
        }

        // ==================================================
        // UPLOAD NEW VIDEO
        // ==================================================

        if (
          newVideo
        ) {
          console.log(
            "🎥 Uploading new video..."
          );

          const uploadedVideo =
            await uploadFile(
              newVideo,
              id,
              "videos"
            );

          videoUrl =
            uploadedVideo.url;

          videoName =
            uploadedVideo.name;
        }

        // ==================================================
        // UPLOAD NEW SCREENSHOTS
        // ==================================================

        if (
          newScreenshots.length >
          0
        ) {
          console.log(
            "🖼 Uploading new screenshots:",
            newScreenshots.length
          );

          const uploadedScreenshots:
            string[] =
            [];

          for (
            let i = 0;
            i <
            newScreenshots.length;
            i++
          ) {
            console.log(
              `🖼 Uploading screenshot ${i + 1}/${newScreenshots.length}`
            );

            const uploaded =
              await uploadFile(
                newScreenshots[
                  i
                ],
                id,
                "screenshots"
              );

            uploadedScreenshots.push(
              uploaded.url
            );
          }

          // ------------------------------------------------
          // REPLACE OLD SCREENSHOTS
          // ------------------------------------------------

          screenshotUrls =
            uploadedScreenshots;
        }

        // ==================================================
        // CREATE REVISION HISTORY
        // ==================================================

        console.log(
          "📝 Creating revision history..."
        );

        const revisionRef =
          await addDoc(
            collection(
              db,
              "projects",
              id,
              "revisions"
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

              liveDemoUrl:
                liveDemoUrl.trim(),

              reportUrl:
                reportUrl,

              reportName:
                reportName,

              reportPath:
                reportPath,

              videoUrl:
                videoUrl,

              videoName:
                videoName,

              screenshotUrls:
                screenshotUrls,

              previousStatus:
                currentProject.status ||
                "revision_required",

              previousGuideFeedback:
                currentProject.guideFeedback ||
                "",

              previousGuideFeedbackAttachmentUrls:
                Array.isArray(
                  currentProject.guideFeedbackAttachmentUrls
                )
                  ? currentProject.guideFeedbackAttachmentUrls
                  : [],

              submittedBy:
                student.uid,

              submittedAt:
                serverTimestamp(),

              status:
                "pending",
            }
          );

        console.log(
          "✅ Revision history created:",
          revisionRef.id
        );

        // ==================================================
        // UPDATE MAIN PROJECT
        // ==================================================

        console.log(
          "🔄 Updating main project..."
        );

        await updateDoc(
          projectRef,
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

            liveDemoUrl:
              liveDemoUrl.trim(),

            reportUrl:
              reportUrl,

            reportName:
              reportName,

            reportPath:
              reportPath,

            videoUrl:
              videoUrl,

            videoName:
              videoName,

            screenshotUrls:
              screenshotUrls,

            // ----------------------------------------------
            // RESET REVIEW STATUS
            // ----------------------------------------------

            status:
              "pending",

            // ----------------------------------------------
            // CLEAR OLD FEEDBACK FROM CURRENT VERSION
            // ----------------------------------------------

            guideFeedback:
              "",

            guideFeedbackAttachmentUrls:
              [],

            guideFeedbackAttachmentNames:
              [],

            reviewedBy:
              "",

            reviewedAt:
              null,

            // ----------------------------------------------
            // REVISION INFO
            // ----------------------------------------------

            lastRevisionId:
              revisionRef.id,

            lastRevisionSubmittedAt:
              serverTimestamp(),

            lastRevisionSubmittedBy:
              student.uid,
          }
        );

        console.log(
          "✅ Main project updated successfully"
        );

        // ==================================================
        // CLEAR FORM
        // ==================================================

        setNewReport(
          null
        );

        setNewVideo(
          null
        );

        setNewScreenshots(
          []
        );

        // ==================================================
        // SUCCESS
        // ==================================================

        Alert.alert(
          "Revision Submitted",
          "Your revised project has been submitted successfully. The guide can now review it again.",
          [
            {
              text:
                "View Project",

              onPress:
                () =>
                  router.replace({
                    pathname:
                      "/student/project-details",
                    params: {
                      id:
                        id,
                    },
                  }),
            },
          ]
        );
      } catch (
        error: any
      ) {
        console.log(
          "❌ Revision submission failed:",
          error
        );

        console.log(
          "Error code:",
          error?.code
        );

        console.log(
          "Error message:",
          error?.message
        );

        Alert.alert(
          "Submission Failed",
          error?.message ||
            "Unable to submit the revision."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  // ======================================================
  // CONFIRM SUBMISSION
  // ======================================================

  const confirmSubmission =
    () => {
      Alert.alert(
        "Submit Revision",
        "Are you sure you want to submit this revision for guide review?",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Submit",

            onPress:
              submitRevision,
          },
        ]
      );
    };

  // ======================================================
  // LOADING
  // ======================================================

  if (
    loading
  ) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#4F7D4F"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading project...
        </Text>
      </View>
    );
  }

  // ======================================================
  // PROJECT NOT FOUND
  // ======================================================

  if (
    !project
  ) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <Text
          style={
            styles.notFoundTitle
          }
        >
          Project Not Found
        </Text>

        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
      keyboardShouldPersistTaps="handled"
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <Pressable
        style={
          styles.backLink
        }
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={
            styles.backLinkText
          }
        >
          ← Back
        </Text>
      </Pressable>

      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.title
          }
        >
          Revise Project
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Update your project based
          on the guide's feedback.
        </Text>
      </View>

      {/* ==================================================
          GUIDE FEEDBACK
      ================================================== */}

      {project.guideFeedback ? (
        <View
          style={
            styles.feedbackBox
          }
        >
          <Text
            style={
              styles.feedbackTitle
            }
          >
            📝 Guide Feedback
          </Text>

          <Text
            style={
              styles.feedbackText
            }
          >
            {
              project.guideFeedback
            }
          </Text>

          {/* GUIDE SCREENSHOTS */}

          {project.guideFeedbackAttachmentUrls &&
          project.guideFeedbackAttachmentUrls
            .length > 0 ? (
            <View
              style={
                styles.guideAttachments
              }
            >
              <Text
                style={
                  styles.attachmentTitle
                }
              >
                📎 Screenshots from
                Guide
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
              >
                {project.guideFeedbackAttachmentUrls.map(
                  (
                    url,
                    index
                  ) => (
                    <Pressable
                      key={`${url}-${index}`}
                      style={
                        styles.guideImageCard
                      }
                      onPress={() => {
                        // No external dependency needed.
                        // Opening the URL is handled by
                        // the image itself through the
                        // system browser if required.
                      }}
                    >
                      <Image
                        source={{
                          uri:
                            url,
                        }}
                        style={
                          styles.guideImage
                        }
                      />

                      <Text
                        style={
                          styles.guideImageText
                        }
                      >
                        Screenshot{" "}
                        {index +
                          1}
                      </Text>
                    </Pressable>
                  )
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ==================================================
          PROJECT DETAILS
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Project Details
        </Text>

        {/* TITLE */}

        <Text
          style={
            styles.label
          }
        >
          Project Title
        </Text>

        <TextInput
          style={
            styles.input
          }
          value={
            title
          }
          onChangeText={
            setTitle
          }
          editable={
            !submitting
          }
          placeholder="Project title"
          placeholderTextColor="#9CA3AF"
        />

        {/* DESCRIPTION */}

        <Text
          style={
            styles.label
          }
        >
          Description
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.textArea,
          ]}
          value={
            description
          }
          onChangeText={
            setDescription
          }
          editable={
            !submitting
          }
          multiline
          textAlignVertical="top"
          placeholder="Project description"
          placeholderTextColor="#9CA3AF"
        />

        {/* DOMAIN */}

        <Text
          style={
            styles.label
          }
        >
          Domain
        </Text>

        <TextInput
          style={
            styles.input
          }
          value={
            domain
          }
          onChangeText={
            setDomain
          }
          editable={
            !submitting
          }
          placeholder="Project domain"
          placeholderTextColor="#9CA3AF"
        />

        {/* TECHNOLOGIES */}

        <Text
          style={
            styles.label
          }
        >
          Technologies
        </Text>

        <TextInput
          style={
            styles.input
          }
          value={
            technologies
          }
          onChangeText={
            setTechnologies
          }
          editable={
            !submitting
          }
          placeholder="Technologies used"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* ==================================================
          GITHUB
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Source Code
        </Text>

        <Text
          style={
            styles.label
          }
        >
          GitHub Repository
        </Text>

        <TextInput
          style={
            styles.input
          }
          value={
            githubUrl
          }
          onChangeText={
            setGithubUrl
          }
          editable={
            !submitting
          }
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://github.com/username/project"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* ==================================================
          LIVE DEMO
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Live Demo
        </Text>

        <Text
          style={
            styles.optionalText
          }
        >
          Optional
        </Text>

        <TextInput
          style={
            styles.input
          }
          value={
            liveDemoUrl
          }
          onChangeText={
            setLiveDemoUrl
          }
          editable={
            !submitting
          }
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://your-demo-link.com"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* ==================================================
          REPORT
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Project Report
        </Text>

        <Text
          style={
            styles.currentFile
          }
        >
          Current report:
          {" "}
          {project.reportName ||
            "No report"}
        </Text>

        <Pressable
          style={
            styles.fileButton
          }
          onPress={
            pickReport
          }
          disabled={
            submitting
          }
        >
          <Text
            style={
              styles.fileButtonText
            }
          >
            📄 Replace Report
          </Text>
        </Pressable>

        {newReport ? (
          <View
            style={
              styles.selectedFile
            }
          >
            <Text
              style={
                styles.selectedFileText
              }
            >
              📄{" "}
              {
                newReport.name
              }
            </Text>

            <Pressable
              onPress={
                removeReport
              }
            >
              <Text
                style={
                  styles.removeText
                }
              >
                Remove
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ==================================================
          VIDEO
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Demo Video
        </Text>

        <Text
          style={
            styles.currentFile
          }
        >
          Current video:
          {" "}
          {project.videoName ||
            "No video"}
        </Text>

        <Pressable
          style={
            styles.fileButton
          }
          onPress={
            pickVideo
          }
          disabled={
            submitting
          }
        >
          <Text
            style={
              styles.fileButtonText
            }
          >
            🎥 Replace Demo Video
          </Text>
        </Pressable>

        {newVideo ? (
          <View
            style={
              styles.selectedFile
            }
          >
            <Text
              style={
                styles.selectedFileText
            }
          >
            🎥{" "}
            {
              newVideo.name
            }
          </Text>

          <Pressable
            onPress={
              removeVideo
            }
          >
            <Text
              style={
                styles.removeText
              }
            >
              Remove
            </Text>
          </Pressable>
        </View>
        ) : null}
      </View>

      {/* ==================================================
          SCREENSHOTS
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          Project Screenshots
        </Text>

        <Text
          style={
            styles.currentFile
          }
        >
          Current screenshots:
          {" "}
          {project.screenshotUrls?.length ||
            0}
        </Text>

        <Text
          style={
            styles.helpText
          }
        >
          Select new screenshots
          only if you want to replace
          the existing ones.
        </Text>

        <Pressable
          style={
            styles.fileButton
          }
          onPress={
            pickScreenshots
          }
          disabled={
            submitting
          }
        >
          <Text
            style={
              styles.fileButtonText
            }
          >
            🖼 Replace Screenshots
          </Text>
        </Pressable>

        {newScreenshots.length >
        0 ? (
          <View
            style={
              styles.selectedScreenshots
            }
          >
            <Text
              style={
                styles.selectedTitle
              }
            >
              {
                newScreenshots.length
              }{" "}
              new screenshot
              {newScreenshots.length !==
              1
                ? "s"
                : ""}{" "}
              selected
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
            >
              {newScreenshots.map(
                (
                  image,
                  index
                ) => (
                  <View
                    key={`${image.uri}-${index}`}
                    style={
                      styles.selectedScreenshot
                    }
                  >
                    <Image
                      source={{
                        uri:
                          image.uri,
                      }}
                      style={
                        styles.previewImage
                      }
                    />

                    <Text
                      style={
                        styles.previewNumber
                      }
                    >
                      {
                        index +
                        1
                      }
                    </Text>

                    <Pressable
                      onPress={() =>
                        removeScreenshot(
                          index
                        )
                      }
                    >
                      <Text
                        style={
                          styles.removeText
                        }
                      >
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* ==================================================
          SUBMIT
      ================================================== */}

      <View
        style={
          styles.submitSection
        }
      >
        <Text
          style={
            styles.submitTitle
          }
        >
          Ready to Resubmit?
        </Text>

        <Text
          style={
            styles.submitDescription
          }
        >
          Your current project will
          be updated and sent back
          to the guide for another
          review. A revision history
          will also be preserved.
        </Text>

        <Pressable
          style={[
            styles.submitButton,
            submitting &&
              styles.disabledButton,
          ]}
          disabled={
            submitting
          }
          onPress={
            confirmSubmission
          }
        >
          {submitting ? (
            <View
              style={
                styles.loadingRow
              }
            >
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.submitButtonText
                }
              >
                Submitting...
              </Text>
            </View>
          ) : (
            <Text
              style={
                styles.submitButtonText
              }
            >
              🔄 Submit Revision
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F4F8F3",
    },

    content: {
      padding: 20,
      paddingBottom: 50,
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F4F8F3",
      padding: 20,
    },

    loadingText: {
      marginTop: 10,
      color: "#718071",
      fontSize: 14,
    },

    notFoundTitle: {
      fontSize: 22,
      fontWeight:
        "bold",
      color: "#263626",
      marginBottom: 20,
    },

    backButton: {
      backgroundColor:
        "#4F7D4F",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },

    backButtonText: {
      color: "#FFFFFF",
      fontWeight:
        "600",
    },

    // ==================================================
    // BACK
    // ==================================================

    backLink: {
      marginBottom: 18,
    },

    backLinkText: {
      color: "#4F7D4F",
      fontSize: 15,
      fontWeight:
        "600",
    },

    // ==================================================
    // HEADER
    // ==================================================

    header: {
      marginBottom: 18,
    },

    title: {
      fontSize: 28,
      fontWeight:
        "bold",
      color: "#263626",
      marginBottom: 7,
    },

    subtitle: {
      fontSize: 14,
      color: "#718071",
      lineHeight: 21,
    },

    // ==================================================
    // FEEDBACK
    // ==================================================

    feedbackBox: {
      backgroundColor:
        "#FFF7ED",
      borderWidth: 1,
      borderColor:
        "#FED7AA",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
    },

    feedbackTitle: {
      fontSize: 16,
      fontWeight:
        "bold",
      color: "#9A3412",
      marginBottom: 10,
    },

    feedbackText: {
      fontSize: 14,
      color: "#7C2D12",
      lineHeight: 21,
    },

    guideAttachments: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor:
        "#FED7AA",
    },

    attachmentTitle: {
      fontSize: 14,
      fontWeight:
        "700",
      color: "#9A3412",
      marginBottom: 10,
    },

    guideImageCard: {
      width: 150,
      marginRight: 12,
    },

    guideImage: {
      width: 150,
      height: 150,
      borderRadius: 10,
      backgroundColor:
        "#E5E7EB",
    },

    guideImageText: {
      fontSize: 12,
      color: "#7C2D12",
      textAlign:
        "center",
      marginTop: 5,
    },

    // ==================================================
    // SECTION
    // ==================================================

    section: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor:
        "#DDE7DB",
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight:
        "bold",
      color: "#263626",
      marginBottom: 14,
    },

    label: {
      fontSize: 13,
      fontWeight:
        "600",
      color: "#536153",
      marginBottom: 6,
    },

    input: {
      borderWidth: 1,
      borderColor:
        "#D1D5DB",
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 14,
      color: "#263626",
      backgroundColor:
        "#FFFFFF",
      marginBottom: 15,
    },

    textArea: {
      minHeight: 120,
    },

    optionalText: {
      fontSize: 12,
      color: "#8A948A",
      marginBottom: 8,
    },

    // ==================================================
    // FILES
    // ==================================================

    currentFile: {
      fontSize: 13,
      color: "#718071",
      marginBottom: 12,
    },

    helpText: {
      fontSize: 12,
      color: "#8A948A",
      lineHeight: 18,
      marginBottom: 12,
    },

    fileButton: {
      backgroundColor:
        "#E7F1E5",
      borderWidth: 1,
      borderColor:
        "#B8D0B5",
      borderRadius: 10,
      paddingVertical: 13,
      alignItems:
        "center",
    },

    fileButtonText: {
      color: "#315C31",
      fontSize: 14,
      fontWeight:
        "700",
    },

    selectedFile: {
      marginTop: 12,
      backgroundColor:
        "#F4F8F3",
      borderRadius: 10,
      padding: 12,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    selectedFileText: {
      flex: 1,
      color: "#536153",
      fontSize: 13,
      marginRight: 10,
    },

    removeText: {
      color: "#DC2626",
      fontSize: 12,
      fontWeight:
        "700",
    },

    // ==================================================
    // SCREENSHOTS
    // ==================================================

    selectedScreenshots: {
      marginTop: 15,
    },

    selectedTitle: {
      fontSize: 13,
      fontWeight:
        "700",
      color: "#315C31",
      marginBottom: 10,
    },

    selectedScreenshot: {
      width: 125,
      marginRight: 12,
    },

    previewImage: {
      width: 125,
      height: 125,
      borderRadius: 9,
      backgroundColor:
        "#E5EBE3",
    },

    previewNumber: {
      fontSize: 11,
      color: "#718071",
      textAlign:
        "center",
      marginVertical: 4,
    },

    // ==================================================
    // SUBMIT
    // ==================================================

    submitSection: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor:
        "#B8D0B5",
    },

    submitTitle: {
      fontSize: 18,
      fontWeight:
        "bold",
      color: "#263626",
      marginBottom: 8,
    },

    submitDescription: {
      fontSize: 13,
      color: "#718071",
      lineHeight: 20,
      marginBottom: 16,
    },

    submitButton: {
      backgroundColor:
        "#4F7D4F",
      borderRadius: 10,
      paddingVertical: 15,
      alignItems:
        "center",
    },

    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight:
        "700",
    },

    disabledButton: {
      opacity: 0.55,
    },

    loadingRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },
  });