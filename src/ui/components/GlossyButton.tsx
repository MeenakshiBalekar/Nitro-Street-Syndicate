import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AudioManager } from '../../audio/AudioManager';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';

type Variant = 'primary' | 'nitro' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  sub?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

const GRADIENTS: Record<Variant, [string, string]> = {
  primary: [Colors.primary, Colors.primaryDark],
  nitro: [Colors.nitro, Colors.nitroHot],
  ghost: [Colors.surfaceGlass, Colors.surfaceGlassSoft],
};

export default function GlossyButton({ label, onPress, variant = 'primary', sub, disabled, style }: Props) {
  const colors = GRADIENTS[variant];
  const dark = variant !== 'ghost';
  return (
    <Pressable
      onPress={
        disabled
          ? undefined
          : () => {
              AudioManager.unlock();
              AudioManager.play('ui');
              onPress();
            }
      }
      style={({ pressed }) => [
        styles.wrap,
        style,
        { opacity: disabled ? 0.4 : pressed ? 0.86 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.grad}>
        <View style={styles.sheen} />
        <Text style={[styles.label, { color: dark ? '#15110A' : Colors.text }]}>{label}</Text>
        {sub ? <Text style={[styles.sub, { color: dark ? 'rgba(20,16,8,0.7)' : Colors.textMuted }]}>{sub}</Text> : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.strokeStrong },
  grad: { paddingVertical: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  label: { fontFamily: Type.display, fontSize: Type.size.lg, fontWeight: Type.weight.black, letterSpacing: 1 },
  sub: { fontFamily: Type.display, fontSize: Type.size.xs, fontWeight: Type.weight.bold, marginTop: 2 },
});
