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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [studentClass, setStudentClass] = useState("");
  const [college, setCollege] = useState("");
  const [qualification, setQualification] = useState("");

  const [registerNumber, setRegisterNumber] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");


  // =====================================================
  // DROPDOWN STATES
  // =====================================================

  const [showClassDropdown, setShowClassDropdown] =
    useState(false);

  const [showCollegeDropdown, setShowCollegeDropdown] =
    useState(false);

  const [showQualificationDropdown, setShowQualificationDropdown] =
    useState(false);


  // =====================================================
  // ROLE
  // =====================================================

  const [role, setRole] =
    useState<"student" | "guide">("student");


  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] =
    useState(false);


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

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanPhone =
      phone.trim();

    const cleanClass =
      studentClass.trim();

    const cleanCollege =
      college.trim();

    const cleanQualification =
      qualification.trim();

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
      cleanPhone === "" ||
      password === "" ||
      confirmPassword === "" ||
      cleanClass === "" ||
      cleanCollege === "" ||
      (
        role === "guide" &&
        cleanQualification === ""
      ) ||
      (
        role === "student" &&
        cleanRegisterNumber === ""
      ) ||
      (
        role === "guide" &&
        cleanEmployeeNumber === ""
      )
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

    if (
      cleanName.length < 2
    ) {

      Alert.alert(
        "Invalid Name",
        "Please enter your full name."
      );

      return;
    }


    // ===================================================
    // PHONE VALIDATION
    // ===================================================

    const phoneRegex =
      /^[6-9]\d{9}$/;

    if (
      !phoneRegex.test(
        cleanPhone
      )
    ) {

      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian phone number."
      );

      return;
    }


    // ===================================================
    // CLASS VALIDATION
    // ===================================================

    if (
      cleanClass !== "MCA"
    ) {

      Alert.alert(
        "Invalid Program",
        
      );

      return;
    }


    // ===================================================
    // COLLEGE VALIDATION
    // ===================================================

    if (
      cleanCollege !== "FISAT"
    ) {

      Alert.alert(
        "Invalid College",
        "Please select FISAT."
      );

      return;
    }


    // ===================================================
    // GUIDE QUALIFICATION VALIDATION
    // ===================================================

    if (
      role === "guide" &&
      cleanQualification !== "MCA" &&
      cleanQualification !== "PhD"
    ) {

      Alert.alert(
        "Invalid Qualification",
        "Please select a valid qualification."
      );

      return;
    }


    // ===================================================
    // STUDENT REGISTER NUMBER
    // ===================================================

    if (
      role === "student"
    ) {

      const registerNumberRegex =
        /^FIT25MCA-\d{4}$/;

      if (
        !registerNumberRegex.test(
          cleanRegisterNumber
        )
      ) {

        Alert.alert(
          "Invalid Register Number",
          
        );

        return;
      }
    }


    // ===================================================
    // GUIDE EMPLOYEE NUMBER
    // ===================================================

    if (
      role === "guide"
    ) {

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
    // EMAIL
    // ===================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        cleanEmail
      )
    ) {

      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return;
    }


    // ===================================================
    // PASSWORD
    // ===================================================

    if (
      password.length < 6
    ) {

      Alert.alert(
        "Weak Password",
        "Password must contain at least 6 characters."
      );

      return;
    }


    // ===================================================
    // CONFIRM PASSWORD
    // ===================================================

    if (
      password !== confirmPassword
    ) {

      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );

      return;
    }


    // ===================================================
    // START LOADING
    // =====================================================

    setLoading(true);


    // =====================================================
    // AUTH USER REFERENCE
    // =====================================================

    let createdAuthUser: any = null;

    let createdUid: string | null = null;


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

      console.log(
        "DEBUG: Email:",
        cleanEmail
      );

      console.log(
        "DEBUG: Role:",
        role
      );


      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );


      createdAuthUser =
        userCredential.user;

      createdUid =
        createdAuthUser.uid;


      console.log(
        "STEP 1 SUCCESS: Firebase Auth account created"
      );

      console.log(
        "USER UID:",
        createdUid
      );


      // =================================================
      // STEP 2
      // STUDENT REGISTER NUMBER CHECK
      // =================================================

      if (
        role === "student"
      ) {

        console.log(
          "===================================="
        );

        console.log(
          "STEP 2: Checking student register number..."
        );

        console.log(
          "DEBUG: Register Number:",
          cleanRegisterNumber
        );


        const registerQuery =
          query(
            collection(
              db,
              "users"
            ),

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
          await getDocs(
            registerQuery
          );


        console.log(
          "STEP 2 SUCCESS: Register number checked"
        );

        console.log(
          "Documents found:",
          registerSnapshot.size
        );


        if (
          !registerSnapshot.empty
        ) {

          const existingStudent =
            registerSnapshot.docs[0].data();


          const existingStatus =
            existingStudent.status;


          console.log(
            "Existing student status:",
            existingStatus
          );


          if (
            existingStatus === "approved"
          ) {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Register Number Already Registered",
              "This student register number is already registered and approved."
            );

            return;
          }


          if (
            existingStatus === "pending"
          ) {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Registration Already Submitted",
              "This register number already has a pending registration. Please wait for administrator approval."
            );

            return;
          }


          if (
            existingStatus === "rejected"
          ) {

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
      // STEP 2
      // GUIDE AUTHORIZATION
      // =================================================

      if (
        role === "guide"
      ) {

        console.log(
          "===================================="
        );

        console.log(
          "STEP 2: Checking authorized guide..."
        );

        console.log(
          "DEBUG: Employee Number:",
          cleanEmployeeNumber
        );


        const guideRef =
          doc(
            db,
            "authorizedGuides",
            cleanEmployeeNumber
          );


        console.log(
          "DEBUG: Creating authorized guide reference..."
        );


        const guideSnapshot =
          await getDoc(
            guideRef
          );


        console.log(
          "DEBUG: getDoc(guideRef) completed successfully."
        );

        console.log(
          "DEBUG: Authorized guide exists:",
          guideSnapshot.exists()
        );


        if (
          !guideSnapshot.exists()
        ) {

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


        console.log(
          "DEBUG: Authorized guide data:",
          guideData
        );


        if (
          guideData.active !== true
        ) {

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


        // =================================================
        // STEP 3
        // CHECK EXISTING GUIDE
        // =================================================

        console.log(
          "===================================="
        );

        console.log(
          "STEP 3: Checking existing guide..."
        );


        console.log(
          "DEBUG: Auth UID from created user:",
          createdUid
        );

        console.log(
          "DEBUG: Employee Number:",
          cleanEmployeeNumber
        );

        console.log(
          "DEBUG: Role:",
          "guide"
        );


        const employeeQuery =
          query(
            collection(
              db,
              "users"
            ),

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


        console.log(
          "DEBUG: Users query created successfully."
        );

        console.log(
          "DEBUG: About to execute getDocs(employeeQuery)..."
        );


        let employeeSnapshot;


        try {

          employeeSnapshot =
            await getDocs(
              employeeQuery
            );


          console.log(
            "DEBUG: getDocs() completed successfully."
          );

          console.log(
            "DEBUG: Documents found:",
            employeeSnapshot.size
          );

        } catch (queryError: any) {

          console.log(
            "===================================="
          );

          console.log(
            "STEP 3 QUERY FAILED"
          );

          console.log(
            "QUERY ERROR CODE:",
            queryError?.code
          );

          console.log(
            "QUERY ERROR MESSAGE:",
            queryError?.message
          );

          console.log(
            "QUERY ERROR FULL:",
            queryError
          );

          console.log(
            "DEBUG CREATED UID:",
            createdUid
          );

          console.log(
            "DEBUG EMPLOYEE NUMBER:",
            cleanEmployeeNumber
          );

          console.log(
            "===================================="
          );

          throw queryError;
        }


        console.log(
          "STEP 3 SUCCESS: Existing guide checked"
        );


        if (
          !employeeSnapshot.empty
        ) {

          const existingGuide =
            employeeSnapshot.docs[0].data();


          console.log(
            "DEBUG: Existing guide data:",
            existingGuide
          );


          const existingStatus =
            existingGuide.status;


          console.log(
            "Existing guide status:",
            existingStatus
          );


          if (
            existingStatus === "approved"
          ) {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Employee Number Already Registered",
              "This employee number is already registered and approved."
            );

            return;
          }


          if (
            existingStatus === "pending"
          ) {

            await deleteUser(
              createdAuthUser
            );

            Alert.alert(
              "Registration Already Submitted",
              "This employee number already has a pending registration. Please wait for administrator approval."
            );

            return;
          }


          if (
            existingStatus === "rejected"
          ) {

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


        console.log(
          "No existing guide found."
        );
      }


      // =================================================
      // STEP 4
      // CREATE FIRESTORE USER PROFILE
      // =================================================

      console.log(
        "===================================="
      );

      console.log(
        "STEP 4: Preparing Firestore profile..."
      );


      const userData: any = {

        name:
          cleanName,

        email:
          cleanEmail,

        phone:
          cleanPhone,

        role:
          role,

        status:
          "pending",

        class:
          cleanClass,

        college:
          cleanCollege,

        createdAt:
          new Date(),
      };


      // =================================================
      // STUDENT DATA
      // =================================================

      if (
        role === "student"
      ) {

        userData.registerNumber =
          cleanRegisterNumber;
      }


      // =================================================
      // GUIDE DATA
      // =================================================

      if (
        role === "guide"
      ) {

        userData.employeeNumber =
          cleanEmployeeNumber;

        userData.qualification =
          cleanQualification;
      }


      console.log(
        "STEP 4 USER DATA:",
        userData
      );


      // =================================================
      // CREATE USERS/{UID}
      // =================================================

      await setDoc(
        doc(
          db,
          "users",
          createdUid!
        ),
        userData
      );


      console.log(
        "STEP 4 SUCCESS: Firestore profile created"
      );


      // =================================================
      // STEP 5
      // SIGN OUT
      // =================================================

      console.log(
        "===================================="
      );

      console.log(
        "STEP 5: Signing out newly registered user..."
      );


      await signOut(
        auth
      );


      console.log(
        "STEP 5 SUCCESS: User signed out"
      );


      // =================================================
      // SUCCESS
      // =================================================

      Alert.alert(
        "Registration Submitted",

        role === "student"
          ? "Your student registration has been submitted successfully. Your account is now pending administrator approval. You can login after your account is approved."
          : "Your guide registration has been submitted successfully. Your guide account is now pending administrator approval. You can login after your account is approved.",

        [
          {
            text: "Continue",

            onPress: () => {

              router.replace(
                "/login"
              );

            },
          },
        ]
      );


    } catch (error: any) {

      console.log(
        "===================================="
      );

      console.log(
        "REGISTRATION ERROR"
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
      // AUTH ROLLBACK
      // =================================================

      if (
        createdAuthUser
      ) {

        try {

          console.log(
            "DEBUG: Attempting Auth rollback..."
          );


          if (
            auth.currentUser?.uid ===
            createdAuthUser.uid
          ) {

            await deleteUser(
              createdAuthUser
            );

            console.log(
              "Firebase Auth account rolled back."
            );

          } else {

            console.log(
              "Auth user is no longer current. Rollback not required."
            );
          }

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
          "Firebase blocked this operation. Please check the Firestore security rules."
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
  // DROPDOWN COMPONENT
  // =====================================================

  const Dropdown = ({
    value,
    placeholder,
    icon,
    options,
    visible,
    onOpen,
    onSelect,
  }: {
    value: string;
    placeholder: string;
    icon: any;
    options: string[];
    visible: boolean;
    onOpen: () => void;
    onSelect: (value: string) => void;
  }) => {

    return (
      <View>

        <Pressable
          style={styles.inputContainer}
          onPress={onOpen}
          disabled={loading}
        >

          <Ionicons
            name={icon}
            size={19}
            color="#6B7280"
            style={styles.inputIcon}
          />

          <Text
            style={[
              styles.dropdownText,
              !value && styles.dropdownPlaceholder,
            ]}
          >
            {value || placeholder}
          </Text>

          <Ionicons
            name={
              visible
                ? "chevron-up-outline"
                : "chevron-down-outline"
            }
            size={19}
            color="#6B7280"
          />

        </Pressable>


        {visible && (

          <View style={styles.dropdownMenu}>

            {options.map((option) => (

              <Pressable
                key={option}
                style={styles.dropdownOption}
                onPress={() =>
                  onSelect(option)
                }
              >

                <Text
                  style={[
                    styles.dropdownOptionText,
                    value === option &&
                      styles.dropdownOptionSelected,
                  ]}
                >
                  {option}
                </Text>

                {value === option && (

                  <Ionicons
                    name="checkmark"
                    size={18}
                    color="#4338CA"
                  />

                )}

              </Pressable>

            ))}

          </View>

        )}

      </View>
    );
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
        contentContainerStyle={
          styles.scrollContent
        }
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
                    placeholder="Enter Student Register Number"
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
                    placeholder="Enter Guide Register Number"
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


            {/* PHONE NUMBER */}

            <View style={styles.inputGroup}>

              <Text style={styles.inputLabel}>
                Phone Number
              </Text>

              <View style={styles.inputContainer}>

                <Ionicons
                  name="call-outline"
                  size={19}
                  color="#6B7280"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!loading}
                />

              </View>

            </View>


            {/* CLASS */}

            <View style={styles.inputGroup}>

              <Text style={styles.inputLabel}>
                Program
              </Text>

              <Dropdown
                value={studentClass}
                placeholder="Select Program"
                icon="school-outline"
                options={["MCA"]}
                visible={showClassDropdown}
                onOpen={() => {

                  setShowClassDropdown(
                    !showClassDropdown
                  );

                  setShowCollegeDropdown(false);
                  setShowQualificationDropdown(false);

                }}
                onSelect={(value) => {

                  setStudentClass(value);
                  setShowClassDropdown(false);

                }}
              />

            </View>


            {/* COLLEGE */}

            <View style={styles.inputGroup}>

              <Text style={styles.inputLabel}>
                College
              </Text>

              <Dropdown
                value={college}
                placeholder="Select college"
                icon="business-outline"
                options={["FISAT"]}
                visible={showCollegeDropdown}
                onOpen={() => {

                  setShowCollegeDropdown(
                    !showCollegeDropdown
                  );

                  setShowClassDropdown(false);
                  setShowQualificationDropdown(false);

                }}
                onSelect={(value) => {

                  setCollege(value);
                  setShowCollegeDropdown(false);

                }}
              />

            </View>


            {/* GUIDE QUALIFICATION */}

            {role === "guide" && (

              <View style={styles.inputGroup}>

                <Text style={styles.inputLabel}>
                  Qualification
                </Text>

                <Dropdown
                  value={qualification}
                  placeholder="Select qualification"
                  icon="ribbon-outline"
                  options={[
                    "MCA",
                    "PhD",
                  ]}
                  visible={
                    showQualificationDropdown
                  }
                  onOpen={() => {

                    setShowQualificationDropdown(
                      !showQualificationDropdown
                    );

                    setShowClassDropdown(false);
                    setShowCollegeDropdown(false);

                  }}
                  onSelect={(value) => {

                    setQualification(value);
                    setShowQualificationDropdown(false);

                  }}
                />

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


// =====================================================
// STYLES
// =====================================================

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

  dropdownText: {
    flex: 1,

    fontSize: 14,

    color: "#1F2937",

    fontWeight: "500",
  },

  dropdownPlaceholder: {
    color: "#9CA3AF",

    fontWeight: "400",
  },

  dropdownMenu: {
    marginTop: 6,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#DDE2EA",

    borderRadius: 12,

    overflow: "hidden",

    elevation: 4,

    shadowColor: "#1F2937",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,

    shadowRadius: 7,
  },

  dropdownOption: {
    minHeight: 48,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 15,

    borderBottomWidth: 1,

    borderBottomColor: "#F0F1F4",
  },

  dropdownOptionText: {
    fontSize: 14,

    color: "#374151",

    fontWeight: "500",
  },

  dropdownOptionSelected: {
    color: "#4338CA",

    fontWeight: "700",
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