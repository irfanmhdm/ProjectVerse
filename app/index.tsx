import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* =====================================================
          TOP BRANDING
      ===================================================== */}

      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>ProjectVerse</Text>

        <Text style={styles.tagline}>
          Discover. Learn. Innovate.
        </Text>
      </View>

      {/* =====================================================
          WELCOME CARD
      ===================================================== */}

      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIcon}>
          <Ionicons
            name="sparkles-outline"
            size={24}
            color="#4338CA"
          />
        </View>

        <Text style={styles.welcomeTitle}>
          Welcome to ProjectVerse
        </Text>

        <Text style={styles.welcomeDescription}>
          A platform to discover projects, manage submissions,
          collaborate with guides, and turn ideas into reality.
        </Text>
      </View>

      {/* =====================================================
          ACTION BUTTONS
      ===================================================== */}

      <View style={styles.actions}>
        {/* LOGIN */}

        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/login")}
        >
          <View style={styles.buttonIcon}>
            <Ionicons
              name="log-in-outline"
              size={21}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.loginText}>Login</Text>

          <Ionicons
            name="arrow-forward"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>

        {/* REGISTER */}

        <Pressable
          style={({ pressed }) => [
            styles.registerButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push("/register")}
        >
          <View style={styles.registerIcon}>
            <Ionicons
              name="person-add-outline"
              size={20}
              color="#4338CA"
            />
          </View>

          <Text style={styles.registerText}>
            Create an Account
          </Text>

          <Ionicons
            name="arrow-forward"
            size={19}
            color="#4338CA"
          />
        </Pressable>
      </View>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <View style={styles.footer}>
        <View style={styles.footerLine} />

        <Text style={styles.footerText}>
          Academic Project Management Platform
        </Text>
      </View>
    </View>
  );
}

// ==========================================================
// STYLES
// ==========================================================

const styles = StyleSheet.create({
  // ========================================================
  // CONTAINER
  // ========================================================

  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // ========================================================
  // BRANDING
  // ========================================================

  brandSection: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#E5E7EB",

    shadowColor: "#1F2937",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,
  },

  logo: {
    width: 82,
    height: 82,
  },

  appName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#4338CA",
    letterSpacing: -0.8,
  },

  tagline: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // ========================================================
  // WELCOME CARD
  // ========================================================

  welcomeCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E4EC",
    marginBottom: 22,
  },

  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#D5F5F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },

  welcomeDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // ========================================================
  // ACTIONS
  // ========================================================

  actions: {
    width: "100%",
    maxWidth: 430,
  },

  // ========================================================
  // LOGIN
  // ========================================================

  loginButton: {
    minHeight: 54,
    width: "100%",
    backgroundColor: "#4338CA",
    borderRadius: 14,
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 12,

    shadowColor: "#4338CA",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,

    elevation: 4,
  },

  buttonIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  loginText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // ========================================================
  // REGISTER
  // ========================================================

  registerButton: {
    minHeight: 54,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1.5,
    borderColor: "#4338CA",
  },

  registerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  registerText: {
    flex: 1,
    color: "#4338CA",
    fontSize: 15,
    fontWeight: "700",
  },

  // ========================================================
  // PRESS
  // ========================================================

  buttonPressed: {
    opacity: 0.78,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  // ========================================================
  // FOOTER
  // ========================================================

  footer: {
    width: "100%",
    maxWidth: 430,
    alignItems: "center",
    marginTop: 25,
  },

  footerLine: {
    width: 45,
    height: 3,
    borderRadius: 5,
    backgroundColor: "#38B2AC",
    marginBottom: 9,
  },

  footerText: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "500",
    textAlign: "center",
  },
});