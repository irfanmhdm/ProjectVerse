import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack, router } from "expo-router";
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
      // Stay on the Index/Home page
      if (!user) {
        console.log("❌ No saved session");
        return;
      }

      // User is already logged in
      console.log("🔥 SESSION RESTORED");
      console.log("UID:", user.uid);
      console.log("Email:", user.email);

      try {
        // Get user's Firestore profile
        const userDoc = await getDoc(
          doc(db, "users", user.uid)
        );

        if (!userDoc.exists()) {
          console.log("❌ User profile not found");
          return;
        }

        const userData = userDoc.data();

        console.log("Role:", userData.role);

        // Student
        if (userData.role === "student") {
          console.log("🎓 Redirecting to Student Dashboard");

          router.replace("/student");
        }

        // Guide
        else if (userData.role === "guide") {
          console.log("👨‍🏫 Redirecting to Guide Dashboard");

          router.replace("/guide");
        }

        // Unknown role
        else {
          console.log("❌ Unknown role:", userData.role);
        }

      } catch (error) {
        console.log(
          "Error loading user profile:",
          error
        );
      }
    });

    return unsubscribe;
  }, []);

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack>

        {/* Main Index Page */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* Login */}
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />

        {/* Register */}
        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
          }}
        />

        {/* Student */}
        <Stack.Screen
          name="student"
          options={{
            headerShown: false,
          }}
        />

        {/* Guide */}
        <Stack.Screen
          name="guide"
          options={{
            headerShown: false,
          }}
        />

        {/* Modal */}
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