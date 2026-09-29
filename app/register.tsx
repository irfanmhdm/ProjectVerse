import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
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

  // =====================================================
  // FORM STATES
  // =====================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [studentClass, setStudentClass] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");

  // =====================================================
  // ROLE
  // =====================================================

  const [role, setRole] = useState<"student" | "guide">("student");

  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =====================================================
  // LOADING
  // =====================================================

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

    const cleanEmail = email.trim().toLowerCase();

    const cleanClass = studentClass.trim();

    const cleanRegisterNumber =
      registerNumber.trim().toUpperCase();

    const cleanEmployeeNumber =
      employeeNumber.trim().toUpperCase();

    // ===================================================
    // EMPTY VALIDATION
    // ===================================================

    if (
      cleanName === "" ||
      cleanEmail === "" ||
      password === "" ||
      confirmPassword === "" ||
      (role === "student" &&
        (cleanClass === "" ||
          cleanRegisterNumber === "")) ||
      (role === "guide" &&
        cleanEmployeeNumber === "")
    ) {
      Alert.alert(
        "Missing Information",
        role === "student"
          ? "Please fill in all student fields."
          : "Please fill in all guide fields."
      );

      return;
    }

    // ===================================================
    // NAME VALIDATION
    // ===================================================

    if (cleanName.length < 2) {
      Alert.alert(
        "Invalid Name",
        "Please enter your full name."
      );

      return;
    }

    // ===================================================
    // STUDENT REGISTER NUMBER VALIDATION
    // ===================================================

    if (role === "student") {

      const registerNumberRegex =
        /^FIT25MCA-\d{4}$/;

      if (
        !registerNumberRegex.test(
          cleanRegisterNumber
        )
      ) {
        Alert.alert(
          "Invalid Register Number",
          "Register number must follow the format FIT25MCA-0000."
        );

        return;
      }
    }

    // ===================================================
    // GUIDE EMPLOYEE NUMBER VALIDATION
    // ===================================================

    if (role === "guide") {

      const employeeNumberRegex =
        /^EMP\d{3}$/;

      if (
        !employeeNumberRegex.test(
          cleanEmployeeNumber
        )
      ) {
        Alert.alert(
          "Invalid Employee Number",
          "Employee number must follow the format EMP000."
        );

        return;
      }
    }

    // ===================================================
    // EMAIL VALIDATION
    // ===================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return;
    }

    // ===================================================
    // PASSWORD VALIDATION
    // ===================================================

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password must contain at least 6 characters."
      );

      return;
    }

    // ===================================================
    // CONFIRM PASSWORD
    // ===================================================

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    let createdAuthUser: any = null;

    try {

      // =================================================
      // STEP 1
      // CREATE FIREBASE AUTH ACCOUNT
      // =================================================

      console.log(
        "===================================="
      );

      console.log(
        "STEP 1: Creating Firebase Auth account..."
      );

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      createdAuthUser =
        userCredential.user;

      const uid =
        createdAuthUser.uid;

      console.log(
        "STEP 1 SUCCESS: Firebase Auth account created"
      );

      console.log(
        "USER UID:",
        uid
      );

      // =================================================
      // STEP 2
      // STUDENT REGISTER NUMBER CHECK
      // =================================================

      if (role === "student") {

        console.log(
          "STEP 2: Checking student register number..."
        );

        const registerQuery =
          query(
            collection(db, "users"),
            where(
              "registerNumber",
              "==",
              cleanRegisterNumber
            ),
            where(
              "role",
              "==",
              "student"
            )
          );

        const registerSnapshot =
          await getDocs(registerQuery);

        console.log(
          "STEP 2 SUCCESS: Register number checked"
        );

        // -------------------------------------------------
        // EXISTING STUDENT FOUND
        // -------------------------------------------------

        if (!registerSnapshot.empty) {

          const existingStudent =
            registerSnapshot.docs[0].data();

          const existingStatus =
            existingStudent.status;

          console.log(
            "Existing student status:",
            existingStatus
          );

          // -----------------------------------------------
          // APPROVED
          // -----------------------------------------------

          if (existingStatus === "approved") {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Register Number Already Registered",
              "This student register number is already registered and approved."
            );

            return;
          }

          // -----------------------------------------------
          // PENDING
          // -----------------------------------------------

          if (existingStatus === "pending") {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Registration Already Submitted",
              "This register number already has a pending registration. Please wait for administrator approval."
            );

            return;
          }

          // -----------------------------------------------
          // REJECTED
          // -----------------------------------------------

          if (existingStatus === "rejected") {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Register Number Already Used",
              "This register number has a previous rejected registration. Please contact the administrator."
            );

            return;
          }
        }

        console.log(
          "Register number is available."
        );
      }

      // =================================================
      // STEP 3
      // GUIDE CHECKS
      // =================================================

      if (role === "guide") {

        console.log(
          "STEP 2: Checking authorized guide..."
        );

        // -------------------------------------------------
        // CHECK AUTHORIZED GUIDE
        // -------------------------------------------------

        const guideRef =
          doc(
            db,
            "authorizedGuides",
            cleanEmployeeNumber
          );

        const guideSnapshot =
          await getDoc(guideRef);

        console.log(
          "STEP 2 SUCCESS: Authorized guide checked"
        );

        if (!guideSnapshot.exists()) {

          await deleteUser(
            createdAuthUser
          );

          Alert.alert(
            "Invalid Employee Number",
            "This employee number is not authorized for guide registration."
          );

          return;
        }

        const guideData =
          guideSnapshot.data();

        // -------------------------------------------------
        // CHECK ACTIVE
        // -------------------------------------------------

        if (guideData.active !== true) {

          await deleteUser(
            createdAuthUser
          );

          Alert.alert(
            "Guide Access Disabled",
            "This employee number is currently inactive. Please contact the administrator."
          );

          return;
        }

        console.log(
          "Authorized guide verified."
        );

        // -------------------------------------------------
        // CHECK EXISTING GUIDE
        // -------------------------------------------------

        console.log(
          "STEP 3: Checking existing guide..."
        );

        const employeeQuery =
          query(
            collection(db, "users"),
            where(
              "employeeNumber",
              "==",
              cleanEmployeeNumber
            ),
            where(
              "role",
              "==",
              "guide"
            )
          );

        const employeeSnapshot =
          await getDocs(employeeQuery);

        console.log(
          "STEP 3 SUCCESS: Existing guide checked"
        );

        if (!employeeSnapshot.empty) {

          const existingGuide =
            employeeSnapshot.docs[0].data();

          const existingStatus =
            existingGuide.status;

          console.log(
            "Existing guide status:",
            existingStatus
          );

          // -----------------------------------------------
          // APPROVED
          // -----------------------------------------------

          if (existingStatus === "approved") {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Employee Number Already Registered",
              "This employee number is already registered and approved."
            );

            return;
          }

          // -----------------------------------------------
          // PENDING
          // -----------------------------------------------

          if (existingStatus === "pending") {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Registration Already Submitted",
              "This employee number already has a pending registration. Please wait for administrator approval."
            );

            return;
          }

          // -----------------------------------------------
          // REJECTED
          // -----------------------------------------------

          if (existingStatus === "rejected") {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Registration Rejected",
              "A previous registration using this employee number was rejected. Please contact the administrator."
            );

            return;
          }
        }
      }

      // =================================================
      // STEP 4
      // CREATE FIRESTORE USER DATA
      // =================================================

      console.log(
        "STEP 4: Preparing Firestore profile..."
      );

      /*
       * IMPORTANT
       *
       * ProjectVerse now uses ONLY:
       *
       * status: pending
       *
       * There is NO approvalStatus field.
       */

      const userData: any = {

        name: cleanName,

        email: cleanEmail,

        role: role,

        status: "pending",

        createdAt: new Date(),
      };

      // =================================================
      // STUDENT DATA
      // =================================================

      if (role === "student") {

        userData.class =
          cleanClass;

        userData.registerNumber =
          cleanRegisterNumber;
      }

      // =================================================
      // GUIDE DATA
      // =================================================

      if (role === "guide") {

        userData.employeeNumber =
          cleanEmployeeNumber;
      }

      console.log(
        "STEP 5: Creating Firestore profile..."
      );

      console.log(
        "Role:",
        userData.role
      );

      console.log(
        "Status:",
        userData.status
      );

      // =================================================
      // CREATE USER PROFILE
      // =================================================

      await setDoc(
        doc(db, "users", uid),
        userData
      );

      console.log(
        "STEP 5 SUCCESS: Firestore profile created"
      );

      // =================================================
      // STEP 6
      // SIGN OUT
      // =================================================

      console.log(
        "STEP 6: Signing out newly registered user..."
      );

      await signOut(auth);

      console.log(
        "STEP 6 SUCCESS: User signed out"
      );

      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        "Registration Submitted",
        role === "student"
          ? "Your student registration has been submitted successfully. Your account is now pending administrator approval. You can login after your account is approved."
          : "Your guide registration has been submitted successfully. Your account is now pending administrator approval. You can login after your account is approved.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.replace("/login");
            },
          },
        ]
      );

    } catch (error: any) {

      console.log(
        "===================================="
      );

      console.log(
        "REGISTRATION ERROR CODE:",
        error?.code
      );

      console.log(
        "REGISTRATION ERROR MESSAGE:",
        error?.message
      );

      console.log(
        "FULL ERROR:",
        error
      );

      console.log(
        "===================================="
      );

      // =================================================
      // ROLLBACK AUTH ACCOUNT
      // =================================================

      if (createdAuthUser) {

        try {

          await deleteUser(
            createdAuthUser
          );

          console.log(
            "Firebase Auth account rolled back."
          );

        } catch (deleteError) {

          console.log(
            "Could not rollback Auth account:",
            deleteError
          );
        }
      }

      // =================================================
      // FIREBASE AUTH ERRORS
      // =================================================

      if (
        error?.code ===
        "auth/email-already-in-use"
      ) {

        Alert.alert(
          "Email Already Registered",
          "This email address is already registered. Please use another email address or login with the existing account."
        );

      } else if (
        error?.code ===
        "auth/invalid-email"
      ) {

        Alert.alert(
          "Invalid Email",
          "Please enter a valid email address."
        );

      } else if (
        error?.code ===
        "auth/weak-password"
      ) {

        Alert.alert(
          "Weak Password",
          "Password must contain at least 6 characters."
        );

      } else if (
        error?.code ===
        "auth/network-request-failed"
      ) {

        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );

      } else if (
        error?.code ===
        "permission-denied" ||
        error?.message?.includes(
          "Missing or insufficient permissions"
        )
      ) {

        Alert.alert(
          "Permission Error",
          "Firebase blocked this registration. Please check the Firestore security rules."
        );

      } else {

        Alert.alert(
          "Registration Failed",
          error?.message ||
            "Something went wrong during registration."
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

      {/* BACK BUTTON */}

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

      {/* SCROLL */}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.content}>

          {/* BRAND */}

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

          {/* HEADING */}

          <View style={styles.headingSection}>

            <Text style={styles.title}>
              Create Account
            </Text>

            <Text style={styles.subtitle}>
              Join ProjectVerse and explore
              academic projects
            </Text>

          </View>

          {/* FORM CARD */}

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

            {/* ROLE */}

            <View style={styles.inputGroup}>

              <Text style={styles.inputLabel}>
                Register As
              </Text>

              <View style={styles.roleContainer}>

                {/* STUDENT */}

                <Pressable
                  style={[
                    styles.roleOption,
                    role === "student" &&
                      styles.roleOptionSelected,
                  ]}
                  onPress={() =>
                    setRole("student")
                  }
                  disabled={loading}
                >

                  <Ionicons
                    name="school-outline"
                    size={20}
                    color={
                      role === "student"
                        ? "#4338CA"
                        : "#6B7280"
                    }
                  />

                  <Text
                    style={[
                      styles.roleText,
                      role === "student" &&
                        styles.roleTextSelected,
                    ]}
                  >
                    Student
                  </Text>

                  {role === "student" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color="#4338CA"
                    />
                  )}

                </Pressable>

                {/* GUIDE */}

                <Pressable
                  style={[
                    styles.roleOption,
                    role === "guide" &&
                      styles.roleOptionSelected,
                  ]}
                  onPress={() =>
                    setRole("guide")
                  }
                  disabled={loading}
                >

                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      role === "guide"
                        ? "#4338CA"
                        : "#6B7280"
                    }
                  />

                  <Text
                    style={[
                      styles.roleText,
                      role === "guide" &&
                        styles.roleTextSelected,
                    ]}
                  >
                    Guide
                  </Text>

                  {role === "guide" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color="#4338CA"
                    />
                  )}

                </Pressable>

              </View>

            </View>

            {/* STUDENT REGISTER NUMBER */}

            {role === "student" && (
              <View style={styles.inputGroup}>

                <Text style={styles.inputLabel}>
                  Register Number
                </Text>

                <View style={styles.inputContainer}>

                  <Ionicons
                    name="card-outline"
                    size={19}
                    color="#6B7280"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="FIT25MCA-2041"
                    placeholderTextColor="#9CA3AF"
                    value={registerNumber}
                    onChangeText={(text) =>
                      setRegisterNumber(
                        text.toUpperCase()
                      )
                    }
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!loading}
                  />

                </View>

              </View>
            )}

            {/* GUIDE EMPLOYEE NUMBER */}

            {role === "guide" && (
              <View style={styles.inputGroup}>

                <Text style={styles.inputLabel}>
                  Employee Number
                </Text>

                <View style={styles.inputContainer}>

                  <Ionicons
                    name="id-card-outline"
                    size={19}
                    color="#6B7280"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="EMP001"
                    placeholderTextColor="#9CA3AF"
                    value={employeeNumber}
                    onChangeText={(text) =>
                      setEmployeeNumber(
                        text.toUpperCase()
                      )
                    }
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!loading}
                  />

                </View>

              </View>
            )}

            {/* CLASS */}

            {role === "student" && (
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
            )}

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
                    setShowPassword(
                      !showPassword
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
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <Pressable
                  style={styles.passwordToggle}
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
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

          {/* LOGIN */}

          <View style={styles.loginSection}>

            <Text style={styles.loginPrompt}>
              Already have an account?
            </Text>

            <Pressable
              onPress={() =>
                router.replace("/login")
              }
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

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

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

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  content: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 85,
    paddingBottom: 30,
  },

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

  roleContainer: {
    flexDirection: "row",
    gap: 10,
  },

  roleOption: {
    flex: 1,

    minHeight: 50,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F8F9FB",

    borderWidth: 1,
    borderColor: "#DDE2EA",

    borderRadius: 12,

    paddingHorizontal: 12,
  },

  roleOptionSelected: {
    backgroundColor: "#F0F1FF",
    borderColor: "#4338CA",
  },

  roleText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 13,
    fontWeight: "600",

    color: "#6B7280",
  },

  roleTextSelected: {
    color: "#4338CA",
  },

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