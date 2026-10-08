import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

type Props = {
  onFinished: () => void;
  startPlayback: boolean;
};

export default function IntroVideo({
  onFinished,
  startPlayback,
}: Props) {
  const finishedRef = useRef(false);
  const startedRef = useRef(false);

  const player = useVideoPlayer(
    require("../assets/videos/projectverse-intro.mp4"),
    (player) => {
      player.loop = false;
      player.muted = true;
      player.pause();
      player.currentTime = 0;
    },
  );

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      if (finishedRef.current) return;

      finishedRef.current = true;

      try {
        player.pause();
      } catch (error) {
        console.log("Video pause error:", error);
      }

      console.log("ProjectVerse intro finished.");
      onFinished();
    });

    return () => {
      subscription.remove();
    };
  }, [player, onFinished]);

  useEffect(() => {
    if (!startPlayback) return;
    if (startedRef.current) return;

    startedRef.current = true;

    try {
      player.currentTime = 0;
      player.play();

      console.log("ProjectVerse intro started from 0:00.");
    } catch (error) {
      console.log("Video playback error:", error);
    }
  }, [player, startPlayback]);

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