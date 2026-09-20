import { Drawer } from "expo-router/drawer";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

import { auth } from "../../firebase/firebaseConfig";

function CustomDrawerContent(props: any) {
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
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerHeader}>
          <Text style={styles.appName}>ProjectVerse</Text>
          <Text style={styles.role}>Student Portal</Text>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.logoutContainer}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
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
      backBehavior="history"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,

        drawerActiveTintColor: "#4338CA",
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

        headerTintColor: "#4338CA",
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
        name="my-projects"
        options={{
          drawerLabel: "My Projects",
          title: "My Projects",
        }}
      />

      <Drawer.Screen
        name="add-project"
        options={{
          drawerLabel: "Upload Project",
          title: "Upload Project",
        }}
      />

      <Drawer.Screen
        name="explore"
        options={{
          drawerLabel: "Explore",
          title: "Explore",
        }}
      />

      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
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
    color: "#4338CA",
  },

  role: {
    marginTop: 5,
    fontSize: 14,
    color: "#6B7280",
  },

  logoutContainer: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  logoutIcon: {
    fontSize: 22,
    marginRight: 12,
    color: "#DC2626",
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },
});
