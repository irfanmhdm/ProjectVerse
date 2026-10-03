import React, { useEffect, useState } from "react";

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

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../../firebase/firebaseConfig";


// =====================================================
// PROFILE
// =====================================================

export default function Profile() {

  // ===================================================
  // PROFILE DATA
  // ===================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [registerNumber, setRegisterNumber] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");

  // ===================================================
  // ORIGINAL VALUES
  // Used when Cancel is pressed
  // ===================================================

  const [originalName, setOriginalName] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ===================================================
  // PASSWORD STATES
  // ===================================================

  const [passwordModalVisible, setPasswordModalVisible] =
    useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  // ===================================================
  // LOAD PROFILE
  // ===================================================

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {

    try {

      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Not Logged In",
          "Please login again."
        );
        return;
      }

      console.log("====================================");
      console.log("LOADING STUDENT PROFILE");
      console.log("UID:", user.uid);
      console.log("EMAIL:", user.email);
      console.log("====================================");

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {

        Alert.alert(
          "Profile Error",
          "Student profile was not found."
        );

        return;
      }

      const data = userSnapshot.data();

      console.log("PROFILE DATA:", data);

      // ===============================================
      // PERSONAL INFORMATION
      // ===============================================

      const profileName = data.name || "";
      const profileEmail =
        data.email || user.email || "";
      const profilePhone = data.phone || "";

      setName(profileName);
      setEmail(profileEmail);
      setPhone(profilePhone);

      // ===============================================
      // ACADEMIC INFORMATION
      // ===============================================

      setRegisterNumber(
        data.registerNumber || ""
      );

      setCollege(
        data.college || ""
      );

      setDepartment(
        data.class || data.department || ""
      );

      // ===============================================
      // ACCOUNT INFORMATION
      // ===============================================

      setStatus(
        data.status || ""
      );

      setRole(
        data.role || ""
      );

      // ===============================================
      // ORIGINAL VALUES
      // ===============================================

      setOriginalName(profileName);
      setOriginalEmail(profileEmail);
      setOriginalPhone(profilePhone);

    } catch (error) {

      console.error(
        "PROFILE LOAD ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load your profile."
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // START EDITING
  // =====================================================

  const handleEdit = () => {

    setOriginalName(name);
    setOriginalEmail(email);
    setOriginalPhone(phone);

    setIsEditing(true);
  };


  // =====================================================
  // CANCEL EDITING
  // =====================================================

  const handleCancel = () => {

    setName(originalName);
    setEmail(originalEmail);
    setPhone(originalPhone);

    setIsEditing(false);
  };


  // =====================================================
  // VALIDATE NAME
  // =====================================================

  const validateName = () => {

    const trimmedName = name.trim();

    if (!trimmedName) {

      Alert.alert(
        "Invalid Name",
        "Name cannot be empty."
      );

      return false;
    }

    if (trimmedName.length < 3) {

      Alert.alert(
        "Invalid Name",
        "Name must contain at least 3 characters."
      );

      return false;
    }

    if (!/^[A-Za-z ]+$/.test(trimmedName)) {

      Alert.alert(
        "Invalid Name",
        "Name can contain only letters and spaces."
      );

      return false;
    }

    return true;
  };


  // =====================================================
  // VALIDATE EMAIL
  // =====================================================

  const validateEmail = () => {

    const trimmedEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {

      Alert.alert(
        "Invalid Email",
        "Email cannot be empty."
      );

      return false;
    }

    if (!emailRegex.test(trimmedEmail)) {

      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return false;
    }

    return true;
  };


  // =====================================================
  // VALIDATE PHONE
  // =====================================================

  const validatePhone = () => {

    const trimmedPhone =
      phone.trim();

    if (!trimmedPhone) {

      Alert.alert(
        "Invalid Phone",
        "Phone number cannot be empty."
      );

      return false;
    }

    if (!/^[6-9][0-9]{9}$/.test(trimmedPhone)) {

      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit Indian mobile number."
      );

      return false;
    }

    return true;
  };


  // =====================================================
  // CHECK EMAIL IN FIRESTORE
  // =====================================================

  const checkEmailExists = async (
    newEmail: string,
    currentUid: string
  ) => {

    try {

      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", newEmail)
      );

      const snapshot =
        await getDocs(emailQuery);

      for (const document of snapshot.docs) {

        if (document.id !== currentUid) {

          return true;
        }
      }

      return false;

    } catch (error) {

      console.error(
        "EMAIL CHECK ERROR:",
        error
      );

      throw error;
    }
  };


  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave = async () => {

    // ===============================================
    // BASIC CHECK
    // ===============================================

    const user = auth.currentUser;

    if (!user) {

      Alert.alert(
        "Authentication Error",
        "Your session has expired. Please login again."
      );

      return;
    }

    // ===============================================
    // VALIDATIONS
    // ===============================================

    if (!validateName()) {
      return;
    }

    if (!validateEmail()) {
      return;
    }

    if (!validatePhone()) {
      return;
    }

    try {

      setSaving(true);

      const currentUid = user.uid;

      const newName =
        name.trim();

      const newEmail =
        email.trim().toLowerCase();

      const newPhone =
        phone.trim();

      const emailChanged =
        newEmail !==
        (originalEmail || "").trim().toLowerCase();

      // =============================================
      // EMAIL EXISTENCE CHECK
      // =============================================

      if (emailChanged) {

        console.log(
          "Checking whether email already exists..."
        );

        const emailExists =
          await checkEmailExists(
            newEmail,
            currentUid
          );

        if (emailExists) {

          Alert.alert(
            "Email Already Exists",
            "This email address is already registered to another ProjectVerse account."
          );

          return;
        }

      }

      // =============================================
      // UPDATE FIREBASE AUTH EMAIL
      // =============================================

      if (emailChanged) {

        console.log(
          "Updating Firebase Authentication email..."
        );

        try {

          await updateEmail(
            user,
            newEmail
          );

          console.log(
            "Firebase Authentication email updated."
          );

        } catch (error: any) {

          console.error(
            "AUTH EMAIL UPDATE ERROR:",
            error
          );

          if (
            error.code ===
            "auth/email-already-in-use"
          ) {

            Alert.alert(
              "Email Already Exists",
              "This email is already being used by another Firebase Authentication account."
            );

          } else if (
            error.code ===
            "auth/requires-recent-login"
          ) {

            Alert.alert(
              "Login Required",
              "For security, please logout and login again before changing your email."
            );

          } else if (
            error.code ===
            "auth/invalid-email"
          ) {

            Alert.alert(
              "Invalid Email",
              "Please enter a valid email address."
            );

          } else {

            Alert.alert(
              "Email Update Failed",
              "Unable to update your email in Firebase Authentication."
            );
          }

          return;
        }
      }

      // =============================================
      // UPDATE FIRESTORE PROFILE
      // =============================================

      const userRef = doc(
        db,
        "users",
        currentUid
      );

      await updateDoc(
        userRef,
        {
          name: newName,
          email: newEmail,
          phone: newPhone,
        }
      );

      // =============================================
      // UPDATE LOCAL STATE
      // =============================================

      setName(newName);
      setEmail(newEmail);
      setPhone(newPhone);

      setOriginalName(newName);
      setOriginalEmail(newEmail);
      setOriginalPhone(newPhone);

      setIsEditing(false);

      Alert.alert(
        "Profile Updated",
        "Your profile information has been updated successfully."
      );

    } catch (error: any) {

      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      if (
        error.code ===
        "permission-denied"
      ) {

        Alert.alert(
          "Permission Denied",
          "You do not have permission to update this profile."
        );

      } else {

        Alert.alert(
          "Update Failed",
          "Unable to update your profile. Please try again."
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

    const user = auth.currentUser;

    if (!user) {

      Alert.alert(
        "Authentication Error",
        "Please login again."
      );

      return;
    }

    // ===============================================
    // OLD PASSWORD
    // ===============================================

    if (!oldPassword.trim()) {

      Alert.alert(
        "Old Password Required",
        "Please enter your current password."
      );

      return;
    }

    // ===============================================
    // NEW PASSWORD
    // ===============================================

    if (!newPassword.trim()) {

      Alert.alert(
        "New Password Required",
        "Please enter a new password."
      );

      return;
    }

    if (newPassword.length < 6) {

      Alert.alert(
        "Weak Password",
        "New password must contain at least 6 characters."
      );

      return;
    }

    // ===============================================
    // CONFIRM PASSWORD
    // ===============================================

    if (!confirmPassword.trim()) {

      Alert.alert(
        "Confirm Password",
        "Please confirm your new password."
      );

      return;
    }

    if (newPassword !== confirmPassword) {

      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match."
      );

      return;
    }

    // ===============================================
    // PREVENT SAME PASSWORD
    // ===============================================

    if (oldPassword === newPassword) {

      Alert.alert(
        "Invalid Password",
        "New password must be different from your old password."
      );

      return;
    }

    try {

      setChangingPassword(true);

      console.log(
        "Re-authenticating user..."
      );

      // =============================================
      // RE-AUTHENTICATE
      // =============================================

      if (!user.email) {

        Alert.alert(
          "Error",
          "Your Firebase account does not have an email address."
        );

        return;
      }

      const credential =
        EmailAuthProvider.credential(
          user.email,
          oldPassword
        );

      await reauthenticateWithCredential(
        user,
        credential
      );

      console.log(
        "Re-authentication successful."
      );

      // =============================================
      // UPDATE PASSWORD
      // =============================================

      await updatePassword(
        user,
        newPassword
      );

      console.log(
        "Password updated successfully."
      );

      // =============================================
      // CLEAR PASSWORD FIELDS
      // =============================================

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordModalVisible(false);

      Alert.alert(
        "Password Changed",
        "Your password has been changed successfully."
      );

    } catch (error: any) {

      console.error(
        "PASSWORD CHANGE ERROR:",
        error
      );

      if (
        error.code ===
        "auth/invalid-credential"
      ) {

        Alert.alert(
          "Incorrect Password",
          "The old password you entered is incorrect."
        );

      } else if (
        error.code ===
        "auth/wrong-password"
      ) {

        Alert.alert(
          "Incorrect Password",
          "The old password you entered is incorrect."
        );

      } else if (
        error.code ===
        "auth/requires-recent-login"
      ) {

        Alert.alert(
          "Login Required",
          "Please logout and login again before changing your password."
        );

      } else if (
        error.code ===
        "auth/weak-password"
      ) {

        Alert.alert(
          "Weak Password",
          "Please choose a stronger password."
        );

      } else {

        Alert.alert(
          "Password Change Failed",
          "Unable to change your password. Please try again."
        );
      }

    } finally {

      setChangingPassword(false);

    }
  };


  // =====================================================
  // INITIALS
  // =====================================================

  const getInitials = () => {

    if (!name.trim()) {
      return "ST";
    }

    const parts =
      name.trim().split(" ");

    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
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

    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ===============================================
          PAGE TITLE
      =============================================== */}

      
      <Text style={styles.subtitle}>
        Manage your personal and academic information
      </Text>


      {/* ===============================================
          PROFILE SUMMARY
      =============================================== */}

      <View style={styles.profileHeader}>

        <View style={styles.initialCircle}>

          <Text style={styles.initialText}>
            {getInitials()}
          </Text>

        </View>


        <View style={styles.profileInfo}>

          <Text style={styles.name}>
            {name || "Student"}
          </Text>

          <Text style={styles.registerNumber}>
            {registerNumber}
          </Text>


          <View style={styles.statusContainer}>

            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              {status
                ? status.charAt(0).toUpperCase() +
                  status.slice(1) +
                  " Student"
                : "Student"}
            </Text>

          </View>

        </View>

      </View>


      {/* ===============================================
          PERSONAL INFORMATION
      =============================================== */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Personal Information
        </Text>

        <View style={styles.divider} />


        {/* NAME */}

        <EditableInfoRow
          label="Full Name"
          value={name}
          editable={isEditing}
          onChangeText={setName}
        />


        {/* EMAIL */}

        <EditableInfoRow
          label="Email"
          value={email}
          editable={isEditing}
          onChangeText={setEmail}
          keyboardType="email-address"
        />


        {/* PHONE */}

        <EditableInfoRow
          label="Phone"
          value={phone}
          editable={isEditing}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          last
        />

      </View>


      {/* ===============================================
          ACADEMIC INFORMATION
      =============================================== */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Academic Information
        </Text>

        <View style={styles.divider} />


        {/* REGISTER NUMBER */}

        <LockedInfoRow
          label="Register Number"
          value={registerNumber}
        />


        {/* COLLEGE */}

        <LockedInfoRow
          label="College"
          value={college}
        />


        {/* DEPARTMENT */}

        <LockedInfoRow
          label="Department"
          value={department}
        />


        

      </View>


      {/* ===============================================
          ACCOUNT SECURITY
      =============================================== */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Account Security
        </Text>

        <View style={styles.divider} />


        <TouchableOpacity
          style={styles.securityButton}
          activeOpacity={0.8}
          onPress={() =>
            setPasswordModalVisible(true)
          }
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
              Update Password
            </Text>

            <Text style={styles.securitySubtitle}>
              Update your password using your current password
            </Text>

          </View>


          <Ionicons
            name="chevron-forward"
            size={20}
            color="#9CA3AF"
          />

        </TouchableOpacity>

      </View>


      {/* ===============================================
          EDIT / SAVE
      =============================================== */}

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
            style={styles.saveButton}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >

            {saving ? (

              <ActivityIndicator
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


      {/* ===============================================
          PASSWORD MODAL
      =============================================== */}

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {

          if (!changingPassword) {
            setPasswordModalVisible(false);
          }

        }}
      >

        <View style={styles.modalOverlay}>

          <View style={styles.passwordModal}>

            {/* HEADER */}

            <View style={styles.modalHeader}>

              <View>

                <Text style={styles.modalTitle}>
                  Change Password
                </Text>

                <Text style={styles.modalSubtitle}>
                  Enter your current and new password
                </Text>

              </View>


              <TouchableOpacity
                onPress={() => {

                  if (!changingPassword) {
                    setPasswordModalVisible(false);
                  }

                }}
              >

                <Ionicons
                  name="close"
                  size={24}
                  color="#6B7280"
                />

              </TouchableOpacity>

            </View>


            {/* OLD PASSWORD */}

            <Text style={styles.inputLabel}>
              Current Password
            </Text>

            <TextInput
              style={styles.passwordInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />


            {/* NEW PASSWORD */}

            <Text style={styles.inputLabel}>
              New Password
            </Text>

            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />


            {/* CONFIRM PASSWORD */}

            <Text style={styles.inputLabel}>
              Confirm New Password
            </Text>

            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />


            {/* PASSWORD RULE */}

            <Text style={styles.passwordHint}>
              Password must contain at least 6 characters.
            </Text>


            {/* BUTTONS */}

            <View style={styles.modalButtonRow}>

              <TouchableOpacity
                style={styles.modalCancelButton}
                activeOpacity={0.8}
                onPress={() => {

                  if (!changingPassword) {

                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");

                    setPasswordModalVisible(false);
                  }

                }}
                disabled={changingPassword}
              >

                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={styles.modalSaveButton}
                activeOpacity={0.8}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >

                {changingPassword ? (

                  <ActivityIndicator
                    color="#FFFFFF"
                  />

                ) : (

                  <Text style={styles.modalSaveText}>
                    Change Password
                  </Text>

                )}

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </ScrollView>
  );
}


// =====================================================
// EDITABLE INFORMATION ROW
// =====================================================

function EditableInfoRow({
  label,
  value,
  editable,
  onChangeText,
  keyboardType,
  last = false,
}: {
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
        !last && styles.infoRowBorder,
      ]}
    >

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
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#9CA3AF"
        />

      ) : (

        <Text style={styles.value}>
          {value || "Not provided"}
        </Text>

      )}

    </View>
  );
}


// =====================================================
// LOCKED INFORMATION ROW
// =====================================================

function LockedInfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {

  return (

    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >

      <Text style={styles.label}>
        {label}
      </Text>


      <View style={styles.lockedValueContainer}>

        <Text style={styles.value}>
          {value || "Not available"}
        </Text>

        <Ionicons
          name="lock-closed-outline"
          size={14}
          color="#9CA3AF"
          style={styles.lockIcon}
        />

      </View>

    </View>
  );
}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  // ===================================================
  // CONTAINER
  // ===================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },


  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },


  // ===================================================
  // TITLE
  // ===================================================

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 5,
    marginBottom: 18,
  },


  // ===================================================
  // PROFILE HEADER
  // ===================================================

  profileHeader: {
    backgroundColor: "#D5F5F2",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#BFEAE5",
  },

  initialCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#4338CA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  initialText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  registerNumber: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 3,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 6,
  },

  statusText: {
    fontSize: 12,
    color: "#15803D",
    fontWeight: "600",
  },


  // ===================================================
  // SECTIONS
  // ===================================================

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4338CA",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },


  // ===================================================
  // INFORMATION ROW
  // ===================================================

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },

  label: {
    fontSize: 13,
    color: "#6B7280",
    flex: 0.8,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "right",
    flex: 1.2,
  },


  // ===================================================
  // EDIT INPUT
  // ===================================================

  editInput: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: "#111827",
    flex: 1.2,
    textAlign: "right",
  },


  // ===================================================
  // LOCKED VALUE
  // ===================================================

  lockedValueContainer: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  lockIcon: {
    marginLeft: 7,
  },


  // ===================================================
  // SECURITY
  // ===================================================

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


  // ===================================================
  // EDIT / SAVE BUTTONS
  // ===================================================

  editButton: {
    backgroundColor: "#4338CA",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexDirection: "row",
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 7,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  cancelButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 5,
  },

  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#4338CA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 5,
  },


  // ===================================================
  // PASSWORD MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  passwordModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  modalSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },

  passwordInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
  },

  passwordHint: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 8,
  },

  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  modalCancelButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
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
    height: 45,
    borderRadius: 8,
    backgroundColor: "#4338CA",
    alignItems: "center",
    justifyContent: "center",
  },

  modalSaveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

});