import { Drawer } from "expo-router/drawer";
import { router, usePathname } from "expo-router";
import { signOut } from "firebase/auth";

import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

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
  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      router.replace("/");
    } catch (error) {
      console.log("Logout error:", error);

      Alert.alert("Logout Failed", "Something went wrong while logging out.");
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
              <Text style={styles.appName}>ProjectVerse</Text>

              <Text style={styles.role}>Student Portal</Text>
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
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={21} color="#DC2626" />

          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =====================================================
// STUDENT LAYOUT
// =====================================================

export default function StudentLayout() {
  return (
    <Drawer
      // =================================================
      // IMPORTANT
      //
      // We DO NOT use drawer history.
      //
      // Main drawer pages should conceptually behave as:
      //
      // Home
      //   ↑
      // My Projects
      // Upload Project
      // Explore
      // Similarity
      // Profile
      // Chat
      //
      // Internal pages such as:
      //
      // My Projects → Project → Revise
      //
      // remain controlled by their own navigation.
      // =================================================

      backBehavior="firstRoute"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        // =================================================
        // HEADER
        // =================================================

        headerShown: true,

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

          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
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

          drawerIcon: ({ color, size }) => (
            <Ionicons name="folder-open-outline" size={size} color={color} />
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

          drawerIcon: ({ color, size }) => (
            <Ionicons name="cloud-upload-outline" size={size} color={color} />
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

          drawerIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
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

          drawerIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
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

          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {/* =================================================
          CHAT
          
          CUSTOM HEADER
          
          Nothing else changed.
      ================================================= */}

      <Drawer.Screen
        name="chat"
        options={{
          drawerLabel: "Chat",

          title: "Chat",

          headerShown: false,

          drawerIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />

      {/* =================================================
          PROJECT
          
          HIDDEN FROM DRAWER
          
          DO NOT CHANGE.
          
          Existing flow:
          
          My Projects
               ↓
          Project Details
               ↓
             Revise
      ================================================= */}

      <Drawer.Screen
        name="project"
        options={{
          drawerItemStyle: {
            display: "none",
          },

          headerShown: true,
        }}
      />

      {/* =================================================
          SIMILARITY RESULTS
          
          HIDDEN FROM DRAWER
          
          INTERNAL FLOW ONLY.
      ================================================= */}

      <Drawer.Screen
        name="similarity-results"
        options={{
          drawerItemStyle: {
            display: "none",
          },
          headerShown: true,
          title: "Similarity Results",
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
});
