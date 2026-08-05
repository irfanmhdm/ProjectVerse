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

  logoutButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 30,
  },

  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
});