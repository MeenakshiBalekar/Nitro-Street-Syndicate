import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useHudStore } from '../../state/hudStore';
import { clamp01 } from '../../util/math';

// Full-screen motion overlay: side speed-lines that intensify with velocity and
// recolor for nitro (orange) / slipstream (cyan), plus a red crash flash. Sits
// behind the HUD widgets, above the 3D canvas. Purely cosmetic, no input.
export default function SpeedFX() {
  const speed = useHudStore((s) => s.speed);
  const nitroActive = useHudStore((s) => s.nitroActive);
  const drafting = useHudStore((s) => s.drafting);
  const flash = useHudStore((s) => s.flash);

  const ratio = clamp01((speed - 90) / 180);
  const intensity = ratio * (nitroActive ? 0.7 : 0.45);
  const edge = nitroActive ? '255,122,26' : drafting ? '46,230,214' : '255,255,255';
  const left: [string, string] = [`rgba(${edge},0.9)`, 'rgba(0,0,0,0)'];
  const right: [string, string] = ['rgba(0,0,0,0)', `rgba(${edge},0.9)`];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={left}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.side, { left: 0, opacity: intensity }]}
      />
      <LinearGradient
        colors={right}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.side, { right: 0, opacity: intensity }]}
      />
      {/* cinematic top/bottom darkening at high speed */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        style={[styles.band, { top: 0, opacity: ratio * 0.5 }]}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
        style={[styles.band, { bottom: 0, opacity: ratio * 0.5 }]}
      />
      {flash > 0.01 ? (
        <View style={[styles.flash, { opacity: flash * 0.45 }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  side: { position: 'absolute', top: 0, bottom: 0, width: '26%' },
  band: { position: 'absolute', left: 0, right: 0, height: '22%' },
  flash: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#FF2A3D' },
});
