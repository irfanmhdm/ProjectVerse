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

      {/* Logo */}
      <Image
        source={require("../assets/images/ProjectVerseLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* App Name */}
      <Text style={styles.appName}>ProjectVerse</Text>

      <Text style={styles.tagline}>
        Discover. Learn. Innovate.
      </Text>

      <Text style={styles.welcome}>
        Welcome to ProjectVerse
      </Text>

      {/* Login */}
      <Pressable
        style={styles.loginButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.loginText}>Login</Text>
      </Pressable>

      {/* Register */}
      <Pressable
        style={styles.registerButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.registerText}>Register</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },

  appName: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#111",
  },

  tagline: {
    fontSize: 20,
    color: "#333",
    marginTop: 10,
  },

  welcome: {
    fontSize: 24,
    color: "#111",
    marginTop: 70,
    marginBottom: 40,
  },

  loginButton: {
    width: "60%",
    height: 70,
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  loginText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  registerButton: {
    width: "60%",
    height: 70,
    borderWidth: 2,
    borderColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  registerText: {
    color: "#2563EB",
    fontSize: 22,
    fontWeight: "bold",
  },
});