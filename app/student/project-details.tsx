import { doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
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
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { db } from "../../firebase/firebaseConfig";

// =====================================================
// PROJECT TYPE
// =====================================================

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

  // ===================================================
  // GUIDE REVIEW
  // ===================================================

  status?: string;

  guideFeedback?: string;

  guideFeedbackAttachmentUrls?: string[];

  guideFeedbackAttachmentNames?: string[];

  guideId?: string;

  reviewedBy?: string;

  reviewedAt?: any;

  createdAt?: any;
};

// =====================================================
// COMPONENT
// =====================================================

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();

  const router = useRouter();

  const [project, setProject] =
    useState<Project | null>(null);

  const [loading, setLoading] =
    useState(true);

  // =====================================================
  // FETCH PROJECT
  // =====================================================

  useEffect(() => {
    const fetchProject = async () => {
      try {
        if (
          !id ||
          typeof id !== "string"
        ) {
          console.log(
            "Project ID is missing"
          );

          setLoading(false);

          return;
        }

        console.log(
          "Fetching project with ID:",
          id
        );

        const projectRef = doc(
          db,
          "projects",
          id
        );

        const projectSnap =
          await getDoc(projectRef);

        if (projectSnap.exists()) {
          const data =
            projectSnap.data();

          console.log(
            "Project found:",
            data
          );

          setProject(
            data as Project
          );
        } else {
          console.log(
            "Project not found"
          );
        }
      } catch (error) {
        console.log(
          "Error fetching project:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // =====================================================
  // OPEN URL
  // =====================================================

  const openUrl = async (
    url: string
  ) => {
    try {
      const supported =
        await Linking.canOpenURL(
          url
        );

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to Open",
          "This link cannot be opened."
        );
      }
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

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (
    status?: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "approved":
        return styles.approved;

      case "revision_required":
      case "revision required":
        return styles.revision;

      case "rejected":
        return styles.rejected;

      default:
        return styles.pending;
    }
  };

  // =====================================================
  // STATUS ICON
  // =====================================================

  const getStatusIcon = (
    status?: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "approved":
        return "checkmark-circle";

      case "revision_required":
      case "revision required":
        return "alert-circle";

      case "rejected":
        return "close-circle";

      default:
        return "time";
    }
  };

  // =====================================================
  // STATUS TEXT
  // =====================================================

  const getStatusText = (
    status?: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "approved":
        return "Approved";

      case "revision_required":
      case "revision required":
        return "Revision Required";

      case "rejected":
        return "Rejected";

      default:
        return "Pending";
    }
  };

  // =====================================================
  // STATUS MESSAGE
  // =====================================================

  const getStatusMessage = (
    status?: string
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "approved":
        return "Your project has been approved by the guide.";

      case "revision_required":
      case "revision required":
        return "Your guide has requested changes to this project. Please review the feedback and attached screenshots below.";

      case "rejected":
        return "Your project has been rejected by the guide. Please review the feedback below.";

      default:
        return "Your project is waiting for guide review.";
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#4338CA"
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

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!project) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <View
          style={
            styles.notFoundIcon
          }
        >
          <Ionicons
            name="document-outline"
            size={30}
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
          found.
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
            size={17}
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

  // =====================================================
  // GUIDE ATTACHMENTS
  // =====================================================

  const guideAttachmentUrls =
    Array.isArray(
      project.guideFeedbackAttachmentUrls
    )
      ? project.guideFeedbackAttachmentUrls
      : [];

  const guideAttachmentNames =
    Array.isArray(
      project.guideFeedbackAttachmentNames
    )
      ? project.guideFeedbackAttachmentNames
      : [];

  // =====================================================
  // MAIN SCREEN
  // =====================================================

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
    >
      {/* =================================================
          BACK
      ================================================= */}

      <Pressable
        style={
          styles.backLink
        }
        onPress={() =>
          router.replace(
            "/student/my-projects"
          )
        }
      >
        <Ionicons
          name="arrow-back"
          size={17}
          color="#4338CA"
        />

        <Text
          style={
            styles.backLinkText
          }
        >
          Back to My Projects
        </Text>
      </Pressable>

      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerIcon
          }
        >
          <Ionicons
            name="folder-open-outline"
            size={25}
            color="#4338CA"
          />
        </View>

        <View
          style={
            styles.headerContent
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
            <Ionicons
              name={
                getStatusIcon(
                  project.status
                ) as any
              }
              size={14}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.statusText
              }
            >
              {getStatusText(
                project.status
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* =================================================
          REVIEW STATUS
      ================================================= */}

      <View
        style={[
          styles.reviewStatusSection,
          project.status ===
            "approved" &&
            styles.reviewApproved,
          project.status ===
            "revision_required" &&
            styles.reviewRevision,
          project.status ===
            "rejected" &&
            styles.reviewRejected,
        ]}
      >
        <View
          style={
            styles.reviewIcon
          }
        >
          <Ionicons
            name={
              getStatusIcon(
                project.status
              ) as any
            }
            size={22}
            color={
              project.status ===
              "approved"
                ? "#238F89"
                : project.status ===
                  "revision_required"
                ? "#C27A16"
                : project.status ===
                  "rejected"
                ? "#C44747"
                : "#4338CA"
            }
          />
        </View>

        <View
          style={
            styles.reviewContent
          }
        >
          <Text
            style={
              styles.reviewStatusTitle
            }
          >
            Project Review Status
          </Text>

          <Text
            style={
              styles.reviewStatusMessage
            }
          >
            {getStatusMessage(
              project.status
            )}
          </Text>
        </View>
      </View>

      {/* =================================================
          DESCRIPTION
      ================================================= */}

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
              name="document-text-outline"
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

      {/* =================================================
          PROJECT INFORMATION
      ================================================= */}

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
            Project Information
          </Text>
        </View>

        <View
          style={
            styles.infoRow
          }
        >
          <View
            style={
              styles.infoIcon
            }
          >
            <Ionicons
              name="layers-outline"
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
      </View>

      {/* =================================================
          PROJECT DEMONSTRATION
      ================================================= */}

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
            style={[
              styles.sectionIcon,
              styles.mintIcon,
            ]}
          >
            <Ionicons
              name="eye-outline"
              size={19}
              color="#238F89"
            />
          </View>

          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Project Demonstration
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              View the demonstration
              provided for this project.
            </Text>
          </View>
        </View>

        {/* LIVE DEMO */}

        {project.liveDemoUrl ? (
          <View
            style={
              styles.demoItem
            }
          >
            <View
              style={
                styles.demoLabelRow
              }
            >
              <Ionicons
                name="globe-outline"
                size={18}
                color="#38B2AC"
              />

              <Text
                style={
                  styles.demoLabel
                }
              >
                Live Demo
              </Text>
            </View>

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
                Open Live Demo
              </Text>

              <Ionicons
                name="open-outline"
                size={17}
                color="#238F89"
              />
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
            <View
              style={
                styles.demoLabelRow
              }
            >
              <Ionicons
                name="videocam-outline"
                size={18}
                color="#4338CA"
              />

              <Text
                style={
                  styles.demoLabel
                }
              >
                Demo Video
              </Text>
            </View>

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
              <Ionicons
                name="play-circle-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.videoButtonText
                }
              >
                Watch Demo Video
              </Text>
            </Pressable>

            {project.videoName ? (
              <Text
                style={
                  styles.fileName
                }
                numberOfLines={2}
              >
                {project.videoName}
              </Text>
            ) : null}
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
            <View
              style={
                styles.demoLabelRow
              }
            >
              <Ionicons
                name="images-outline"
                size={18}
                color="#4338CA"
              />

              <Text
                style={
                  styles.demoLabel
                }
              >
                Screenshots
              </Text>
            </View>

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
                  >
                    <Image
                      source={{
                        uri: url,
                      }}
                      style={
                        styles.screenshot
                      }
                    />

                    <View
                      style={
                        styles.imageNumber
                      }
                    >
                      <Text
                        style={
                          styles.imageNumberText
                        }
                      >
                        {index + 1}
                      </Text>
                    </View>
                  </Pressable>
                )
              )}
            </ScrollView>

            <Text
              style={
                styles.imageHint
              }
            >
              Tap an image to open it
            </Text>
          </View>
        ) : null}

        {/* NOTHING PROVIDED */}

        {!project.liveDemoUrl &&
        !project.videoUrl &&
        (!project.screenshotUrls ||
          project.screenshotUrls
            .length === 0) ? (
          <View
            style={
              styles.emptyDemo
            }
          >
            <Ionicons
              name="eye-off-outline"
              size={22}
              color="#9CA3AF"
            />

            <Text
              style={
                styles.notAvailable
              }
            >
              No project demonstration
              available.
            </Text>
          </View>
        ) : null}
      </View>

      {/* =================================================
          PROJECT REPORT
      ================================================= */}

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
              <Ionicons
                name="document-text-outline"
                size={19}
                color="#4338CA"
              />

              <Text
                style={
                  styles.reportButtonText
                }
              >
                View Project Report
              </Text>

              <Ionicons
                name="open-outline"
                size={16}
                color="#4338CA"
              />
            </Pressable>

            {project.reportName ? (
              <Text
                style={
                  styles.fileName
                }
                numberOfLines={2}
              >
                {project.reportName}
              </Text>
            ) : null}
          </>
        ) : (
          <View
            style={
              styles.emptyDemo
            }
          >
            <Ionicons
              name="document-outline"
              size={21}
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

      {/* =================================================
          GITHUB
      ================================================= */}

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
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.githubButtonText
              }
            >
              GitHub Repository
            </Text>

            <Ionicons
              name="open-outline"
              size={16}
              color="#FFFFFF"
            />
          </Pressable>
        ) : (
          <View
            style={
              styles.emptyDemo
            }
          >
            <Ionicons
              name="logo-github"
              size={21}
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

      {/* =================================================
          GUIDE FEEDBACK
      ================================================= */}

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
            style={[
              styles.sectionIcon,
              styles.feedbackIcon,
            ]}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={19}
              color="#238F89"
            />
          </View>

          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Guide Feedback
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Feedback and screenshots
              provided by your guide.
            </Text>
          </View>
        </View>

        {/* TEXT FEEDBACK */}

        {project.guideFeedback ? (
          <View
            style={
              styles.feedbackBox
            }
          >
            <View
              style={
                styles.feedbackHeader
              }
            >
              <Ionicons
                name="person-outline"
                size={16}
                color="#238F89"
              />

              <Text
                style={
                  styles.feedbackLabel
                }
              >
                Feedback from your guide
              </Text>
            </View>

            <Text
              style={
                styles.feedbackText
              }
            >
              {project.guideFeedback}
            </Text>
          </View>
        ) : (
          <View
            style={
              styles.feedbackBox
            }
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color="#9CA3AF"
            />

            <Text
              style={
                styles.feedbackText
              }
            >
              No feedback has been
              provided by the guide yet.
            </Text>
          </View>
        )}

        {/* GUIDE ATTACHMENTS */}

        {guideAttachmentUrls.length >
        0 ? (
          <View
            style={
              styles.guideAttachmentsSection
            }
          >
            <View
              style={
                styles.attachmentsHeader
              }
            >
              <Ionicons
                name="images-outline"
                size={18}
                color="#4338CA"
              />

              <Text
                style={
                  styles.attachmentsTitle
                }
              >
                Screenshots from Guide
              </Text>
            </View>

            <Text
              style={
                styles.attachmentsDescription
              }
            >
              These screenshots show the
              areas that require changes
              or improvement.
            </Text>

            <View
              style={
                styles.attachmentCountRow
              }
            >
              <Ionicons
                name="attach-outline"
                size={15}
                color="#4338CA"
              />

              <Text
                style={
                  styles.attachmentCount
                }
              >
                {
                  guideAttachmentUrls.length
                }{" "}
                screenshot
                {guideAttachmentUrls.length !==
                1
                  ? "s"
                  : ""}{" "}
                attached
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={
                styles.guideAttachmentScroll
              }
            >
              {guideAttachmentUrls.map(
                (
                  url,
                  index
                ) => (
                  <View
                    key={`${url}-${index}`}
                    style={
                      styles.guideAttachmentCard
                    }
                  >
                    {/* IMAGE */}

                    <Pressable
                      onPress={() =>
                        openUrl(
                          url
                        )
                      }
                    >
                      <Image
                        source={{
                          uri: url,
                        }}
                        style={
                          styles.guideAttachmentImage
                        }
                        resizeMode="cover"
                      />
                    </Pressable>

                    {/* NUMBER */}

                    <View
                      style={
                        styles.guideAttachmentInfo
                      }
                    >
                      <Text
                        style={
                          styles.guideAttachmentNumber
                        }
                      >
                        Screenshot{" "}
                        {index + 1}
                      </Text>

                      {guideAttachmentNames[
                        index
                      ] ? (
                        <Text
                          style={
                            styles.guideAttachmentName
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {
                            guideAttachmentNames[
                              index
                            ]
                          }
                        </Text>
                      ) : null}
                    </View>

                    {/* OPEN */}

                    <Pressable
                      style={
                        styles.viewGuideAttachmentButton
                      }
                      onPress={() =>
                        openUrl(
                          url
                        )
                      }
                    >
                      <Text
                        style={
                          styles.viewGuideAttachmentText
                        }
                      >
                        View Full Image
                      </Text>

                      <Ionicons
                        name="open-outline"
                        size={14}
                        color="#4338CA"
                      />
                    </Pressable>
                  </View>
                )
              )}
            </ScrollView>

            <Text
              style={
                styles.imageHint
              }
            >
              Tap an image to view it in
              full size.
            </Text>
          </View>
        ) : null}
      </View>

      {/* =================================================
          REVISION BUTTON
      ================================================= */}

      {project.status ===
      "revision_required" ? (
        <View
          style={
            styles.revisionSection
          }
        >
          <View
            style={
              styles.revisionHeader
            }
          >
            <View
              style={
                styles.revisionIcon
              }
            >
              <Ionicons
                name="create-outline"
                size={22}
                color="#C27A16"
              />
            </View>

            <View
              style={
                styles.revisionHeaderText
              }
            >
              <Text
                style={
                  styles.revisionTitle
                }
              >
                Changes Required
              </Text>

              <Text
                style={
                  styles.revisionSubtitle
                }
              >
                Your guide has requested
                changes to this project.
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.revisionMessage
            }
          >
            Review the guide's feedback
            and screenshots, make the
            required changes, and submit
            a new revision.
          </Text>

          <Pressable
            style={
              styles.reviseButton
            }
            onPress={() => {
              router.push({
                pathname:
                  "/student/revise-project",
                params: {
                  id: id,
                },
              });
            }}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.reviseButtonText
              }
            >
              Revise Project
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      ) : null}

      {/* BOTTOM SPACE */}

      <View
        style={
          styles.bottomSpace
        }
      />
    </ScrollView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles =
  StyleSheet.create({
    // ==================================================
    // PAGE
    // ==================================================

    container: {
      flex: 1,
      backgroundColor: "#F5F7FB",
    },

    content: {
      padding: 18,
      paddingBottom: 35,
    },

    // ==================================================
    // LOADING
    // ==================================================

    loadingContainer: {
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
      marginBottom: 15,
    },

    notFoundTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 6,
    },

    notFoundText: {
      color: "#6B7280",
      fontSize: 13,
      marginBottom: 20,
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
      padding: 17,
      borderWidth: 1,
      borderColor: "#E0E4EC",
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
      fontSize: 23,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 9,
    },

    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
    },

    statusText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
      marginLeft: 5,
    },

    pending: {
      backgroundColor: "#D99A28",
    },

    approved: {
      backgroundColor: "#669b88",
    },

    revision: {
      backgroundColor: "#D97706",
    },

    rejected: {
      backgroundColor: "#C44747",
    },

    // ==================================================
    // REVIEW STATUS
    // ==================================================

    reviewStatusSection: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 15,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: "#E0E4EC",
      flexDirection: "row",
      alignItems: "flex-start",
    },

    reviewApproved: {
      backgroundColor: "#F1FBFA",
      borderColor: "#C7E9E6",
    },

    reviewRevision: {
      backgroundColor: "#FFF9ED",
      borderColor: "#F3D9A2",
    },

    reviewRejected: {
      backgroundColor: "#FFF5F5",
      borderColor: "#F0CCCC",
    },

    reviewIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: "#EEF0FF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 11,
    },

    reviewContent: {
      flex: 1,
    },

    reviewStatusTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 5,
    },

    reviewStatusMessage: {
      fontSize: 12,
      color: "#6B7280",
      lineHeight: 18,
    },

    // ==================================================
    // SECTION
    // ==================================================

    section: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 17,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: "#E0E4EC",
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
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

    mintIcon: {
      backgroundColor: "#D5F5F2",
    },

    feedbackIcon: {
      backgroundColor: "#D5F5F2",
    },

    sectionTitle: {
      flex: 1,
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
    // DESCRIPTION
    // ==================================================

    description: {
      fontSize: 14,
      lineHeight: 22,
      color: "#4B5563",
    },

    // ==================================================
    // INFORMATION
    // ==================================================

    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 3,
    },

    infoIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: "#D5F5F2",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    infoContent: {
      flex: 1,
    },

    label: {
      fontSize: 11,
      fontWeight: "600",
      color: "#9CA3AF",
      marginBottom: 3,
    },

    value: {
      fontSize: 14,
      color: "#1F2937",
      lineHeight: 20,
    },

    divider: {
      height: 1,
      backgroundColor: "#EDF0F4",
      marginVertical: 11,
    },

    // ==================================================
    // DEMONSTRATION
    // ==================================================

    demoItem: {
      marginBottom: 18,
    },

    demoLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 9,
    },

    demoLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
      marginLeft: 7,
    },

    liveDemoButton: {
      backgroundColor: "#D5F5F2",
      borderWidth: 1,
      borderColor: "#B7E5E1",
      borderRadius: 11,
      minHeight: 45,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    liveDemoButtonText: {
      color: "#238F89",
      fontSize: 13,
      fontWeight: "700",
      marginRight: 7,
    },

    videoButton: {
      backgroundColor: "#4338CA",
      borderRadius: 11,
      minHeight: 45,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    videoButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      marginLeft: 7,
    },

    screenshotScroll: {
      marginTop: 2,
    },

    screenshot: {
      width: 210,
      height: 135,
      borderRadius: 11,
      marginRight: 10,
      backgroundColor: "#E5E7EB",
    },

    imageNumber: {
      position: "absolute",
      left: 8,
      bottom: 8,
      width: 25,
      height: 25,
      borderRadius: 8,
      backgroundColor: "#4338CA",
      alignItems: "center",
      justifyContent: "center",
    },

    imageNumberText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },

    imageHint: {
      fontSize: 10,
      color: "#9CA3AF",
      marginTop: 7,
    },

    emptyDemo: {
      minHeight: 45,
      backgroundColor: "#F8F9FB",
      borderRadius: 11,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },

    notAvailable: {
      color: "#9CA3AF",
      fontSize: 12,
      marginLeft: 8,
    },

    // ==================================================
    // FILES
    // ==================================================

    fileName: {
      marginTop: 7,
      color: "#9CA3AF",
      fontSize: 10,
      lineHeight: 15,
    },

    // ==================================================
    // REPORT
    // ==================================================

    reportButton: {
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

    reportButtonText: {
      color: "#4338CA",
      fontSize: 13,
      fontWeight: "700",
      marginHorizontal: 8,
    },

    // ==================================================
    // GITHUB
    // ==================================================

    githubButton: {
      minHeight: 46,
      backgroundColor: "#1F2937",
      borderRadius: 11,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    githubButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      marginHorizontal: 8,
    },

    // ==================================================
    // GUIDE FEEDBACK
    // ==================================================

    feedbackBox: {
      backgroundColor: "#F1FBFA",
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: "#C7E9E6",
    },

    feedbackHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },

    feedbackLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#238F89",
      marginLeft: 6,
    },

    feedbackText: {
      color: "#4B5563",
      fontSize: 13,
      lineHeight: 20,
    },

    // ==================================================
    // GUIDE ATTACHMENTS
    // ==================================================

    guideAttachmentsSection: {
      marginTop: 18,
      paddingTop: 17,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },

    attachmentsHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },

    attachmentsTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#1F2937",
      marginLeft: 7,
    },

    attachmentsDescription: {
      fontSize: 11,
      color: "#6B7280",
      lineHeight: 17,
      marginBottom: 8,
    },

    attachmentCountRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },

    attachmentCount: {
      fontSize: 11,
      fontWeight: "600",
      color: "#4338CA",
      marginLeft: 4,
    },

    guideAttachmentScroll: {
      marginTop: 2,
    },

    guideAttachmentCard: {
      width: 190,
      marginRight: 11,
      backgroundColor: "#F8F9FB",
      borderRadius: 13,
      padding: 8,
      borderWidth: 1,
      borderColor: "#E0E4EC",
    },

    guideAttachmentImage: {
      width: 174,
      height: 170,
      borderRadius: 9,
      backgroundColor: "#E5E7EB",
    },

    guideAttachmentInfo: {
      paddingHorizontal: 2,
      paddingTop: 7,
    },

    guideAttachmentNumber: {
      fontSize: 11,
      fontWeight: "700",
      color: "#374151",
      textAlign: "center",
    },

    guideAttachmentName: {
      fontSize: 10,
      color: "#9CA3AF",
      textAlign: "center",
      marginTop: 3,
    },

    viewGuideAttachmentButton: {
      backgroundColor: "#EEF0FF",
      borderWidth: 1,
      borderColor: "#DCDFF5",
      borderRadius: 8,
      paddingVertical: 9,
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    viewGuideAttachmentText: {
      color: "#4338CA",
      fontSize: 11,
      fontWeight: "700",
      marginRight: 5,
    },

    // ==================================================
    // REVISION
    // ==================================================

    revisionSection: {
      backgroundColor: "#FFF9ED",
      borderWidth: 1,
      borderColor: "#F3D9A2",
      borderRadius: 18,
      padding: 17,
      marginBottom: 15,
    },

    revisionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 13,
    },

    revisionIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: "#FFF0D2",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    revisionHeaderText: {
      flex: 1,
    },

    revisionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#9A6700",
    },

    revisionSubtitle: {
      fontSize: 11,
      color: "#A17A27",
      marginTop: 3,
    },

    revisionMessage: {
      fontSize: 12,
      color: "#7C5A13",
      lineHeight: 18,
      marginBottom: 14,
    },

    reviseButton: {
      minHeight: 47,
      backgroundColor: "#D97706",
      borderRadius: 11,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    reviseButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      marginHorizontal: 8,
    },

    // ==================================================
    // BACK BUTTON
    // ==================================================

    backButton: {
      backgroundColor: "#4338CA",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 11,
      flexDirection: "row",
      alignItems: "center",
    },

    backButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 13,
      marginLeft: 7,
    },

    bottomSpace: {
      height: 15,
    },
  });