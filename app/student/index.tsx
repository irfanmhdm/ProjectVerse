import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../firebase/firebaseConfig";

export default function StudentDashboard() {
  const router = useRouter();

  const [studentName, setStudentName] =
    useState("Student");

  // =====================================================
  // LOAD STUDENT NAME
  // =====================================================

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          return;
        }

        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const userSnap = await getDoc(
          userRef
        );

        if (userSnap.exists()) {
          const data = userSnap.data();

          if (data.name) {
            setStudentName(data.name);
          }
        }
      } catch (error) {
        console.log(
          "Error loading student:",
          error
        );
      }
    };

    loadStudent();
  }, []);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goToProjects = () => {
    router.push("/student/my-projects");
  };

  const goToExplore = () => {
    router.push("/student/explore");
  };

  const goToAddProject = () => {
    router.push("/student/add-project");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* =================================================
          HERO SECTION
      ================================================= */}

      {/* =================================================
    HERO SECTION
================================================= */}

<View style={styles.heroCard}>

  {/* Decorative mint circle */}
  <View style={styles.decorCircle} />

  <View style={styles.heroContent}>

    <Text style={styles.studentLabel}>
      STUDENT
    </Text>

    <Text style={styles.greeting}>
      Welcome back,{"\t"}<Text style={styles.studentName}>
      {studentName}
    </Text>
    </Text>

    <Text style={styles.heroDescription}>
   
        {"\n"}
      Manage your projects, track progress,
      and collaborate with your guide.
    </Text>

    <View style={styles.mintAccent} />

    <Text style={styles.quote}>
      "Good ideas become
      {"\n"}
      better projects."
    </Text>

  </View>

</View>
        

      {/* =================================================
          QUICK ACCESS HEADER
      ================================================= */}

      <View style={styles.sectionHeader}>

        <Text style={styles.sectionTitle}>
          Quick Access
        </Text>

        <Text style={styles.sectionSubtitle}>
          Manage your ProjectVerse workspace
        </Text>

      </View>

      {/* =================================================
          ACTION CARDS
      ================================================= */}

      <View style={styles.cardsContainer}>

        {/* =================================================
            MY PROJECTS
        ================================================= */}

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            styles.projectCard,
            pressed && styles.pressed,
          ]}
          onPress={goToProjects}
        >

          <View style={styles.cardTop}>

            <View
              style={[
                styles.iconBox,
                styles.indigoIcon,
              ]}
            >
              <Ionicons
                name="folder-outline"
                size={25}
                color="#4338CA"
              />
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#4338CA"
              />
            </View>

          </View>

          <Text style={styles.cardTitle}>
            My Projects
          </Text>

          <Text style={styles.cardDescription}>
            View and manage your
            submitted projects.
          </Text>

          <View style={styles.waveIndigo} />

        </Pressable>

        {/* =================================================
            EXPLORE
        ================================================= */}

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            styles.exploreCard,
            pressed && styles.pressed,
          ]}
          onPress={goToExplore}
        >

          <View style={styles.cardTop}>

            <View
              style={[
                styles.iconBox,
                styles.mintIcon,
              ]}
            >
              <Ionicons
                name="search-outline"
                size={25}
                color="#238F89"
              />
            </View>

            <View
              style={[
                styles.arrowCircle,
                styles.mintArrow,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#238F89"
              />
            </View>

          </View>

          <Text style={styles.cardTitle}>
            Explore Projects
          </Text>

          <Text style={styles.cardDescription}>
            Discover existing projects
            and explore new ideas.
          </Text>

          <View style={styles.waveMint} />

        </Pressable>

        {/* =================================================
            ADD PROJECT
        ================================================= */}

        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            styles.addCard,
            pressed && styles.pressed,
          ]}
          onPress={goToAddProject}
        >

          <View style={styles.cardTop}>

            <View
              style={[
                styles.iconBox,
                styles.addIcon,
              ]}
            >
              <Ionicons
                name="add"
                size={27}
                color="#4338CA"
              />
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#4338CA"
              />
            </View>

          </View>

          <Text style={styles.cardTitle}>
            Upload Project
          </Text>

          <Text style={styles.cardDescription}>
            Create and submit your
            project for review.
          </Text>

          <View style={styles.waveIndigoLight} />

        </Pressable>

      </View>

      {/* =================================================
          INSPIRATION CARD
      ================================================= */}

      <View style={styles.inspirationCard}>

        <View style={styles.inspirationIcon}>
          <Ionicons
            name="leaf-outline"
            size={25}
            color="#238F89"
          />
        </View>

        <View style={styles.inspirationContent}>

          <Text style={styles.inspirationTitle}>
            Every great project
            starts with a curious mind.
          </Text>

          <Text style={styles.inspirationSubtitle}>
            Keep learning. Keep building.
          </Text>

        </View>

      </View>

      {/* =================================================
          FOOTER
      ================================================= */}

      <View style={styles.footer}>

        <Text style={styles.footerTitle}>
          ProjectVerse
        </Text>

        <Text style={styles.footerSubtitle}>
          Innovate • Collaborate • Succeed
        </Text>

      </View>

    </ScrollView>
  );
}

