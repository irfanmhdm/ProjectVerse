import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  setDoc,
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

import { auth, db } from "../firebase/firebaseConfig";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentClass, setStudentClass] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async () => {
    if (loading) {
      return;
    }

    // ===================================================
    // CLEAN VALUES
    // ===================================================

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanClass = studentClass.trim();

    // ===================================================
    // EMPTY FIELD VALIDATION
    // ===================================================

    if (
      cleanName === "" ||
      cleanEmail === "" ||
      cleanClass === "" ||
      password === "" ||
      confirmPassword === ""
    ) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields.",
      );

      return;
    }

    // ===================================================
    // NAME VALIDATION
    // ===================================================

    if (cleanName.length < 2) {
      Alert.alert(
        "Invalid Name",
        "Please enter your full name.",
      );

      return;
    }

    // ===================================================
    // EMAIL VALIDATION
    // ===================================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address.",
      );

      return;
    }

    // ===================================================
    // PASSWORD VALIDATION
    // ===================================================

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must contain at least 6 characters.",
      );

      return;
    }

    // ===================================================
    // CONFIRM PASSWORD
    // ===================================================

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match.",
      );

      return;
    }

    setLoading(true);

    try {
      // =================================================
      // 1. CREATE FIREBASE ACCOUNT
      // =================================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );

      // =================================================
      // 2. GET USER UID
      // =================================================

      const uid = userCredential.user.uid;

      console.log("New user UID:", uid);

      // =================================================
      // 3. CREATE FIRESTORE USER PROFILE
      // =================================================

      await setDoc(
        doc(db, "users", uid),
        {
          name: cleanName,
          email: cleanEmail,
          class: cleanClass,
          role: "student",
        },
      );

      console.log(
        "Student profile created successfully.",
      );

      // =================================================
      // 4. SUCCESS
      // =================================================

      Alert.alert(
        "Registration Successful",
        "Your ProjectVerse account has been created.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.replace("/login");
            },
          },
        ],
      );
    } catch (error: any) {
      console.log("Registration error:", error);

      // =================================================
      // FIREBASE ERROR HANDLING
      // =================================================

      if (
        error?.code ===
        "auth/email-already-in-use"
      ) {
        Alert.alert(
          "Account Already Exists",
          "An account already exists with this email address.",
        );
      } else if (
        error?.code ===
        "auth/invalid-email"
      ) {
        Alert.alert(
          "Invalid Email",
          "Please enter a valid email address.",
        );
      } else if (
        error?.code ===
        "auth/weak-password"
      ) {
        Alert.alert(
          "Weak Password",
          "Please choose a stronger password.",
        );
      } else if (
        error?.code ===
        "auth/network-request-failed"
      ) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again.",
        );
      } else {
        Alert.alert(
          "Registration Failed",
          "Something went wrong while creating your account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>
      {/* =================================================
          BACK BUTTON
      ================================================= */}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color="#4338CA"
        />

        <Text style={styles.backText}>
          Back
        </Text>
      </Pressable>

      {/* =================================================
          SCROLLABLE CONTENT
      ================================================= */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* =================================================
              BRAND
          ================================================= */}

          <View style={styles.brandSection}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.appName}>
              ProjectVerse
            </Text>

            <Text style={styles.tagline}>
              Discover. Learn. Innovate.
            </Text>
          </View>

          {/* =================================================
              HEADING
          ================================================= */}

          <View style={styles.headingSection}>
            <Text style={styles.title}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Join ProjectVerse and explore academic projects
            </Text>
          </View>

          {/* =================================================
              FORM CARD
          ================================================= */}

          <View style={styles.formCard}>
            {/* FULL NAME */}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Full Name
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={19}
                  color="#6B7280"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* CLASS */}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Class
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="school-outline"
                  size={19}
                  color="#6B7280"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your class"
                  placeholderTextColor="#9CA3AF"
                  value={studentClass}
                  onChangeText={setStudentClass}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* EMAIL */}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Email Address
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#6B7280"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* PASSWORD */}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Password
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#6B7280"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <Pressable
                  style={styles.passwordToggle}
                  onPress={() =>
                    setShowPassword(!showPassword)
                  }
                  disabled={loading}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* CONFIRM PASSWORD */}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Confirm Password
              </Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#6B7280"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <Pressable
                  style={styles.passwordToggle}
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword,
                    )
                  }
                  disabled={loading}
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* REGISTER BUTTON */}

            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed &&
                  !loading &&
                  styles.buttonPressed,
                loading &&
                  styles.registerButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>
                    Creating Account...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>
                    Create Account
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>
          </View>

          {/* =================================================
              LOGIN LINK
          ================================================= */}

          <View style={styles.loginSection}>
            <Text style={styles.loginPrompt}>
              Already have an account?
            </Text>

            <Pressable
              onPress={() => router.replace("/login")}
              disabled={loading}
            >
              <Text style={styles.loginLink}>
                Login
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ========================================================
// STYLES
// ========================================================

const styles = StyleSheet.create({
  // ======================================================
  // CONTAINER
  // ======================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  // ======================================================
  // BACK BUTTON
  // ======================================================

  backButton: {
    position: "absolute",
    top: 55,
    left: 22,
    zIndex: 10,

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 7,
    paddingHorizontal: 4,
  },

  backText: {
    marginLeft: 6,
    color: "#4338CA",
    fontSize: 13,
    fontWeight: "600",
  },

  // ======================================================
  // SCROLL
  // ======================================================

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // ======================================================
  // CONTENT
  // ======================================================

  content: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 85,
    paddingBottom: 30,
  },

  // ======================================================
  // BRAND
  // ======================================================

  brandSection: {
    alignItems: "center",
    marginBottom: 18,
  },

  logo: {
    width: 68,
    height: 68,
    marginBottom: 8,
  },

  appName: {
    fontSize: 25,
    fontWeight: "800",
    color: "#4338CA",
    letterSpacing: -0.5,
  },

  tagline: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },

  // ======================================================
  // HEADING
  // ======================================================

  headingSection: {
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 15,
  },

  // ======================================================
  // FORM CARD
  // ======================================================

  formCard: {
    width: "100%",

    backgroundColor: "#FFFFFF",

    borderRadius: 20,

    padding: 19,

    borderWidth: 1,
    borderColor: "#E0E4EC",

    shadowColor: "#1F2937",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,

    elevation: 3,
  },

  // ======================================================
  // INPUT GROUP
  // ======================================================

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 50,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F8F9FB",

    borderWidth: 1,
    borderColor: "#DDE2EA",

    borderRadius: 12,

    paddingHorizontal: 12,
  },

  inputIcon: {
    marginRight: 9,
  },

  input: {
    flex: 1,

    minHeight: 48,

    color: "#1F2937",
    fontSize: 14,
  },

  passwordToggle: {
    padding: 5,
    marginLeft: 5,
  },

  // ======================================================
  // REGISTER BUTTON
  // ======================================================

  registerButton: {
    minHeight: 52,
    width: "100%",

    backgroundColor: "#4338CA",

    borderRadius: 13,

    paddingHorizontal: 15,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 3,

    shadowColor: "#4338CA",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 7,

    elevation: 3,
  },

  registerButtonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginHorizontal: 9,
  },

  buttonPressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  // ======================================================
  // LOGIN
  // ======================================================

  loginSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 19,
  },

  loginPrompt: {
    color: "#6B7280",
    fontSize: 12,
  },

  loginLink: {
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },
});