import { StyleSheet, Text, View } from "react-native";

export default function StudentDashboard() {
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