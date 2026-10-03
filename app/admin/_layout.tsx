import React from "react";
import {
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";

import { Drawer } from "expo-router/drawer";
import { Ionicons } from "@expo/vector-icons";

import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
} from "react-native";

import { useRouter } from "expo-router";
import { auth } from "../../firebase/firebaseConfig";

// =====================================================
// CUSTOM ADMIN DRAWER CONTENT
// =====================================================

function CustomDrawerContent(props: any) {
  const router = useRouter();

  // ===================================================
  // GET CURRENT ACTIVE ROUTE
  // ===================================================

  const currentRoute =
    props.state?.routes?.[props.state.index]?.name;

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = async () => {
    try {
      await auth.signOut();

      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);

      Alert.alert(
        "Logout Error",
        "Unable to logout. Please try again."
      );
    }
  };

  // ===================================================
  // NAVIGATION FUNCTION
  // ===================================================

  const navigateTo = (routeName: string) => {
    props.navigation.navigate(routeName);
  };

  return (
    <View style={styles.drawerContainer}>

      {/* =================================================
          MAIN DRAWER CONTENT
      ================================================= */}

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >

        {/* =================================================
            PROJECTVERSE HEADER
        ================================================= */}

        <View style={styles.brandSection}>

          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandText}>

            <Text style={styles.brandTitle}>
              ProjectVerse
            </Text>

            <Text style={styles.brandSubtitle}>
              Admin Panel
            </Text>

          </View>

        </View>

        {/* =================================================
            DIVIDER
        ================================================= */}

        <View style={styles.divider} />

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <DrawerItem
          label="Dashboard"

          focused={currentRoute === "index"}

          icon={({ color }) => (
            <Ionicons
              name="grid-outline"
              size={24}
              color={color}
            />
          )}

          onPress={() => {
            navigateTo("index");
          }}

          activeTintColor="#4338CA"
          inactiveTintColor="#374151"
          activeBackgroundColor="#D5F5F2"

          labelStyle={styles.drawerLabel}
          style={styles.drawerItem}
        />

        {/* =================================================
            APPROVED STUDENTS
        ================================================= */}

        <DrawerItem
          label="Approved Students"

          focused={currentRoute === "approved-students"}

          icon={({ color }) => (
            <Ionicons
              name="people-outline"
              size={24}
              color={color}
            />
          )}

          onPress={() => {
            navigateTo("approved-students");
          }}

          activeTintColor="#4338CA"
          inactiveTintColor="#374151"
          activeBackgroundColor="#D5F5F2"

          labelStyle={styles.drawerLabel}
          style={styles.drawerItem}
        />

        {/* =================================================
            APPROVED GUIDES
        ================================================= */}

        <DrawerItem
          label="Approved Guides"

          focused={currentRoute === "approved-guides"}

          icon={({ color }) => (
            <Ionicons
              name="school-outline"
              size={24}
              color={color}
            />
          )}

          onPress={() => {
            navigateTo("approved-guides");
          }}

          activeTintColor="#4338CA"
          inactiveTintColor="#374151"
          activeBackgroundColor="#D5F5F2"

          labelStyle={styles.drawerLabel}
          style={styles.drawerItem}
        />

        {/* =================================================
            STUDENT APPROVAL
        ================================================= */}

        <DrawerItem
          label="Student Approval"

          focused={currentRoute === "student-approval"}

          icon={({ color }) => (
            <Ionicons
              name="person-add-outline"
              size={24}
              color={color}
            />
          )}

          onPress={() => {
            navigateTo("student-approval");
          }}

          activeTintColor="#4338CA"
          inactiveTintColor="#374151"
          activeBackgroundColor="#D5F5F2"

          labelStyle={styles.drawerLabel}
          style={styles.drawerItem}
        />

        {/* =================================================
            GUIDE APPROVAL
        ================================================= */}

        <DrawerItem
          label="Guide Approval"

          focused={currentRoute === "guide-approval"}

          icon={({ color }) => (
            <Ionicons
              name="person-add-outline"
              size={24}
              color={color}
            />
          )}

          onPress={() => {
            navigateTo("guide-approval");
          }}

          activeTintColor="#4338CA"
          inactiveTintColor="#374151"
          activeBackgroundColor="#D5F5F2"

          labelStyle={styles.drawerLabel}
          style={styles.drawerItem}
        />

      </DrawerContentScrollView>

      {/* =================================================
          BOTTOM LOGOUT SECTION
      ================================================= */}

      <View style={styles.bottomSection}>

        <View style={styles.divider} />

        <DrawerItem
          label="Logout"

          icon={({ color }) => (
            <Ionicons
              name="log-out-outline"
              size={24}
              color={color}
            />
          )}

          onPress={handleLogout}

          activeTintColor="#DC2626"
          inactiveTintColor="#DC2626"

          labelStyle={[
            styles.drawerLabel,
            styles.logoutLabel,
          ]}

          style={styles.drawerItem}
        />

      </View>

    </View>
  );
}

