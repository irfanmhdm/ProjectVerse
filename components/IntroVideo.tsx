import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

type Props = {
  onFinished: () => void;
};

export default function IntroVideo({ onFinished }: Props) {
  const finishedRef = useRef(false);

  const player = useVideoPlayer(
    require("../assets/videos/projectverse-intro.mp4"),
    (player) => {
      player.loop = false;
      player.muted = true;
    }
  );

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      if (finishedRef.current) return;

      finishedRef.current = true;

      console.log("ProjectVerse intro finished.");

      onFinished();
    });

    return () => {
      subscription.remove();
    };
  }, [player, onFinished]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        player.currentTime = 0;
        player.play();
      } catch (error) {
        console.log("Video playback error:", error);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [player]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  video: {
    width: "100%",
    height: "100%",
  },
});