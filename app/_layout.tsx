import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { Stack, router, usePathname } from "expo-router";

import { StatusBar } from "expo-status-bar";

import { useEffect, useRef, useState } from "react";

import { BackHandler, View, StyleSheet } from "react-native";

import "react-native-reanimated";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebaseConfig";

import { useColorScheme } from "@/hooks/use-color-scheme";

import * as SplashScreen from "expo-splash-screen";

import IntroVideo from "../components/IntroVideo";

// =====================================================
// KEEP NATIVE SPLASH SCREEN VISIBLE
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
  // NATIVE SPLASH COMPLETED
  // =====================================================

  const [nativeSplashFinished, setNativeSplashFinished] =
    useState(false);

  // =====================================================
  // PROJECTVERSE INTRO
  // =====================================================

  const [showIntro, setShowIntro] = useState(true);

  // =====================================================
  // PATHNAME REF
  // =====================================================

  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // =====================================================
  // NATIVE SPLASH TIMER
  // =====================================================

  useEffect(() => {
    console.log("Native splash timer started.");

    const splashTimer = setTimeout(async () => {
      console.log("1 second completed.");

      try {
        await SplashScreen.hideAsync();

        console.log("Native splash screen hidden.");

        setNativeSplashFinished(true);
      } catch (error) {
        console.log(
          "Error hiding native splash:",
          error
        );

        setNativeSplashFinished(true);
      }
    }, 1000);

    return () => {
      clearTimeout(splashTimer);
    };
  }, []);

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
        console.log(
          "Android back pressed:",
          pathname
        );

        // =================================================
        // SIMILARITY RESULTS
        // =================================================

        if (
          pathname ===
          "/student/similarity-results"
        ) {
          router.replace(
            "/student/similarity"
          );

          return true;
        }

        // =================================================
        // PROJECT DETAILS
        // =================================================

        if (
          pathname.includes(
            "project-details"
          )
        ) {
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
          return false;
        }

        // =================================================
        // GUIDE HOME
        // =================================================

        if (
          pathname === "/guide"
        ) {
          return false;
        }

        // =================================================
        // GUIDE MAIN PAGES
        // =================================================

        if (
          pathname ===
            "/guide/students" ||

          pathname ===
            "/guide/add-student" ||

          pathname ===
            "/guide/projects" ||

          pathname ===
            "/guide/chat" ||

          pathname ===
            "/guide/profile"
        ) {
          router.replace("/guide");

          return true;
        }

        // =================================================
        // STUDENT HOME
        // =================================================

        if (
          pathname === "/student"
        ) {
          BackHandler.exitApp();

          return true;
        }

        // =================================================
        // PROJECT DETAILS / REVISE PROJECT
        // =================================================

        if (
          pathname ===
            "/student/project/project-details" ||

          pathname ===
            "/student/project/revise-project"
        ) {
          console.log(
            "Project nested page - allowing normal back navigation"
          );

          return false;
        }

        // =================================================
        // OTHER STUDENT PAGES
        // =================================================

        if (
          pathname.startsWith(
            "/student/"
          )
        ) {
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
          BackHandler.exitApp();

          return true;
        }

        // =================================================
        // DEFAULT
        // =================================================

        return false;
      }
    );

    return () => {
      backHandler.remove();
    };
  }, [pathname]);

  // =====================================================
  // FIREBASE AUTH INITIALIZATION
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
          // NO SAVED SESSION
          // =================================================

          if (!user) {
            console.log(
              "No saved session."
            );

            console.log(
              "Opening index page."
            );

            setIsInitializing(false);

            return;
          }

          // =================================================
          // SAVED SESSION FOUND
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

          if (
            pathnameRef.current ===
            "/register"
          ) {
            console.log(
              "REGISTER PAGE ACTIVE"
            );

            console.log(
              "Skipping session restoration."
            );

            setIsInitializing(false);

            return;
          }

          try {
            // =================================================
            // LOAD USER PROFILE
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
              await getDoc(userRef);

            // =================================================
            // CHECK REGISTER AGAIN
            // =================================================

            if (
              pathnameRef.current ===
              "/register"
            ) {
              console.log(
                "Route changed to register."
              );

              setIsInitializing(false);

              return;
            }

            // =================================================
            // PROFILE DOES NOT EXIST
            // =================================================

            if (!userDoc.exists()) {
              console.log(
                "User profile not found."
              );

              await signOut(auth);

              setIsInitializing(false);

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
            // ADMIN
            // =================================================

            if (
              userData.role ===
              "admin"
            ) {
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
                  "Redirecting to Admin Dashboard."
                );

                router.replace(
                  "/admin"
                );
              } else {
                console.log(
                  "Admin already inside application."
                );
              }

              setIsInitializing(false);

              return;
            }

            // =================================================
            // STUDENT
            // =================================================

            if (
              userData.role ===
              "student"
            ) {
              // =================================================
              // APPROVED STUDENT
              // =================================================

              if (
                userData.status ===
                "approved"
              ) {
                console.log(
                  "Approved student."
                );

                const currentPath =
                  pathnameRef.current;

                const isAuthPage =
                  currentPath === "/" ||
                  currentPath === "/login";

                if (isAuthPage) {
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
                }

                setIsInitializing(false);

                return;
              }

              // =================================================
              // PENDING STUDENT
              // =================================================

              if (
                userData.status ===
                "pending"
              ) {
                console.log(
                  "Student account is pending approval."
                );

                await signOut(auth);

                setIsInitializing(false);

                router.replace(
                  "/login"
                );

                return;
              }

              // =================================================
              // REJECTED STUDENT
              // =================================================

              if (
                userData.status ===
                "rejected"
              ) {
                console.log(
                  "Student registration was rejected."
                );

                await signOut(auth);

                setIsInitializing(false);

                router.replace(
                  "/login"
                );

                return;
              }

              // =================================================
              // INVALID STUDENT STATUS
              // =================================================

              console.log(
                "Invalid student status:",
                userData.status
              );

              await signOut(auth);

              setIsInitializing(false);

              router.replace(
                "/login"
              );

              return;
            }

            // =================================================
            // GUIDE
            // =================================================

            if (
              userData.role ===
              "guide"
            ) {
              // =================================================
              // APPROVED GUIDE
              // =================================================

              if (
                userData.status ===
                "approved"
              ) {
                console.log(
                  "Approved guide."
                );

                const currentPath =
                  pathnameRef.current;

                const isAuthPage =
                  currentPath === "/" ||
                  currentPath === "/login";

                if (isAuthPage) {
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
                }

                setIsInitializing(false);

                return;
              }

              // =================================================
              // PENDING GUIDE
              // =================================================

              if (
                userData.status ===
                "pending"
              ) {
                console.log(
                  "Guide account is pending approval."
                );

                await signOut(auth);

                setIsInitializing(false);

                router.replace(
                  "/login"
                );

                return;
              }

              // =================================================
              // REJECTED GUIDE
              // =================================================

              if (
                userData.status ===
                "rejected"
              ) {
                console.log(
                  "Guide registration was rejected."
                );

                await signOut(auth);

                setIsInitializing(false);

                router.replace(
                  "/login"
                );

                return;
              }

              // =================================================
              // INVALID GUIDE STATUS
              // =================================================

              console.log(
                "Invalid guide status:",
                userData.status
              );

              await signOut(auth);

              setIsInitializing(false);

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

            await signOut(auth);

            setIsInitializing(false);

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
  // APP UI
  // =====================================================

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <View style={styles.root}>

        {/* =================================================
            EXPO ROUTER APP
        ================================================= */}

        <Stack>

          {/* INDEX / HOME */}

          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />

          {/* LOGIN */}

          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
            }}
          />

          {/* REGISTER */}

          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
            }}
          />

          {/* STUDENT */}

          <Stack.Screen
            name="student"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* GUIDE */}

          <Stack.Screen
            name="guide"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* ADMIN */}

          <Stack.Screen
            name="admin"
            options={{
              headerShown: false,
            }}
          />

          {/* MODAL */}

          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              title: "Modal",
            }}
          />

        </Stack>

        {/* =================================================
            PROJECTVERSE INTRO OVERLAY
        ================================================= */}

        {nativeSplashFinished && showIntro && (
          <View
            style={styles.introOverlay}
          >
            <IntroVideo
              onFinished={() => {
                console.log(
                  "ProjectVerse intro finished."
                );

                setShowIntro(false);
              }}
            />
          </View>
        )}

      </View>

      {/* =====================================================
          STATUS BAR
      ===================================================== */}

      <StatusBar style="dark" />

    </ThemeProvider>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: "#F5F7FB",
  },
});