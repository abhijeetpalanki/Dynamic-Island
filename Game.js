import { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  BounceIn,
  Easing,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Constants
const FPS = 60;
const DELTA = 1000 / FPS;
const SPEED = 20;
const BALL_WIDTH = 15;

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
    h: 25,
  }; // player dimensions
  const islandDimensions = { x: 150, y: 11, w: width / 4, h: 25 }; // island dimensions

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const targetPositionX = useSharedValue(width / 2);
  const targetPositionY = useSharedValue(height / 2);
  const direction = useSharedValue(
    normalizeVector({ x: Math.random(), y: Math.random() })
  );
  const playerPosition = useSharedValue({ x: width / 4, y: height - 100 });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        update();
      }
    }, DELTA);
    return () => clearInterval(interval);
  }, [gameOver]);

  // update ball position
  const update = () => {
    let nextPos = getNextPos(direction.value);
    let newDirection = direction.value;

    // wall hit detection
    if (nextPos.y > height - BALL_WIDTH) {
      setGameOver(true);
    }

    if (nextPos.x < 0 || nextPos.x > width - BALL_WIDTH) {
      newDirection = { x: -direction.value.x, y: direction.value.y };
    }

    if (nextPos.y < 0) {
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
      setScore((s) => s + 1);
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

  const restartGame = () => {
    targetPositionX.value = width / 2;
    targetPositionY.value = height / 2;
    setScore(0);
    setGameOver(false);
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

  const islandAnimatedStyles = useAnimatedStyle(() => {
    return {
      width: withRepeat(
        withSequence(
          withTiming(islandDimensions.w * 1.3, { duration: 100 }),
          withTiming(islandDimensions.w, { duration: 100 })
        ),
        3
      ),
      height: withRepeat(
        withSequence(
          withTiming(islandDimensions.h * 1.3, { duration: 100 }),
          withTiming(islandDimensions.h, { duration: 100 })
        ),
        3
      ),
      opacity: withRepeat(
        withSequence(
          withTiming(0, { duration: 100 }),
          withTiming(1, { duration: 100 })
        ),
        3
      ),
    };
  }, [score]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {},
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
      <Text style={styles.score}>{score}</Text>
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOver}>Game Over</Text>

          <Button title="Restart" onPress={restartGame} />
        </View>
      )}

      {!gameOver && <Animated.View style={[styles.ball, ballAnimatedStyles]} />}

      {/* Island */}
      <Animated.View
        entering={BounceIn}
        key={score}
        style={{
          position: "absolute",
          top: islandDimensions.y,
          left: islandDimensions.x,
          width: islandDimensions.w,
          height: islandDimensions.h,
          borderRadius: 20,
          backgroundColor: "black",
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
  score: {
    fontSize: 150,
    fontWeight: "500",
    position: "absolute",
    top: 150,
    color: "lightgrey",
  },
  gameOverContainer: {
    position: "absolute",
    top: 300,
  },
  gameOver: {
    fontSize: 50,
    fontWeight: "500",
    color: "red",
  },
});
