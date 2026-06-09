import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';

// Entrance animation applied per screen (keyed by screen id in App) so every
// navigation fades + lifts the incoming screen into place.
export default function ScreenTransition({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(16)).current;
  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: useNative }),
      Animated.timing(lift, { toValue: 0, duration: 320, useNativeDriver: useNative }),
    ]).start();
  }, [opacity, lift, useNative]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, transform: [{ translateY: lift }] }]}>
      {children}
    </Animated.View>
  );
}
