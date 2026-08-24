import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>ProjectVerse 🚀</Text>

      <Text style={styles.tagline}>Discover. Learn. Innovate.</Text>

      <Text style={styles.welcome}>Welcome to ProjectVerse</Text>

      <Pressable
        style={styles.loginButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.loginText}>Login</Text>
      </Pressable>

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
    width: "90%",
    backgroundColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 20,
  },

  loginText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  registerButton: {
    width: "90%",
    borderWidth: 2,
    borderColor: "#2563EB",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },

  registerText: {
    color: "#2563EB",
    fontSize: 22,
    fontWeight: "bold",
  },
});