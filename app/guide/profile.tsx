import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
} from "firebase/firestore";

import {
  updateEmail,
  updatePassword,
} from "firebase/auth";

import { auth, db } from "../../firebase/firebaseConfig";


// =====================================================
// PROFILE
// =====================================================

export default function Profile() {

  // =================================
  // PROFILE DATA
  // =================================

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");


  // =================================
  // FIXED INFORMATION
  // =================================

  const [employeeNumber, setEmployeeNumber] =
    useState("");

  const [college, setCollege] =
    useState("");

  const [department, setDepartment] =
    useState("");

  const [qualification, setQualification] =
    useState("");


  // =================================
  // ORIGINAL VALUES
  // =================================

  const [originalName, setOriginalName] =
    useState("");

  const [originalEmail, setOriginalEmail] =
    useState("");

  const [originalPhone, setOriginalPhone] =
    useState("");


  // =================================
  // EDIT STATE
  // =================================

  const [isEditing, setIsEditing] =
    useState(false);


  // =================================
  // LOADING
  // =================================

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  // =================================
  // PASSWORD MODAL
  // =================================

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);


  // =====================================================
  // LOAD PROFILE
  // =====================================================

  const loadProfile = async () => {

    try {

      setLoading(true);


      const currentUser =
        auth.currentUser;


      // -----------------------------------------------
      // NO LOGGED IN USER
      // -----------------------------------------------

      if (!currentUser) {

        Alert.alert(
          "Session Error",
          "Your login session could not be found."
        );

        return;
      }


      // -----------------------------------------------
      // GET FIRESTORE PROFILE
      // -----------------------------------------------

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );


      const userSnapshot =
        await getDoc(
          userRef
        );


      if (!userSnapshot.exists()) {

        Alert.alert(
          "Profile Not Found",
          "Your profile information could not be found."
        );

        return;
      }


      const userData =
        userSnapshot.data();


      // -----------------------------------------------
      // LOAD DATA
      // -----------------------------------------------

      const loadedName =
        userData.name || "";

      const loadedEmail =
        userData.email ||
        currentUser.email ||
        "";

      const loadedPhone =
        userData.phone || "";

      const loadedEmployeeNumber =
        userData.employeeNumber || "";

      const loadedCollege =
        userData.college || "";

      const loadedDepartment =
        userData.class || "";

      const loadedQualification =
        userData.qualification || "";


      // -----------------------------------------------
      // SET PROFILE
      // -----------------------------------------------

      setName(
        loadedName
      );

      setEmail(
        loadedEmail
      );

      setPhone(
        loadedPhone
      );

      setEmployeeNumber(
        loadedEmployeeNumber
      );

      setCollege(
        loadedCollege
      );

      setDepartment(
        loadedDepartment
      );

      setQualification(
        loadedQualification
      );


      // -----------------------------------------------
      // SAVE ORIGINAL VALUES
      // -----------------------------------------------

      setOriginalName(
        loadedName
      );

      setOriginalEmail(
        loadedEmail
      );

      setOriginalPhone(
        loadedPhone
      );


    } catch (error: any) {

      console.log(
        "PROFILE LOAD ERROR:",
        error
      );


      Alert.alert(
        "Profile Error",
        error?.message ||
          "Unable to load your profile."
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // LOAD PROFILE ON SCREEN OPEN
  // =====================================================

  useEffect(() => {

    loadProfile();

  }, []);


  // =====================================================
  // EDIT BUTTON
  // =====================================================

  const handleEdit = () => {

    setIsEditing(true);

  };


  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancel = () => {

    // Restore original Firestore values

    setName(
      originalName
    );

    setEmail(
      originalEmail
    );

    setPhone(
      originalPhone
    );

    setIsEditing(false);

  };


  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  const isValidEmail = (
    emailValue: string
  ) => {

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(
      emailValue
    );
  };


  // =====================================================
  // PHONE VALIDATION
  // =====================================================

  const isValidPhone = (
    phoneValue: string
  ) => {

    const phoneRegex =
      /^[6-9]\d{9}$/;

    return phoneRegex.test(
      phoneValue
    );
  };


  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave = async () => {

    if (saving) {
      return;
    }


    const currentUser =
      auth.currentUser;


    // -----------------------------------------------
    // CHECK AUTH USER
    // -----------------------------------------------

    if (!currentUser) {

      Alert.alert(
        "Session Error",
        "Your login session has expired. Please login again."
      );

      return;
    }


    // -----------------------------------------------
    // CLEAN VALUES
    // -----------------------------------------------

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanPhone =
      phone.trim();


    // -----------------------------------------------
    // NAME VALIDATION
    // -----------------------------------------------

    if (
      cleanName.length < 2
    ) {

      Alert.alert(
        "Invalid Name",
        "Please enter a valid full name."
      );

      return;
    }


    // -----------------------------------------------
    // EMAIL VALIDATION
    // -----------------------------------------------

    if (
      !isValidEmail(
        cleanEmail
      )
    ) {

      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return;
    }


    // -----------------------------------------------
    // PHONE VALIDATION
    // -----------------------------------------------

    if (
      !isValidPhone(
        cleanPhone
      )
    ) {

      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian mobile number."
      );

      return;
    }


    setSaving(true);


    try {

      // =============================================
      // FIRESTORE USER REFERENCE
      // =============================================

      const userRef =
        doc(
          db,
          "users",
          currentUser.uid
        );


      // =============================================
      // EMAIL CHANGE CHECK
      // =============================================

      if (
        cleanEmail !==
        originalEmail.trim().toLowerCase()
      ) {

        console.log(
          "Checking whether email already exists..."
        );


        const emailQuery =
          query(
            collection(
              db,
              "users"
            ),
            where(
              "email",
              "==",
              cleanEmail
            )
          );


        const emailSnapshot =
          await getDocs(
            emailQuery
          );


        // -------------------------------------------
        // CHECK OTHER FIRESTORE ACCOUNT
        // -------------------------------------------

        const emailAlreadyUsed =
          emailSnapshot.docs.some(
            (document) =>
              document.id !==
              currentUser.uid
          );


        if (
          emailAlreadyUsed
        ) {

          Alert.alert(
            "Email Already Registered",
            "This email address is already associated with another ProjectVerse account."
          );

          return;
        }

      }


      // =============================================
      // FIREBASE AUTH EMAIL UPDATE
      // =============================================

      if (
        cleanEmail !==
        originalEmail.trim().toLowerCase()
      ) {

        console.log(
          "Updating Firebase Authentication email..."
        );


        try {

          await updateEmail(
            currentUser,
            cleanEmail
          );


          console.log(
            "Firebase Authentication email updated."
          );


        } catch (emailError: any) {

          console.log(
            "EMAIL UPDATE ERROR:",
            emailError
          );


          if (
            emailError?.code ===
            "auth/email-already-in-use"
          ) {

            Alert.alert(
              "Email Already Registered",
              "This email address is already registered with another Firebase account."
            );

          } else if (
            emailError?.code ===
            "auth/requires-recent-login"
          ) {

            Alert.alert(
              "Login Required",
              "For security, please login again before changing your email address."
            );

          } else if (
            emailError?.code ===
            "auth/invalid-email"
          ) {

            Alert.alert(
              "Invalid Email",
              "Please enter a valid email address."
            );

          } else {

            Alert.alert(
              "Email Update Failed",
              emailError?.message ||
                "Unable to update your email address."
            );

          }

          return;
        }

      }


      // =============================================
      // FIRESTORE UPDATE
      // =============================================

      await updateDoc(
        userRef,
        {
          name:
            cleanName,

          email:
            cleanEmail,

          phone:
            cleanPhone,
        }
      );


      console.log(
        "Firestore profile updated successfully."
      );


      // =============================================
      // UPDATE LOCAL STATE
      // =============================================

      setName(
        cleanName
      );

      setEmail(
        cleanEmail
      );

      setPhone(
        cleanPhone
      );


      setOriginalName(
        cleanName
      );

      setOriginalEmail(
        cleanEmail
      );

      setOriginalPhone(
        cleanPhone
      );


      setIsEditing(false);


      Alert.alert(
        "Profile Updated",
        "Your profile information has been updated successfully."
      );


    } catch (error: any) {

      console.log(
        "PROFILE UPDATE ERROR:",
        error
      );


      // =============================================
      // FIRESTORE PERMISSION
      // =============================================

      if (
        error?.code ===
        "permission-denied"
      ) {

        Alert.alert(
          "Permission Denied",
          "You do not have permission to update this profile."
        );

      } else {

        Alert.alert(
          "Update Failed",
          error?.message ||
            "Something went wrong while updating your profile."
        );

      }

    } finally {

      setSaving(false);

    }

  };


  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async () => {

    if (changingPassword) {
      return;
    }


    const currentUser =
      auth.currentUser;


    if (!currentUser) {

      Alert.alert(
        "Session Error",
        "Please login again before changing your password."
      );

      return;
    }


    // =============================================
    // EMPTY VALIDATION
    // =============================================

    if (
      newPassword.trim() === "" ||
      confirmPassword.trim() === ""
    ) {

      Alert.alert(
        "Missing Information",
        "Please enter and confirm your new password."
      );

      return;
    }


    // =============================================
    // PASSWORD LENGTH
    // =============================================

    if (
      newPassword.length < 6
    ) {

      Alert.alert(
        "Weak Password",
        "Password must contain at least 6 characters."
      );

      return;
    }


    // =============================================
    // PASSWORD MATCH
    // =============================================

    if (
      newPassword !==
      confirmPassword
    ) {

      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match."
      );

      return;
    }


    setChangingPassword(true);


    try {

      await updatePassword(
        currentUser,
        newPassword
      );


      console.log(
        "Password updated successfully."
      );


      setNewPassword("");

      setConfirmPassword("");

      setShowPasswordModal(false);


      Alert.alert(
        "Password Updated",
        "Your password has been changed successfully."
      );


    } catch (error: any) {

      console.log(
        "PASSWORD UPDATE ERROR:",
        error
      );


      if (
        error?.code ===
        "auth/requires-recent-login"
      ) {

        Alert.alert(
          "Login Required",
          "For security, please login again before changing your password."
        );

      } else if (
        error?.code ===
        "auth/weak-password"
      ) {

        Alert.alert(
          "Weak Password",
          "Password must contain at least 6 characters."
        );

      } else {

        Alert.alert(
          "Password Update Failed",
          error?.message ||
            "Unable to change your password."
        );

      }

    } finally {

      setChangingPassword(false);

    }

  };


  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#4338CA"
        />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>

      </View>

    );

  }


  // =====================================================
  // UI
  // =====================================================

  return (

    <View style={styles.screenContainer}>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* =================================
            PROFILE HEADER
        ================================= */}

        <View style={styles.profileHeader}>

          <View style={styles.profileIcon}>

            <Ionicons
              name="person"
              size={32}
              color="#FFFFFF"
            />

          </View>


          <View style={styles.profileHeaderText}>

            <Text style={styles.title}>
              {name || "Guide"}
            </Text>


            <View style={styles.roleRow}>

              <View style={styles.roleBadge}>

                <Text style={styles.roleText}>
                  GUIDE
                </Text>

              </View>


              <Text style={styles.employeeNumber}>
                {employeeNumber || "—"}
              </Text>

            </View>


            <Text style={styles.subtitle}>
              View and manage your profile information.
            </Text>

          </View>

        </View>


        {/* =================================
            BASIC INFORMATION
        ================================= */}

        <View style={styles.card}>

          <View style={styles.sectionHeader}>

            <View style={styles.sectionIcon}>

              <Ionicons
                name="person-outline"
                size={20}
                color="#4338CA"
              />

            </View>


            <Text style={styles.sectionTitle}>
              Basic Information
            </Text>

          </View>


          {/* NAME */}

          <EditableInfoRow
            icon="person-outline"
            label="Name"
            value={name}
            editable={isEditing}
            onChangeText={setName}
          />


          {/* EMPLOYEE NUMBER */}

          <InfoRow
            icon="id-card-outline"
            label="Employee Number"
            value={employeeNumber || "—"}
            locked
          />


          {/* EMAIL */}

          <EditableInfoRow
            icon="mail-outline"
            label="Email"
            value={email}
            editable={isEditing}
            onChangeText={setEmail}
            keyboardType="email-address"
          />


          {/* PHONE */}

          <EditableInfoRow
            icon="call-outline"
            label="Phone"
            value={phone}
            editable={isEditing}
            onChangeText={(text) => {

              const numbersOnly =
                text.replace(
                  /[^0-9]/g,
                  ""
                );

              setPhone(
                numbersOnly
              );

            }}
            keyboardType="phone-pad"
            last
          />

        </View>


        {/* =================================
            PROFESSIONAL INFORMATION
        ================================= */}

        <View style={styles.card}>

          <View style={styles.sectionHeader}>

            <View style={styles.sectionIcon}>

              <Ionicons
                name="briefcase-outline"
                size={20}
                color="#4338CA"
              />

            </View>


            <Text style={styles.sectionTitle}>
              Professional Information
            </Text>

          </View>


          {/* COLLEGE */}

          <InfoRow
            icon="business-outline"
            label="College"
            value={college || "—"}
            locked
          />


          {/* DEPARTMENT */}

          <InfoRow
            icon="school-outline"
            label="Department"
            value={department || "—"}
            locked
          />


          {/* QUALIFICATION */}

          <InfoRow
            icon="ribbon-outline"
            label="Qualification"
            value={qualification || "—"}
            locked
            last
          />

        </View>


        {/* =================================
            ACCOUNT SECURITY
        ================================= */}

        <View style={styles.card}>

          <View style={styles.sectionHeader}>

            <View style={styles.sectionIcon}>

              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#4338CA"
              />

            </View>


            <Text style={styles.sectionTitle}>
              Account Security
            </Text>

          </View>


          <TouchableOpacity
            style={styles.securityButton}
            activeOpacity={0.8}
            onPress={() =>
              setShowPasswordModal(true)
            }
            disabled={saving}
          >

            <View style={styles.securityIcon}>

              <Ionicons
                name="key-outline"
                size={20}
                color="#38B2AC"
              />

            </View>


            <View style={styles.securityContent}>

              <Text style={styles.securityTitle}>
                Change Password
              </Text>

              <Text style={styles.securitySubtitle}>
                Update your account password
              </Text>

            </View>


            <Ionicons
              name="chevron-forward"
              size={20}
              color="#9CA3AF"
            />

          </TouchableOpacity>

        </View>


        {/* =================================
            EDIT / SAVE BUTTONS
        ================================= */}

        {!isEditing ? (

          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.8}
            onPress={handleEdit}
          >

            <Ionicons
              name="create-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.editButtonText}>
              Edit Profile
            </Text>

          </TouchableOpacity>

        ) : (

          <View style={styles.actionRow}>

            {/* CANCEL */}

            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={handleCancel}
              disabled={saving}
            >

              <Ionicons
                name="close-outline"
                size={19}
                color="#6B7280"
              />

              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>

            </TouchableOpacity>


            {/* SAVE */}

            <TouchableOpacity
              style={[
                styles.saveButton,
                saving &&
                  styles.saveButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={saving}
            >

              {saving ? (

                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

              ) : (

                <>

                  <Ionicons
                    name="checkmark-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    Save Changes
                  </Text>

                </>

              )}

            </TouchableOpacity>

          </View>

        )}

      </ScrollView>


      {/* =================================================
          CHANGE PASSWORD MODAL
      ================================================= */}

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => {

          if (!changingPassword) {
            setShowPasswordModal(false);
          }

        }}
      >

        <View style={styles.modalOverlay}>

          <View style={styles.passwordModal}>

            {/* HEADER */}

            <View style={styles.modalHeader}>

              <View style={styles.modalIcon}>

                <Ionicons
                  name="key-outline"
                  size={22}
                  color="#4338CA"
                />

              </View>


              <TouchableOpacity
                onPress={() => {

                  if (!changingPassword) {
                    setShowPasswordModal(false);
                  }

                }}
                disabled={changingPassword}
              >

                <Ionicons
                  name="close-outline"
                  size={24}
                  color="#6B7280"
                />

              </TouchableOpacity>

            </View>


            <Text style={styles.modalTitle}>
              Change Password
            </Text>


            <Text style={styles.modalSubtitle}>
              Create a new password for your ProjectVerse account.
            </Text>


            {/* NEW PASSWORD */}

            <View style={styles.passwordInputContainer}>

              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#6B7280"
              />

              <TextInput
                style={styles.passwordInput}
                placeholder="New password"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!changingPassword}
              />


              <TouchableOpacity
                onPress={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
                disabled={changingPassword}
              >

                <Ionicons
                  name={
                    showNewPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={20}
                  color="#6B7280"
                />

              </TouchableOpacity>

            </View>


            {/* CONFIRM PASSWORD */}

            <View style={styles.passwordInputContainer}>

              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color="#6B7280"
              />

              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={
                  !showConfirmPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!changingPassword}
              />


              <TouchableOpacity
                onPress={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                disabled={changingPassword}
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

              </TouchableOpacity>

            </View>


            {/* PASSWORD BUTTONS */}

            <View style={styles.modalActionRow}>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {

                  if (!changingPassword) {

                    setNewPassword("");

                    setConfirmPassword("");

                    setShowPasswordModal(false);

                  }

                }}
                disabled={changingPassword}
              >

                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  changingPassword &&
                    styles.modalSaveButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >

                {changingPassword ? (

                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                ) : (

                  <>

                    <Ionicons
                      name="checkmark-outline"
                      size={18}
                      color="#FFFFFF"
                    />

                    <Text style={styles.modalSaveText}>
                      Update Password
                    </Text>

                  </>

                )}

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </View>
  );
}


