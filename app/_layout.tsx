import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack, router, usePathname } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { useEffect, useRef, useState } from "react";

import {
  BackHandler,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import "react-native-reanimated";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebaseConfig";

import { useColorScheme } from "@/hooks/use-color-scheme";

// =====================================================
// ROOT LAYOUT
// =====================================================

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const pathname = usePathname();

  // =====================================================
  // AUTH INITIALIZATION STATE
  // =====================================================
  //
  // IMPORTANT:
  //
  // This prevents the index page from appearing while
  // Firebase is restoring the saved session.
  //
  // Flow:
  //
  // App opens
  //      ↓
  // Firebase restores session
  //      ↓
  // Check user profile
  //      ↓
  // Dashboard OR index
  //
  // =====================================================

  const [isInitializing, setIsInitializing] = useState(true);

  // =====================================================
  // KEEP CURRENT PATHNAME IN REF
  // =====================================================

  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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

        // =====================================================
        // SIMILARITY RESULTS
        // =====================================================

        if (pathname === "/student/similarity-results") {
          console.log(
            "Similarity Results - returning to Similarity Analysis"
          );

          router.replace("/student/similarity");

          return true;
        }

        // =================================================
        // PROJECT DETAILS
        // =================================================

        if (pathname.includes("project-details")) {
          console.log(
            "Project Details flow - allowing normal navigation"
          );

          return false;
        }

        // =================================================
        // GUIDE CHAT CONVERSATION
        // =================================================

        if (pathname.startsWith("/guide/chat/")) {
          console.log(
            "Guide chat conversation - allowing normal navigation"
          );

          return false;
        }

        // =================================================
        // GUIDE HOME
        // =================================================

        if (pathname === "/guide") {
          console.log(
            "Guide Home - allowing Android to close app"
          );

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
          console.log(
            "Guide main page - returning to Guide Home"
          );

          router.replace("/guide");

          return true;
        }

        // =================================================
        // STUDENT HOME
        // =================================================

        if (pathname === "/student") {
          console.log("Student Home - exiting app");

          BackHandler.exitApp();

          return true;
        }

        // =================================================
        // STUDENT PAGES
        // =================================================

        if (pathname.startsWith("/student/")) {
          console.log(
            "Student page - returning to Student Home"
          );

          router.replace("/student");

          return true;
        }

        // =================================================
        // ADMIN HOME
        // =================================================

        if (
          pathname === "/admin" ||
          pathname === "/admin/index"
        ) {
          console.log("Admin Home - exiting app");

          BackHandler.exitApp();

          return true;
        }

        // =================================================
        // ADMIN PAGES
        // =================================================
        //
        // No custom admin route replacement.
        //
        // =================================================

        // =================================================
        // OTHER PAGES
        // =================================================

        console.log(
          "No custom back rule - allowing normal navigation"
        );

        return false;
      }
    );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      backHandler.remove();
    };
  }, [pathname]);

  // =====================================================
  // FIREBASE SESSION RESTORATION
  // =====================================================

  useEffect(() => {
    console.log("====================================");

    console.log("CREATING FIREBASE AUTH LISTENER");

    console.log(
      "Initial pathname:",
      pathnameRef.current
    );

    console.log("====================================");

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        console.log("====================================");

        console.log("AUTH STATE CHANGED");

        console.log(
          "CURRENT PATH:",
          pathnameRef.current
        );

        // =================================================
        // NO USER
        // =================================================

        if (!user) {
          console.log("No saved session");

          console.log(
            "Showing normal authentication screen."
          );

          // ---------------------------------------------
          // Firebase has finished checking persistence.
          // Therefore it is now safe to show index/login.
          // ---------------------------------------------

          setIsInitializing(false);

          console.log("====================================");

          return;
        }

        // =================================================
        // USER EXISTS
        // =================================================

        console.log("SESSION RESTORED");

        console.log("UID:", user.uid);

        console.log("Email:", user.email);

        // =================================================
        // REGISTRATION PROTECTION
        // =================================================
        //
        // During registration:
        //
        // createUserWithEmailAndPassword()
        //          ↓
        // Auth state changes
        //
        // But users/{uid} may not exist yet.
        //
        // Therefore NEVER perform session restoration
        // while register screen is active.
        //
        // =================================================

        if (pathnameRef.current === "/register") {
          console.log("REGISTER PAGE ACTIVE");

          console.log(
            "Skipping session restoration."
          );

          // Registration page should be visible normally.
          setIsInitializing(false);

          console.log("====================================");

          return;
        }

        try {
          // =================================================
          // GET USER PROFILE
          // =================================================

          const userRef = doc(
            db,
            "users",
            user.uid
          );

          console.log("Loading user profile...");

          const userDoc = await getDoc(userRef);

          // =================================================
          // CHECK REGISTER AGAIN
          // =================================================

          if (pathnameRef.current === "/register") {
            console.log(
              "Route is now register."
            );

            console.log(
              "Stopping session restoration."
            );

            setIsInitializing(false);

            return;
          }

          // =================================================
          // PROFILE NOT FOUND
          // =================================================

          if (!userDoc.exists()) {
            console.log(
              "User profile not found"
            );

            await signOut(auth);

            setIsInitializing(false);

            router.replace("/login");

            return;
          }

          // =================================================
          // USER DATA
          // =================================================

          const userData = userDoc.data();

          console.log(
            "User role:",
            userData.role
          );

          console.log(
            "User status:",
            userData.status
          );

          // =================================================
          // ADMIN
          // =================================================

          if (userData.role === "admin") {
            console.log(
              "Admin session verified."
            );

            const currentPath =
              pathnameRef.current;

            const isAuthPage =
              currentPath === "/" ||
              currentPath === "/login";

            if (isAuthPage) {
              console.log(
                "Admin is on auth/root page."
              );

              console.log(
                "Redirecting to Admin Dashboard."
              );

              router.replace("/admin");
            } else {
              console.log(
                "Admin is already inside application."
              );

              console.log(
                "Keeping current route:",
                currentPath
              );
            }

            // ---------------------------------------------
            // Initial authentication check completed.
            // ---------------------------------------------

            setIsInitializing(false);

            return;
          }

          // =================================================
          // STUDENT
          // =================================================

          if (userData.role === "student") {
            // ---------------------------------------------
            // APPROVED STUDENT
            // ---------------------------------------------

            if (userData.status === "approved") {
              const currentPath =
                pathnameRef.current;

              const isAuthPage =
                currentPath === "/" ||
                currentPath === "/login";

              if (isAuthPage) {
                console.log(
                  "Approved student."
                );

                console.log(
                  "Redirecting to Student Dashboard."
                );

                router.replace("/student");
              } else {
                console.log(
                  "Student already inside application."
                );

                console.log(
                  "Keeping current route:",
                  currentPath
                );
              }

              setIsInitializing(false);

              return;
            }

            // ---------------------------------------------
            // PENDING STUDENT
            // ---------------------------------------------

            if (userData.status === "pending") {
              console.log(
                "Student account is pending approval."
              );

              await signOut(auth);

              setIsInitializing(false);

              router.replace("/login");

              return;
            }

            // ---------------------------------------------
            // REJECTED STUDENT
            // ---------------------------------------------

            if (userData.status === "rejected") {
              console.log(
                "Student registration was rejected."
              );

              await signOut(auth);

              setIsInitializing(false);

              router.replace("/login");

              return;
            }

            // ---------------------------------------------
            // INVALID STATUS
            // ---------------------------------------------

            console.log(
              "Student has invalid status:",
              userData.status
            );

            await signOut(auth);

            setIsInitializing(false);

            router.replace("/login");

            return;
          }

          // =================================================
          // GUIDE
          // =================================================

          if (userData.role === "guide") {
            // ---------------------------------------------
            // APPROVED GUIDE
            // ---------------------------------------------

            if (userData.status === "approved") {
              const currentPath =
                pathnameRef.current;

              const isAuthPage =
                currentPath === "/" ||
                currentPath === "/login";

              if (isAuthPage) {
                console.log(
                  "Approved guide."
                );

                console.log(
                  "Redirecting to Guide Dashboard."
                );

                router.replace("/guide");
              } else {
                console.log(
                  "Guide already inside application."
                );

                console.log(
                  "Keeping current route:",
                  currentPath
                );
              }

              setIsInitializing(false);

              return;
            }

            // ---------------------------------------------
            // PENDING GUIDE
            // ---------------------------------------------

            if (userData.status === "pending") {
              console.log(
                "Guide account is pending approval."
              );

              await signOut(auth);

              setIsInitializing(false);

              router.replace("/login");

              return;
            }

            // ---------------------------------------------
            // REJECTED GUIDE
            // ---------------------------------------------

            if (userData.status === "rejected") {
              console.log(
                "Guide registration was rejected."
              );

              await signOut(auth);

              setIsInitializing(false);

              router.replace("/login");

              return;
            }

            // ---------------------------------------------
            // INVALID STATUS
            // ---------------------------------------------

            console.log(
              "Guide has invalid status:",
              userData.status
            );

            await signOut(auth);

            setIsInitializing(false);

            router.replace("/login");

            return;
          }

          // =================================================
          // UNKNOWN ROLE
          // =================================================

          console.log(
            "Unknown role:",
            userData.role
          );

          await signOut(auth);

          setIsInitializing(false);

          router.replace("/login");

        } catch (error: any) {
          console.log("====================================");

          console.log(
            "ERROR LOADING USER PROFILE"
          );

          console.log(
            "ERROR CODE:",
            error?.code
          );

          console.log(
            "ERROR MESSAGE:",
            error?.message
          );

          console.log("====================================");

          // ---------------------------------------------
          // IMPORTANT:
          //
          // We do not automatically navigate to /admin
          // or /login here.
          //
          // If Firestore is temporarily offline,
          // keep the current screen.
          //
          // But we MUST stop the initial loading screen,
          // otherwise the app could remain stuck forever.
          // ---------------------------------------------

          setIsInitializing(false);
        }
      }
    );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      console.log(
        "Firebase Auth listener removed."
      );

      unsubscribe();
    };
  }, []);

  // =====================================================
  // UI
  // =====================================================

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <View style={styles.rootContainer}>
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

        {/* =================================================
            INITIAL AUTH LOADING SCREEN
        =================================================
        
        This sits ABOVE the Stack.

        Therefore the index page may technically exist
        underneath, but the user cannot see it until
        Firebase finishes restoring the session.
        
        ================================================= */}

        {isInitializing && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingLogoContainer}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.loadingLogo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.loadingAppName}>
              ProjectVerse
            </Text>

            <Text style={styles.loadingText}>
              Loading...
            </Text>
          </View>
        )}
      </View>

      {/* =================================================
          STATUS BAR
      ================================================= */}

      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

// ==========================================================
// STYLES
// ==========================================================

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },

  // ========================================================
  // INITIAL LOADING SCREEN
  // ========================================================

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "#F5F7FB",

    alignItems: "center",
    justifyContent: "center",

    zIndex: 9999,

    elevation: 9999,
  },

  loadingLogoContainer: {
    width: 110,
    height: 110,

    borderRadius: 30,

    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E5E7EB",

    shadowColor: "#1F2937",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,

    marginBottom: 18,
  },

  loadingLogo: {
    width: 82,
    height: 82,
  },

  loadingAppName: {
    fontSize: 30,
    fontWeight: "800",

    color: "#4338CA",

    letterSpacing: -0.8,
  },

  loadingText: {
    marginTop: 8,

    fontSize: 13,
    fontWeight: "500",

    color: "#6B7280",

    letterSpacing: 0.2,
  },
});