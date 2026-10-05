import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack, router, usePathname } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { useEffect, useRef, useState } from "react";

import { BackHandler, View } from "react-native";

import "react-native-reanimated";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebaseConfig";

import { useColorScheme } from "@/hooks/use-color-scheme";

import * as SplashScreen from "expo-splash-screen";

// =====================================================
// KEEP NATIVE SPLASH SCREEN VISIBLE
// =====================================================
//
// IMPORTANT:
//
// The native splash stays visible while Firebase checks
// the saved authentication session.
//
// We DO NOT render the Expo Router Stack during this
// initialization period.
//
// Therefore:
//
// SAVED SESSION
//
// Native Splash
//      ↓
// Firebase Auth
//      ↓
// Firestore profile
//      ↓
// Dashboard
//
//
// NO SESSION
//
// Native Splash
//      ↓
// Firebase Auth
//      ↓
// Index
//
// There is no:
//
// Splash → Index → Dashboard
//
// =====================================================

SplashScreen.preventAutoHideAsync().catch(() => {});

// =====================================================
// ROOT LAYOUT
// =====================================================

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const pathname = usePathname();

  // =====================================================
  // AUTH INITIALIZATION
  // =====================================================

  const [isInitializing, setIsInitializing] = useState(true);

  // =====================================================
  // PATHNAME REF
  // =====================================================

  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // =====================================================
  // FINISH INITIALIZATION
  // =====================================================
  //
  // This function:
  //
  // 1. Marks Firebase initialization as finished.
  // 2. Hides native splash.
  //
  // The Stack is rendered only AFTER this decision.
  //
  // =====================================================

  const finishInitialization = async () => {
    setIsInitializing(false);

    try {
      await SplashScreen.hideAsync();

      console.log("Native splash screen hidden.");
    } catch (error) {
      console.log("Error hiding native splash:", error);
    }
  };

  // =====================================================
  // ANDROID BACK HANDLING
  // =====================================================

  useEffect(() => {
    if (typeof pathname !== "string") {
      return;
    }

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        console.log("Android back pressed:", pathname);

        // =================================================
        // SIMILARITY RESULTS
        // =================================================

        if (pathname === "/student/similarity-results") {
          router.replace("/student/similarity");

          return true;
        }

        // =================================================
        // PROJECT DETAILS
        // =================================================

        if (pathname.includes("project-details")) {
          return false;
        }

        // =================================================
        // GUIDE CHAT CONVERSATION
        // =================================================

        if (pathname.startsWith("/guide/chat/")) {
          return false;
        }

        // =================================================
        // GUIDE HOME
        // =================================================

        if (pathname === "/guide") {
          return false;
        }

        // =================================================
        // GUIDE MAIN PAGES
        // =================================================

        if (
          pathname === "/guide/students" ||
          pathname === "/guide/add-student" ||
          pathname === "/guide/projects" ||
          pathname === "/guide/chat" ||
          pathname === "/guide/profile"
        ) {
          router.replace("/guide");

          return true;
        }

        // =================================================
        // STUDENT HOME
        // =================================================

        if (pathname === "/student") {
          BackHandler.exitApp();

          return true;
        }

        // =================================================
        // STUDENT PAGES
        // =================================================

        // =================================================
        // PROJECT DETAILS / REVISE PROJECT
        // =================================================
        //
        // These pages belong to a nested Stack:
        //
        // My Projects
        //      ↓
        // Project Details
        //      ↓
        // Revise Project
        //
        // Do NOT send these directly to Student Home.
        // Let the nested project Stack handle back navigation.
        // =================================================

        if (
          pathname === "/student/project/project-details" ||
          pathname === "/student/project/revise-project"
        ) {
          console.log("Project nested page - allowing normal back navigation");

          return false;
        }

        // =================================================
        // OTHER STUDENT PAGES
        // =================================================

        if (pathname.startsWith("/student/")) {
          console.log("Student page - returning to Student Home");

          router.replace("/student");

          return true;
        }

        // =================================================
        // ADMIN HOME
        // =================================================

        if (pathname === "/admin" || pathname === "/admin/index") {
          BackHandler.exitApp();

          return true;
        }

        // =================================================
        // DEFAULT
        // =================================================

        return false;
      },
    );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      backHandler.remove();
    };
  }, [pathname]);

  // =====================================================
  // FIREBASE AUTH INITIALIZATION
  // =====================================================

  useEffect(() => {
    console.log("====================================");

    console.log("CREATING FIREBASE AUTH LISTENER");

    console.log("Initial pathname:", pathnameRef.current);

    console.log("====================================");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("====================================");

      console.log("AUTH STATE CHANGED");

      console.log("CURRENT PATH:", pathnameRef.current);

      // =================================================
      // NO SAVED SESSION
      // =================================================
      //
      // This is the important part.
      //
      // Firebase has confirmed that there is no
      // authenticated user.
      //
      // We simply hide the native splash.
      //
      // Since Stack is now allowed to render,
      // Expo Router will show index.tsx.
      //
      // =================================================

      if (!user) {
        console.log("No saved session.");

        console.log("Opening index page.");

        await finishInitialization();

        return;
      }

      // =================================================
      // SAVED SESSION FOUND
      // =================================================

      console.log("SESSION RESTORED");

      console.log("UID:", user.uid);

      console.log("Email:", user.email);

      // =================================================
      // REGISTRATION PROTECTION
      // =================================================
      //
      // During registration Firebase automatically
      // changes the authentication state.
      //
      // Do NOT redirect the newly registered user
      // before the registration process finishes.
      //
      // =================================================

      if (pathnameRef.current === "/register") {
        console.log("REGISTER PAGE ACTIVE");

        console.log("Skipping session restoration.");

        await finishInitialization();

        return;
      }

      try {
        // =================================================
        // LOAD USER PROFILE
        // =================================================

        const userRef = doc(db, "users", user.uid);

        console.log("Loading user profile...");

        const userDoc = await getDoc(userRef);

        // =================================================
        // CHECK REGISTER AGAIN
        // =================================================

        if (pathnameRef.current === "/register") {
          console.log("Route changed to register.");

          await finishInitialization();

          return;
        }

        // =================================================
        // PROFILE DOES NOT EXIST
        // =================================================

        if (!userDoc.exists()) {
          console.log("User profile not found.");

          await signOut(auth);

          // No valid session.
          // Show login instead of exposing index.

          await finishInitialization();

          router.replace("/login");

          return;
        }

        // =================================================
        // USER DATA
        // =================================================

        const userData = userDoc.data();

        console.log("User role:", userData.role);

        console.log("User status:", userData.status);

        // =================================================
        // ADMIN
        // =================================================

        if (userData.role === "admin") {
          console.log("Admin session verified.");

          const currentPath = pathnameRef.current;

          const isAuthPage = currentPath === "/" || currentPath === "/login";

          if (isAuthPage) {
            console.log("Redirecting to Admin Dashboard.");

            router.replace("/admin");
          } else {
            console.log("Admin already inside application.");
          }

          // Important:
          //
          // Routing decision has been made.
          // Only now reveal the app.

          await finishInitialization();

          return;
        }

        // =================================================
        // STUDENT
        // =================================================

        if (userData.role === "student") {
          // =================================================
          // APPROVED STUDENT
          // =================================================

          if (userData.status === "approved") {
            console.log("Approved student.");

            const currentPath = pathnameRef.current;

            const isAuthPage = currentPath === "/" || currentPath === "/login";

            if (isAuthPage) {
              console.log("Redirecting to Student Dashboard.");

              router.replace("/student");
            } else {
              console.log("Student already inside application.");
            }

            await finishInitialization();

            return;
          }

          // =================================================
          // PENDING STUDENT
          // =================================================

          if (userData.status === "pending") {
            console.log("Student account is pending approval.");

            await signOut(auth);

            await finishInitialization();

            router.replace("/login");

            return;
          }

          // =================================================
          // REJECTED STUDENT
          // =================================================

          if (userData.status === "rejected") {
            console.log("Student registration was rejected.");

            await signOut(auth);

            await finishInitialization();

            router.replace("/login");

            return;
          }

          // =================================================
          // INVALID STUDENT STATUS
          // =================================================

          console.log("Invalid student status:", userData.status);

          await signOut(auth);

          await finishInitialization();

          router.replace("/login");

          return;
        }

        // =================================================
        // GUIDE
        // =================================================

        if (userData.role === "guide") {
          // =================================================
          // APPROVED GUIDE
          // =================================================

          if (userData.status === "approved") {
            console.log("Approved guide.");

            const currentPath = pathnameRef.current;

            const isAuthPage = currentPath === "/" || currentPath === "/login";

            if (isAuthPage) {
              console.log("Redirecting to Guide Dashboard.");

              router.replace("/guide");
            } else {
              console.log("Guide already inside application.");
            }

            await finishInitialization();

            return;
          }

          // =================================================
          // PENDING GUIDE
          // =================================================

          if (userData.status === "pending") {
            console.log("Guide account is pending approval.");

            await signOut(auth);

            await finishInitialization();

            router.replace("/login");

            return;
          }

          // =================================================
          // REJECTED GUIDE
          // =================================================

          if (userData.status === "rejected") {
            console.log("Guide registration was rejected.");

            await signOut(auth);

            await finishInitialization();

            router.replace("/login");

            return;
          }

          // =================================================
          // INVALID GUIDE STATUS
          // =================================================

          console.log("Invalid guide status:", userData.status);

          await signOut(auth);

          await finishInitialization();

          router.replace("/login");

          return;
        }

        // =================================================
        // UNKNOWN ROLE
        // =================================================

        console.log("Unknown role:", userData.role);

        await signOut(auth);

        await finishInitialization();

        router.replace("/login");
      } catch (error: any) {
        console.log("====================================");

        console.log("ERROR LOADING USER PROFILE");

        console.log("ERROR CODE:", error?.code);

        console.log("ERROR MESSAGE:", error?.message);

        console.log("====================================");

        // =================================================
        // FIRESTORE ERROR
        // =================================================
        //
        // We cannot safely determine the user's role.
        //
        // Hide the native splash so the current route
        // can remain visible.
        //
        // =================================================

        await finishInitialization();
      }
    });

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      console.log("Firebase Auth listener removed.");

      unsubscribe();
    };
  }, []);

  // =====================================================
  // IMPORTANT INITIALIZATION GATE
  // =====================================================
  //
  // THIS IS THE MAIN FIX.
  //
  // While Firebase is checking the saved session:
  //
  //      DO NOT RENDER STACK
  //
  // The native Android splash remains visible.
  //
  // This means index.tsx cannot appear for 1–2 seconds.
  //
  // =====================================================

  if (isInitializing) {
    return null;
  }

  // =====================================================
  // APP UI
  // =====================================================

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View
        style={{
          flex: 1,
        }}
      >
        <Stack>
          {/* =================================================
              INDEX / HOME
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
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* =================================================
              GUIDE
          ================================================= */}

          <Stack.Screen
            name="guide"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* =================================================
              ADMIN
          ================================================= */}

          <Stack.Screen
            name="admin"
            options={{
              headerShown: false,
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
      </View>

      {/* =================================================
          STATUS BAR
      ================================================= */}

      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
