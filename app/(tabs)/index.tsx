import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

export default function HomeScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);

      router.replace("/login");
    } catch (error: any) {
      console.log("Logout error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProjectVerse 🚀</Text>

      <Text style={styles.subtitle}>Discover. Learn. Innovate.</Text>

      <Text style={styles.message}>Welcome to ProjectVerse</Text>

      <Pressable
        style={styles.loginButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable
        style={styles.registerButton}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.registerText}>Register</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },

  message: {
    fontSize: 18,
    marginTop: 40,
  },

  loginButton: {
    marginTop: 30,
    paddingVertical: 14,
    paddingHorizontal: 60,
    backgroundColor: "#2563EB",
    borderRadius: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerButton: {
    marginTop: 15,
    paddingVertical: 14,
    paddingHorizontal: 55,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
  },

  registerText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "bold",
  },

  logoutButton: {
  position: "absolute",
  top: 50,
  right: 20,

  backgroundColor: "#DC2626",
  paddingVertical: 5,
  paddingHorizontal: 10,
  borderRadius: 20,
},

logoutText: {
  color: "white",
  fontSize: 16,
  fontWeight: "bold",
},
});
