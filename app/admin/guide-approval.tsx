import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

type Guide = {
  id: string;
  name?: string;
  email?: string;
  employeeNumber?: string;
  approvalStatus?: string;
  status?: string;
};

export default function GuideApproval() {
  const [guides, setGuides] = useState<Guide[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [processingUser, setProcessingUser] =
    useState<string | null>(null);

  // =====================================================
  // LOAD GUIDES
  // =====================================================

  const loadGuides = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const snapshot = await getDocs(
        collection(db, "users")
      );

      const pendingGuides: Guide[] = [];

      snapshot.forEach((userDoc) => {
        const user = userDoc.data();

        const status =
          user.approvalStatus ?? user.status;

        if (
          user.role === "guide" &&
          status === "pending"
        ) {
          pendingGuides.push({
            id: userDoc.id,
            ...user,
          });
        }
      });

      setGuides(pendingGuides);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Unable to load guide requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGuides();
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadGuides();
  };

  // =====================================================
  // APPROVE
  // =====================================================

  const approveGuide = async (
    guideId: string
  ) => {
    try {
      setProcessingUser(guideId);

      await updateDoc(
        doc(db, "users", guideId),
        {
          approvalStatus: "approved",
          status: "approved",
        }
      );

      setGuides((current) =>
        current.filter(
          (guide) => guide.id !== guideId
        )
      );

      Alert.alert(
        "Guide Approved",
        "The guide can now log in."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Unable to approve guide."
      );
    } finally {
      setProcessingUser(null);
    }
  };

  // =====================================================
  // REJECT
  // =====================================================

  const rejectGuide = async (
    guideId: string
  ) => {
    try {
      setProcessingUser(guideId);

      await updateDoc(
        doc(db, "users", guideId),
        {
          approvalStatus: "rejected",
          status: "rejected",
        }
      );

      setGuides((current) =>
        current.filter(
          (guide) => guide.id !== guideId
        )
      );

      Alert.alert(
        "Guide Rejected",
        "The guide registration was rejected."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Unable to reject guide."
      );
    } finally {
      setProcessingUser(null);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="small"
          color="#4338CA"
        />

        <Text style={styles.loadingText}>
          Loading guide requests...
        </Text>
      </View>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4338CA"
          />
        }
      >

        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons
              name="school-outline"
              size={25}
              color="#4338CA"
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.title}>
              Guide Approval
            </Text>

            <Text style={styles.subtitle}>
              Review guide registration requests
            </Text>
          </View>
        </View>

        <View style={styles.countCard}>
          <Text style={styles.countNumber}>
            {guides.length}
          </Text>

          <Text style={styles.countText}>
            Pending Guide Requests
          </Text>
        </View>

        {guides.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-done-outline"
                size={30}
                color="#4338CA"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Pending Requests
            </Text>

            <Text style={styles.emptyText}>
              There are no guide registration
              requests waiting for approval.
            </Text>
          </View>
        ) : (
          guides.map((guide) => (
            <View
              key={guide.id}
              style={styles.userCard}
            >
              <View style={styles.userInfo}>
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

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="id-card-outline"
                      size={14}
                      color="#6B7280"
                    />

                    <Text style={styles.infoText}>
                      {guide.employeeNumber ||
                        "No employee number"}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="mail-outline"
                      size={14}
                      color="#6B7280"
                    />

                    <Text style={styles.infoText}>
                      {guide.email || "No email"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  disabled={
                    processingUser === guide.id
                  }
                  onPress={() =>
                    rejectGuide(guide.id)
                  }
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={19}
                    color="#DC2626"
                  />

                  <Text style={styles.rejectText}>
                    Reject
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  disabled={
                    processingUser === guide.id
                  }
                  onPress={() =>
                    approveGuide(guide.id)
                  }
                >
                  {processingUser === guide.id ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                  )}

                  <Text style={styles.approveText}>
                    Approve
                  </Text>
                </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
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

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#1F2937",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12.5,
    color: "#6B7280",
  },

  countCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  countNumber: {
    fontSize: 27,
    fontWeight: "700",
    color: "#4338CA",
  },

  countText: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },

  userCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  details: {
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  infoText: {
    marginLeft: 5,
    fontSize: 12.5,
    color: "#6B7280",
    flexShrink: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#EEF0F4",
    marginVertical: 15,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  rejectButton: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  rejectText: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#DC2626",
  },

  approveButton: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  approveText: {
    marginLeft: 6,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});