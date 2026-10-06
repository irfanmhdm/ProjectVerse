// import { useEffect } from "react";
// import { StyleSheet, View } from "react-native";
// import { VideoView, useVideoPlayer } from "expo-video";

// type Props = {
//   onFinished: () => void;
// };

// export default function IntroVideo({ onFinished }: Props) {
//   const player = useVideoPlayer(
//     require("../assets/videos/projectverse-intro.mp4"),
//     (player) => {
//       player.loop = false;
//       player.muted = true;
//     }
//   );

//   useEffect(() => {
//     const subscription = player.addListener("playToEnd", () => {
//       console.log("ProjectVerse intro finished.");
//       onFinished();
//     });

//     // Start playback only after the player is mounted.
//     player.play();

//     return () => {
//       subscription.remove();
//     };
//   }, [player, onFinished]);

//   return (
//     <View style={styles.container}>
//       <VideoView
//         player={player}
//         style={styles.video}
//         contentFit="cover"
//         nativeControls={false}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F7FB",
//   },

//   video: {
//     width: "100%",
//     height: "100%",
//   },
// });