/* =====================================================
   NORMAL INFORMATION ROW
===================================================== */

function InfoRow({
  icon,
  label,
  value,
  locked = false,
  last = false,
}: {
  icon: any;
  label: string;
  value: string;
  locked?: boolean;
  last?: boolean;
}) {

  return (

    <View
      style={[
        styles.infoRow,
        !last &&
          styles.infoRowBorder,
      ]}
    >

      <View style={styles.infoIconContainer}>

        <Ionicons
          name={icon}
          size={19}
          color="#38B2AC"
        />

      </View>


      <View style={styles.infoContent}>

        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.value}>
          {value}
        </Text>

      </View>


      {locked && (

        <Ionicons
          name="lock-closed-outline"
          size={15}
          color="#9CA3AF"
        />

      )}

    </View>
  );
}


/* =====================================================
   EDITABLE INFORMATION ROW
===================================================== */

function EditableInfoRow({
  icon,
  label,
  value,
  editable,
  onChangeText,
  keyboardType,
  last = false,
}: {
  icon: any;
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  last?: boolean;
}) {

  return (

    <View
      style={[
        styles.infoRow,
        !last &&
          styles.infoRowBorder,
      ]}
    >

      <View style={styles.infoIconContainer}>

        <Ionicons
          name={icon}
          size={19}
          color="#38B2AC"
        />

      </View>


      <View style={styles.infoContent}>

        <Text style={styles.label}>
          {label}
        </Text>


        {editable ? (

          <TextInput
            style={styles.editInput}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            autoCapitalize={
              label === "Email"
                ? "none"
                : "words"
            }
            autoCorrect={false}
          />

        ) : (

          <Text style={styles.value}>
            {value}
          </Text>

        )}

      </View>

    </View>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({

  // =================================
  // MAIN CONTAINER
  // =================================

  screenContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },


  // =================================
  // LOADING
  // =================================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },


  // =================================
  // PROFILE HEADER
  // =================================

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  profileIcon: {
    width: 64,
    height: 64,

    borderRadius: 32,

    backgroundColor: "#4338CA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 14,
  },

  profileHeaderText: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  roleBadge: {
    backgroundColor: "#D5F5F2",

    paddingHorizontal: 9,
    paddingVertical: 4,

    borderRadius: 6,

    marginRight: 8,
  },

  roleText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16877F",
  },

  employeeNumber: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
  },


  // =================================
  // CARD
  // =================================

  card: {
    backgroundColor: "#FFFFFF",

    borderRadius: 14,

    padding: 18,

    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#E5E7EB",
  },


  // =================================
  // SECTION HEADER
  // =================================

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 12,
  },

  sectionIcon: {
    width: 38,
    height: 38,

    borderRadius: 10,

    backgroundColor: "#EEF2FF",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },


  // =================================
  // INFORMATION ROW
  // =================================

  infoRow: {
    flexDirection: "row",

    alignItems: "center",

    paddingVertical: 13,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },

  infoIconContainer: {
    width: 38,
    height: 38,

    borderRadius: 10,

    backgroundColor: "#F0FDFA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",

    marginBottom: 3,
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },


  // =================================
  // EDIT INPUT
  // =================================

  editInput: {
    minHeight: 38,

    borderWidth: 1,
    borderColor: "#DDE2EA",

    backgroundColor: "#F8F9FB",

    borderRadius: 8,

    paddingHorizontal: 10,

    fontSize: 14,

    color: "#1F2937",
  },


  // =================================
  // SECURITY
  // =================================

  securityButton: {
    flexDirection: "row",

    alignItems: "center",

    paddingVertical: 8,
  },

  securityIcon: {
    width: 40,
    height: 40,

    borderRadius: 10,

    backgroundColor: "#F0FDFA",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  securitySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },


  // =================================
  // BUTTONS
  // =================================

  editButton: {
    height: 48,

    borderRadius: 10,

    backgroundColor: "#4338CA",

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    marginTop: 2,
  },

  editButtonText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "600",

    marginLeft: 8,
  },

  actionRow: {
    flexDirection: "row",

    gap: 10,

    marginTop: 2,
  },

  cancelButton: {
    flex: 1,

    height: 48,

    borderRadius: 10,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#D1D5DB",

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#6B7280",

    fontSize: 15,

    fontWeight: "600",

    marginLeft: 6,
  },

  saveButton: {
    flex: 1,

    height: 48,

    borderRadius: 10,

    backgroundColor: "#4338CA",

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "600",

    marginLeft: 6,
  },


  // =================================
  // PASSWORD MODAL
  // =================================

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(15, 23, 42, 0.45)",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
  },

  passwordModal: {
    width: "100%",

    backgroundColor: "#FFFFFF",

    borderRadius: 18,

    padding: 20,

    borderWidth: 1,
    borderColor: "#E5E7EB",

    elevation: 8,

    shadowColor: "#1F2937",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.15,

    shadowRadius: 12,
  },

  modalHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  modalIcon: {
    width: 42,
    height: 42,

    borderRadius: 11,

    backgroundColor: "#EEF2FF",

    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontSize: 20,

    fontWeight: "700",

    color: "#1F2937",

    marginTop: 14,
  },

  modalSubtitle: {
    fontSize: 13,

    lineHeight: 20,

    color: "#6B7280",

    marginTop: 5,

    marginBottom: 18,
  },

  passwordInputContainer: {
    minHeight: 50,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#F8F9FB",

    borderWidth: 1,

    borderColor: "#DDE2EA",

    borderRadius: 11,

    paddingHorizontal: 12,

    marginBottom: 12,
  },

  passwordInput: {
    flex: 1,

    minHeight: 48,

    fontSize: 14,

    color: "#1F2937",

    marginLeft: 9,

    marginRight: 8,
  },

  modalActionRow: {
    flexDirection: "row",

    gap: 10,

    marginTop: 6,
  },

  modalCancelButton: {
    flex: 1,

    height: 46,

    borderRadius: 10,

    borderWidth: 1,

    borderColor: "#D1D5DB",

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",
  },

  modalCancelText: {
    fontSize: 14,

    fontWeight: "600",

    color: "#6B7280",
  },

  modalSaveButton: {
    flex: 1,

    height: 46,

    borderRadius: 10,

    backgroundColor: "#4338CA",

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",
  },

  modalSaveButtonDisabled: {
    opacity: 0.7,
  },

  modalSaveText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "600",

    marginLeft: 6,
  },

});