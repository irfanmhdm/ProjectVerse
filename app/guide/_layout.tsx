import { Drawer } from "expo-router/drawer";
import { router, usePathname } from "expo-router";
import { signOut } from "firebase/auth";
import { BackHandler } from "react-native";
import { useEffect } from "react";

import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

import { Ionicons } from "@expo/vector-icons";

import { auth } from "../../firebase/firebaseConfig";

// =====================================================
// CUSTOM DRAWER
// =====================================================

function CustomDrawerContent(props: any) {

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {

    try {

      await signOut(auth);

      router.replace("/");

    } catch (error) {

      console.log(
        "Logout error:",
        error
      );

      Alert.alert(
        "Logout Failed",
        "Something went wrong while logging out."
      );
    }
  };

  // =====================================================
  // DRAWER UI
  // =====================================================

  return (

    <View
      style={
        styles.drawerContainer
      }
    >

      {/* =================================================
          DRAWER CONTENT
      ================================================= */}

      <DrawerContentScrollView
        {...props}

        contentContainerStyle={
          styles.drawerContent
        }
      >

        {/* =================================================
            DRAWER HEADER
        ================================================= */}

        <View
          style={
            styles.drawerHeader
          }
        >

          <View
            style={
              styles.logoContainer
            }
          >

            <Image
              source={
                require(
                  "../../assets/images/logo.png"
                )
              }

              style={
                styles.logo
              }

              resizeMode="contain"
            />

            <View>

              <Text
                style={
                  styles.appName
                }
              >
                ProjectVerse
              </Text>

              <Text
                style={
                  styles.role
                }
              >
                Guide Portal
              </Text>

            </View>

          </View>

        </View>

        {/* =================================================
            DRAWER PAGES
        ================================================= */}

        <DrawerItemList
          {...props}
        />

      </DrawerContentScrollView>

      {/* =================================================
          LOGOUT
      ================================================= */}

      <View
        style={
          styles.logoutContainer
        }
      >

        <Pressable
          style={
            styles.logoutButton
          }

          onPress={
            handleLogout
          }
        >

          <Ionicons
            name="log-out-outline"
            size={21}
            color="#DC2626"
          />

          <Text
            style={
              styles.logoutText
            }
          >
            Logout
          </Text>

        </Pressable>

      </View>

    </View>
  );
}

// =====================================================
// GUIDE LAYOUT
// =====================================================

