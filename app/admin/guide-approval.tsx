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
  // APPROVE ALL LOADING
  // =====================================================

  const [approvingAll, setApprovingAll] =
    useState(false);

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
  // APPROVE ALL
  // =====================================================

  const approveAllGuides = async () => {
    if (guides.length === 0) {
      return;
    }

    try {
      setApprovingAll(true);

      await Promise.all(
        guides.map((guide) =>
          updateDoc(
            doc(db, "users", guide.id),
            {
              approvalStatus: "approved",
              status: "approved",
            }
          )
        )
      );

      setGuides([]);

      Alert.alert(
        "Guides Approved",
        "All pending guides have been approved successfully."
      );
    } catch (error) {
      console.error(
        "Approve all guides error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to approve all guides."
      );
    } finally {
      setApprovingAll(false);
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

        {/* =================================================
            HEADER
        ================================================= */}
{/* 
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
        </View> */}

        {/* =================================================
            COUNT
        ================================================= */}

        <View style={styles.countCard}>
          <Text style={styles.countNumber}>
            {guides.length}
          </Text>

          <Text style={styles.countText}>
            Pending Guide Requests
          </Text>
        </View>

        {/* =================================================
            APPROVE ALL
        ================================================= */}

        {guides.length > 0 && (
          <TouchableOpacity
            style={[
              styles.approveAllButton,
              approvingAll &&
                styles.approveAllButtonDisabled,
            ]}
            onPress={approveAllGuides}
            disabled={approvingAll}
            activeOpacity={0.8}
          >
            {approvingAll ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.approveAllText}>
              {approvingAll
                ? "Approving All..."
                : "Approve All Guides"}
            </Text>
          </TouchableOpacity>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

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
              {/* =================================================
                  USER INFO
              ================================================= */}

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

              {/* =================================================
                  DIVIDER
              ================================================= */}

              <View style={styles.divider} />

              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <View style={styles.actionRow}>
                {/* -------------------------------------------------
                    REJECT
                ------------------------------------------------- */}

                <TouchableOpacity
                  style={styles.rejectButton}
                  disabled={
                    processingUser === guide.id ||
                    approvingAll
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

                {/* -------------------------------------------------
                    APPROVE
                ------------------------------------------------- */}

                <TouchableOpacity
                  style={styles.approveButton}
                  disabled={
                    processingUser === guide.id ||
                    approvingAll
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

// =====================================================
// STYLES
// =====================================================

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

  // =====================================================
  // HEADER
  // =====================================================

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

  // =====================================================
  // COUNT
  // =====================================================

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

  // =====================================================
  // APPROVE ALL
  // =====================================================

  approveAllButton: {
    height: 46,
    borderRadius: 11,
    backgroundColor: "#4338CA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  approveAllButtonDisabled: {
    opacity: 0.7,
  },

  approveAllText: {
    marginLeft: 7,
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // =====================================================
  // EMPTY
  // =====================================================

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

  // =====================================================
  // USER CARD
  // =====================================================

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

  // =====================================================
  // DIVIDER
  // =====================================================

  divider: {
    height: 1,
    backgroundColor: "#EEF0F4",
    marginVertical: 15,
  },

  // =====================================================
  // ACTION ROW
  // =====================================================

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  // =====================================================
  // REJECT
  // =====================================================

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

  // =====================================================
  // APPROVE
  // =====================================================

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