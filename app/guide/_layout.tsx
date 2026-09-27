import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";
import { signOut } from "firebase/auth";

import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

import { Ionicons } from "@expo/vector-icons";

import { auth } from "../../firebase/firebaseConfig";

// =====================================================
// CUSTOM DRAWER
// =====================================================

function CustomDrawerContent(props: any) {
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
                Guide Portal
              </Text>
            </View>

          </View>

        </View>

        {/* =================================================
            DRAWER PAGES
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
// GUIDE LAYOUT
// =====================================================

export default function GuideLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}

      backBehavior="history"

      screenOptions={{
        // Normal Drawer pages have header
        headerShown: true,

        drawerActiveTintColor: "#4338CA",

        drawerInactiveTintColor: "#374151",

        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
          marginLeft: -5,
        },

        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 285,
        },

        drawerActiveBackgroundColor: "#D5F5F2",

        headerStyle: {
          backgroundColor: "#FFFFFF",
        },

        headerTintColor: "#1F2937",

        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
          color: "#1F2937",
        },
      }}
    >

      {/* =================================================
          HOME
      ================================================= */}

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

      {/* =================================================
          MY STUDENTS
      ================================================= */}

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

      {/* =================================================
          ADD STUDENT
      ================================================= */}

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

      {/* =================================================
          PROJECTS
      ================================================= */}

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

      {/* =================================================
          CHAT LIST
      ================================================= */}

      <Drawer.Screen
        name="chat"
        options={{
          title: "Chat",
          drawerLabel: "Chat",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubbles-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* =================================================
          CHAT CONVERSATION
          
          IMPORTANT:
          This hides the MAIN DRAWER HEADER.

          The actual conversation page has
          its own custom header containing:
          - Back button
          - Student avatar
          - Student name
          - Student role
      ================================================= */}

      <Drawer.Screen
        name="chat/[studentId]"
        options={{
          headerShown: false,

          drawerItemStyle: {
            display: "none",
          },
        }}
      />

      {/* =================================================
          PROFILE
      ================================================= */}

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

      {/* =================================================
          PROJECT DETAILS
          HIDDEN FROM DRAWER
      ================================================= */}

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

// =======================================================
// STYLES
// =======================================================

const styles = StyleSheet.create({

  // =====================================================
  // DRAWER
  // =====================================================

  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

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

  // =====================================================
  // LOGOUT
  // =====================================================

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

});