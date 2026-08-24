import { router } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { auth } from "../../firebase/firebaseConfig";

export default function GuideDashboard() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not logout.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>ProjectVerse</Text>

      <Text style={styles.title}>Guide Dashboard</Text>

      <Text style={styles.subtitle}>
        Welcome to the ProjectVerse Guide Portal
      </Text>

      {/* Add Student Button */}
      <Pressable
        style={styles.addStudentButton}
        onPress={() => router.push("/guide/add-student")}
      >
        <Text style={styles.addStudentButtonText}>
          + Add Student
        </Text>
      </Pressable>

      {/* Logout Button */}
      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
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
    padding: 30,
  },

  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },

  addStudentButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
  },

  addStudentButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  logoutButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },

  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
});