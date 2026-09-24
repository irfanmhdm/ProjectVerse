import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { auth, db } from "../firebase/firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    const cleanEmail = email.trim();

    // ===================================================
    // VALIDATION
    // ===================================================

    if (cleanEmail === "" || password === "") {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password.",
      );

      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address.",
      );

      return;
    }

    setLoading(true);

    try {
      // =================================================
      // 1. FIREBASE AUTHENTICATION
      // =================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );

      // =================================================
      // 2. GET UID
      // =================================================

      const uid =
        userCredential.user.uid;

      console.log(
        "Logged in UID:",
        uid,
      );

      // =================================================
      // 3. GET USER PROFILE
      // =================================================

      const userDoc = await getDoc(
        doc(db, "users", uid),
      );

      // =================================================
      // 4. CHECK PROFILE
      // =================================================

      if (!userDoc.exists()) {
        Alert.alert(
          "Profile Error",
          "Your user profile could not be found.",
        );

        await auth.signOut();

        return;
      }

      // =================================================
      // 5. USER DATA
      // =================================================

      const userData = userDoc.data();

      const role = userData.role;
      const approvalStatus =
        userData.approvalStatus;

      console.log(
        "User role:",
        role,
      );

      console.log(
        "Approval status:",
        approvalStatus,
      );

      // =================================================
      // 6. STUDENT LOGIN
      // =================================================

      if (role === "student") {
        console.log(
          "Student login successful",
        );

        router.replace("/student");

        return;
      }

      // =================================================
      // 7. GUIDE LOGIN
      // =================================================

      if (role === "guide") {
        // -----------------------------------------------
        // GUIDE APPROVED
        // -----------------------------------------------

        if (
          approvalStatus === "approved"
        ) {
          console.log(
            "Guide approved - login successful",
          );

          router.replace("/guide");

          return;
        }

        // -----------------------------------------------
        // GUIDE PENDING
        // -----------------------------------------------

        if (
          approvalStatus === "pending"
        ) {
          console.log(
            "Guide approval pending",
          );

          await auth.signOut();

          Alert.alert(
            "Approval Pending",
            "Your guide account is waiting for admin approval. You can login after your account has been approved.",
          );

          return;
        }

        // -----------------------------------------------
        // GUIDE REJECTED
        // -----------------------------------------------

        if (
          approvalStatus === "rejected"
        ) {
          console.log(
            "Guide registration rejected",
          );

          await auth.signOut();

          Alert.alert(
            "Registration Rejected",
            "Your guide registration was rejected by the administrator.",
          );

          return;
        }

        // -----------------------------------------------
        // UNKNOWN GUIDE STATUS
        // -----------------------------------------------

        await auth.signOut();

        Alert.alert(
          "Account Not Approved",
          "Your guide account has not been approved yet. Please contact the administrator.",
        );

        return;
      }

      // =================================================
      // 8. ADMIN LOGIN
      // =================================================

      if (role === "admin") {
        console.log(
          "Admin login successful",
        );

        router.replace("/admin");

        return;
      }

      // =================================================
      // 9. INVALID ROLE
      // =================================================

      console.log(
        "Unknown role:",
        role,
      );

      Alert.alert(
        "Invalid Account",
        "Your account does not have a valid role.",
      );

      await auth.signOut();

    } catch (error: any) {
      console.log(
        "Login error:",
        error,
      );

      // =================================================
      // FIREBASE ERROR HANDLING
      // =================================================

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        Alert.alert(
          "Login Failed",
          "The email or password is incorrect.",
        );

      } else if (
        error?.code ===
        "auth/user-not-found"
      ) {
        Alert.alert(
          "Login Failed",
          "No account was found with this email.",
        );

      } else if (
        error?.code ===
        "auth/wrong-password"
      ) {
        Alert.alert(
          "Login Failed",
          "The password is incorrect.",
        );

      } else if (
        error?.code ===
        "auth/too-many-requests"
      ) {
        Alert.alert(
          "Too Many Attempts",
          "Too many login attempts. Please try again later.",
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
          "Login Failed",
          "Something went wrong while logging in. Please try again.",
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
          CONTENT
      ================================================= */}

      <View style={styles.content}>

        {/* =================================================
            BRAND
        ================================================= */}

        <View style={styles.brandSection}>

          <Image
            source={require(
              "../assets/images/logo.png"
            )}
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
            Welcome Back
          </Text>

          <Text style={styles.subtitle}>
            Login to continue exploring projects
          </Text>

        </View>

        {/* =================================================
            FORM CARD
        ================================================= */}

        <View style={styles.formCard}>

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
                placeholder="Enter your password"
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
                  setShowPassword(
                    !showPassword,
                  )
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

          {/* LOGIN BUTTON */}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,

              pressed &&
                !loading &&
                styles.buttonPressed,

              loading &&
                styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >

            {loading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text style={styles.buttonText}>
                  Logging in...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.buttonText}>
                  Login
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
            REGISTER
        ================================================= */}

        <View style={styles.registerSection}>

          <Text style={styles.registerPrompt}>
            Don't have an account?
          </Text>

          <Pressable
            onPress={() =>
              router.push("/register")
            }
            disabled={loading}
          >
            <Text style={styles.registerLink}>
              Create an Account
            </Text>
          </Pressable>

        </View>

      </View>

    </View>
  );
}


// ========================================================
// STYLES
// ========================================================

const styles = StyleSheet.create({

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
  // CONTENT
  // ======================================================

  content: {
    flex: 1,
    justifyContent: "center",

    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 25,
  },

  // ======================================================
  // BRAND
  // ======================================================

  brandSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  logo: {
    width: 72,
    height: 72,
    marginBottom: 9,
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
  // INPUT
  // ======================================================

  inputGroup: {
    marginBottom: 15,
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
  // LOGIN BUTTON
  // ======================================================

  loginButton: {
    minHeight: 52,
    width: "100%",

    backgroundColor: "#4338CA",

    borderRadius: 13,

    paddingHorizontal: 15,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 4,

    shadowColor: "#4338CA",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.16,
    shadowRadius: 7,

    elevation: 3,
  },

  loginButtonDisabled: {
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
  // REGISTER
  // ======================================================

  registerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: 19,
  },

  registerPrompt: {
    color: "#6B7280",
    fontSize: 12,
  },

  registerLink: {
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },
});