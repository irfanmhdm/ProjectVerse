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

import {
  useEffect,
  useRef,
} from "react";

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
  // KEEP CURRENT PATHNAME IN REF
  // =====================================================
  //
  // IMPORTANT:
  //
  // We do NOT put pathname in the Firebase auth
  // useEffect dependency array.
  //
  // Instead, this ref always contains the latest route.
  //
  // =====================================================

  const pathnameRef =
    useRef(pathname);

  useEffect(() => {

    pathnameRef.current =
      pathname;

  }, [
    pathname,
  ]);


  // =====================================================
  // ANDROID BACK HANDLING
  // =====================================================

  useEffect(() => {

    if (
      typeof pathname !== "string"
    ) {
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
          // PROJECT DETAILS
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

          if (
            pathname === "/guide"
          ) {

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

            router.replace(
              "/guide"
            );

            return true;
          }


          // =================================================
          // STUDENT HOME
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
          // STUDENT PAGES
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
          // ADMIN PAGES
          // =================================================
          //
          // IMPORTANT:
          //
          // There is NO admin route replacement here.
          //
          // Therefore:
          //
          // /admin/approved-students
          // /admin/approved-guides
          // /admin/student-approval
          //
          // will remain on their current page.
          //
          // Android back will use normal navigation.
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

  }, [
    pathname,
  ]);


  // =====================================================
  // FIREBASE SESSION RESTORATION
  // =====================================================
  //
  // VERY IMPORTANT:
  //
  // DO NOT PUT pathname IN THIS DEPENDENCY ARRAY.
  //
  // This listener should exist only ONCE.
  //
  // Otherwise every route change causes:
  //
  // onAuthStateChanged()
  //       ↓
  // get user
  //       ↓
  // router.replace("/admin")
  //
  // =====================================================

  useEffect(() => {

    console.log(
      "===================================="
    );

    console.log(
      "CREATING FIREBASE AUTH LISTENER"
    );

    console.log(
      "Initial pathname:",
      pathnameRef.current
    );

    console.log(
      "===================================="
    );


    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          console.log(
            "===================================="
          );

          console.log(
            "AUTH STATE CHANGED"
          );

          console.log(
            "CURRENT PATH:",
            pathnameRef.current
          );


          // =================================================
          // NO USER
          // =================================================

          if (!user) {

            console.log(
              "No saved session"
            );

            console.log(
              "===================================="
            );

            return;
          }


          // =================================================
          // USER EXISTS
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


          // =================================================
          // REGISTRATION PROTECTION
          // =================================================
          //
          // During registration:
          //
          // createUserWithEmailAndPassword()
          //        ↓
          // Auth state changes
          //
          // But users/{uid} may not exist yet.
          //
          // Therefore NEVER perform session restoration
          // while the register screen is active.
          //
          // =================================================

          if (
            pathnameRef.current === "/register"
          ) {

            console.log(
              "REGISTER PAGE ACTIVE"
            );

            console.log(
              "Skipping session restoration."
            );

            console.log(
              "===================================="
            );

            return;
          }


          try {

            // =================================================
            // GET USER PROFILE
            // =================================================

            const userRef =
              doc(
                db,
                "users",
                user.uid
              );


            console.log(
              "Loading user profile..."
            );


            const userDoc =
              await getDoc(
                userRef
              );


            // =================================================
            // CHECK REGISTER AGAIN
            // =================================================

            if (
              pathnameRef.current === "/register"
            ) {

              console.log(
                "Route is now register."
              );

              console.log(
                "Stopping session restoration."
              );

              return;
            }


            // =================================================
            // PROFILE NOT FOUND
            // =================================================

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


            // =================================================
            // USER DATA
            // =================================================

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
            // IMPORTANT ROUTE CHECK
            // =================================================
            //
            // If the user is ALREADY inside an authenticated
            // section, do NOT redirect them.
            //
            // This is the main fix for your Admin problem.
            //
            // =================================================


            // =================================================
            // ADMIN
            // =================================================

            if (
              userData.role === "admin"
            ) {

              console.log(
                "Admin session verified."
              );


              // ---------------------------------------------
              // ONLY REDIRECT TO ADMIN HOME IF USER IS
              // CURRENTLY ON AN AUTHENTICATION / ROOT PAGE.
              // ---------------------------------------------

              const currentPath =
                pathnameRef.current;


              const isAuthPage =
                currentPath === "/" ||
                currentPath === "/login";


              if (
                isAuthPage
              ) {

                console.log(
                  "Admin is on auth/root page."
                );

                console.log(
                  "Redirecting to Admin Dashboard."
                );

                router.replace(
                  "/admin"
                );

              } else {

                console.log(
                  "Admin is already inside application."
                );

                console.log(
                  "Keeping current route:",
                  currentPath
                );

              }

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

                const currentPath =
                  pathnameRef.current;


                const isAuthPage =
                  currentPath === "/" ||
                  currentPath === "/login";


                if (
                  isAuthPage
                ) {

                  console.log(
                    "Approved student."
                  );

                  console.log(
                    "Redirecting to Student Dashboard."
                  );

                  router.replace(
                    "/student"
                  );

                } else {

                  console.log(
                    "Student already inside application."
                  );

                  console.log(
                    "Keeping current route:",
                    currentPath
                  );

                }

                return;
              }


              // ---------------------------------------------
              // PENDING STUDENT
              // ---------------------------------------------

              if (
                userData.status === "pending"
              ) {

                console.log(
                  "Student account is pending approval."
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
                  "Student registration was rejected."
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

                const currentPath =
                  pathnameRef.current;


                const isAuthPage =
                  currentPath === "/" ||
                  currentPath === "/login";


                if (
                  isAuthPage
                ) {

                  console.log(
                    "Approved guide."
                  );

                  console.log(
                    "Redirecting to Guide Dashboard."
                  );

                  router.replace(
                    "/guide"
                  );

                } else {

                  console.log(
                    "Guide already inside application."
                  );

                  console.log(
                    "Keeping current route:",
                    currentPath
                  );

                }

                return;
              }


              // ---------------------------------------------
              // PENDING GUIDE
              // ---------------------------------------------

              if (
                userData.status === "pending"
              ) {

                console.log(
                  "Guide account is pending approval."
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
                  "Guide registration was rejected."
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

          } catch (error: any) {

            console.log(
              "===================================="
            );

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

            console.log(
              "===================================="
            );

            // IMPORTANT:
            //
            // Do NOT automatically navigate to /admin
            // or /login here.
            //
            // If Firestore is temporarily offline,
            // keep the current screen instead of
            // unexpectedly navigating away.

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
          name="admin/index"
          options={{
            headerShown: true,

            title: "Admin",

            headerBackVisible: false,

            gestureEnabled: false,

            headerStyle: {
              backgroundColor: "#FFFFFF",
            },

            headerTintColor:
              "#111827",

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


      {/* =================================================
          STATUS BAR
      ================================================= */}

      <StatusBar
        style="dark"
      />

    </ThemeProvider>
  );
}