import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioManager } from '../../audio/AudioManager';
import { useUIStore } from '../../state/uiStore';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import Backdrop from '../components/Backdrop';

export default function SplashScreen() {
  const go = useUIStore((s) => s.go);
  const pulse = useRef(new Animated.Value(0.4)).current;
  const rise = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(rise, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, rise]);

  return (
    <Backdrop>
      <Pressable
        style={styles.root}
        onPress={() => {
          AudioManager.unlock();
          go('menu');
        }}
      >
        <Animated.View style={{ transform: [{ translateY: rise }], alignItems: 'center' }}>
          <Text style={styles.kicker}>PREMIUM ARCADE RACING</Text>
          <Text style={styles.nitro}>NITRO</Text>
          <View style={styles.bar} />
          <Text style={styles.syndicate}>STREET SYNDICATE</Text>
        </Animated.View>
        <Animated.Text style={[styles.tap, { opacity: pulse }]}>TAP TO START</Animated.Text>
        <Text style={styles.ver}>v0.1 · vertical slice</Text>
      </Pressable>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontFamily: Type.display, fontSize: Type.size.sm, fontWeight: '700', color: Colors.cyan, letterSpacing: 6, marginBottom: 6 },
  nitro: {
    fontFamily: Type.display,
    fontSize: 88,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 4,
    textShadowColor: 'rgba(255,122,26,0.6)',
    textShadowRadius: 22,
    lineHeight: 92,
  },
  bar: { width: 220, height: 4, backgroundColor: Colors.nitro, borderRadius: 2, marginVertical: 6 },
  syndicate: { fontFamily: Type.display, fontSize: Type.size.xl, fontWeight: '900', color: Colors.text, letterSpacing: 8 },
  tap: { position: 'absolute', bottom: 70, fontFamily: Type.display, fontSize: Type.size.lg, fontWeight: '900', color: Colors.text, letterSpacing: 3 },
  ver: { position: 'absolute', bottom: 24, fontFamily: Type.mono, fontSize: Type.size.xs, color: Colors.textDim },
});
