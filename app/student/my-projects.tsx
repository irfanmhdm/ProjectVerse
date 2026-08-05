import { StyleSheet, Text, View } from "react-native";

export default function MyProjects() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Projects</Text>
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