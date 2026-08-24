import { StyleSheet, Text, View } from "react-native";

export default function GuideDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>ProjectVerse</Text>

      <Text style={styles.title}>
        Guide Dashboard
      </Text>

      <Text style={styles.subtitle}>
        Welcome to the ProjectVerse Guide Portal
      </Text>

      <Text style={styles.info}>
        Open the menu to manage your students,
        projects, reports and more.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 25,
    justifyContent: "center",
  },

  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 15,
  },

  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#111827",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
  },

  info: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 25,
    lineHeight: 22,
  },
});