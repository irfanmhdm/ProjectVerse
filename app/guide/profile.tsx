import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  return (
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
            Dr. John Mathew
          </Text>

          <View style={styles.roleRow}>

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                GUIDE
              </Text>
            </View>

            <Text style={styles.employeeNumber}>
              EMP105
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

        <InfoRow
          icon="person-outline"
          label="Name"
          value="Dr. John Mathew"
        />


        {/* EMPLOYEE NUMBER */}

        <InfoRow
          icon="id-card-outline"
          label="Employee Number"
          value="EMP105"
        />


        {/* EMAIL */}

        <InfoRow
          icon="mail-outline"
          label="Email"
          value="guide@gmail.com"
        />


        {/* PHONE */}

        <InfoRow
          icon="call-outline"
          label="Phone"
          value="9876543210"
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


        <InfoRow
          icon="business-outline"
          label="Department"
          value="MCA"
        />


        <InfoRow
          icon="briefcase-outline"
          label="Designation"
          value="Assistant Professor"
        />


        <InfoRow
          icon="school-outline"
          label="Qualification"
          value="MCA, PhD"
        />


        <InfoRow
          icon="sparkles-outline"
          label="Specialization"
          value="Artificial Intelligence"
        />


        <InfoRow
          icon="time-outline"
          label="Experience"
          value="8 Years"
          last
        />

      </View>


      {/* =================================
          ABOUT
      ================================= */}

      <View style={styles.card}>

        <View style={styles.sectionHeader}>

          <View style={styles.sectionIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#4338CA"
            />
          </View>

          <Text style={styles.sectionTitle}>
            About
          </Text>

        </View>

        <Text style={styles.aboutText}>
          Guide profile information and professional
          background will be displayed here.
        </Text>

      </View>


      {/* =================================
          EDIT PROFILE
      ================================= */}

      <TouchableOpacity
        style={styles.editButton}
        activeOpacity={0.8}
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

    </ScrollView>
  );
}


/* =================================
   REUSABLE INFORMATION ROW
================================= */

function InfoRow({
  icon,
  label,
  value,
  last = false,
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
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

    </View>
  );
}


/* =================================
   STYLES
================================= */

const styles = StyleSheet.create({

  // =================================
  // MAIN CONTAINER
  // =================================

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
  // ABOUT
  // =================================

  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4B5563",
  },


  // =================================
  // EDIT BUTTON
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

});