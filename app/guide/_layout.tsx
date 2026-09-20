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

function CustomDrawerContent(props: any) {
  const handleLogout = async () => {
    try {
      await signOut(auth);

      router.replace("/login");
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
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}
      >
        {/* Drawer Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.logoContainer}>

            {/* ProjectVerse Logo */}
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

        {/* Drawer Pages */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout */}
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

export default function GuideLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
      backBehavior="history"
      screenOptions={{
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
      {/* Dashboard */}
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

      {/* My Students */}
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

      {/* Add Student */}
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

      {/* Projects */}
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

     
      {/* Chat */}
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

      {/* Profile */}
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

      {/* Project Details - Hidden from Drawer */}
      <Drawer.Screen
        name="project-details"
        options={{
          drawerItemStyle: {
            display: "none",
          },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  drawerContent: {
    paddingTop: 0,
  },

  drawerHeader: {
    paddingHorizontal: 20,

    // Header moved slightly lower
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