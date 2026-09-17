import * as ImagePicker from "expo-image-picker";

import {
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
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  auth,
  db,
} from "../../firebase/firebaseConfig";

import {
  supabase,
} from "../../supabase/supabaseConfig";

// ======================================================
// TYPES
// ======================================================

type Project = {
  title?: string;
  description?: string;
  domain?: string;
  technologies?: string;

  studentId?: string;
  studentName?: string;
  studentEmail?: string;

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

  // Multiple guide feedback attachments
  guideFeedbackAttachmentUrls?: string[];
  guideFeedbackAttachmentNames?: string[];

  reviewedBy?: string;
  reviewedAt?: any;
};

type FeedbackAttachment =
  ImagePicker.ImagePickerAsset;

// ======================================================
// COMPONENT
// ======================================================

export default function GuideProjectDetails() {
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

  const [updating, setUpdating] =
    useState(false);

  // ======================================================
  // FEEDBACK
  // ======================================================

  const [feedback, setFeedback] =
    useState("");

  // ======================================================
  // FEEDBACK ATTACHMENTS
  // ======================================================

  const [feedbackAttachments, setFeedbackAttachments] =
    useState<FeedbackAttachment[]>([]);

  // ======================================================
  // LOAD PROJECT
  // ======================================================

  useEffect(() => {
    const loadProject = async () => {
      try {
        console.log(
          "📌 Guide Project ID:",
          id
        );

        // --------------------------------------------------
        // CHECK PROJECT ID
        // --------------------------------------------------

        if (
          !id ||
          typeof id !== "string"
        ) {
          console.log(
            "❌ Project ID is missing"
          );

          setLoading(false);

          return;
        }

        console.log(
          "🔍 Fetching project:",
          id
        );

        // --------------------------------------------------
        // FIRESTORE PROJECT
        // --------------------------------------------------

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
          console.log(
            "❌ Project not found"
          );

          setLoading(false);

          return;
        }

        const data =
          projectSnap.data();

        console.log(
          "✅ Project found:",
          data
        );

        // --------------------------------------------------
        // LOAD ATTACHMENT ARRAYS
        // --------------------------------------------------

        const attachmentUrls =
          Array.isArray(
            data.guideFeedbackAttachmentUrls
          )
            ? data.guideFeedbackAttachmentUrls
            : [];

        const attachmentNames =
          Array.isArray(
            data.guideFeedbackAttachmentNames
          )
            ? data.guideFeedbackAttachmentNames
            : [];

        // --------------------------------------------------
        // LOADED PROJECT
        // --------------------------------------------------

        const loadedProject: Project = {
          title:
            data.title ||
            "Untitled Project",

          description:
            data.description ||
            "No description available.",

          domain:
            data.domain ||
            "Not specified",

          technologies:
            data.technologies ||
            "Not specified",

          studentId:
            data.studentId ||
            "",

          studentName:
            data.studentName ||
            "Unknown Student",

          studentEmail:
            data.studentEmail ||
            "",

          githubUrl:
            data.githubUrl ||
            "",

          liveDemoUrl:
            data.liveDemoUrl ||
            "",

          reportUrl:
            data.reportUrl ||
            "",

          reportName:
            data.reportName ||
            "",

          reportPath:
            data.reportPath ||
            "",

          videoUrl:
            data.videoUrl ||
            "",

          videoName:
            data.videoName ||
            "",

          screenshotUrls:
            Array.isArray(
              data.screenshotUrls
            )
              ? data.screenshotUrls
              : [],

          status:
            data.status ||
            "pending",

          guideFeedback:
            data.guideFeedback ||
            "",

          guideFeedbackAttachmentUrls:
            attachmentUrls,

          guideFeedbackAttachmentNames:
            attachmentNames,

          reviewedBy:
            data.reviewedBy ||
            "",

          reviewedAt:
            data.reviewedAt ||
            null,
        };

        setProject(
          loadedProject
        );

        // --------------------------------------------------
        // LOAD EXISTING FEEDBACK
        // --------------------------------------------------

        setFeedback(
          loadedProject.guideFeedback ||
            ""
        );
      } catch (error) {
        console.log(
          "❌ Error loading project:",
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
  // OPEN URL
  // ======================================================

  const openUrl = async (
    url: string
  ) => {
    try {
      const supported =
        await Linking.canOpenURL(
          url
        );

      if (!supported) {
        Alert.alert(
          "Unable to Open",
          "This link cannot be opened."
        );

        return;
      }

      await Linking.openURL(
        url
      );
    } catch (error) {
      console.log(
        "❌ Error opening URL:",
        error
      );

      Alert.alert(
        "Error",
        "Something went wrong while opening the link."
      );
    }
  };

  // ======================================================
  // PICK MULTIPLE FEEDBACK SCREENSHOTS
  // ======================================================

  const pickFeedbackAttachments =
    async () => {
      try {
        // --------------------------------------------------
        // REQUEST PERMISSION
        // --------------------------------------------------

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {
          Alert.alert(
            "Permission Required",
            "Please allow photo library access to attach screenshots."
          );

          return;
        }

        // --------------------------------------------------
        // OPEN IMAGE PICKER
        // --------------------------------------------------

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes: [
                "images",
              ],

              allowsMultipleSelection:
                true,

              quality: 0.8,
            }
          );

        if (
          result.canceled
        ) {
          return;
        }

        const selectedImages =
          result.assets || [];

        if (
          selectedImages.length ===
          0
        ) {
          return;
        }

        // --------------------------------------------------
        // MAXIMUM 8 ATTACHMENTS
        // --------------------------------------------------

        const images =
          selectedImages.slice(
            0,
            8
          );

        if (
          selectedImages.length >
          8
        ) {
          Alert.alert(
            "Maximum Attachments",
            "You can attach a maximum of 8 screenshots."
          );
        }

        // --------------------------------------------------
        // MAXIMUM SIZE PER IMAGE
        // --------------------------------------------------

        const maxSize =
          10 * 1024 * 1024;

        // --------------------------------------------------
        // VALIDATE IMAGES
        // --------------------------------------------------

        const validImages =
          images.filter(
            (image) => {
              const fileName =
                image.fileName ||
                "feedback_screenshot.jpg";

              // File type
              const isImage =
                image.mimeType?.startsWith(
                  "image/"
                ) ||
                /\.(jpg|jpeg|png|webp)$/i.test(
                  fileName
                );

              if (
                !isImage
              ) {
                return false;
              }

              // File size
              if (
                image.fileSize &&
                image.fileSize >
                  maxSize
              ) {
                return false;
              }

              return true;
            }
          );

        // --------------------------------------------------
        // INVALID FILE WARNING
        // --------------------------------------------------

        if (
          validImages.length !==
          images.length
        ) {
          Alert.alert(
            "Invalid Attachment",
            "Only image files smaller than 10 MB are allowed."
          );
        }

        // --------------------------------------------------
        // SAVE SELECTED IMAGES
        // --------------------------------------------------

        setFeedbackAttachments(
          validImages
        );

        console.log(
          "📎 Selected feedback attachments:",
          validImages.length
        );
      } catch (error) {
        console.log(
          "❌ Error selecting feedback screenshots:",
          error
        );

        Alert.alert(
          "Error",
          "Could not select the feedback screenshots."
        );
      }
    };

  // ======================================================
  // REMOVE ONE ATTACHMENT
  // ======================================================

  const removeFeedbackAttachment =
    (
      index: number
    ) => {
      setFeedbackAttachments(
        (previous) =>
          previous.filter(
            (_, i) =>
              i !== index
          )
      );
    };

  // ======================================================
  // UPLOAD ONE FILE TO SUPABASE
  // ======================================================

  const uploadFeedbackAttachment =
    async (
      image: FeedbackAttachment,
      projectId: string
    ) => {
      // --------------------------------------------------
      // READ IMAGE
      // --------------------------------------------------

      const response =
        await fetch(
          image.uri
        );

      if (
        !response.ok
      ) {
        throw new Error(
          "Could not read the selected screenshot."
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      // --------------------------------------------------
      // FILE NAME
      // --------------------------------------------------

      const originalName =
        image.fileName ||
        "feedback_screenshot.jpg";

      const safeFileName =
        originalName.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const extension =
        safeFileName
          .split(".")
          .pop() ||
        "jpg";

      // --------------------------------------------------
      // UNIQUE STORAGE PATH
      // --------------------------------------------------

      const uniqueId =
        Math.random()
          .toString(36)
          .substring(
            2,
            8
          );

      const filePath =
        `guide-feedback/${projectId}/${Date.now()}_feedback_${uniqueId}.${extension}`;

      console.log(
        "📤 Uploading feedback attachment:",
        filePath
      );

      // --------------------------------------------------
      // SUPABASE UPLOAD
      // --------------------------------------------------

      const {
        error,
      } =
        await supabase.storage
          .from(
            "project-demos"
          )
          .upload(
            filePath,
            arrayBuffer,
            {
              contentType:
                image.mimeType ||
                "image/jpeg",

              upsert:
                false,
            }
          );

      if (
        error
      ) {
        throw error;
      }

      // --------------------------------------------------
      // GET PUBLIC URL
      // --------------------------------------------------

      const {
        data,
      } =
        supabase.storage
          .from(
            "project-demos"
          )
          .getPublicUrl(
            filePath
          );

      console.log(
        "✅ Feedback attachment uploaded:",
        data.publicUrl
      );

      return {
        url:
          data.publicUrl,

        name:
          originalName,
      };
    };

  // ======================================================
  // FORMAT STATUS
  // ======================================================

  const formatStatus = (
    status?: string
  ) => {
    if (
      !status
    ) {
      return "Pending";
    }

    if (
      status ===
      "revision_required"
    ) {
      return "Revision Required";
    }

    return status
      .replace(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // ======================================================
  // STATUS STYLE
  // ======================================================

  const getStatusStyle = (
    status?: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "approved":
        return styles.approved;

      case "revision_required":
        return styles.revision;

      case "rejected":
        return styles.rejected;

      default:
        return styles.pending;
    }
  };

  // ======================================================
  // UPDATE REVIEW
  // ======================================================

  const updateReview =
    async (
      newStatus: string
    ) => {
      // --------------------------------------------------
      // PROJECT ID
      // --------------------------------------------------

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

      // --------------------------------------------------
      // CURRENT GUIDE
      // --------------------------------------------------

      const guide =
        auth.currentUser;

      if (!guide) {
        Alert.alert(
          "Error",
          "Guide session has expired. Please login again."
        );

        return;
      }

      // --------------------------------------------------
      // FEEDBACK VALIDATION
      // --------------------------------------------------

      const trimmedFeedback =
        feedback.trim();

      // Revision requires feedback
      if (
        newStatus ===
          "revision_required" &&
        trimmedFeedback === ""
      ) {
        Alert.alert(
          "Feedback Required",
          "Please explain what the student needs to change or improve."
        );

        return;
      }

      // Rejection requires reason
      if (
        newStatus ===
          "rejected" &&
        trimmedFeedback === ""
      ) {
        Alert.alert(
          "Reason Required",
          "Please provide a reason for rejecting this project."
        );

        return;
      }

      // --------------------------------------------------
      // UPDATE
      // --------------------------------------------------

      try {
        setUpdating(
          true
        );

        console.log(
          "🔄 Updating project review:",
          {
            status:
              newStatus,

            feedback:
              trimmedFeedback,

            attachmentCount:
              feedbackAttachments.length,

            guideId:
              guide.uid,
          }
        );

        // ==================================================
        // ATTACHMENT ARRAYS
        // ==================================================

        const attachmentUrls: string[] =
          [];

        const attachmentNames: string[] =
          [];

        // ==================================================
        // UPLOAD ALL SELECTED ATTACHMENTS
        // ==================================================

        if (
          feedbackAttachments.length >
          0
        ) {
          console.log(
            "📎 Uploading feedback screenshots:",
            feedbackAttachments.length
          );

          for (
            let i = 0;
            i <
            feedbackAttachments.length;
            i++
          ) {
            console.log(
              `📤 Uploading attachment ${i + 1}/${feedbackAttachments.length}`
            );

            const uploaded =
              await uploadFeedbackAttachment(
                feedbackAttachments[
                  i
                ],
                id
              );

            attachmentUrls.push(
              uploaded.url
            );

            attachmentNames.push(
              uploaded.name
            );
          }
        }

        console.log(
          "📎 Total uploaded attachments:",
          attachmentUrls.length
        );

        // ==================================================
        // FIRESTORE
        // ==================================================

        const projectRef =
          doc(
            db,
            "projects",
            id
          );

        await updateDoc(
          projectRef,
          {
            status:
              newStatus,

            guideFeedback:
              trimmedFeedback,

            guideFeedbackAttachmentUrls:
              attachmentUrls,

            guideFeedbackAttachmentNames:
              attachmentNames,

            reviewedBy:
              guide.uid,

            reviewedAt:
              serverTimestamp(),
          }
        );

        console.log(
          "✅ Review updated successfully"
        );

        // ==================================================
        // UPDATE LOCAL UI
        // ==================================================

        setProject(
          (
            previousProject
          ) => {
            if (
              !previousProject
            ) {
              return previousProject;
            }

            return {
              ...previousProject,

              status:
                newStatus,

              guideFeedback:
                trimmedFeedback,

              guideFeedbackAttachmentUrls:
                attachmentUrls,

              guideFeedbackAttachmentNames:
                attachmentNames,

              reviewedBy:
                guide.uid,
            };
          }
        );

        // ==================================================
        // CLEAR SELECTED ATTACHMENTS
        // ==================================================

        setFeedbackAttachments(
          []
        );

        // ==================================================
        // SUCCESS
        // ==================================================

        Alert.alert(
          "Review Submitted",
          `Project has been ${formatStatus(
            newStatus
          ).toLowerCase()}.`
        );
      } catch (
        error: any
      ) {
        console.log(
          "❌ Error updating review:",
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
          "Update Failed",
          error?.message ||
            "Unable to update the project review."
        );
      } finally {
        setUpdating(
          false
        );
      }
    };

  // ======================================================
  // CONFIRM REVIEW
  // ======================================================

  const confirmReview =
    (
      newStatus: string
    ) => {
      const trimmedFeedback =
        feedback.trim();

      // --------------------------------------------------
      // REVISION VALIDATION
      // --------------------------------------------------

      if (
        newStatus ===
          "revision_required" &&
        trimmedFeedback === ""
      ) {
        Alert.alert(
          "Feedback Required",
          "Please enter the exact changes or improvements required from the student."
        );

        return;
      }

      // --------------------------------------------------
      // REJECTION VALIDATION
      // --------------------------------------------------

      if (
        newStatus ===
          "rejected" &&
        trimmedFeedback === ""
      ) {
        Alert.alert(
          "Reason Required",
          "Please explain why this project is being rejected."
        );

        return;
      }

      let title =
        "";

      let message =
        "";

      // --------------------------------------------------
      // APPROVE
      // --------------------------------------------------

      if (
        newStatus ===
        "approved"
      ) {
        title =
          "Approve Project";

        message =
          trimmedFeedback
            ? "Are you sure you want to approve this project with this feedback?"
            : "Are you sure you want to approve this project without additional feedback?";
      }

      // --------------------------------------------------
      // REVISION
      // --------------------------------------------------

      if (
        newStatus ===
        "revision_required"
      ) {
        title =
          "Request Revision";

        message =
          feedbackAttachments.length >
          0
            ? `The student will see your feedback and ${feedbackAttachments.length} attached screenshot${feedbackAttachments.length !== 1 ? "s" : ""}. Continue?`
            : "The student will see your feedback and will need to make the requested changes. Continue?";
      }

      // --------------------------------------------------
      // REJECT
      // --------------------------------------------------

      if (
        newStatus ===
        "rejected"
      ) {
        title =
          "Reject Project";

        message =
          feedbackAttachments.length >
          0
            ? `The student will see the rejection reason and ${feedbackAttachments.length} attached screenshot${feedbackAttachments.length !== 1 ? "s" : ""}. Continue?`
            : "The student will see the rejection reason you provided. Continue?";
      }

      // --------------------------------------------------
      // CONFIRMATION
      // --------------------------------------------------

      Alert.alert(
        title,
        message,
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Confirm",

            style:
              newStatus ===
              "rejected"
                ? "destructive"
                : "default",

            onPress:
              () =>
                updateReview(
                  newStatus
                ),
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
          color="#2563EB"
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
  // MAIN SCREEN
  // ======================================================

  return (
    <ScrollView
      style={
        styles.container
      }
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* ==================================================
          BACK
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
          ← Back to Projects
        </Text>
      </Pressable>

      {/* ==================================================
          HEADER
      ================================================== */}

      <View
        style={
          styles.headerCard
        }
      >
        <Text
          style={
            styles.title
          }
        >
          {project.title ||
            "Untitled Project"}
        </Text>

        <View
          style={[
            styles.statusBadge,
            getStatusStyle(
              project.status
            ),
          ]}
        >
          <Text
            style={
              styles.statusText
            }
          >
            {formatStatus(
              project.status
            )}
          </Text>
        </View>

        {project.studentName ? (
          <Text
            style={
              styles.studentName
            }
          >
            👨‍🎓{" "}
            {
              project.studentName
            }
          </Text>
        ) : null}

        {project.studentEmail ? (
          <Text
            style={
              styles.studentEmail
            }
          >
            {
              project.studentEmail
            }
          </Text>
        ) : null}
      </View>

      {/* ==================================================
          DESCRIPTION
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
          Project Description
        </Text>

        <Text
          style={
            styles.description
          }
        >
          {project.description ||
            "No description available."}
        </Text>
      </View>

      {/* ==================================================
          PROJECT INFORMATION
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
          Project Information
        </Text>

        <View
          style={
            styles.infoRow
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Domain
          </Text>

          <Text
            style={
              styles.value
            }
          >
            {project.domain ||
              "Not specified"}
          </Text>
        </View>

        <View
          style={
            styles.divider
          }
        />

        <View
          style={
            styles.infoRow
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Technologies
          </Text>

          <Text
            style={
              styles.value
            }
          >
            {project.technologies ||
              "Not specified"}
          </Text>
        </View>
      </View>

      {/* ==================================================
          PROJECT DEMONSTRATION
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
          Project Demonstration
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          Review the student's
          application using the
          available demonstration
          materials.
        </Text>

        {/* LIVE DEMO */}

        {project.liveDemoUrl ? (
          <View
            style={
              styles.demoItem
            }
          >
            <Text
              style={
                styles.demoLabel
              }
            >
              🌐 Live Demo
            </Text>

            <Pressable
              style={
                styles.liveDemoButton
              }
              onPress={() =>
                openUrl(
                  project.liveDemoUrl!
                )
              }
            >
              <Text
                style={
                  styles.liveDemoButtonText
                }
              >
                Open Live Demo ↗
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* VIDEO */}

        {project.videoUrl ? (
          <View
            style={
              styles.demoItem
            }
          >
            <Text
              style={
                styles.demoLabel
              }
            >
              🎥 Video Demonstration
            </Text>

            {project.videoName ? (
              <Text
                style={
                  styles.fileName
                }
              >
                {
                  project.videoName
                }
              </Text>
            ) : null}

            <Pressable
              style={
                styles.videoButton
              }
              onPress={() =>
                openUrl(
                  project.videoUrl!
                )
              }
            >
              <Text
                style={
                  styles.videoButtonText
                }
              >
                ▶ Watch Project Video
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* SCREENSHOTS */}

        {project.screenshotUrls &&
        project.screenshotUrls
          .length > 0 ? (
          <View
            style={
              styles.demoItem
            }
          >
            <Text
              style={
                styles.demoLabel
              }
            >
              🖼️ Project Screenshots
            </Text>

            <Text
              style={
                styles.screenshotCount
              }
            >
              {
                project
                  .screenshotUrls
                  .length
              }{" "}
              screenshot
              {project
                .screenshotUrls
                .length !==
              1
                ? "s"
                : ""}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.screenshotScroll
              }
            >
              {project.screenshotUrls.map(
                (
                  url,
                  index
                ) => (
                  <Pressable
                    key={`${url}-${index}`}
                    onPress={() =>
                      openUrl(
                        url
                      )
                    }
                    style={
                      styles.screenshotCard
                    }
                  >
                    <Image
                      source={{
                        uri:
                          url,
                      }}
                      style={
                        styles.screenshot
                      }
                      resizeMode="cover"
                    />

                    <Text
                      style={
                        styles.screenshotNumber
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

        {/* NO DEMO */}

        {!project.liveDemoUrl &&
        !project.videoUrl &&
        (!project.screenshotUrls ||
          project
            .screenshotUrls
            .length ===
            0) ? (
          <View
            style={
              styles.noDemoBox
            }
          >
            <Text
              style={
                styles.noDemoTitle
              }
            >
              No Demo Materials
            </Text>

            <Text
              style={
                styles.notAvailable
              }
            >
              The student has not
              provided a live demo,
              video, or screenshots.
            </Text>
          </View>
        ) : null}
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

        {project.reportUrl ? (
          <>
            <Pressable
              style={
                styles.reportButton
              }
              onPress={() =>
                openUrl(
                  project.reportUrl!
                )
              }
            >
              <Text
                style={
                  styles.reportButtonText
                }
              >
                📄 View Project Report
              </Text>
            </Pressable>

            {project.reportName ? (
              <Text
                style={
                  styles.fileName
                }
              >
                {
                  project.reportName
                }
              </Text>
            ) : null}
          </>
        ) : (
          <Text
            style={
              styles.notAvailable
            }
          >
            No report available.
          </Text>
        )}
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

        {project.githubUrl ? (
          <Pressable
            style={
              styles.githubButton
            }
            onPress={() =>
              openUrl(
                project.githubUrl!
              )
            }
          >
            <Text
              style={
                styles.githubButtonText
              }
            >
              GitHub ↗
            </Text>
          </Pressable>
        ) : (
          <Text
            style={
              styles.notAvailable
            }
          >
            No GitHub repository
            available.
          </Text>
        )}
      </View>

      {/* ==================================================
          EXISTING GUIDE FEEDBACK
      ================================================== */}

      {project.guideFeedback ||
      (
        project
          .guideFeedbackAttachmentUrls
          ?.length || 0
      ) > 0 ? (
        <View
          style={
            styles.previousFeedbackBox
          }
        >
          <Text
            style={
              styles.previousFeedbackTitle
            }
          >
            Previous Guide Feedback
          </Text>

          {project.guideFeedback ? (
            <Text
              style={
                styles.previousFeedbackText
              }
            >
              {
                project.guideFeedback
              }
            </Text>
          ) : null}

          {/* ==================================================
              EXISTING ATTACHMENTS
          ================================================== */}

          {project.guideFeedbackAttachmentUrls &&
          project.guideFeedbackAttachmentUrls
            .length > 0 ? (
            <View
              style={
                styles.existingAttachment
              }
            >
              <Text
                style={
                  styles.attachmentLabel
                }
              >
                📎 Attached Screenshots
              </Text>

              <Text
                style={
                  styles.attachmentCount
                }
              >
                {
                  project
                    .guideFeedbackAttachmentUrls
                    .length
                }{" "}
                screenshot
                {project
                  .guideFeedbackAttachmentUrls
                  .length !==
                1
                  ? "s"
                  : ""}
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
                        styles.existingAttachmentCard
                      }
                      onPress={() =>
                        openUrl(
                          url
                        )
                      }
                    >
                      <Image
                        source={{
                          uri:
                            url,
                        }}
                        style={
                          styles.existingAttachmentImage
                        }
                        resizeMode="cover"
                      />

                      <Text
                        style={
                          styles.existingAttachmentNumber
                        }
                      >
                        Screenshot{" "}
                        {index +
                          1}
                      </Text>

                      <Text
                        style={
                          styles.viewAttachmentText
                        }
                      >
                        View ↗
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
          GUIDE REVIEW
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
          Guide Review
        </Text>

        <Text
          style={
            styles.reviewText
          }
        >
          Add clear feedback so the
          student understands what
          needs to be improved.
        </Text>

        {/* FEEDBACK INPUT */}

        <Text
          style={
            styles.label
          }
        >
          Feedback / Review Comments
        </Text>

        <TextInput
          style={
            styles.feedbackInput
          }
          placeholder={
            "Example: Improve login validation, add proper error handling, and update the project documentation."
          }
          placeholderTextColor="#9CA3AF"
          value={
            feedback
          }
          onChangeText={
            setFeedback
          }
          multiline
          textAlignVertical="top"
          editable={
            !updating
          }
        />

        <Text
          style={
            styles.feedbackHint
          }
        >
          Feedback is required when
          requesting a revision or
          rejecting a project.
        </Text>

        {/* ==================================================
            MULTIPLE ATTACHMENTS
        ================================================== */}

        <Text
          style={
            styles.label
          }
        >
          Feedback Screenshots
          <Text
            style={
              styles.optionalText
            }
          >
            {" "}
            (Optional)
          </Text>
        </Text>

        <Text
          style={
            styles.attachmentHint
          }
        >
          Attach screenshots to visually
          show the student where problems
          or required changes are located.
          You can select up to 8 screenshots.
        </Text>

        {/* ATTACH BUTTON */}

        <Pressable
          style={
            styles.attachButton
          }
          onPress={
            pickFeedbackAttachments
          }
          disabled={
            updating
          }
        >
          <Text
            style={
              styles.attachButtonText
            }
          >
            📎 Attach Screenshots
          </Text>
        </Pressable>

        {/* SELECTED ATTACHMENTS */}

        {feedbackAttachments.length >
        0 ? (
          <View
            style={
              styles.selectedAttachments
            }
          >
            <Text
              style={
                styles.attachmentSelectedTitle
              }
            >
              {
                feedbackAttachments.length
              }{" "}
              screenshot
              {feedbackAttachments.length !==
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
              {feedbackAttachments.map(
                (
                  image,
                  index
                ) => (
                  <View
                    key={`${image.uri}-${index}`}
                    style={
                      styles.selectedAttachmentItem
                    }
                  >
                    <Image
                      source={{
                        uri:
                          image.uri,
                      }}
                      style={
                        styles.attachmentPreview
                      }
                      resizeMode="cover"
                    />

                    <Text
                      style={
                        styles.selectedAttachmentNumber
                      }
                    >
                      {
                        index +
                        1
                      }
                    </Text>

                    <Pressable
                      onPress={() =>
                        removeFeedbackAttachment(
                          index
                        )
                      }
                      disabled={
                        updating
                      }
                    >
                      <Text
                        style={
                          styles.removeAttachmentText
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

        {/* ==================================================
            APPROVE
        ================================================== */}

        <Pressable
          style={[
            styles.actionButton,
            styles.approveButton,
            updating &&
              styles.disabledButton,
          ]}
          disabled={
            updating
          }
          onPress={() =>
            confirmReview(
              "approved"
            )
          }
        >
          <Text
            style={
              styles.actionButtonText
            }
          >
            ✓ Approve Project
          </Text>
        </Pressable>

        {/* ==================================================
            REVISION
        ================================================== */}

        <Pressable
          style={[
            styles.actionButton,
            styles.revisionButton,
            updating &&
              styles.disabledButton,
          ]}
          disabled={
            updating
          }
          onPress={() =>
            confirmReview(
              "revision_required"
            )
          }
        >
          <Text
            style={
              styles.actionButtonText
            }
          >
            ↻ Request Revision
          </Text>
        </Pressable>

        {/* ==================================================
            REJECT
        ================================================== */}

        <Pressable
          style={[
            styles.actionButton,
            styles.rejectButton,
            updating &&
              styles.disabledButton,
          ]}
          disabled={
            updating
          }
          onPress={() =>
            confirmReview(
              "rejected"
            )
          }
        >
          <Text
            style={
              styles.actionButtonText
            }
          >
            ✕ Reject Project
          </Text>
        </Pressable>

        {/* ==================================================
            UPDATING
        ================================================== */}

        {updating && (
          <View
            style={
              styles.updatingContainer
            }
          >
            <ActivityIndicator
              size="small"
              color="#2563EB"
            />

            <Text
              style={
                styles.updatingText
              }
            >
              Saving review...
            </Text>
          </View>
        )}
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
        "#F8FAFC",
    },

    content: {
      padding: 20,
      paddingBottom: 50,
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#F8FAFC",
      padding: 20,
    },

    loadingText: {
      marginTop: 12,
      color: "#6B7280",
      fontSize: 14,
    },

    notFoundTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#111827",
      marginBottom: 20,
    },

    backButton: {
      backgroundColor:
        "#2563EB",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },

    backButtonText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },

    backLink: {
      marginBottom: 15,
    },

    backLinkText: {
      color: "#2563EB",
      fontSize: 15,
      fontWeight: "600",
    },

    headerCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      marginBottom: 16,
    },

    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#111827",
      marginBottom: 12,
    },

    statusBadge: {
      alignSelf:
        "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    statusText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },

    pending: {
      backgroundColor:
        "#F59E0B",
    },

    approved: {
      backgroundColor:
        "#16A34A",
    },

    revision: {
      backgroundColor:
        "#EA580C",
    },

    rejected: {
      backgroundColor:
        "#DC2626",
    },

    studentName: {
      marginTop: 14,
      fontSize: 15,
      fontWeight: "600",
      color: "#2563EB",
    },

    studentEmail: {
      marginTop: 4,
      fontSize: 13,
      color: "#6B7280",
    },

    section: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      marginBottom: 16,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#111827",
      marginBottom: 12,
    },

    sectionDescription: {
      fontSize: 14,
      color: "#6B7280",
      lineHeight: 20,
      marginBottom: 15,
    },

    description: {
      fontSize: 15,
      color: "#4B5563",
      lineHeight: 23,
    },

    infoRow: {
      paddingVertical: 5,
    },

    label: {
      fontSize: 13,
      fontWeight: "600",
      color: "#6B7280",
      marginBottom: 5,
    },

    value: {
      fontSize: 15,
      color: "#111827",
    },

    divider: {
      height: 1,
      backgroundColor:
        "#E5E7EB",
      marginVertical: 12,
    },

    demoItem: {
      marginBottom: 18,
    },

    demoLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 8,
    },

    liveDemoButton: {
      backgroundColor:
        "#2563EB",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems:
        "center",
    },

    liveDemoButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },

    videoButton: {
      backgroundColor:
        "#7C3AED",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems:
        "center",
    },

    videoButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },

    fileName: {
      fontSize: 13,
      color: "#6B7280",
      marginBottom: 8,
    },

    screenshotCount: {
      fontSize: 13,
      color: "#6B7280",
      marginBottom: 10,
    },

    screenshotScroll: {
      marginHorizontal:
        -5,
    },

    screenshotCard: {
      width: 170,
      marginHorizontal: 5,
    },

    screenshot: {
      width: 170,
      height: 220,
      borderRadius: 10,
      backgroundColor:
        "#E5E7EB",
    },

    screenshotNumber: {
      fontSize: 12,
      color: "#6B7280",
      marginTop: 6,
      textAlign:
        "center",
    },

    noDemoBox: {
      backgroundColor:
        "#F9FAFB",
      borderRadius: 10,
      padding: 15,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    noDemoTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 5,
    },

    notAvailable: {
      color: "#9CA3AF",
      fontSize: 14,
    },

    reportButton: {
      backgroundColor:
        "#EFF6FF",
      borderWidth: 1,
      borderColor:
        "#BFDBFE",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems:
        "center",
    },

    reportButtonText: {
      color: "#2563EB",
      fontWeight: "700",
      fontSize: 14,
    },

    githubButton: {
      backgroundColor:
        "#111827",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems:
        "center",
    },

    githubButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },

    previousFeedbackBox: {
      backgroundColor:
        "#FFF7ED",
      borderWidth: 1,
      borderColor:
        "#FED7AA",
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
    },

    previousFeedbackTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#9A3412",
      marginBottom: 8,
    },

    previousFeedbackText: {
      fontSize: 14,
      color: "#7C2D12",
      lineHeight: 21,
      marginBottom: 5,
    },

    existingAttachment: {
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor:
        "#FED7AA",
    },

    attachmentLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: "#9A3412",
      marginBottom: 7,
    },

    attachmentCount: {
      fontSize: 12,
      color: "#9A3412",
      marginBottom: 10,
    },

    existingAttachmentCard: {
      width: 130,
      marginRight: 12,
    },

    existingAttachmentImage: {
      width: 130,
      height: 150,
      borderRadius: 10,
      backgroundColor:
        "#E5E7EB",
    },

    existingAttachmentNumber: {
      fontSize: 12,
      color: "#7C2D12",
      textAlign:
        "center",
      marginTop: 5,
    },

    viewAttachmentButton: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#FDBA74",
      borderRadius: 8,
      paddingVertical: 10,
      alignItems:
        "center",
    },

    viewAttachmentText: {
      color: "#C2410C",
      fontWeight: "700",
      fontSize: 12,
      textAlign:
        "center",
      marginTop: 4,
    },

    reviewText: {
      fontSize: 14,
      color: "#6B7280",
      lineHeight: 21,
      marginBottom: 15,
    },

    feedbackInput: {
      minHeight: 130,
      borderWidth: 1,
      borderColor:
        "#D1D5DB",
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: "#111827",
      backgroundColor:
        "#FFFFFF",
      marginBottom: 8,
    },

    feedbackHint: {
      fontSize: 12,
      color: "#6B7280",
      lineHeight: 18,
      marginBottom: 18,
    },

    optionalText: {
      color: "#9CA3AF",
      fontWeight:
        "400",
    },

    attachmentHint: {
      fontSize: 12,
      color: "#6B7280",
      lineHeight: 18,
      marginBottom: 12,
    },

    attachButton: {
      borderWidth: 1,
      borderColor:
        "#2563EB",
      borderStyle:
        "dashed",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems:
        "center",
      marginBottom: 18,
      backgroundColor:
        "#EFF6FF",
    },

    attachButtonText: {
      color: "#2563EB",
      fontSize: 14,
      fontWeight: "700",
    },

    selectedAttachments: {
      marginBottom: 18,
    },

    selectedAttachmentItem: {
      width: 115,
      marginRight: 12,
    },

    attachmentPreview: {
      width: 115,
      height: 130,
      borderRadius: 8,
      backgroundColor:
        "#E5E7EB",
    },

    selectedAttachmentNumber: {
      fontSize: 11,
      color: "#6B7280",
      textAlign:
        "center",
      marginTop: 4,
    },

    attachmentSelectedTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1E3A8A",
      marginBottom: 10,
    },

    removeAttachmentText: {
      color: "#DC2626",
      fontSize: 12,
      fontWeight: "700",
      textAlign:
        "center",
      marginTop: 5,
    },

    actionButton: {
      paddingVertical: 14,
      borderRadius: 10,
      alignItems:
        "center",
      marginBottom: 12,
    },

    approveButton: {
      backgroundColor:
        "#16A34A",
    },

    revisionButton: {
      backgroundColor:
        "#EA580C",
    },

    rejectButton: {
      backgroundColor:
        "#DC2626",
    },

    disabledButton: {
      opacity: 0.5,
    },

    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },

    updatingContainer: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginTop: 5,
    },

    updatingText: {
      marginLeft: 8,
      color: "#6B7280",
      fontSize: 13,
    },
  });