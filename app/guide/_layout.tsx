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
          <Text style={styles.role}>Guide Portal</Text>
        </View>

        {/* Existing Drawer Pages */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>↪</Text>

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
          title: "Dashboard",
          drawerLabel: "Dashboard",
        }}
      />

      <Drawer.Screen
        name="students"
        options={{
          title: "My Students",
          drawerLabel: "My Students",
        }}
      />

      <Drawer.Screen
        name="add-student"
        options={{
          title: "Add Student",
          drawerLabel: "Add Student",
        }}
      />

      <Drawer.Screen
        name="projects"
        options={{
          title: "Projects",
          drawerLabel: "Projects",
        }}
      />

      <Drawer.Screen
        name="reports"
        options={{
          title: "Reports",
          drawerLabel: "Reports",
        }}
      />

      <Drawer.Screen
        name="chat"
        options={{
          title: "Chat",
          drawerLabel: "Chat",
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
          drawerLabel: "Profile",
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