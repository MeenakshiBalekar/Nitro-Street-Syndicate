import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useHudStore } from '../../state/hudStore';
import { Colors } from '../../theme/colors';

// First-person cockpit frame, shown only in cockpit camera mode. The player's 3D
// bike is hidden in that mode (see RaceScene), so this stylized handlebar +
// instrument-cowl frame is what sells the "on the bike" feel — and the
// Speedometer sits inside the central binnacle.
export default function CockpitOverlay() {
  const cam = useHudStore((s) => s.camMode);
  if (cam !== 'cockpit') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* dark cowl rising from the bottom */}
      <LinearGradient
        colors={['rgba(8,10,16,0)', 'rgba(8,10,16,0.55)', 'rgba(6,8,12,0.96)']}
        style={styles.cowl}
      />

      {/* mirrors */}
      <View style={[styles.mirror, { left: '5%', transform: [{ rotate: '-8deg' }] }]}>
        <LinearGradient colors={['#1A2233', '#0A0E16']} style={styles.mirrorGlass} />
      </View>
      <View style={[styles.mirror, { right: '5%', transform: [{ rotate: '8deg' }] }]}>
        <LinearGradient colors={['#1A2233', '#0A0E16']} style={styles.mirrorGlass} />
      </View>

      {/* handlebars angling up toward the centre */}
      <View style={[styles.bar, styles.leftBar]}>
        <LinearGradient colors={['#2A3242', '#0C1018']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.barGrad} />
      </View>
      <View style={[styles.bar, styles.rightBar]}>
        <LinearGradient colors={['#2A3242', '#0C1018']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.barGrad} />
      </View>
      {/* grips */}
      <View style={[styles.grip, { left: '7%' }]} />
      <View style={[styles.grip, { right: '7%' }]} />

      {/* central instrument binnacle (the Speedometer renders on top of this) */}
      <View style={styles.binnacle}>
        <LinearGradient colors={['#161C2A', '#080B12']} style={StyleSheet.absoluteFill} />
        <View style={styles.binnacleRim} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cowl: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },
  mirror: {
    position: 'absolute',
    top: '12%',
    width: 70,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(46,230,214,0.35)',
    overflow: 'hidden',
    backgroundColor: '#0A0E16',
  },
  mirrorGlass: { flex: 1, opacity: 0.9 },
  bar: { position: 'absolute', bottom: '12%', width: '44%', height: 18, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  barGrad: { flex: 1 },
  leftBar: { left: '4%', transform: [{ rotate: '-15deg' }] },
  rightBar: { right: '4%', transform: [{ rotate: '15deg' }] },
  grip: {
    position: 'absolute',
    bottom: '9%',
    width: 64,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0A0E16',
    borderWidth: 2,
    borderColor: 'rgba(255,210,63,0.4)',
  },
  binnacle: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 120,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    overflow: 'hidden',
    borderTopWidth: 2,
    borderColor: 'rgba(46,230,214,0.3)',
  },
  binnacleRim: {
    position: 'absolute',
    top: 6,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: 'rgba(46,230,214,0.4)',
    borderRadius: 1,
  },
});