// =====================================================
// ADMIN DRAWER LAYOUT
// =====================================================

export default function AdminLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}

      screenOptions={{
        // =================================================
        // NORMAL HEADER
        // =================================================

        headerShown: true,

        headerStyle: {
          backgroundColor: "#FFFFFF",
        },

        headerTintColor: "#1F2937",

        headerTitleStyle: {
          fontSize: 22,
          fontWeight: "700",
        },

        headerShadowVisible: false,

        // =================================================
        // DRAWER
        // =================================================

        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 300,
        },

        drawerActiveTintColor: "#4338CA",

        drawerInactiveTintColor: "#374151",

        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
        },
      }}
    >

      {/* =================================================
          ADMIN DASHBOARD
      ================================================= */}

      <Drawer.Screen
        name="index"
        options={{
          title: "Admin",

          drawerLabel: "Dashboard",

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
          APPROVED STUDENTS
      ================================================= */}

      <Drawer.Screen
        name="approved-students"
        options={{
          title: "Admin - Approved Students",

          drawerLabel: "Approved Students",

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
          APPROVED GUIDES
      ================================================= */}

      <Drawer.Screen
        name="approved-guides"
        options={{
          title: "Admin - Approved Guides",

          drawerLabel: "Approved Guides",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="school-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* =================================================
          STUDENT APPROVAL
      ================================================= */}

      <Drawer.Screen
        name="student-approval"
        options={{
          title: "Admin - Student Approval",

          drawerLabel: "Student Approval",

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
          GUIDE APPROVAL
      ================================================= */}

      <Drawer.Screen
        name="guide-approval"
        options={{
          title: "Admin - Guide Approval",

          drawerLabel: "Guide Approval",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="person-add-outline"
              size={size}
              color={color}
            />
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

  // ===================================================
  // DRAWER CONTAINER
  // ===================================================

  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingTop: 40,
    paddingBottom: 20,
  },

  // ===================================================
  // PROJECTVERSE BRAND
  // ===================================================

  brandSection: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },

  logoContainer: {
    width: 52,
    height: 52,

    borderRadius: 15,

    backgroundColor: "#E0E7FF",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 13,
  },

  logo: {
    width: 36,
    height: 36,
  },

  brandText: {
    flex: 1,
  },

  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4338CA",
  },

  brandSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    color: "#6B7280",
  },

  // ===================================================
  // DIVIDER
  // ===================================================

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
  },

  // ===================================================
  // DRAWER ITEMS
  // ===================================================

  drawerItem: {
    marginHorizontal: 10,
    marginVertical: 2,

    borderRadius: 11,

    paddingVertical: 0,
  },

  drawerLabel: {
    marginLeft: -5,

    fontSize: 14.5,
    fontWeight: "600",

    color: "#374151",
  },

  // ===================================================
  // BOTTOM SECTION
  // ===================================================

  bottomSection: {
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  logoutLabel: {
    color: "#DC2626",
  },

});