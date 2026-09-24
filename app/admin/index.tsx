import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>
        Manage ProjectVerse overview and guide approvals
      </Text>

      <View style={styles.statsContainer}>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Students</Text>
          <Text style={styles.count}>0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guides</Text>
          <Text style={styles.count}>0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Submitted Projects</Text>
          <Text style={styles.count}>0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Approved Projects</Text>
          <Text style={styles.count}>0</Text>
        </View>

      </View>

      <View style={styles.approvalCard}>
        <Text style={styles.approvalTitle}>
          Guide Approvals
        </Text>

        <Text style={styles.approvalText}>
          Review and approve registered guides.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 20,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 24,
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 10,
  },

  count: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4338CA",
  },

  approvalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#D5F5F2",
  },

  approvalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },

  approvalText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
});