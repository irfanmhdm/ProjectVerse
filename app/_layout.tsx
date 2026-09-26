import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack, router, usePathname } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { useEffect } from "react";

import { BackHandler } from "react-native";

import "react-native-reanimated";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebaseConfig";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const pathname = usePathname();

  // =====================================================
  // PREVENT BACK NAVIGATION FROM DASHBOARDS
  // =====================================================

  useEffect(() => {
    // Protect only dashboard pages
    const isProtectedPage =
      pathname === "/admin" || pathname === "/student" || pathname === "/guide";

    if (!isProtectedPage) {
      return;
    }

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        console.log("Back navigation blocked on dashboard");

        return true;
      },
    );

    return () => {
      backHandler.remove();
    };
  }, [pathname]);

  // =====================================================
  // SESSION RESTORATION
  // =====================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // =================================================
      // NO LOGGED-IN USER
      // =================================================

      if (!user) {
        console.log("No saved session");

        return;
      }

      // =================================================
      // SESSION RESTORED
      // =================================================

      console.log("SESSION RESTORED");

      console.log("UID:", user.uid);

      console.log("Email:", user.email);

      try {
        // ===============================================
        // GET USER PROFILE
        // ===============================================

        const userDoc = await getDoc(doc(db, "users", user.uid));

        // ===============================================
        // PROFILE NOT FOUND
        // ===============================================

        if (!userDoc.exists()) {
          console.log("User profile not found");

          await signOut(auth);

          router.replace("/login");

          return;
        }

        const userData = userDoc.data();

        console.log("Role:", userData.role);

        console.log("Approval Status:", userData.approvalStatus);

        // =================================================
        // STUDENT
        // =================================================

        if (userData.role === "student") {
          console.log("Student session restored");

          console.log("Redirecting to Student Dashboard");

          router.replace("/student");

          return;
        }

        // =================================================
        // ADMIN
        // =================================================

        if (userData.role === "admin") {
          console.log("Admin session restored");

          router.replace("/admin");

          return;
        }

        // =================================================
        // GUIDE
        // =================================================

        if (userData.role === "guide") {
          // ---------------------------------------------
          // APPROVED GUIDE
          // ---------------------------------------------

          if (userData.approvalStatus === "approved") {
            console.log("Approved guide session restored");

            console.log("Redirecting to Guide Dashboard");

            router.replace("/guide");

            return;
          }

          // ---------------------------------------------
          // PENDING GUIDE
          // ---------------------------------------------

          if (userData.approvalStatus === "pending") {
            console.log("Guide approval is still pending");

            console.log("Guide session blocked");

            await signOut(auth);

            router.replace("/login");

            return;
          }

          // ---------------------------------------------
          // REJECTED GUIDE
          // ---------------------------------------------

          if (userData.approvalStatus === "rejected") {
            console.log("Guide approval was rejected");

            console.log("Guide session blocked");

            await signOut(auth);

            router.replace("/login");

            return;
          }

          // ---------------------------------------------
          // INVALID / MISSING STATUS
          // ---------------------------------------------

          console.log(
            "Guide has invalid approval status:",
            userData.approvalStatus,
          );

          await signOut(auth);

          router.replace("/login");

          return;
        }

        // =================================================
        // UNKNOWN ROLE
        // =================================================

        console.log("Unknown role:", userData.role);

        await signOut(auth);

        router.replace("/login");
      } catch (error) {
        console.log("Error loading user profile:", error);
      }
    });

    // =====================================================
    // CLEANUP
    // =====================================================

    return unsubscribe;
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* =================================================
            HOME
        ================================================= */}

        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* =================================================
            LOGIN
        ================================================= */}

        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />

        {/* =================================================
            REGISTER
        ================================================= */}

        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
          }}
        />

        {/* =================================================
    STUDENT
================================================= */}

        <Stack.Screen
          name="student"
          options={{
            // No header above the drawer
            headerShown: false,

            // Prevent swipe-back
            gestureEnabled: false,
          }}
        />

        {/* =================================================
    GUIDE
================================================= */}

        <Stack.Screen
          name="guide"
          options={{
            // No header above the drawer
            headerShown: false,

            // Prevent swipe-back
            gestureEnabled: false,
          }}
        />

        {/* =================================================
            ADMIN
        ================================================= */}

        <Stack.Screen
          name="admin/index"
          options={{
            headerShown: true,

            title: "Admin",

            // Remove native back arrow
            headerBackVisible: false,

            // Prevent swipe-back
            gestureEnabled: false,

            headerStyle: {
              backgroundColor: "#FFFFFF",
            },

            headerTintColor: "#111827",

            headerTitleStyle: {
              color: "#111827",
              fontWeight: "700",
              fontSize: 24,
            },

            headerShadowVisible: false,
          }}
        />

        {/* =================================================
            MODAL
        ================================================= */}

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>

      {/* ===================================================
          STATUS BAR
      =================================================== */}

      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
