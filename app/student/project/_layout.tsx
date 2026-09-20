import { Stack } from "expo-router";

export default function ProjectLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="project-details"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="revise-project"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}