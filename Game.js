import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Constants
const FPS = 60;
const DELTA = 1000 / FPS;
const SPEED = 10;
const BALL_WIDTH = 15;

const islandDimensions = { x: 212, y: 7, w: 25, h: 25 }; // island dimensions

// vector normalization
const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
};

export default function Game() {
  const { height, width } = useWindowDimensions();

  const playerDimensions = {
    w: width / 2,
    h: 37,
  }; // player dimensions

  const targetPositionX = useSharedValue(width / 2);
  const targetPositionY = useSharedValue(height / 2);
  const direction = useSharedValue(
    normalizeVector({ x: Math.random(), y: Math.random() })
  );
  const playerPosition = useSharedValue({ x: width / 4, y: height - 100 });

  useEffect(() => {
    const interval = setInterval(update, DELTA);
    return () => clearInterval(interval);
  }, []);

  // update ball position
  const update = () => {
    let nextPos = getNextPos(direction.value);
    let newDirection = direction.value;

    // wall hit detection
    if (nextPos.x < 0 || nextPos.x > width - BALL_WIDTH) {
      newDirection = { x: -direction.value.x, y: direction.value.y };
    }

    if (nextPos.y < 0 || nextPos.y > height - BALL_WIDTH) {
      newDirection = { x: direction.value.x, y: -direction.value.y };
    }

    // island hit detection
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
        newDirection = { x: -direction.value.x, y: direction.value.y };
      } else {
        newDirection = { x: direction.value.x, y: -direction.value.y };
      }
    }

    // player hit detection
    if (
      nextPos.x < playerPosition.value.x + playerDimensions.w &&
      nextPos.x + BALL_WIDTH > playerPosition.value.x &&
      nextPos.y < playerPosition.value.y + playerDimensions.h &&
      BALL_WIDTH + nextPos.y > playerPosition.value.y
    ) {
      if (
        targetPositionX.value < playerPosition.value.x ||
        targetPositionX.value > playerPosition.value.x + playerDimensions.w
      ) {
        newDirection = { x: -direction.value.x, y: direction.value.y };
      } else {
        newDirection = { x: direction.value.x, y: -direction.value.y };
      }
    }

    direction.value = newDirection;
    nextPos = getNextPos(newDirection);

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

  const playerAnimatedStyles = useAnimatedStyle(() => {
    return { left: playerPosition.value.x };
  });

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event) => {
      console.log(event);
    },
    onActive: (event) => {
      playerPosition.value = {
        ...playerPosition.value,
        x: event.absoluteX - playerDimensions.w / 2,
      };
    },
    onEnd: () => {},
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ball, ballAnimatedStyles]} />

      {/* Island */}
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

      {/* Player */}
      <Animated.View
        style={[
          {
            top: playerPosition.value.y,
            width: playerDimensions.w,
            height: playerDimensions.h,
            position: "absolute",
            backgroundColor: "black",
            borderRadius: 20,
          },
          playerAnimatedStyles,
        ]}
      />

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={{
            width: "100%",
            height: 200,
            position: "absolute",
            bottom: 0,
          }}
        ></Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
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
