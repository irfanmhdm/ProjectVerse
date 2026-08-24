import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

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
      <DrawerContentScrollView {...props}>
        {/* Drawer Header */}
        <View style={styles.drawerHeader}>
          <Text style={styles.appName}>ProjectVerse</Text>
          <Text style={styles.role}>Student Portal</Text>
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
          <Text style={styles.logoutIcon}>↪</Text>

          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function StudentLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
      screenOptions={{
        headerShown: true,

        drawerActiveTintColor: "#2563EB",
        drawerInactiveTintColor: "#374151",

        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
        },

        drawerStyle: {
          backgroundColor: "#FFFFFF",
          width: 280,
        },

        headerStyle: {
          backgroundColor: "#FFFFFF",
        },

        headerTitleStyle: {
          fontWeight: "bold",
          color: "#111827",
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "ProjectVerse",
        }}
      />

      <Drawer.Screen
        name="projects"
        options={{
          drawerLabel: "My Projects",
          title: "My Projects",
        }}
      />

      <Drawer.Screen
        name="add-project"
        options={{
          drawerLabel: "Add Project",
          title: "Add Project",
        }}
      />

      <Drawer.Screen
        name="reports"
        options={{
          drawerLabel: "My Reports",
          title: "My Reports",
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
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

  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 10,
  },

  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563EB",
  },

  role: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 15,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 10,
  },

  logoutIcon: {
    fontSize: 20,
    color: "#DC2626",
    marginRight: 12,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },
});