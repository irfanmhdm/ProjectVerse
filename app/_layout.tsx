import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebaseConfig";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      // No logged-in user
      if (!user) {
        console.log("❌ No saved session");

        router.replace("/login");
        return;
      }

      // Session exists
      console.log("🔥 SESSION RESTORED");
      console.log("UID:", user.uid);
      console.log("Email:", user.email);

      try {
        // Get the user's Firestore profile
        const userDoc = await getDoc(
          doc(db, "users", user.uid)
        );

        if (!userDoc.exists()) {
          console.log("❌ User profile not found");
          router.replace("/login");
          return;
        }

        const userData = userDoc.data();

        console.log("Role:", userData.role);

        // Route according to role
        if (userData.role === "student") {
          console.log("🎓 Redirecting to Student Dashboard");

          router.replace("/(tabs)");
        }

        else if (userData.role === "guide") {
          console.log("👨‍🏫 Redirecting to Guide Dashboard");

          router.replace("/guide");
        }

        else {
          console.log("❌ Unknown role:", userData.role);

          router.replace("/login");
        }

      } catch (error) {
        console.log("Error loading user profile:", error);

        router.replace("/login");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="register"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="guide/index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}