export default function GuideLayout() {

  // =====================================================
  // CURRENT ROUTE
  // =====================================================

  const pathname =
    usePathname();

  // =====================================================
  // ANDROID BACK HANDLING
  // =====================================================

  useEffect(() => {

    const handleAndroidBack = () => {

      console.log(
        "Android back pressed:",
        pathname
      );

      // =================================================
      // MAIN GUIDE HOME
      //
      // Home → Back → CLOSE APP
      //
      // This does NOT logout.
      // =================================================

      if (
        pathname === "/guide" ||
        pathname === "/guide/"
      ) {

        console.log(
          "Guide home - exiting app"
        );

        BackHandler.exitApp();

        return true;
      }

      // =================================================
      // MAIN DRAWER PAGES
      //
      // These should ALWAYS return to Home.
      //
      // We intentionally use replace so the previous
      // drawer page does not remain in the navigation
      // history.
      // =================================================

      const mainDrawerPages = [

        "/guide/students",

        "/guide/add-student",

        "/guide/projects",

        "/guide/chat",

        "/guide/profile",

      ];

      if (
        mainDrawerPages.includes(
          pathname
        )
      ) {

        console.log(
          "Main drawer page - returning to Guide Home"
        );

        router.replace(
          "/guide"
        );

        return true;
      }

      // =================================================
      // EVERYTHING ELSE
      //
      // IMPORTANT:
      //
      // Project Details
      // Project Details → Revise
      //
      // Chat → Chat/[studentId]
      //
      // are NOT handled here.
      //
      // Their existing navigation flow remains untouched.
      // =================================================

      return false;
    };

    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        handleAndroidBack
      );

    return () => {

      subscription.remove();

    };

  }, [
    pathname,
  ]);

  // =====================================================
  // DRAWER
  // =====================================================

  return (

    <Drawer

      drawerContent={
        (props) => (
          <CustomDrawerContent
            {...props}
          />
        )
      }

      // =================================================
      // DRAWER BACK BEHAVIOR
      //
      // This prevents drawer history from determining
      // the destination of the Android back action.
      //
      // Our BackHandler above handles the actual
      // Android back/swipe behavior.
      // =================================================

      backBehavior="firstRoute"

      screenOptions={{

        // =================================================
        // HEADER
        // =================================================

        headerShown: true,

        // =================================================
        // DRAWER COLORS
        // =================================================

        drawerActiveTintColor:
          "#4338CA",

        drawerInactiveTintColor:
          "#374151",

        drawerLabelStyle: {

          fontSize: 15,

          fontWeight: "600",

          marginLeft: -5,

        },

        // =================================================
        // DRAWER STYLE
        // =================================================

        drawerStyle: {

          backgroundColor:
            "#FFFFFF",

          width: 285,

        },

        drawerActiveBackgroundColor:
          "#D5F5F2",

        // =================================================
        // HEADER STYLE
        // =================================================

        headerStyle: {

          backgroundColor:
            "#FFFFFF",

        },

        headerTintColor:
          "#1F2937",

        headerTitleStyle: {

          fontSize: 18,

          fontWeight: "700",

          color:
            "#1F2937",

        },

      }}
    >

      {/* =================================================
          HOME
      ================================================= */}

      <Drawer.Screen
        name="index"

        options={{

          title:
            "Home",

          drawerLabel:
            "Home",

          drawerIcon:
            ({
              color,
              size,
            }) => (

              <Ionicons
                name="grid-outline"
                size={size}
                color={color}
              />

            ),

        }}
      />

      {/* =================================================
          MY STUDENTS
      ================================================= */}

      <Drawer.Screen
        name="students"

        options={{

          title:
            "My Students",

          drawerLabel:
            "My Students",

          drawerIcon:
            ({
              color,
              size,
            }) => (

              <Ionicons
                name="people-outline"
                size={size}
                color={color}
              />

            ),

        }}
      />

      {/* =================================================
          ADD STUDENT
      ================================================= */}

      <Drawer.Screen
        name="add-student"

        options={{

          title:
            "Add Student",

          drawerLabel:
            "Add Student",

          drawerIcon:
            ({
              color,
              size,
            }) => (

              <Ionicons
                name="person-add-outline"
                size={size}
                color={color}
              />

            ),

        }}
      />

      {/* =================================================
          PROJECTS
      ================================================= */}

      <Drawer.Screen
        name="projects"

        options={{

          title:
            "Projects",

          drawerLabel:
            "Projects",

          drawerIcon:
            ({
              color,
              size,
            }) => (

              <Ionicons
                name="folder-open-outline"
                size={size}
                color={color}
              />

            ),

        }}
      />

      {/* =================================================
          CHAT LIST
      ================================================= */}

      <Drawer.Screen
        name="chat"

        options={{

          title:
            "Chat",

          drawerLabel:
            "Chat",

          drawerIcon:
            ({
              color,
              size,
            }) => (

              <Ionicons
                name="chatbubbles-outline"
                size={size}
                color={color}
              />

            ),

        }}
      />

      {/* =================================================
          CHAT CONVERSATION
          
          HIDDEN FROM DRAWER

          DO NOT CHANGE THE FLOW.
      ================================================= */}

      <Drawer.Screen
        name="chat/[studentId]"

        options={{

          headerShown:
            false,

          drawerItemStyle: {

            display:
              "none",

          },

        }}
      />

      {/* =================================================
          PROFILE
      ================================================= */}

      <Drawer.Screen
        name="profile"

        options={{

          title:
            "Profile",

          drawerLabel:
            "Profile",

          drawerIcon:
            ({
              color,
              size,
            }) => (

              <Ionicons
                name="person-circle-outline"
                size={size}
                color={color}
              />

            ),

        }}
      />

      {/* =================================================
          PROJECT DETAILS
          
          IMPORTANT:
          
          DO NOT CHANGE THIS FLOW.
          
          Projects
              ↓
          Project Details
              ↓
          Revise
          
          Existing project flow stays untouched.
      ================================================= */}

      <Drawer.Screen
        name="project-details"

        options={{

          title:
            "Project Details",

          drawerItemStyle: {

            display:
              "none",

          },

        }}
      />

    </Drawer>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles =
  StyleSheet.create({

    // ===================================================
    // DRAWER
    // ===================================================

    drawerContainer: {

      flex: 1,

      backgroundColor:
        "#FFFFFF",

    },

    drawerContent: {

      paddingTop:
        0,

    },

    // ===================================================
    // DRAWER HEADER
    // ===================================================

    drawerHeader: {

      paddingHorizontal:
        20,

      paddingTop:
        65,

      paddingBottom:
        24,

      borderBottomWidth:
        1,

      borderBottomColor:
        "#E5E7EB",

      marginBottom:
        8,

    },

    logoContainer: {

      flexDirection:
        "row",

      alignItems:
        "center",

    },

    logo: {

      width:
        48,

      height:
        48,

      marginRight:
        12,

    },

    appName: {

      fontSize:
        21,

      fontWeight:
        "700",

      color:
        "#4338CA",

    },

    role: {

      fontSize:
        13,

      color:
        "#6B7280",

      marginTop:
        3,

    },

    // ===================================================
    // LOGOUT
    // ===================================================

    logoutContainer: {

      borderTopWidth:
        1,

      borderTopColor:
        "#E5E7EB",

      paddingHorizontal:
        15,

      paddingVertical:
        12,

    },

    logoutButton: {

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingVertical:
        13,

      paddingHorizontal:
        15,

      borderRadius:
        10,

    },

    logoutText: {

      fontSize:
        15,

      fontWeight:
        "600",

      color:
        "#DC2626",

      marginLeft:
        12,

    },

  });