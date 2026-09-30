import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import {
  Stack,
  router,
  usePathname,
} from "expo-router";

import { StatusBar } from "expo-status-bar";

import { useEffect } from "react";

import {
  BackHandler,
} from "react-native";

import "react-native-reanimated";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebaseConfig";

import {
  useColorScheme,
} from "@/hooks/use-color-scheme";


// =====================================================
// ROOT LAYOUT
// =====================================================

export default function RootLayout() {

  const colorScheme =
    useColorScheme();

  const pathname =
    usePathname();


  // =====================================================
  // ANDROID BACK HANDLING
  // =====================================================
  //
  // REQUIRED BEHAVIOR:
  //
  // Guide Home
  //      ↓ Android back
  // Android closes app
  //
  // Guide Students
  //      ↓ Android back
  // Guide Home
  //
  // Guide Projects
  //      ↓ Android back
  // Guide Home
  //
  // Guide Chat
  //      ↓ Android back
  // Guide Home
  //
  // Guide Profile
  //      ↓ Android back
  // Guide Home
  //
  // Project Details / Revise:
  //      DO NOT TOUCH
  //
  // Chat Conversation:
  //      DO NOT TOUCH
  //
  // =====================================================

  useEffect(() => {

    if (typeof pathname !== "string") {
      return;
    }


    const backHandler =
      BackHandler.addEventListener(
        "hardwareBackPress",
        () => {

          console.log(
            "Android back pressed:",
            pathname
          );


          // =================================================
          // PROJECT DETAILS / REVISE
          // =================================================
          //
          // VERY IMPORTANT:
          //
          // Do not interfere with:
          //
          // Project
          //    ↓
          // Project Details
          //    ↓
          // Revise
          //
          // Those screens manage their own navigation.
          //
          // =================================================

          if (
            pathname.includes(
              "project-details"
            )
          ) {

            console.log(
              "Project Details flow - allowing normal navigation"
            );

            return false;
          }


          // =================================================
          // GUIDE CHAT CONVERSATION
          // =================================================
          //
          // Example:
          //
          // /guide/chat/ABC123
          //
          // The conversation screen has its own
          // custom back button/header.
          //
          // Do not interfere with it.
          //
          // =================================================

          if (
            pathname.startsWith(
              "/guide/chat/"
            )
          ) {

            console.log(
              "Guide chat conversation - allowing normal navigation"
            );

            return false;
          }


          // =================================================
          // GUIDE HOME
          // =================================================
          //
          // IMPORTANT:
          //
          // Returning FALSE here allows Android itself
          // to handle the back action.
          //
          // On a physical Android phone this means:
          //
          // Guide Home
          //      ↓
          // Android Back
          //      ↓
          // App closes
          //
          // Firebase logout DOES NOT happen.
          //
          // =================================================

          if (
            pathname === "/guide"
          ) {

            console.log(
              "Guide Home - allowing Android to close app"
            );

            return false;
          }


          // =================================================
          // GUIDE MAIN DRAWER PAGES
          // =================================================
          //
          // These pages should always return to
          // Guide Home instead of going through
          // navigation history.
          //
          // =================================================

          if (
            pathname === "/guide/students" ||
            pathname === "/guide/add-student" ||
            pathname === "/guide/projects" ||
            pathname === "/guide/chat" ||
            pathname === "/guide/profile"
          ) {

            console.log(
              "Guide main drawer page - returning to Guide Home"
            );

            router.replace(
              "/guide"
            );

            return true;
          }


          // =================================================
          // STUDENT HOME
          // =================================================
          //
          // Student Home → Back → Android closes app
          //
          // =================================================

          if (
            pathname === "/student"
          ) {

            console.log(
              "Student Home - allowing Android to close app"
            );

            return false;
          }


          // =================================================
          // STUDENT MAIN DRAWER PAGES
          // =================================================
          //
          // Any normal Student drawer page goes back
          // to Student Home.
          //
          // Project Details was already excluded above.
          //
          // =================================================

          if (
            pathname.startsWith(
              "/student/"
            )
          ) {

            console.log(
              "Student page - returning to Student Home"
            );

            router.replace(
              "/student"
            );

            return true;
          }


          // =================================================
          // ADMIN HOME
          // =================================================
          //
          // Admin Home → Back → Android closes app
          //
          // =================================================

          if (
            pathname === "/admin" ||
            pathname === "/admin/index"
          ) {

            console.log(
              "Admin Home - allowing Android to close app"
            );

            return false;
          }


          // =================================================
          // ADMIN MAIN DRAWER PAGES
          // =================================================
          //
          // Normal Admin pages return to Admin Home.
          //
          // =================================================

          if (
            pathname.startsWith(
              "/admin/"
            )
          ) {

            console.log(
              "Admin page - returning to Admin Home"
            );

            router.replace(
              "/admin"
            );

            return true;
          }


          // =================================================
          // OTHER PAGES
          // =================================================
          //
          // Login, Register, etc.
          //
          // Let React Navigation / Android handle them.
          //
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

  }, [
    pathname,
  ]);


  // =====================================================
  // SESSION RESTORATION
  // =====================================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {


          // =================================================
          // REGISTER PAGE
          // =================================================

          if (
            pathname === "/register"
          ) {

            console.log(
              "Register page active - skipping session restoration"
            );

            return;
          }


          // =================================================
          // NO LOGGED-IN USER
          // =================================================

          if (!user) {

            console.log(
              "No saved session"
            );

            return;
          }


          // =================================================
          // SESSION RESTORED
          // =================================================

          console.log(
            "SESSION RESTORED"
          );

          console.log(
            "UID:",
            user.uid
          );

          console.log(
            "Email:",
            user.email
          );


          try {

            // ===============================================
            // GET USER PROFILE
            // ===============================================

            const userRef =
              doc(
                db,
                "users",
                user.uid
              );

            const userDoc =
              await getDoc(
                userRef
              );


            // ===============================================
            // PROFILE NOT FOUND
            // ===============================================

            if (
              !userDoc.exists()
            ) {

              console.log(
                "User profile not found"
              );

              await signOut(
                auth
              );

              router.replace(
                "/login"
              );

              return;
            }


            const userData =
              userDoc.data();


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

            if (
              userData.role === "admin"
            ) {

              console.log(
                "Admin session restored"
              );

              console.log(
                "Admin login successful"
              );

              router.replace(
                "/admin"
              );

              return;
            }


            // =================================================
            // STUDENT
            // =================================================

            if (
              userData.role === "student"
            ) {


              // ---------------------------------------------
              // APPROVED STUDENT
              // ---------------------------------------------

              if (
                userData.status === "approved"
              ) {

                console.log(
                  "Approved student session restored"
                );

                console.log(
                  "Redirecting to Student Dashboard"
                );

                router.replace(
                  "/student"
                );

                return;
              }


              // ---------------------------------------------
              // PENDING STUDENT
              // ---------------------------------------------

              if (
                userData.status === "pending"
              ) {

                console.log(
                  "Student account is pending approval"
                );

                console.log(
                  "Student session blocked"
                );

                await signOut(
                  auth
                );

                router.replace(
                  "/login"
                );

                return;
              }


              // ---------------------------------------------
              // REJECTED STUDENT
              // ---------------------------------------------

              if (
                userData.status === "rejected"
              ) {

                console.log(
                  "Student registration was rejected"
                );

                console.log(
                  "Student session blocked"
                );

                await signOut(
                  auth
                );

                router.replace(
                  "/login"
                );

                return;
              }


              // ---------------------------------------------
              // INVALID STATUS
              // ---------------------------------------------

              console.log(
                "Student has invalid status:",
                userData.status
              );

              await signOut(
                auth
              );

              router.replace(
                "/login"
              );

              return;
            }


            // =================================================
            // GUIDE
            // =================================================

            if (
              userData.role === "guide"
            ) {


              // ---------------------------------------------
              // APPROVED GUIDE
              // ---------------------------------------------

              if (
                userData.status === "approved"
              ) {

                console.log(
                  "Approved guide session restored"
                );

                console.log(
                  "Redirecting to Guide Dashboard"
                );

                router.replace(
                  "/guide"
                );

                return;
              }


              // ---------------------------------------------
              // PENDING GUIDE
              // ---------------------------------------------

              if (
                userData.status === "pending"
              ) {

                console.log(
                  "Guide account is pending approval"
                );

                console.log(
                  "Guide session blocked"
                );

                await signOut(
                  auth
                );

                router.replace(
                  "/login"
                );

                return;
              }


              // ---------------------------------------------
              // REJECTED GUIDE
              // ---------------------------------------------

              if (
                userData.status === "rejected"
              ) {

                console.log(
                  "Guide registration was rejected"
                );

                console.log(
                  "Guide session blocked"
                );

                await signOut(
                  auth
                );

                router.replace(
                  "/login"
                );

                return;
              }


              // ---------------------------------------------
              // INVALID STATUS
              // ---------------------------------------------

              console.log(
                "Guide has invalid status:",
                userData.status
              );

              await signOut(
                auth
              );

              router.replace(
                "/login"
              );

              return;
            }


            // =================================================
            // UNKNOWN ROLE
            // =================================================

            console.log(
              "Unknown role:",
              userData.role
            );

            await signOut(
              auth
            );

            router.replace(
              "/login"
            );

          } catch (error) {

            console.log(
              "Error loading user profile:",
              error
            );

          }

        }
      );


    // =====================================================
    // CLEANUP
    // =====================================================

    return unsubscribe;

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

            // Android hardware back is handled
            // by BackHandler above.

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

            // Android hardware back is handled
            // by BackHandler above.

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

            headerBackVisible: false,

            gestureEnabled: false,

            headerStyle: {
              backgroundColor:
                "#FFFFFF",
            },

            headerTintColor:
              "#111827",

            headerTitleStyle: {
              color:
                "#111827",

              fontWeight:
                "700",

              fontSize:
                24,
            },

            headerShadowVisible:
              false,
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
          STATUS BAR
      ================================================= */}

      <StatusBar
        style="dark"
      />

    </ThemeProvider>
  );
}