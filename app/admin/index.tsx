import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>
        Manage ProjectVerse users and guide approvals
      </Text>

      {/* Statistics */}

      <View style={styles.statsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardNumber}>0</Text>
          <Text style={styles.cardLabel}>Students</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber}>0</Text>
          <Text style={styles.cardLabel}>Guides</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber}>0</Text>
          <Text style={styles.cardLabel}>Submitted Projects</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardNumber}>0</Text>
          <Text style={styles.cardLabel}>Approved Projects</Text>
        </View>
      </View>

      {/* Guide Approval */}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Guide Approval
        </Text>

        <Text style={styles.emptyText}>
          No pending guide approvals.
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
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    elevation: 2,
  },

  cardNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4338CA",
  },

  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginTop: 10,
    marginBottom: 30,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
});