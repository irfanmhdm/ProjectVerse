import { Drawer } from "expo-router/drawer";

export default function StudentLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "ProjectVerse",
        }}
      />
    </Drawer>
  );
}