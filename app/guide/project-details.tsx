import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

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
  const { id } = useLocalSearchParams();
  const router = useRouter();

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

  const [feedbackAttachments, setFeedbackAttachments] =
    useState<FeedbackAttachment[]>([]);

  // ======================================================
  // LOAD PROJECT
  // ======================================================

  useEffect(() => {
    const loadProject = async () => {
      try {
        if (
          !id ||
          typeof id !== "string"
        ) {
          setLoading(false);
          return;
        }

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
          setLoading(false);
          return;
        }

        const data =
          projectSnap.data();

        // ==================================================
        // LOAD STUDENT DETAILS
        // ==================================================

        let studentName =
          data.studentName || "";

        let studentEmail =
          data.studentEmail || "";

        /*
         * The project normally contains studentName
         * and studentEmail.
         *
         * If either is missing, use studentId to
         * retrieve the student's actual details
         * from the users collection.
         */

        if (
          data.studentId &&
          (!studentName || !studentEmail)
        ) {
          try {
            const studentRef =
              doc(
                db,
                "users",
                data.studentId
              );

            const studentSnap =
              await getDoc(
                studentRef
              );

            if (
              studentSnap.exists()
            ) {
              const studentData =
                studentSnap.data();

              studentName =
                studentData.name ||
                studentName ||
                "Student";

              studentEmail =
                studentData.email ||
                studentEmail ||
                "";
            }
          } catch (studentError) {
            console.log(
              "Error loading student details:",
              studentError
            );
          }
        }

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
            studentName ||
            "Student",

          studentEmail:
            studentEmail ||
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

        setFeedback(
          loadedProject.guideFeedback ||
            ""
        );
      } catch (error) {
        console.log(
          "Error loading project:",
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
        "Error opening URL:",
        error
      );

      Alert.alert(
        "Error",
        "Something went wrong while opening the link."
      );
    }
  };

  // ======================================================
  // PICK FEEDBACK ATTACHMENTS
  // ======================================================

  const pickFeedbackAttachments =
    async () => {
      try {
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

        const maxSize =
          10 * 1024 * 1024;

        const validImages =
          images.filter(
            (image) => {
              const fileName =
                image.fileName ||
                "feedback_screenshot.jpg";

              const isImage =
                image.mimeType?.startsWith(
                  "image/"
                ) ||
                /\.(jpg|jpeg|png|webp)$/i.test(
                  fileName
                );

              if (!isImage) {
                return false;
              }

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

        if (
          validImages.length !==
          images.length
        ) {
          Alert.alert(
            "Invalid Attachment",
            "Only image files smaller than 10 MB are allowed."
          );
        }

        setFeedbackAttachments(
          validImages
        );
      } catch (error) {
        console.log(
          "Error selecting screenshots:",
          error
        );

        Alert.alert(
          "Error",
          "Could not select the feedback screenshots."
        );
      }
    };

  // ======================================================
  // REMOVE ATTACHMENT
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
  // UPLOAD ATTACHMENT
  // ======================================================

  const uploadFeedbackAttachment =
    async (
      image: FeedbackAttachment,
      projectId: string
    ) => {
      const response =
        await fetch(
          image.uri
        );

      if (!response.ok) {
        throw new Error(
          "Could not read the selected screenshot."
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

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

      const uniqueId =
        Math.random()
          .toString(36)
          .substring(
            2,
            8
          );

      const filePath =
        `guide-feedback/${projectId}/${Date.now()}_feedback_${uniqueId}.${extension}`;

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

      if (error) {
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
            filePath
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
    if (!status) {
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
  // STATUS CONFIG
  // ======================================================

  const getStatusConfig = (
    status?: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "approved":
        return {
          background:
            "#D1FAE5",
          color:
            "#047857",
          icon:
            "checkmark-circle" as const,
        };

      case "revision_required":
        return {
          background:
            "#FEF3C7",
          color:
            "#B45309",
          icon:
            "create-outline" as const,
        };

      case "rejected":
        return {
          background:
            "#FEE2E2",
          color:
            "#B91C1C",
          icon:
            "close-circle" as const,
        };

      default:
        return {
          background:
            "#E0E7FF",
          color:
            "#4338CA",
          icon:
            "time-outline" as const,
        };
    }
  };

  // ======================================================
  // UPDATE REVIEW
  // ======================================================

  const updateReview =
    async (
      newStatus: string
    ) => {
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

      const guide =
        auth.currentUser;

      if (!guide) {
        Alert.alert(
          "Error",
          "Guide session has expired. Please login again."
        );

        return;
      }

      const trimmedFeedback =
        feedback.trim();

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

      try {
        setUpdating(
          true
        );

        const attachmentUrls: string[] =
          [];

        const attachmentNames: string[] =
          [];

        if (
          feedbackAttachments.length >
          0
        ) {
          for (
            let i = 0;
            i <
            feedbackAttachments.length;
            i++
          ) {
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

        setFeedbackAttachments(
          []
        );

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
          "Error updating review:",
          error
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

      let title = "";
      let message = "";

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

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <View
          style={
            styles.loadingIcon
          }
        >
          <Ionicons
            name="document-text-outline"
            size={30}
            color="#4338CA"
          />
        </View>

        <ActivityIndicator
          size="small"
          color="#38B2AC"
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

  if (!project) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <View
          style={
            styles.emptyIcon
          }
        >
          <Ionicons
            name="document-text-outline"
            size={32}
            color="#4338CA"
          />
        </View>

        <Text
          style={
            styles.notFoundTitle
          }
        >
          Project Not Found
        </Text>

        <Text
          style={
            styles.notFoundText
          }
        >
          The project could not be
          loaded or may have been
          removed.
        </Text>

        <Pressable
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color="#FFFFFF"
          />

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

  const statusConfig =
    getStatusConfig(
      project.status
    );

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
        <Ionicons
          name="arrow-back"
          size={18}
          color="#4338CA"
        />

        <Text
          style={
            styles.backLinkText
          }
        >
          Back to Projects
        </Text>
      </Pressable>

      {/* ==================================================
          PROJECT HERO
      ================================================== */}

      <View
        style={
          styles.heroCard
        }
      >
        <View
          style={
            styles.heroIcon
          }
        >
          <Ionicons
            name="document-text-outline"
            size={28}
            color="#4338CA"
          />
        </View>

        <View
          style={
            styles.heroContent
          }
        >
          <Text
            style={
              styles.heroTitle
            }
          >
            {project.title ||
              "Untitled Project"}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusConfig.background,
              },
            ]}
          >
            <Ionicons
              name={
                statusConfig.icon
              }
              size={14}
              color={
                statusConfig.color
              }
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    statusConfig.color,
                },
              ]}
            >
              {formatStatus(
                project.status
              )}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.studentBox
          }
        >
          <View
            style={
              styles.studentAvatar
            }
          >
            <Text
              style={
                styles.studentAvatarText
              }
            >
              {(
                project.studentName ||
                "S"
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={
              styles.studentInfo
            }
          >
            <Text
              style={
                styles.studentName
              }
            >
              {project.studentName ||
                "Student"}
            </Text>

            {project.studentEmail ? (
              <Text
                style={
                  styles.studentEmail
                }
                numberOfLines={1}
              >
                {
                  project.studentEmail
                }
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* ==================================================
          DESCRIPTION
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#4338CA"
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Project Description
          </Text>
        </View>

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
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="layers-outline"
              size={19}
              color="#4338CA"
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Project Information
          </Text>
        </View>

        <View
          style={
            styles.infoCard
          }
        >
          <View
            style={
              styles.infoIcon
            }
          >
            <Ionicons
              name="grid-outline"
              size={17}
              color="#38B2AC"
            />
          </View>

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoLabel
              }
            >
              DOMAIN
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {project.domain ||
                "Not specified"}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.infoCard
          }
        >
          <View
            style={
              styles.infoIcon
            }
          >
            <Ionicons
              name="code-slash-outline"
              size={17}
              color="#38B2AC"
            />
          </View>

          <View
            style={
              styles.infoContent
            }
          >
            <Text
              style={
                styles.infoLabel
              }
            >
              TECHNOLOGIES
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {project.technologies ||
                "Not specified"}
            </Text>
          </View>
        </View>
      </View>

      {/* ==================================================
          DEMONSTRATION
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="play-circle-outline"
              size={19}
              color="#4338CA"
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Project Demonstration
          </Text>
        </View>

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

        {project.liveDemoUrl ? (
          <Pressable
            style={[
              styles.resourceButton,
              styles.liveDemoButton,
            ]}
            onPress={() =>
              openUrl(
                project.liveDemoUrl!
              )
            }
          >
            <View
              style={
                styles.resourceIcon
              }
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color="#4338CA"
              />
            </View>

            <View
              style={
                styles.resourceText
              }
            >
              <Text
                style={
                  styles.resourceTitle
                }
              >
                Live Demo
              </Text>

              <Text
                style={
                  styles.resourceSubtitle
                }
              >
                Open project application
              </Text>
            </View>

            <Ionicons
              name="open-outline"
              size={19}
              color="#4338CA"
            />
          </Pressable>
        ) : null}

        {project.videoUrl ? (
          <Pressable
            style={[
              styles.resourceButton,
              styles.videoResourceButton,
            ]}
            onPress={() =>
              openUrl(
                project.videoUrl!
              )
            }
          >
            <View
              style={[
                styles.resourceIcon,
                styles.videoIcon,
              ]}
            >
              <Ionicons
                name="videocam-outline"
                size={20}
                color="#4338CA"
              />
            </View>

            <View
              style={
                styles.resourceText
              }
            >
              <Text
                style={
                  styles.resourceTitle
                }
              >
                Video Demonstration
              </Text>

              <Text
                style={
                  styles.resourceSubtitle
                }
              >
                {project.videoName ||
                  "Watch project video"}
              </Text>
            </View>

            <Ionicons
              name="play-outline"
              size={19}
              color="#4338CA"
            />
          </Pressable>
        ) : null}

        {project.screenshotUrls &&
        project.screenshotUrls.length >
          0 ? (
          <View
            style={
              styles.galleryContainer
            }
          >
            <View
              style={
                styles.galleryHeader
              }
            >
              <View
                style={
                  styles.galleryTitleRow
                }
              >
                <Ionicons
                  name="images-outline"
                  size={19}
                  color="#4338CA"
                />

                <Text
                  style={
                    styles.galleryTitle
                  }
                >
                  Screenshots
                </Text>
              </View>

              <View
                style={
                  styles.countBadge
                }
              >
                <Text
                  style={
                    styles.countBadgeText
                  }
                >
                  {
                    project
                      .screenshotUrls
                      .length
                  }
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.galleryScroll
              }
            >
              {project.screenshotUrls.map(
                (
                  url,
                  index
                ) => (
                  <Pressable
                    key={`${url}-${index}`}
                    style={
                      styles.screenshotCard
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
                        styles.screenshot
                      }
                      resizeMode="cover"
                    />

                    <View
                      style={
                        styles.screenshotOverlay
                      }
                    >
                      <Ionicons
                        name="open-outline"
                        size={15}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.screenshotOverlayText
                        }
                      >
                        {index +
                          1}
                      </Text>
                    </View>
                  </Pressable>
                )
              )}
            </ScrollView>
          </View>
        ) : null}

        {!project.liveDemoUrl &&
        !project.videoUrl &&
        (!project.screenshotUrls ||
          project.screenshotUrls
            .length === 0) ? (
          <View
            style={
              styles.noDemoBox
            }
          >
            <Ionicons
              name="folder-open-outline"
              size={25}
              color="#9CA3AF"
            />

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
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="document-attach-outline"
              size={19}
              color="#4338CA"
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Project Report
          </Text>
        </View>

        {project.reportUrl ? (
          <Pressable
            style={
              styles.documentButton
            }
            onPress={() =>
              openUrl(
                project.reportUrl!
              )
            }
          >
            <View
              style={
                styles.documentIcon
              }
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color="#4338CA"
              />
            </View>

            <View
              style={
                styles.resourceText
              }
            >
              <Text
                style={
                  styles.resourceTitle
                }
              >
                View Project Report
              </Text>

              <Text
                style={
                  styles.resourceSubtitle
                }
                numberOfLines={1}
              >
                {project.reportName ||
                  "Project report"}
              </Text>
            </View>

            <Ionicons
              name="open-outline"
              size={19}
              color="#4338CA"
            />
          </Pressable>
        ) : (
          <View
            style={
              styles.unavailableBox
            }
          >
            <Ionicons
              name="document-outline"
              size={20}
              color="#9CA3AF"
            />

            <Text
              style={
                styles.notAvailable
              }
            >
              No report available.
            </Text>
          </View>
        )}
      </View>

      {/* ==================================================
          SOURCE CODE
      ================================================== */}

      <View
        style={
          styles.section
        }
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={
              styles.sectionIcon
            }
          >
            <Ionicons
              name="logo-github"
              size={19}
              color="#4338CA"
            />
          </View>

          <Text
            style={
              styles.sectionTitle
            }
          >
            Source Code
          </Text>
        </View>

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
            <Ionicons
              name="logo-github"
              size={21}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.githubButtonText
              }
            >
              Open GitHub Repository
            </Text>

            <Ionicons
              name="open-outline"
              size={18}
              color="#FFFFFF"
            />
          </Pressable>
        ) : (
          <View
            style={
              styles.unavailableBox
            }
          >
            <Ionicons
              name="logo-github"
              size={20}
              color="#9CA3AF"
            />

            <Text
              style={
                styles.notAvailable
              }
            >
              No GitHub repository
              available.
            </Text>
          </View>
        )}
      </View>

      {/* ==================================================
          PREVIOUS FEEDBACK
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
          <View
            style={
              styles.feedbackHeader
            }
          >
            <View
              style={
                styles.feedbackHeaderIcon
              }
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={19}
                color="#B45309"
              />
            </View>

            <View>
              <Text
                style={
                  styles.previousFeedbackTitle
                }
              >
                Previous Guide Feedback
              </Text>

              <Text
                style={
                  styles.previousFeedbackSubtitle
                }
              >
                Feedback from the previous
                review
              </Text>
            </View>
          </View>

          {project.guideFeedback ? (
            <View
              style={
                styles.previousFeedbackTextBox
              }
            >
              <Text
                style={
                  styles.previousFeedbackText
                }
              >
                {
                  project.guideFeedback
                }
              </Text>
            </View>
          ) : null}

          {project.guideFeedbackAttachmentUrls &&
          project.guideFeedbackAttachmentUrls
            .length > 0 ? (
            <View
              style={
                styles.existingAttachment
              }
            >
              <View
                style={
                  styles.attachmentHeader
                }
              >
                <Text
                  style={
                    styles.attachmentLabel
                  }
                >
                  Attached Screenshots
                </Text>

                <View
                  style={
                    styles.countBadgeOrange
                  }
                >
                  <Text
                    style={
                      styles.countBadgeOrangeText
                    }
                  >
                    {
                      project
                        .guideFeedbackAttachmentUrls
                        .length
                    }
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.galleryScroll
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

                      <View
                        style={
                          styles.attachmentViewRow
                        }
                      >
                        <Text
                          style={
                            styles.existingAttachmentNumber
                          }
                        >
                          Screenshot{" "}
                          {index +
                            1}
                        </Text>

                        <Ionicons
                          name="open-outline"
                          size={14}
                          color="#C2410C"
                        />
                      </View>
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
          styles.reviewSection
        }
      >
        <View
          style={
            styles.reviewHeader
          }
        >
          <View
            style={
              styles.reviewIcon
            }
          >
            <Ionicons
              name="checkmark-done-outline"
              size={21}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.reviewHeaderText
            }
          >
            <Text
              style={
                styles.reviewTitle
              }
            >
              Guide Review
            </Text>

            <Text
              style={
                styles.reviewSubtitle
              }
            >
              Review the project and
              provide clear feedback.
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.inputLabel
          }
        >
          Feedback / Review Comments
        </Text>

        <TextInput
          style={
            styles.feedbackInput
          }
          placeholder="Example: Improve login validation, add proper error handling, and update the project documentation."
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

        <Text
          style={
            styles.inputLabel
          }
        >
          Feedback Screenshots
          <Text
            style={
              styles.optionalText
            }
          >
            {" "}
            Optional
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
          Maximum 8 screenshots.
        </Text>

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
          <View
            style={
              styles.attachIcon
            }
          >
            <Ionicons
              name="images-outline"
              size={19}
              color="#4338CA"
            />
          </View>

          <Text
            style={
              styles.attachButtonText
            }
          >
            Attach Screenshots
          </Text>

          <Ionicons
            name="add"
            size={19}
            color="#4338CA"
          />
        </Pressable>

        {feedbackAttachments.length >
        0 ? (
          <View
            style={
              styles.selectedAttachments
            }
          >
            <View
              style={
                styles.selectedHeader
              }
            >
              <Text
                style={
                  styles.attachmentSelectedTitle
                }
              >
                Selected Attachments
              </Text>

              <View
                style={
                  styles.selectedCount
                }
              >
                <Text
                  style={
                    styles.selectedCountText
                  }
                >
                  {
                    feedbackAttachments.length
                  }
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.galleryScroll
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

                    <View
                      style={
                        styles.selectedImageFooter
                      }
                    >
                      <Text
                        style={
                          styles.selectedAttachmentNumber
                        }
                      >
                        {index +
                          1}
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
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#DC2626"
                        />
                      </Pressable>
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        ) : null}

        <Text
          style={
            styles.actionLabel
          }
        >
          Review Decision
        </Text>

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
          <View
            style={
              styles.actionIcon
            }
          >
            <Ionicons
              name="checkmark"
              size={19}
              color="#047857"
            />
          </View>

          <View
            style={
              styles.actionTextContainer
            }
          >
            <Text
              style={
                styles.actionTitle
              }
            >
              Approve Project
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Mark this project as
              approved
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color="#047857"
          />
        </Pressable>

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
          <View
            style={[
              styles.actionIcon,
              styles.revisionIcon,
            ]}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color="#B45309"
            />
          </View>

          <View
            style={
              styles.actionTextContainer
            }
          >
            <Text
              style={
                styles.actionTitle
              }
            >
              Request Revision
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Ask the student to make
              changes
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color="#B45309"
          />
        </Pressable>

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
          <View
            style={[
              styles.actionIcon,
              styles.rejectIcon,
            ]}
          >
            <Ionicons
              name="close-outline"
              size={19}
              color="#B91C1C"
            />
          </View>

          <View
            style={
              styles.actionTextContainer
            }
          >
            <Text
              style={
                styles.actionTitle
              }
            >
              Reject Project
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Reject this project with a
              reason
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color="#B91C1C"
          />
        </Pressable>

        {updating && (
          <View
            style={
              styles.updatingContainer
            }
          >
            <ActivityIndicator
              size="small"
              color="#4338CA"
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

      {/* ==================================================
          FOOTER
      ================================================== */}

      <View
        style={
          styles.footer
        }
      >
        <Text
          style={
            styles.footerText
          }
        >
          ProjectVerse
        </Text>

        <Text
          style={
            styles.footerSubtext
          }
        >
          Guide Review Portal
        </Text>
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
        "#F5F7FB",
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
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#F5F7FB",
      padding: 25,
    },

    loadingIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 18,
    },

    loadingText: {
      marginTop: 10,
      color: "#6B7280",
      fontSize: 14,
    },

    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 18,
    },

    notFoundTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 7,
    },

    notFoundText: {
      fontSize: 14,
      color: "#6B7280",
      textAlign:
        "center",
      lineHeight: 21,
      marginBottom: 22,
    },

    backButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      backgroundColor:
        "#4338CA",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },

    backButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },

    // ==================================================
    // BACK
    // ==================================================

    backLink: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      marginBottom: 14,
      paddingVertical: 5,
    },

    backLinkText: {
      color: "#4338CA",
      fontSize: 14,
      fontWeight: "700",
    },

    // ==================================================
    // HERO
    // ==================================================

    heroCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      padding: 20,
      marginBottom: 16,
      shadowColor:
        "#1F2937",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity:
        0.05,
      shadowRadius: 10,
      elevation: 2,
    },

    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 14,
    },

    heroContent: {
      marginBottom: 17,
    },

    heroTitle: {
      fontSize: 26,
      lineHeight: 33,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 10,
    },

    statusBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      alignSelf:
        "flex-start",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },

    statusText: {
      fontSize: 12,
      fontWeight: "700",
    },

    studentBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor:
        "#F0F1F5",
    },

    studentAvatar: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        "#4338CA",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 11,
    },

    studentAvatarText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },

    studentInfo: {
      flex: 1,
    },

    studentName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#1F2937",
    },

    studentEmail: {
      marginTop: 3,
      fontSize: 12,
      color: "#6B7280",
    },

    // ==================================================
    // SECTIONS
    // ==================================================

    section: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      marginBottom: 14,
    },

    sectionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 14,
    },

    sectionIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },

    sectionTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: "#1F2937",
    },

    sectionDescription: {
      fontSize: 13,
      color: "#6B7280",
      lineHeight: 19,
      marginBottom: 15,
    },

    description: {
      fontSize: 14,
      color: "#4B5563",
      lineHeight: 22,
    },

    // ==================================================
    // INFORMATION
    // ==================================================

    infoCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#F8FAFC",
      borderRadius: 12,
      padding: 12,
      marginBottom: 9,
    },

    infoIcon: {
      width: 35,
      height: 35,
      borderRadius: 10,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 11,
    },

    infoContent: {
      flex: 1,
    },

    infoLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: "#9CA3AF",
      letterSpacing: 0.6,
      marginBottom: 3,
    },

    infoValue: {
      fontSize: 14,
      color: "#1F2937",
      fontWeight: "600",
    },

    // ==================================================
    // RESOURCES
    // ==================================================

    resourceButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      borderRadius: 13,
      padding: 12,
      marginBottom: 9,
      borderWidth: 1,
    },

    liveDemoButton: {
      backgroundColor:
        "#EEF2FF",
      borderColor:
        "#C7D2FE",
    },

    videoResourceButton: {
      backgroundColor:
        "#F5F3FF",
      borderColor:
        "#DDD6FE",
    },

    resourceIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 11,
    },

    videoIcon: {
      backgroundColor:
        "#EDE9FE",
    },

    resourceText: {
      flex: 1,
      marginRight: 8,
    },

    resourceTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F2937",
    },

    resourceSubtitle: {
      fontSize: 11,
      color: "#6B7280",
      marginTop: 3,
    },

    // ==================================================
    // SCREENSHOT GALLERY
    // ==================================================

    galleryContainer: {
      marginTop: 6,
    },

    galleryHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 10,
    },

    galleryTitleRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    galleryTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F2937",
    },

    countBadge: {
      minWidth: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 8,
    },

    countBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#4338CA",
    },

    galleryScroll: {
      paddingRight: 5,
    },

    screenshotCard: {
      width: 145,
      height: 185,
      borderRadius: 13,
      overflow: "hidden",
      marginRight: 10,
      backgroundColor:
        "#E5E7EB",
    },

    screenshot: {
      width: "100%",
      height: "100%",
    },

    screenshotOverlay: {
      position: "absolute",
      left: 8,
      right: 8,
      bottom: 8,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "rgba(31,41,55,0.72)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },

    screenshotOverlayText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },

    noDemoBox: {
      backgroundColor:
        "#F8FAFC",
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      borderRadius: 12,
      padding: 16,
      alignItems:
        "center",
    },

    noDemoTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#374151",
      marginTop: 7,
      marginBottom: 4,
    },

    notAvailable: {
      color: "#9CA3AF",
      fontSize: 13,
      lineHeight: 19,
    },

    // ==================================================
    // DOCUMENT
    // ==================================================

    documentButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#EEF2FF",
      borderWidth: 1,
      borderColor:
        "#C7D2FE",
      borderRadius: 13,
      padding: 12,
    },

    documentIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 11,
    },

    unavailableBox: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      backgroundColor:
        "#F8FAFC",
      borderRadius: 11,
      padding: 13,
    },

    // ==================================================
    // GITHUB
    // ==================================================

    githubButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 9,
      backgroundColor:
        "#1F2937",
      borderRadius: 12,
      paddingVertical: 14,
    },

    githubButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
      flex: 1,
      textAlign:
        "center",
    },

    // ==================================================
    // PREVIOUS FEEDBACK
    // ==================================================

    previousFeedbackBox: {
      backgroundColor:
        "#FFFBEB",
      borderWidth: 1,
      borderColor:
        "#FDE68A",
      borderRadius: 18,
      padding: 17,
      marginBottom: 14,
    },

    feedbackHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 13,
    },

    feedbackHeaderIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        "#FEF3C7",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },

    previousFeedbackTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#92400E",
    },

    previousFeedbackSubtitle: {
      fontSize: 11,
      color: "#B45309",
      marginTop: 2,
    },

    previousFeedbackTextBox: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 11,
      padding: 12,
      borderWidth: 1,
      borderColor:
        "#FDE68A",
    },

    previousFeedbackText: {
      fontSize: 13,
      color: "#78350F",
      lineHeight: 20,
    },

    existingAttachment: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#FDE68A",
    },

    attachmentHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 9,
    },

    attachmentLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: "#92400E",
    },

    countBadgeOrange: {
      minWidth: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor:
        "#FEF3C7",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 7,
    },

    countBadgeOrangeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#B45309",
    },

    existingAttachmentCard: {
      width: 125,
      marginRight: 10,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 11,
      padding: 6,
      borderWidth: 1,
      borderColor:
        "#FED7AA",
    },

    existingAttachmentImage: {
      width: 113,
      height: 135,
      borderRadius: 8,
      backgroundColor:
        "#E5E7EB",
    },

    attachmentViewRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 3,
      paddingTop: 6,
    },

    existingAttachmentNumber: {
      fontSize: 10,
      color: "#9A3412",
      fontWeight: "600",
    },

    // ==================================================
    // REVIEW
    // ==================================================

    reviewSection: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      marginBottom: 15,
    },

    reviewHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#4338CA",
      borderRadius: 15,
      padding: 14,
      marginBottom: 19,
    },

    reviewIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor:
        "rgba(255,255,255,0.16)",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 11,
    },

    reviewHeaderText: {
      flex: 1,
    },

    reviewTitle: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },

    reviewSubtitle: {
      color: "#E0E7FF",
      fontSize: 11,
      marginTop: 3,
      lineHeight: 16,
    },

    inputLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 7,
    },

    feedbackInput: {
      minHeight: 125,
      borderWidth: 1,
      borderColor:
        "#D1D5DB",
      borderRadius: 12,
      padding: 13,
      fontSize: 14,
      color: "#1F2937",
      backgroundColor:
        "#F9FAFB",
      marginBottom: 7,
    },

    feedbackHint: {
      fontSize: 11,
      color: "#6B7280",
      lineHeight: 17,
      marginBottom: 18,
    },

    optionalText: {
      color: "#9CA3AF",
      fontWeight:
        "400",
    },

    attachmentHint: {
      fontSize: 11,
      color: "#6B7280",
      lineHeight: 17,
      marginBottom: 11,
    },

    attachButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#A5B4FC",
      borderStyle:
        "dashed",
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 13,
      backgroundColor:
        "#EEF2FF",
      marginBottom: 15,
    },

    attachIcon: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 9,
    },

    attachButtonText: {
      flex: 1,
      color: "#4338CA",
      fontSize: 13,
      fontWeight: "700",
    },

    selectedAttachments: {
      backgroundColor:
        "#F8FAFC",
      borderRadius: 12,
      padding: 11,
      marginBottom: 18,
    },

    selectedHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 9,
    },

    attachmentSelectedTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
    },

    selectedCount: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor:
        "#D5F5F2",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 6,
    },

    selectedCountText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#4338CA",
    },

    selectedAttachmentItem: {
      width: 105,
      marginRight: 10,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 9,
      padding: 5,
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    attachmentPreview: {
      width: 95,
      height: 115,
      borderRadius: 7,
      backgroundColor:
        "#E5E7EB",
    },

    selectedImageFooter: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 2,
      paddingTop: 5,
    },

    selectedAttachmentNumber: {
      fontSize: 10,
      color: "#6B7280",
      fontWeight: "600",
    },

    actionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
      marginBottom: 9,
    },

    actionButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      borderRadius: 13,
      padding: 12,
      marginBottom: 9,
      borderWidth: 1,
    },

    approveButton: {
      backgroundColor:
        "#ECFDF5",
      borderColor:
        "#A7F3D0",
    },

    revisionButton: {
      backgroundColor:
        "#FFFBEB",
      borderColor:
        "#FDE68A",
    },

    rejectButton: {
      backgroundColor:
        "#FEF2F2",
      borderColor:
        "#FECACA",
    },

    actionIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor:
        "#D1FAE5",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 10,
    },

    revisionIcon: {
      backgroundColor:
        "#FEF3C7",
    },

    rejectIcon: {
      backgroundColor:
        "#FEE2E2",
    },

    actionTextContainer: {
      flex: 1,
    },

    actionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F2937",
    },

    actionSubtitle: {
      fontSize: 10,
      color: "#6B7280",
      marginTop: 3,
    },

    disabledButton: {
      opacity: 0.5,
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
      fontSize: 12,
    },

    // ==================================================
    // FOOTER
    // ==================================================

    footer: {
      alignItems:
        "center",
      paddingTop: 8,
      paddingBottom: 10,
    },

    footerText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#4338CA",
    },

    footerSubtext: {
      fontSize: 10,
      color: "#9CA3AF",
      marginTop: 2,
    },
  });