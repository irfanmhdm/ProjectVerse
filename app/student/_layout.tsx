import { Drawer } from "expo-router/drawer";
import { router, usePathname } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Alert,
  BackHandler,
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
import { auth } from "../../firebase/firebaseConfig";
import { useEffect, useState } from "react";
import {
  listenToNotifications,
  AppNotification,
} from "../../utils/notifications";
// =====================================================
// CUSTOM DRAWER
// =====================================================
// =====================================================
// NOTIFICATION BUTTON
// =====================================================
function NotificationButton() {
  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setNotifications([]);
      return;
    }
    return listenToNotifications(user.uid, setNotifications);
  }, []);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${notifications.length} total`}
        onPress={() => setVisible(true)}
        style={styles.notificationButton}
      >
        <Ionicons
          name="notifications-outline"
          size={25}
          color="#4338CA"
        />
        {notifications.length > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {notifications.length > 99 ? "99+" : notifications.length}
            </Text>
          </View>
        )}
      </Pressable>
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
            <View style={styles.notificationPopupHeader}>
              <View style={styles.notificationHeadingRow}>
                <Ionicons name="notifications" size={22} color="#4338CA" />
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
                <Ionicons name="close" size={23} color="#6B7280" />
              </Pressable>
            </View>
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
                  Project reviews and status updates will appear here.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.notificationList}
                showsVerticalScrollIndicator
              >
                {notifications.map((item) => (
                  <View key={item.id} style={styles.notificationItem}>
                    <View style={styles.notificationItemIcon}>
                      <Ionicons
                        name={
                          item.type === "project_approved"
                            ? "checkmark-circle-outline"
                            : item.type === "project_rejected"
                            ? "close-circle-outline"
                            : item.type === "changes_requested"
                            ? "create-outline"
                            : item.type === "project_revision"
                            ? "git-branch-outline"
                            : "notifications-outline"
                        }
                        size={21}
                        color="#4338CA"
                      />
                    </View>
                    <View style={styles.notificationItemContent}>
                      <Text style={styles.notificationItemTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.notificationItemMessage}>
                        {item.message}
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
  // UI
  // ===================================================
  return (
    <View style={styles.drawerContainer}>
      {/* =================================================
          DRAWER CONTENT
      ================================================= */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}
      >
        {/* =================================================
            DRAWER HEADER
        ================================================= */}
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
                Student Portal
              </Text>
            </View>
          </View>
        </View>
        {/* =================================================
            MAIN DRAWER ITEMS
        ================================================= */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      {/* =================================================
          LOGOUT
      ================================================= */}
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
// STUDENT LAYOUT
// =====================================================
export default function StudentLayout() {
  // =====================================================
  // CURRENT ROUTE
  // =====================================================
  const pathname = usePathname();
  // =====================================================
  // PROJECT HEADER TITLE
  // =====================================================
  let projectHeaderTitle = "Project";
  if (
    pathname.includes(
      "/project/project-details"
    )
  ) {
    projectHeaderTitle = "Project Details";
  }
  if (
    pathname.includes(
      "/project/revise-project"
    )
  ) {
    projectHeaderTitle = "Revise Project";
  }
  // =====================================================
  // PROJECT BACK HANDLING
  // =====================================================
  //
  // app/\\\_layout.tsx contains a general rule:
  //
  // /student/*
  //       ↓
  // /student
  //
  // That rule is useful for normal Student pages,
  // but it would incorrectly send:
  //
  // Revise Project
  //       ↓
  // Project Details
  //
  // directly to:
  //
  // Student Home
  //
  // Therefore this Student layout handles the nested
  // Project Stack first.
  //
  // =====================================================
  useEffect(() => {
    const backHandler =
      BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          // =================================================
          // REVISE PROJECT
          // =================================================
          if (
            pathname.includes(
              "/student/project/revise-project"
            )
          ) {
            console.log(
              "Revise Project -> Project Details"
            );
            // -----------------------------------------------
            // Let the nested project Stack pop.
            //
            // This returns to:
            //
            // /student/project/project-details
            // -----------------------------------------------
            router.back();
            return true;
          }
          // =================================================
          // PROJECT DETAILS
          // =================================================
          if (
            pathname.includes(
              "/student/project/project-details"
            )
          ) {
            console.log(
              "Project Details -> previous Student page"
            );
            // -----------------------------------------------
            // Project Details was entered from My Projects.
            //
            // router.back() returns to the previous route
            // instead of forcing Student Home.
            // -----------------------------------------------
            router.back();
            return true;
          }
          // =================================================
          // ALL OTHER STUDENT ROUTES
          // =================================================
          // -----------------------------------------------
          // Return false.
          //
          // The root app/\\\_layout.tsx will handle these
          // routes using your existing Student back logic.
          // -----------------------------------------------
          return false;
        }
      );
    // =====================================================
    // CLEANUP
    // =====================================================
    return () => {
      backHandler.remove();
    };
  }, [pathname]);
  // =====================================================
  // DRAWER
  // =====================================================
  return (
    <Drawer
      // =================================================
      // DRAWER BACK BEHAVIOR
      // =================================================
      backBehavior="history"
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
      screenOptions={{
        // =================================================
        // DEFAULT HEADER
        // =================================================
        headerShown: true,
        headerRight: () => <NotificationButton /> ,
        // =================================================
        // DRAWER COLORS
        // =================================================
        drawerActiveTintColor: "#4338CA",
        drawerInactiveTintColor: "#374151",
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
          marginLeft: -5,
        },
        // =================================================
        // DRAWER STYLE
        // =================================================
        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 285,
        },
        drawerActiveBackgroundColor: "#D5F5F2",
        // =================================================
        // HEADER STYLE
        // =================================================
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
          color: "#1F2937",
        },
        headerTintColor: "#4338CA",
      }}
    >
      {/* =================================================
          HOME
      ================================================= */}
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "ProjectVerse",
          drawerIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* =================================================
          MY PROJECTS
      ================================================= */}
      <Drawer.Screen
        name="my-projects"
        options={{
          drawerLabel: "My Projects",
          title: "My Projects",
          drawerIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="folder-open-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* =================================================
          UPLOAD PROJECT
      ================================================= */}
      <Drawer.Screen
        name="add-project"
        options={{
          drawerLabel: "Upload Project",
          title: "Upload Project",
          drawerIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="cloud-upload-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* =================================================
          EXPLORE
      ================================================= */}
      <Drawer.Screen
        name="explore"
        options={{
          drawerLabel: "Explore Projects",
          title: "Explore Projects",
          drawerIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="compass-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* =================================================
          SIMILARITY ANALYSIS
      ================================================= */}
      <Drawer.Screen
        name="similarity"
        options={{
          drawerLabel: "Similarity Analysis",
          title: "Similarity Analysis",
          drawerIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="analytics-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* =================================================
          PROFILE
      ================================================= */}
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "My Profile",
          title: "My Profile",
          drawerIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="person-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* =================================================
          CHAT
      ================================================= */}
      <Drawer.Screen
        name="chat"
        options={{
          drawerLabel: "Chat",
          title: "Chat",
          headerShown: false,
          drawerIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="chatbubble-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* =================================================
          PROJECT
          HIDDEN FROM DRAWER
          INTERNAL FLOW:
          My Projects
                ↓
          Project Details
                ↓
          Revise Project
      ================================================= */}
      <Drawer.Screen
        name="project"
        options={{
          // -----------------------------------------------
          // HIDDEN FROM DRAWER
          // -----------------------------------------------
          drawerItemStyle: {
            display: "none",
          },
          // -----------------------------------------------
          // ONLY ONE HEADER
          // -----------------------------------------------
          headerShown: true,
          // -----------------------------------------------
          // DYNAMIC HEADER
          // -----------------------------------------------
          title: projectHeaderTitle,
        }}
      />
      {/* =================================================
          SIMILARITY RESULTS
          HIDDEN FROM DRAWER
      ================================================= */}
      <Drawer.Screen
        name="similarity-results"
        options={{
          // -----------------------------------------------
          // HIDDEN FROM DRAWER
          // -----------------------------------------------
          drawerItemStyle: {
            display: "none",
          },
          // -----------------------------------------------
          // HEADER
          // -----------------------------------------------
          headerShown: true,
          title: "Similarity Results",
          // -----------------------------------------------
          // DISABLE DRAWER SWIPE
          // -----------------------------------------------
          swipeEnabled: false,
          // -----------------------------------------------
          // HEADER BACK BUTTON
          // -----------------------------------------------
          headerLeft: () => (
            <Pressable
              onPress={() => {
                router.replace(
                  "/student/similarity"
                );
              }}
              style={styles.resultsBackButton}
              hitSlop={8}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#4338CA"
              />
            </Pressable>
          ),
        }}
      />
    </Drawer>
  );
}
// =====================================================
// STYLES
// =====================================================
const styles = StyleSheet.create({
  // =====================================================
  // DRAWER CONTAINER
  // =====================================================
  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // =====================================================
  // DRAWER CONTENT
  // =====================================================
  drawerContent: {
    paddingTop: 0,
  },
  // =====================================================
  // DRAWER HEADER
  // =====================================================
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },
  // =====================================================
  // LOGO CONTAINER
  // =====================================================
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  // =====================================================
  // LOGO
  // =====================================================
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  // =====================================================
  // APP NAME
  // =====================================================
  appName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#4338CA",
  },
  // =====================================================
  // ROLE
  // =====================================================
  role: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 3,
  },
  // =====================================================
  // LOGOUT CONTAINER
  // =====================================================
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  // =====================================================
  // LOGOUT BUTTON
  // =====================================================
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  // =====================================================
  // LOGOUT TEXT
  // =====================================================
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
    marginLeft: 12,
  },
  // =====================================================
  // SIMILARITY RESULTS BACK BUTTON
  // =====================================================
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
    shadowOffset: { width: 0, height: 4 },
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
resultsBackButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});
