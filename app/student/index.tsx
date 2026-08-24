import { signOut } from "firebase/auth";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { auth } from "../../firebase/firebaseConfig";

export default function StudentDashboard() {
  const handleLogout = async () => {
    try {
      await signOut(auth);

      console.log("User logged out successfully");
    } catch (error: any) {
      console.log("Logout error:", error);

      Alert.alert(
        "Logout Error",
        error.message || "Something went wrong while logging out."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>

      <Text style={styles.subtitle}>
        Welcome to ProjectVerse
      </Text>

     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    color: "#111",
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },

});