import { StyleSheet, Text, View } from "react-native";

export default function Students() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Students</Text>

      <Text style={styles.subtitle}>
        Students assigned under your guidance will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
  },
});