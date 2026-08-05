import { StyleSheet, Text, View } from "react-native";

export default function ExploreProjects() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore Projects</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "white",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },
});