// =======================================================
// STYLES
// =======================================================

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
    paddingBottom: 35,
  },

  // =====================================================
  // HERO
  // =====================================================

  heroCard: {
    minHeight: 315,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5E4",
    overflow: "hidden",
    position: "relative",
    marginBottom: 28,
    padding: 22,
  },

  heroContent: {
    width: "65%",
    zIndex: 2,
  },

  studentLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#4338CA",
    marginBottom: 16,
  },

  greeting: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "700",
    color: "#579daf",
  },

  studentName: {
    fontSize: 31,
    lineHeight: 39,
    fontWeight: "700",
    color: "#574bc6",
    marginBottom: 14,
  },

  heroDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
  },

  mintAccent: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#38B2AC",
    marginTop: 17,
    marginBottom: 14,
  },

  quote: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    fontStyle: "italic",
    color: "#423998",
  },

  // =====================================================
  // HERO DECORATION
  // =====================================================

  decorCircle: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -90,
    top: -80,
    backgroundColor: "#D5F5F2",
  },

  // =====================================================
  // SECTION HEADER
  // =====================================================

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5c5599",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },

  // =====================================================
  // CARDS
  // =====================================================

  cardsContainer: {
    gap: 13,
    marginBottom: 20,
  },

  actionCard: {
    minHeight: 158,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E6ED",
    padding: 17,
    overflow: "hidden",
    position: "relative",
  },

  projectCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCDFF0",
  },

  exploreCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E8E6",
  },

  addCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCDFF0",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  indigoIcon: {
    backgroundColor: "#EEF0FF",
  },

  mintIcon: {
    backgroundColor: "#D5F5F2",
  },

  addIcon: {
    backgroundColor: "#EEF0FF",
  },

  arrowCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },

  mintArrow: {
    backgroundColor: "#D5F5F2",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    maxWidth: 270,
  },

  waveIndigo: {
    position: "absolute",
    width: 180,
    height: 35,
    borderRadius: 100,
    backgroundColor: "#EEF0FF",
    right: -45,
    bottom: -18,
    transform: [
      {
        rotate: "-8deg",
      },
    ],
  },

  waveMint: {
    position: "absolute",
    width: 180,
    height: 35,
    borderRadius: 100,
    backgroundColor: "#D5F5F2",
    right: -45,
    bottom: -18,
    transform: [
      {
        rotate: "-8deg",
      },
    ],
  },

  waveIndigoLight: {
    position: "absolute",
    width: 180,
    height: 35,
    borderRadius: 100,
    backgroundColor: "#F1F2FF",
    right: -45,
    bottom: -18,
    transform: [
      {
        rotate: "-8deg",
      },
    ],
  },

  // =====================================================
  // INSPIRATION
  // =====================================================

  inspirationCard: {
    minHeight: 105,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D8E8E6",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    overflow: "hidden",
  },

  inspirationIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  inspirationContent: {
    flex: 1,
  },

  inspirationTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#48716d",
    marginBottom: 4,
  },

  inspirationSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },

  // =====================================================
  // FOOTER
  // =====================================================

  footer: {
    alignItems: "center",
    paddingBottom: 8,
  },

  footerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4338CA",
    marginBottom: 4,
  },

  footerSubtitle: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  // =====================================================
  // PRESS
  // =====================================================

  pressed: {
    opacity: 0.82,
  },
});