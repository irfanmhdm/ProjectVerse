import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

type Guide = {
  id: string;
  name?: string;
  email?: string;
  employeeNumber?: string;
};

export default function ApprovedGuides() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGuides = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const approved: Guide[] = [];

      snapshot.forEach((userDoc) => {
        const user = userDoc.data();

        const status =
          user.approvalStatus ?? user.status;

        if (
          user.role === "guide" &&
          status === "approved"
        ) {
          approved.push({
            id: userDoc.id,
            ...user,
          });
        }
      });

      setGuides(approved);
    } catch (error) {
      console.error(
        "Error loading approved guides:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGuides();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          color="#4338CA"
        />

        <Text style={styles.loadingText}>
          Loading approved guides...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadGuides();
            }}
            tintColor="#4338CA"
          />
        }
      >
        {/* <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons
              name="school-outline"
              size={26}
              color="#4338CA"
            />
          </View>

          <View>
            <Text style={styles.title}>
              Approved Guides
            </Text>

            <Text style={styles.subtitle}>
              {guides.length} approved guide
              {guides.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View> */}

        {guides.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="school-outline"
              size={35}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              No Approved Guides
            </Text>
          </View>
        ) : (
          guides.map((guide) => (
            <View
              key={guide.id}
              style={styles.card}
            >
              <View style={styles.avatar}>
                <Ionicons
                  name="person-outline"
                  size={23}
                  color="#4338CA"
                />
              </View>

              <View style={styles.details}>
                <Text style={styles.name}>
                  {guide.name || "Guide"}
                </Text>

                <Text style={styles.employee}>
                  {guide.employeeNumber ||
                    "No employee number"}
                </Text>

                <Text style={styles.email}>
                  {guide.email || "No email"}
                </Text>
              </View>

              <View style={styles.status}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#15803D"
                />

                <Text style={styles.statusText}>
                  Approved
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 10,
    color: "#6B7280",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  details: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  employee: {
    marginTop: 4,
    fontSize: 12.5,
    color: "#374151",
  },

  email: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  status: {
    alignItems: "center",
    marginLeft: 8,
  },

  statusText: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: "600",
    color: "#15803D",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 35,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
});