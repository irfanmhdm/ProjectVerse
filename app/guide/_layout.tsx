
import { Drawer } from "expo-router/drawer";
import { router, usePathname } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { BackHandler } from "react-native";
import { useEffect, useState } from "react";

import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
} from "react-native";

import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

import { Ionicons } from "@expo/vector-icons";

import { auth, db } from "../../firebase/firebaseConfig";

import {
  listenToNotifications,
  markNotificationsAsRead,
  AppNotification,
} from "../../utils/notifications";

// =====================================================
// NOTIFICATION BUTTON
// =====================================================

function NotificationButton() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [visible, setVisible] = useState(false);

  // ===================================================
  // REAL-TIME NOTIFICATIONS
  // ===================================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setNotifications([]);
      return;
    }

    return listenToNotifications(
      user.uid,
      setNotifications
    );
  }, []);

  // ===================================================
  // UNREAD COUNT
  // ===================================================

  const unreadCount = notifications.filter(
    (notification) => notification.isRead !== true
  ).length;

  // ===================================================
  // OPEN NOTIFICATIONS AND MARK CURRENT UNREAD ITEMS
  // ===================================================

  const openNotifications = async () => {
    setVisible(true);

    try {
      await markNotificationsAsRead(notifications);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  // ===================================================
  // NOTIFICATION HEADER BUTTON
  // ===================================================

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${unreadCount} unread`}
        onPress={openNotifications}
        style={styles.notificationButton}
      >
        <Ionicons
          name="notifications-outline"
          size={25}
          color="#4338CA"
        />

        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* ===============================================
          NOTIFICATION POPUP
      =============================================== */}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.notificationOverlay}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={styles.notificationPopup}
            onPress={(event) => event.stopPropagation()}
          >
            {/* POPUP HEADER */}

            <View style={styles.notificationPopupHeader}>
              <View style={styles.notificationHeadingRow}>
                <Ionicons
                  name="notifications"
                  size={22}
                  color="#4338CA"
                />

                <Text style={styles.notificationPopupTitle}>
                  Notifications
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
                onPress={() => setVisible(false)}
                style={styles.notificationCloseButton}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#6B7280"
                />
              </Pressable>
            </View>

            {/* NOTIFICATION LIST */}

            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Ionicons
                  name="notifications-off-outline"
                  size={42}
                  color="#9CA3AF"
                />

                <Text style={styles.emptyNotificationTitle}>
                  No notifications yet
                </Text>

                <Text style={styles.emptyNotificationMessage}>
                  Project submissions and revisions will
                  appear here.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.notificationList}
                showsVerticalScrollIndicator={true}
              >
                {notifications.map((item) => (
                  <View
                    key={item.id}
                    style={styles.notificationItem}
                  >
                    <View style={styles.notificationItemIcon}>
                      <Ionicons
                        name={
                          item.type === "project_submitted"
                            ? "document-text-outline"
                            : item.type === "project_revision"
                            ? "git-branch-outline"
                            : item.type === "project_approved"
                            ? "checkmark-circle-outline"
                            : item.type === "project_rejected"
                            ? "close-circle-outline"
                            : item.type === "changes_requested"
                            ? "create-outline"
                            : "notifications-outline"
                        }
                        size={21}
                        color="#4338CA"
                      />
                    </View>

                    <View style={styles.notificationItemContent}>
                      <View style={styles.notificationTitleRow}>
                        <Text style={styles.notificationItemTitle}>
                          {item.title}
                        </Text>

                        {item.isRead !== true && (
                          <View
                            accessibilityLabel="Unread notification"
                            style={styles.unreadDot}
                          />
                        )}
                      </View>

                      <Text style={styles.notificationItemMessage}>
                        {item.message}
                      </Text>

                      <Text style={styles.notificationDate}>
                        {item.createdAt?.toDate
                          ? item.createdAt.toDate().toLocaleString()
                          : "Just now"}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// =====================================================
// CUSTOM DRAWER
// =====================================================

function CustomDrawerContent(props: any) {
  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);

      Alert.alert(
        "Logout Failed",
        "Something went wrong while logging out."
      );
    }
  };

  // ===================================================
  // DRAWER UI
  // ===================================================

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}
      >
        {/* DRAWER HEADER */}

        <View style={styles.drawerHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View>
              <Text style={styles.appName}>
                ProjectVerse
              </Text>

              <Text style={styles.role}>
                Guide Portal
              </Text>
            </View>
          </View>
        </View>

        {/* DRAWER PAGES */}

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* LOGOUT */}

      <View style={styles.logoutContainer}>
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#DC2626"
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================
// GUIDE LAYOUT
// =====================================================

export default function GuideLayout() {
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Keep drawer Chat badge and menu icon synced with the same chat documents
  // used by the guide chat list. Listen to assignments first, then each chat doc.
  useEffect(() => {
    let unsubscribeAssignments: (() => void) | undefined;
    let unsubscribeAuth: (() => void) | undefined;
    let chatUnsubscribers: (() => void)[] = [];
    let unreadByChat = new Map<string, number>();

    const stopChatListeners = () => {
      chatUnsubscribers.forEach((unsubscribe) => unsubscribe());
      chatUnsubscribers = [];
      unreadByChat.clear();
    };

    unsubscribeAuth = onAuthStateChanged(auth, (guide) => {
      unsubscribeAssignments?.();
      unsubscribeAssignments = undefined;
      stopChatListeners();
      setUnreadChatCount(0);

      if (!guide?.uid) return;

      const assignmentsQuery = query(
        collection(db, "guideStudents"),
        where("guideId", "==", guide.uid),
      );

      unsubscribeAssignments = onSnapshot(
        assignmentsQuery,
        (assignmentsSnapshot) => {
          stopChatListeners();
          setUnreadChatCount(0);

          assignmentsSnapshot.docs.forEach((assignmentDoc) => {
            const assignment = assignmentDoc.data();
            const studentId = assignment.studentId;
            if (typeof studentId !== "string" || !studentId) return;

            const chatId = `${guide.uid}_${studentId}`;
            const unsubscribeChat = onSnapshot(
              doc(db, "chats", chatId),
              (chatSnapshot) => {
                const rawCount = chatSnapshot.exists()
                  ? chatSnapshot.data().unreadGuideCount
                  : 0;
                const count = Number(rawCount ?? 0);
                unreadByChat.set(
                  chatId,
                  Number.isFinite(count) && count > 0 ? count : 0,
                );
                const total = Array.from(unreadByChat.values()).reduce(
                  (sum, value) => sum + value,
                  0,
                );
                setUnreadChatCount(total);
              },
              (error) => {
                console.log("Guide drawer chat badge listener error:", error.code || error);
              },
            );
            chatUnsubscribers.push(unsubscribeChat);
          });
        },
        (error) => {
          console.log("Guide assignments badge listener error:", error.code || error);
          setUnreadChatCount(0);
        },
      );
    });

    return () => {
      unsubscribeAuth?.();
      unsubscribeAssignments?.();
      stopChatListeners();
    };
  }, []);
  // ===================================================
  // CURRENT ROUTE
  // ===================================================

  const pathname = usePathname();

  // ===================================================
  // ANDROID BACK HANDLING
  // ===================================================

  useEffect(() => {
    const handleAndroidBack = () => {
      console.log("Android back pressed:", pathname);

      // MAIN GUIDE HOME

      if (
        pathname === "/guide" ||
        pathname === "/guide/"
      ) {
        console.log("Guide home - exiting app");

        BackHandler.exitApp();
        return true;
      }

      // MAIN DRAWER PAGES

      const mainDrawerPages = [
        "/guide/students",
        "/guide/add-student",
        "/guide/projects",
        "/guide/chat",
        "/guide/profile",
      ];

      if (mainDrawerPages.includes(pathname)) {
        console.log(
          "Main drawer page - returning to Guide Home"
        );

        router.replace("/guide");
        return true;
      }

      // PROJECT DETAILS, REVISE AND CHAT CONVERSATIONS
      // KEEP THEIR EXISTING NAVIGATION FLOW.

      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleAndroidBack
    );

    return () => {
      subscription.remove();
    };
  }, [pathname]);

  // ===================================================
  // DRAWER
  // ===================================================

  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
      backBehavior="history"
      screenOptions={({ navigation }) => ({
        // HEADER
        headerShown: true,
        headerLeft: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open navigation menu${unreadChatCount > 0 ? `, ${unreadChatCount} unread chat messages` : ""}`}
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
          >
            <Ionicons name="menu" size={27} color="#1F2937" />
            {unreadChatCount > 0 && (
              <View style={styles.menuChatBadge}>
                <Text style={styles.menuChatBadgeText}>
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </Text>
              </View>
            )}
          </Pressable>
        ),
        headerRight: () => <NotificationButton />,

        // DRAWER COLORS

        drawerActiveTintColor: "#4338CA",
        drawerInactiveTintColor: "#374151",

        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
          marginLeft: -5,
        },

        // DRAWER STYLE

        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 285,
        },

        drawerActiveBackgroundColor: "#D5F5F2",

        // HEADER STYLE

        headerStyle: {
          backgroundColor: "#FFFFFF",
        },

        headerTintColor: "#1F2937",

        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
          color: "#1F2937",
        },
      })}
    >
      {/* HOME */}

      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
          drawerLabel: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="grid-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* MY STUDENTS */}

      <Drawer.Screen
        name="students"
        options={{
          title: "My Students",
          drawerLabel: "My Students",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="people-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* ADD STUDENT */}

      <Drawer.Screen
        name="add-student"
        options={{
          title: "Add Student",
          drawerLabel: "Add Student",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="person-add-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* PROJECTS */}

      <Drawer.Screen
        name="projects"
        options={{
          title: "Projects",
          drawerLabel: "Projects",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="folder-open-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* CHAT LIST */}

      <Drawer.Screen
        name="chat"
        options={{
          title: "Chat",
          drawerLabel: ({ color }) => (
            <View style={styles.chatDrawerLabel}>
              <Text style={[styles.chatDrawerLabelText, { color }]}>Chat</Text>
              {unreadChatCount > 0 && (
                <View style={styles.chatDrawerBadge}>
                  <Text style={styles.chatDrawerBadgeText}>
                    {unreadChatCount > 99 ? "99+" : unreadChatCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubbles-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* CHAT CONVERSATION - HIDDEN */}

      <Drawer.Screen
        name="chat/[studentId]"
        options={{
          headerShown: false,
          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      {/* PROFILE */}

      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
          drawerLabel: "Profile",
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="person-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* PROJECT DETAILS - HIDDEN */}

      <Drawer.Screen
        name="project-details"
        options={{
          title: "Project Details",
          drawerItemStyle: {
            display: "none",
          },
        }}
      />
    </Drawer>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // DRAWER

  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  drawerContent: {
    paddingTop: 0,
  },

  // DRAWER HEADER

  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },

  appName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#4338CA",
  },

  role: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },

  // LOGOUT

  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
    marginLeft: 12,
  },

  // CHAT UNREAD BADGES
  menuButton: {
    marginLeft: 8,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  menuChatBadge: {
    position: "absolute",
    top: 0,
    right: -1,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  menuChatBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  chatDrawerLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 24,
  },
  chatDrawerLabelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  chatDrawerBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  chatDrawerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // NOTIFICATION HEADER BUTTON

  notificationButton: {
    marginRight: 18,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationBadge: {
    position: "absolute",
    right: -2,
    top: -1,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // NOTIFICATION POPUP

  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingHorizontal: 12,
  },

  notificationPopup: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "75%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  notificationPopupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  notificationHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  notificationPopupTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
  },

  notificationCloseButton: {
    padding: 4,
  },

  notificationList: {
    flexGrow: 0,
  },

  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 11,
  },

  notificationItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationItemContent: {
    flex: 1,
  },

  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4338CA",
    marginTop: 3,
  },

  notificationDate: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 7,
  },

  notificationItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },

  notificationItemMessage: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 4,
    lineHeight: 19,
  },

  // EMPTY NOTIFICATIONS

  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 12,
  },

  emptyNotificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
  },

  emptyNotificationMessage: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
});
