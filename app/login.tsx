import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      console.log("Logged in UID:", userCredential.user.uid);

      Alert.alert("Login Successful","Welcome to ProjectVerse");
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
});
