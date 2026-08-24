import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";

import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { auth, db } from "../firebase/firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    // Check empty fields
    if (email.trim() === "" || password.trim() === "") {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    try {
      // 1. Login using Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      // 2. Get logged-in user's UID
      const uid = userCredential.user.uid;

      // 3. Find user's profile in Firestore
      const userDoc = await getDoc(doc(db, "users", uid));

      // 4. Check whether profile exists
      if (!userDoc.exists()) {
        Alert.alert("Error", "User profile not found.");
        return;
      }

      // 5. Get user information
      const userData = userDoc.data();

      console.log("Logged in UID:", uid);
      console.log("User role:", userData.role);

      // 6. Redirect based on role
      if (userData.role === "student") {
        Alert.alert("Login Successful", "Welcome to ProjectVerse");

        router.replace("/student");
      } else if (userData.role === "guide") {
        Alert.alert("Login Successful", "Welcome, Guide!");
        router.replace("/guide");
      } else {
        Alert.alert("Error", "Invalid user role.");
      }
    } catch (error: any) {
      console.log(error);

      Alert.alert("Login Failed", "Invalid email or password.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>ProjectVerse</Text>

      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.subtitle}>Login to continue exploring projects</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#777"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable
        style={styles.registerLink}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.registerText}>Don't have an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "white",
  },

  appName: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2563EB",
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111",
  },

  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    marginTop: 8,
    marginBottom: 30,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111",
    marginBottom: 15,
  },

  loginButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },

  registerText: {
    fontSize: 15,
    color: "#2563EB",
    fontWeight: "600",
  },
});
