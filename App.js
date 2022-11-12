import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const FPS = 60;
const DELTA = 1000 / FPS;
const SPEED = 0.5;

export default function App() {
  const targetPositionX = useSharedValue(0);
  const targetPositionY = useSharedValue(0);
  const directionX = useSharedValue(0);
  const directionY = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(update, DELTA);

    return () => clearInterval(interval);
  }, []);

  const update = () => {
    targetPositionX.value = withTiming(
      targetPositionX.value + directionX.value * SPEED,
      {
        duration: DELTA,
        easing: Easing.linear,
      }
    );
    targetPositionY.value = withTiming(
      targetPositionY.value + directionY.value * SPEED,
      {
        duration: DELTA,
        easing: Easing.linear,
      }
    );
  };

  const ballAnimatedStyles = useAnimatedStyle(() => {
    return {
      top: targetPositionY.value,
      left: targetPositionX.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ball, ballAnimatedStyles]} />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  ball: {
    backgroundColor: "black",
    width: 25,
    aspectRatio: 1,
    borderRadius: 25,
    position: "absolute",
  },
});
