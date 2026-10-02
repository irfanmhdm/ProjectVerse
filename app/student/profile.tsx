import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function Profile() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* =========================
          PAGE TITLE
      ========================= */}

      <Text style={styles.title}>
        My Profile
      </Text>

      <Text style={styles.subtitle}>
        Manage your personal and academic information
      </Text>


      {/* =========================
          PROFILE SUMMARY
      ========================= */}

      <View style={styles.profileHeader}>

        <View style={styles.initialCircle}>
          <Text style={styles.initialText}>
            MI
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            Muhammed Irfan
          </Text>

          <Text style={styles.registerNumber}>
            FIT25MCA-2041
          </Text>

          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              Approved Student
            </Text>
          </View>
        </View>

      </View>


      {/* =========================
          PERSONAL INFORMATION
      ========================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Personal Information
        </Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Full Name
          </Text>

          <Text style={styles.value}>
            Muhammed Irfan
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Email
          </Text>

          <Text style={styles.value}>
            student@gmail.com
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Phone
          </Text>

          <Text style={styles.value}>
            9876543210
          </Text>
        </View>

      </View>


      {/* =========================
          ACADEMIC INFORMATION
      ========================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Academic Information
        </Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Register Number
          </Text>

          <Text style={styles.value}>
            FIT25MCA-2041
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            College
          </Text>

          <Text style={styles.value}>
            FISAT
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Department
          </Text>

          <Text style={styles.value}>
            MCA
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Batch
          </Text>

          <Text style={styles.value}>
            2025 - 2027
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>
            Semester
          </Text>

          <Text style={styles.value}>
            3
          </Text>
        </View>

      </View>


      {/* =========================
          SKILLS
      ========================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          Skills
        </Text>

        <View style={styles.divider} />

        <View style={styles.skillsContainer}>

          <View style={styles.skill}>
            <Text style={styles.skillText}>
              React Native
            </Text>
          </View>

          <View style={styles.skill}>
            <Text style={styles.skillText}>
              Firebase
            </Text>
          </View>

          <View style={styles.skill}>
            <Text style={styles.skillText}>
              Python
            </Text>
          </View>

          <View style={styles.skill}>
            <Text style={styles.skillText}>
              JavaScript
            </Text>
          </View>

        </View>

      </View>


      {/* =========================
          ABOUT
      ========================= */}

      <View style={styles.section}>

        <Text style={styles.sectionTitle}>
          About
        </Text>

        <View style={styles.divider} />

        <Text style={styles.about}>
          Student profile information and personal
          introduction will appear here.
        </Text>

      </View>


      {/* =========================
          EDIT PROFILE
      ========================= */}

      <TouchableOpacity
        style={styles.editButton}
        activeOpacity={0.8}
      >
        <Text style={styles.editButtonText}>
          Edit Profile
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },


  // =========================
  // TITLE
  // =========================

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


  // =========================
  // PROFILE HEADER
  // =========================

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


  // =========================
  // SECTIONS
  // =========================

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


  // =========================
  // INFORMATION
  // =========================

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },

  label: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "right",
    flex: 1.3,
  },


  // =========================
  // SKILLS
  // =========================

  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skill: {
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },

  skillText: {
    color: "#4338CA",
    fontSize: 13,
    fontWeight: "600",
  },


  // =========================
  // ABOUT
  // =========================

  about: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4B5563",
  },


  // =========================
  // EDIT BUTTON
  // =========================

  editButton: {
    backgroundColor: "#4338CA",
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

});