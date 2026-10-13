import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  phone?: string;
  college?: string;
  department?: string;
  class?: string;
  qualification?: string;
  [key: string]: any;
};

export default function ApprovedGuides() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

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

  const filteredGuides = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return guides;
    }

    return guides.filter((guide) =>
      [
        guide.name,
        guide.employeeNumber,
        guide.email,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(search)
      )
    );
  }, [guides, searchText]);

  const detailRows = (guide: Guide) => {
    const fields: { label: string; value: unknown }[] = [
      { label: "Name", value: guide.name },
      { label: "Employee Number", value: guide.employeeNumber },
      { label: "Email", value: guide.email },
      { label: "Phone", value: guide.phone ?? guide.phoneNumber },
      { label: "College", value: guide.college },
      {
        label: "Department / Class",
        value: guide.department ?? guide.class ?? guide.classDepartment,
      },
      { label: "Qualification", value: guide.qualification },
    ];

    return fields.filter(
      (field) =>
        field.value !== undefined &&
        field.value !== null &&
        String(field.value).trim() !== ""
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4338CA" />

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
        keyboardShouldPersistTaps="handled"
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
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#6B7280"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, employee no. or email"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText("")}
              accessibilityRole="button"
              accessibilityLabel="Clear guide search"
            >
              <Ionicons
                name="close-circle"
                size={19}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>

        {filteredGuides.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name={searchText.trim() ? "search-outline" : "school-outline"}
              size={35}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              {searchText.trim()
                ? "No Matching Guides"
                : "No Approved Guides"}
            </Text>

            {searchText.trim() ? (
              <Text style={styles.emptySubtitle}>
                Try another name, employee number, or email.
              </Text>
            ) : null}
          </View>
        ) : (
          filteredGuides.map((guide) => (
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

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => setSelectedGuide(guide)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${guide.name || "guide"}`}
                >
                  <Ionicons
                    name="eye-outline"
                    size={21}
                    color="#4338CA"
                  />
                </TouchableOpacity>

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
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={selectedGuide !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGuide(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setSelectedGuide(null)}
            accessibilityRole="button"
            accessibilityLabel="Close guide details"
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeading}>
                <View style={styles.modalAvatar}>
                  <Ionicons
                    name="person-outline"
                    size={25}
                    color="#4338CA"
                  />
                </View>

                <View style={styles.modalHeadingText}>
                  <Text style={styles.modalTitle}>
                    Guide Details
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Approved guide information
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedGuide(null)}
                accessibilityRole="button"
                accessibilityLabel="Close popup"
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#4B5563"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedGuide &&
                detailRows(selectedGuide).map((field) => (
                  <View
                    key={field.label}
                    style={styles.detailRow}
                  >
                    <Text style={styles.detailLabel}>
                      {field.label}
                    </Text>
                    <Text style={styles.detailValue}>
                      {String(field.value)}
                    </Text>
                  </View>
                ))}

              <View style={styles.approvedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={17}
                  color="#15803D"
                />
                <Text style={styles.approvedBadgeText}>
                  Approved
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setSelectedGuide(null)}
              accessibilityRole="button"
            >
              <Text style={styles.doneButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  searchContainer: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7EAF0",
    paddingHorizontal: 13,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    paddingHorizontal: 9,
    fontSize: 13,
    color: "#1F2937",
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
    minWidth: 0,
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

  actions: {
    alignItems: "center",
    marginLeft: 8,
  },

  viewButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  status: {
    alignItems: "center",
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
    textAlign: "center",
  },

  emptySubtitle: {
    marginTop: 7,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "82%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalHeading: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  modalAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  modalHeadingText: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  modalScroll: {
    flexShrink: 1,
  },

  modalScrollContent: {
    paddingBottom: 8,
  },

  detailRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },

  approvedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 14,
  },

  approvedBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#15803D",
  },

  doneButton: {
    backgroundColor: "#4338CA",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },

  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
