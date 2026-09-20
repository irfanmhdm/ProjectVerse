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

import { auth, db } from "../../../firebase/firebaseConfig";
import { supabase } from "../../../supabase/supabaseConfig";

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
        });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      const isPdf =
        selectedFile.mimeType ===
          "application/pdf" ||
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

      const maxSize = 10 * 1024 * 1024;

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
  // SELECT DEMO VIDEO
  // =========================================================

  const pickDemoVideo = async () => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          type: "video/*",
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

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

      setDemoVideo(selectedFile);

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

      const newImages =
        result.assets.slice(0, 8);

      if (result.assets.length > 8) {
        Alert.alert(
          "Maximum Screenshots",
          "You can upload a maximum of 8 screenshots."
        );
      }

      setScreenshots(newImages);

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
    contentType: string
  ) => {
    const response = await fetch(uri);

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
          }
        );

    if (error) {
      throw error;
    }

    const { data } =
      supabase.storage
        .from("project-demos")
        .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // =========================================================
  // SUBMIT PROJECT
  // =========================================================

  const handleSubmit = async () => {
    if (
      title.trim() === "" ||
      description.trim() === "" ||
      domain.trim() === "" ||
      technologies.trim() === "" ||
      githubUrl.trim() === ""
    ) {
      Alert.alert(
        "Error",
        "Please fill in all required fields."
      );
      return;
    }

    // -------------------------------------------------------
    // REPORT REQUIRED
    // -------------------------------------------------------

    if (!report) {
      Alert.alert(
        "Error",
        "Please select your project report PDF."
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
        "Please provide at least one demonstration:\n\n• Live Demo Link\n• Demo Video\n• Screenshots"
      );
      return;
    }

    // -------------------------------------------------------
    // GITHUB VALIDATION
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // LIVE DEMO URL VALIDATION
    // -------------------------------------------------------

    if (hasLiveDemo) {
      try {
        const url =
          new URL(
            liveDemoUrl.trim()
          );

        if (
          url.protocol !==
            "http:" &&
          url.protocol !==
            "https:"
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

    // -------------------------------------------------------
    // CURRENT USER
    // -------------------------------------------------------

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
      // 1. CREATE PROJECT
      // =====================================================

      console.log(
        "Creating project..."
      );

      const projectRef =
        await addDoc(
          collection(
            db,
            "projects"
          ),
          {
            title: title.trim(),
            description:
              description.trim(),
            domain: domain.trim(),
            technologies:
              technologies.trim(),

            githubUrl:
              githubUrl.trim(),

            reportUrl: "",
            reportName: "",
            reportPath: "",

            liveDemoUrl:
              hasLiveDemo
                ? liveDemoUrl.trim()
                : "",

            videoUrl: "",
            videoName: "",

            screenshotUrls: [],

            studentId: user.uid,

            status: "pending",

            createdAt:
              serverTimestamp(),
          }
        );

      const projectId =
        projectRef.id;

      console.log(
        "Project created:",
        projectId
      );

      // =====================================================
      // 2. UPLOAD REPORT
      // =====================================================

      console.log(
        "Uploading report..."
      );

      const reportResponse =
        await fetch(report.uri);

      if (!reportResponse.ok) {
        throw new Error(
          "Could not read the selected PDF."
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
        `${user.uid}/${Date.now()}_${safeReportName}`;

      const {
        error:
          reportUploadError,
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
            }
          );

      if (
        reportUploadError
      ) {
        throw reportUploadError;
      }

      const {
        data:
          reportPublicData,
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

      // =====================================================
      // 3. UPLOAD VIDEO
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
              "video/mp4"
          );

        console.log(
          "Video uploaded:",
          videoUrl
        );
      }

      // =====================================================
      // 4. UPLOAD SCREENSHOTS
      // =====================================================

      const screenshotUrls: string[] =
        [];

      if (
        screenshots.length >
        0
      ) {
        console.log(
          "Uploading screenshots..."
        );

        for (
          let i = 0;
          i <
          screenshots.length;
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
                "image/jpeg"
            );

          screenshotUrls.push(
            imageUrl
          );
        }
      }

      // =====================================================
      // 5. UPDATE PROJECT
      // =====================================================

      await updateDoc(
        doc(
          db,
          "projects",
          projectId
        ),
        {
          reportUrl,
          reportName:
            report.name,
          reportPath,

          videoUrl,
          videoName:
            demoVideo?.name ||
            "",

          screenshotUrls,
        }
      );

      console.log(
        "Project submitted successfully."
      );

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
  // UI
  // =========================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* {/* =====================================================
          HEADER
      ====================================================== 

      <View style={styles.headerRow}>

        <View
          style={
            styles.headerTextContainer
          }
        >
          

          <Text
            style={styles.subtitle}
          >
            Submit your academic project
            for guide review
          </Text>
        </View>

      </View> */}

      {/* =====================================================
          PROJECT DETAILS CARD
      ====================================================== */}

      <View
        style={styles.sectionCard}
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

          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Project Details
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Basic information about your project
            </Text>
          </View>
        </View>

        {/* TITLE */}

        <Text style={styles.label}>
          Project Title
          <Text style={styles.required}>
            {" "}*
          </Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter project title"
          placeholderTextColor="#9CA3AF"
          value={title}
          onChangeText={setTitle}
        />

        {/* DESCRIPTION */}

        <Text style={styles.label}>
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
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={
            setDescription
          }
          multiline
          textAlignVertical="top"
        />

        {/* DOMAIN */}

        <Text style={styles.label}>
          Domain
          <Text style={styles.required}>
            {" "}*
          </Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Example: Artificial Intelligence"
          placeholderTextColor="#9CA3AF"
          value={domain}
          onChangeText={setDomain}
        />

        {/* TECHNOLOGIES */}

        <Text style={styles.label}>
          Technologies Used
          <Text style={styles.required}>
            {" "}*
          </Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Example: React Native, Firebase"
          placeholderTextColor="#9CA3AF"
          value={technologies}
          onChangeText={
            setTechnologies
          }
        />

        {/* GITHUB */}

        <Text style={styles.label}>
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
            size={18}
            color="#6B7280"
          />

          <TextInput
            style={
              styles.iconInput
            }
            placeholder="https://github.com/username/project"
            placeholderTextColor="#9CA3AF"
            value={githubUrl}
            onChangeText={
              setGithubUrl
            }
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
      </View>

      {/* =====================================================
          REPORT CARD
      ====================================================== */}

      <View
        style={styles.sectionCard}
      >
        <View
          style={
            styles.sectionHeader
          }
        >
          <View
            style={[
              styles.sectionIcon,
              styles.mintSectionIcon,
            ]}
          >
            <Ionicons
              name="document-attach-outline"
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
              Project Report
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Upload your project report
            </Text>
          </View>
        </View>

        <Text style={styles.label}>
          Project Report (PDF)
          <Text style={styles.required}>
            {" "}*
          </Text>
        </Text>

        <Pressable
          style={[
            styles.uploadButton,
            report &&
              styles.uploadButtonSelected,
          ]}
          onPress={
            pickReport
          }
          disabled={loading}
        >
          <Ionicons
            name={
              report
                ? "checkmark-circle-outline"
                : "cloud-upload-outline"
            }
            size={20}
            color={
              report
                ? "#238F89"
                : "#4338CA"
            }
          />

          <Text
            style={
              styles.uploadButtonText
            }
          >
            {report
              ? "Change Report"
              : "Select PDF Report"}
          </Text>
        </Pressable>

        {report && (
          <View
            style={
              styles.selectedFileBox
            }
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#238F89"
            />

            <View
              style={
                styles.selectedFileInfo
              }
            >
              <Text
                style={
                  styles.selectedFile
                }
                numberOfLines={1}
              >
                {report.name}
              </Text>

              {report.size && (
                <Text
                  style={
                    styles.fileSize
                  }
                >
                  {(
                    report.size /
                    (1024 * 1024)
                  ).toFixed(2)}{" "}
                  MB
                </Text>
              )}
            </View>

            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#238F89"
            />
          </View>
        )}
      </View>

      {/* =====================================================
          DEMONSTRATION CARD
      ====================================================== */}

      <View
        style={styles.sectionCard}
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
              name="eye-outline"
              size={19}
              color="#4338CA"
            />
          </View>

          <View
            style={
              styles.sectionHeaderFlex
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
                styles.requiredHint
              }
            >
              At least one option required
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.demoDescription
          }
        >
          Choose how you want to present
          your project to your guide.
          You can provide one or more
          options.
        </Text>

        {/* LIVE DEMO */}

        <Text style={styles.label}>
          Live Demo Link
        </Text>

        <View
          style={styles.inputWithIcon}
        >
          <Ionicons
            name="globe-outline"
            size={18}
            color="#6B7280"
          />

          <TextInput
            style={
              styles.iconInput
            }
            placeholder="https://your-project.com"
            placeholderTextColor="#9CA3AF"
            value={liveDemoUrl}
            onChangeText={
              setLiveDemoUrl
            }
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        {/* VIDEO */}

        <Text style={styles.label}>
          Demo Video
        </Text>

        <Pressable
          style={[
            styles.uploadButton,
            demoVideo &&
              styles.uploadButtonSelected,
          ]}
          onPress={
            pickDemoVideo
          }
          disabled={loading}
        >
          <Ionicons
            name={
              demoVideo
                ? "checkmark-circle-outline"
                : "videocam-outline"
            }
            size={20}
            color={
              demoVideo
                ? "#238F89"
                : "#4338CA"
            }
          />

          <Text
            style={
              styles.uploadButtonText
            }
          >
            {demoVideo
              ? "Change Demo Video"
              : "Select Demo Video"}
          </Text>
        </Pressable>

        {demoVideo && (
          <View
            style={
              styles.selectedFileBox
            }
          >
            <Ionicons
              name="videocam-outline"
              size={20}
              color="#238F89"
            />

            <Text
              style={
                styles.selectedFile
              }
              numberOfLines={1}
            >
              {demoVideo.name}
            </Text>

            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#238F89"
            />
          </View>
        )}

        {/* SCREENSHOTS */}

        <Text style={styles.label}>
          Screenshots
        </Text>

        <Pressable
          style={[
            styles.uploadButton,
            screenshots.length >
              0 &&
              styles.uploadButtonSelected,
          ]}
          onPress={
            pickScreenshots
          }
          disabled={loading}
        >
          <Ionicons
            name={
              screenshots.length >
              0
                ? "checkmark-circle-outline"
                : "images-outline"
            }
            size={20}
            color={
              screenshots.length >
              0
                ? "#238F89"
                : "#4338CA"
            }
          />

          <Text
            style={
              styles.uploadButtonText
            }
          >
            {screenshots.length >
            0
              ? "Change Screenshots"
              : "Select Screenshots"}
          </Text>
        </Pressable>

        {screenshots.length >
          0 && (
          <>
            <Text
              style={
                styles.screenshotCount
              }
            >
              {screenshots.length}{" "}
              screenshot
              {screenshots.length >
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
              style={
                styles.previewContainer
              }
            >
              {screenshots.map(
                (
                  image,
                  index
                ) => (
                  <Image
                    key={`${image.uri}-${index}`}
                    source={{
                      uri: image.uri,
                    }}
                    style={
                      styles.previewImage
                    }
                  />
                )
              )}
            </ScrollView>
          </>
        )}

        {/* INFO */}

        <View
          style={styles.infoBox}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#4338CA"
          />

          <Text
            style={styles.infoText}
          >
            At least one of Live Demo,
            Demo Video, or Screenshots
            is required.
          </Text>
        </View>
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
        onPress={
          handleSubmit
        }
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
              style={
                styles.buttonText
              }
            >
              Uploading...
            </Text>
          </View>
        ) : (
          <>
            <Ionicons
              name="paper-plane-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.buttonText
              }
            >
              Submit Project
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  // =====================================================
  // PAGE
  // =====================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  // // =====================================================
  // // HEADER
  // // =====================================================

  // headerRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 22,
  // },

  // headerIcon: {
  //   width: 48,
  //   height: 48,
  //   borderRadius: 14,
  //   backgroundColor: "#EEF0FF",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   marginRight: 12,
  // },

  // headerTextContainer: {
  //   flex: 1,
  // },

  // title: {
  //   fontSize: 26,
  //   fontWeight: "700",
  //   color: "#1F2937",
  // },

  // subtitle: {
  //   fontSize: 16,
  //   lineHeight: 18,
  //   color: "#070707",
  //   marginTop: 3,
  //   marginLeft: 20,
  // },

  // =====================================================
  // SECTION CARD
  // =====================================================

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E0E4EC",
    padding: 17,
    marginBottom: 15,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  sectionHeaderFlex: {
    flex: 1,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  mintSectionIcon: {
    backgroundColor: "#D5F5F2",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 3,
  },

  // =====================================================
  // LABELS
  // =====================================================

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  required: {
    color: "#C44747",
  },

  requiredHint: {
    fontSize: 10,
    fontWeight: "600",
    color: "#C27A16",
    marginTop: 3,
  },

  // =====================================================
  // INPUT
  // =====================================================

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE2EA",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 17,
  },

  textArea: {
    height: 110,
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
    marginBottom: 17,
  },

  iconInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    marginLeft: 9,
    paddingVertical: 0,
  },

  // =====================================================
  // UPLOAD
  // =====================================================

  uploadButton: {
    minHeight: 46,
    backgroundColor: "#EEF0FF",
    borderWidth: 1,
    borderColor: "#DCDFF5",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    marginBottom: 9,
  },

  uploadButtonSelected: {
    backgroundColor: "#D5F5F2",
    borderColor: "#B7E5E1",
  },

  uploadButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#661198",
    marginLeft: 7,
  },

  selectedFileBox: {
    minHeight: 48,
    backgroundColor: "#F8FAFA",
    borderWidth: 1,
    borderColor: "#DDE8E6",
    borderRadius: 11,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },

  selectedFileInfo: {
    flex: 1,
    marginLeft: 8,
  },

  selectedFile: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },

  fileSize: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // =====================================================
  // DEMONSTRATION
  // =====================================================

  demoDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: -7,
    marginBottom: 18,
  },

  screenshotCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#238F89",
    marginTop: 2,
    marginBottom: 9,
  },

  previewContainer: {
    marginBottom: 15,
  },

  previewImage: {
    width: 92,
    height: 92,
    borderRadius: 10,
    marginRight: 9,
    backgroundColor: "#E5E7EB",
  },

  infoBox: {
    backgroundColor: "#F5F6FF",
    borderWidth: 1,
    borderColor: "#E0E2F5",
    borderRadius: 11,
    padding: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
  },

  infoText: {
    flex: 1,
    color: "#4B5563",
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 8,
  },

  // =====================================================
  // SUBMIT
  // =====================================================

  submitButton: {
    minHeight: 50,
    backgroundColor: "#4338CA",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
    marginBottom: 15,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});