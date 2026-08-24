import { createUserWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studentClass, setStudentClass] = useState("");

  const handleRegister = async () => {
    // 1. Check for empty fields
    if (
      name.trim() === "" ||
      email.trim() === "" ||
      studentClass.trim() === "" ||
      password.trim() === "" ||
      confirmPassword.trim() === ""
    ) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // 2. Check whether passwords match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    // 3. If validation passed, create Firebase account
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name.trim(),
        email: email.trim(),
        class: studentClass.trim(),
        role: "student",
      });

      console.log("User UID:", userCredential.user.uid);

      Alert.alert("Success", "Your ProjectVerse account has been created!");
      router.replace("/login");
    } catch (error: any) {
      console.log(error);

      Alert.alert("Registration Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>ProjectVerse</Text>

      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.subtitle}>
        Join ProjectVerse and explore academic projects
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#777"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Class"
        placeholderTextColor="#777"
        value={studentClass}
        onChangeText={setStudentClass}
      />

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

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#777"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Pressable style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
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

  registerButton: {
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
});
