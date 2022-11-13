import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Constants
const FPS = 60;
const DELTA = 1000 / FPS;
const SPEED = 10;
const BALL_WIDTH = 15;

const islandDimensions = { x: 150, y: 11, w: 127, h: 37 }; // ideal island dimensions

// vector normalization
const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
};

export default function App() {
  const { height, width } = useWindowDimensions();
  const targetPositionX = useSharedValue(width / 2);
  const targetPositionY = useSharedValue(height / 2);
  const direction = useSharedValue(
    normalizeVector({ x: Math.random(), y: Math.random() })
  );
  useEffect(() => {
    const interval = setInterval(update, DELTA);
    return () => clearInterval(interval);
  }, []);

  // update ball position
  const update = () => {
    let nextPos = getNextPos(direction.value);

    if (nextPos.x < 0 || nextPos.x > width - BALL_WIDTH) {
      const newDirection = { x: -direction.value.x, y: direction.value.y };
      direction.value = newDirection;
      nextPos = getNextPos(newDirection);
    }

    if (nextPos.y < 0 || nextPos.y > height - BALL_WIDTH) {
      const newDirection = { x: direction.value.x, y: -direction.value.y };
      direction.value = newDirection;
      nextPos = getNextPos(newDirection);
    }

    // handle ball collision with island
    if (
      nextPos.x < islandDimensions.x + islandDimensions.w &&
      nextPos.x + BALL_WIDTH > islandDimensions.x &&
      nextPos.y < islandDimensions.y + islandDimensions.h &&
      BALL_WIDTH + nextPos.y > islandDimensions.y
    ) {
      if (
        targetPositionX.value < islandDimensions.x ||
        targetPositionX.value > islandDimensions.x + islandDimensions.w
      ) {
        const newDirection = { x: -direction.value.x, y: direction.value.y };
        direction.value = newDirection;
        nextPos = getNextPos(newDirection);
      } else {
        const newDirection = { x: direction.value.x, y: -direction.value.y };
        direction.value = newDirection;
        nextPos = getNextPos(newDirection);
      }
    }

    // use withTiming for continous movement of ball
    targetPositionX.value = withTiming(nextPos.x, {
      duration: DELTA,
      easing: Easing.linear,
    });
    targetPositionY.value = withTiming(nextPos.y, {
      duration: DELTA,
      easing: Easing.linear,
    });
  };

  const getNextPos = (direction) => {
    return {
      x: targetPositionX.value + direction.x * SPEED,
      y: targetPositionY.value + direction.y * SPEED,
    };
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

      <View
        style={{
          top: islandDimensions.y,
          left: islandDimensions.x,
          width: islandDimensions.w,
          height: islandDimensions.h,
          position: "absolute",
          backgroundColor: "black",
          borderRadius: 20,
        }}
      />

      <StatusBar style="light" />
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
    width: BALL_WIDTH,
    aspectRatio: 1,
    borderRadius: 25,
    position: "absolute",
  },
});
