import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { auth, db } from "../../firebase/firebaseConfig";

export default function AddProject() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Check required fields
    if (
      title.trim() === "" ||
      description.trim() === "" ||
      domain.trim() === "" ||
      technologies.trim() === ""
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    // Get currently logged-in student
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You must be logged in to add a project.");
      return;
    }

    try {
      setLoading(true);

      // Create project document in Firestore
      const projectRef = await addDoc(collection(db, "projects"), {
        title: title.trim(),
        description: description.trim(),
        domain: domain.trim(),
        technologies: technologies.trim(),
        githubUrl: githubUrl.trim(),

        studentId: user.uid,

        status: "pending",

        createdAt: serverTimestamp(),
      });

      console.log("Project created:", projectRef.id);

      Alert.alert("Success", "Project added successfully!");

      // Clear the form
      setTitle("");
      setDescription("");
      setDomain("");
      setTechnologies("");
      setGithubUrl("");
    } catch (error) {
      console.log("Error adding project:", error);

      Alert.alert("Error", "Something went wrong while adding the project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Project</Text>

      <Text style={styles.subtitle}>
        Add your academic project to ProjectVerse
      </Text>

      <Text style={styles.label}>Project Title *</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter project title"
        placeholderTextColor="#777"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description *</Text>

      <TextInput
        style={[styles.input,styles.textArea]}
        placeholder="Describe your project"
        placeholderTextColor="#777"
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>Domain *</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: Artificial Intelligence"
        placeholderTextColor="#777"
        value={domain}
        onChangeText={setDomain}
      />

      <Text style={styles.label}>Technologies Used *</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: React Native, Firebase"
        placeholderTextColor="#777"
        value={technologies}
        onChangeText={setTechnologies}
      />

      <Text style={styles.label}>GitHub Repository</Text>

      <TextInput
        style={styles.input}
        placeholder="https://github.com/..."
        placeholderTextColor="#777"
        value={githubUrl}
        onChangeText={setGithubUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      <Pressable
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Submitting..." : "Submit Project"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },

  content: {
    padding: 25,
    paddingBottom: 50,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 6,
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    color: "#111",
    marginBottom: 18,
  },

  textArea: {
    height: 120,
  },

  submitButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
