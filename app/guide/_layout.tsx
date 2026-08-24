import { Drawer } from "expo-router/drawer";

export default function GuideLayout() {
  return (
    <Drawer
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