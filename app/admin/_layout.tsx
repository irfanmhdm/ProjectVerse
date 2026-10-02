// import { Stack } from "expo-router";

// export default function AdminLayout() {
//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false,
//       }}
//     >

//       {/* ADMIN DASHBOARD */}
//       <Stack.Screen
//         name="index"
//         options={{
//           headerShown: true,
//           title: "Admin",
//           headerBackVisible: false,

//           headerStyle: {
//             backgroundColor: "#FFFFFF",
//           },

//           headerTintColor: "#111827",

//           headerTitleStyle: {
//             fontWeight: "700",
//             fontSize: 24,
//           },

//           headerShadowVisible: false,
//         }}
//       />

//       {/* INNER PAGES */}

//       <Stack.Screen
//         name="approved-students"
//         options={{
//           headerShown: false,
//         }}
//       />

//       <Stack.Screen
//         name="approved-guides"
//         options={{
//           headerShown: false,
//         }}
//       />

//       <Stack.Screen
//         name="student-approval"
//         options={{
//           headerShown: false,
//         }}
//       />

//       <Stack.Screen
//         name="guide-approval"
//         options={{
//           headerShown: false,
//         }}
//       />

//     </Stack>
//   );
// }