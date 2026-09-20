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
                Student Portal
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

export default function StudentLayout() {
  return (
    <Drawer
      backBehavior="history"
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
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

        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
          color: "#1F2937",
        },

        headerTintColor: "#4338CA",
      }}
    >
      {/* Home */}
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "ProjectVerse",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* My Projects */}
      <Drawer.Screen
        name="my-projects"
        options={{
          drawerLabel: "My Projects",
          title: "My Projects",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="folder-open-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Upload Project */}
      <Drawer.Screen
        name="add-project"
        options={{
          drawerLabel: "Upload Project",
          title: "Upload Project",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="cloud-upload-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Explore */}
      <Drawer.Screen
        name="explore"
        options={{
          drawerLabel: "Explore",
          title: "Explore",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="compass-outline"
              size={size}
              color={color}
            />
          )}
        }
      />

      {/* Profile */}
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",

          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="person-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Project Stack */}
      <Drawer.Screen
        name="project"
        options={{
          drawerItemStyle: {
            display: "none",
          },

          headerShown: true,
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

    // Moved the header slightly lower
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