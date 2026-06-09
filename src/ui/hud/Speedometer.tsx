import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useHudStore } from '../../state/hudStore';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';

const SEGMENTS = 22;

// Bottom-center speed cluster: big readout, segmented RPM sweep, gear.
export default function Speedometer() {
  const speed = useHudStore((s) => s.speed);
  const rpm = useHudStore((s) => s.rpm);
  const gear = useHudStore((s) => s.gear);
  const nitroActive = useHudStore((s) => s.nitroActive);

  const lit = Math.round(rpm * SEGMENTS);

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.bars}>
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const on = i < lit;
          const c = i > SEGMENTS * 0.8 ? Colors.danger : i > SEGMENTS * 0.55 ? Colors.primary : Colors.success;
          return (
            <View
              key={i}
              style={[
                styles.seg,
                { height: 8 + (i / SEGMENTS) * 16 },
                on ? { backgroundColor: nitroActive ? Colors.nitro : c } : styles.segOff,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.row}>
        <Text style={[styles.speed, nitroActive && { color: Colors.nitro }]}>{speed}</Text>
        <View style={styles.meta}>
          <Text style={styles.unit}>KM/H</Text>
          <View style={styles.gearBox}>
            <Text style={styles.gear}>{gear}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 26, marginBottom: 2 },
  seg: { width: 5, marginHorizontal: 1.5, borderRadius: 2 },
  segOff: { backgroundColor: 'rgba(255,255,255,0.12)' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  speed: {
    fontFamily: Type.mono,
    fontSize: 54,
    fontWeight: Type.weight.black,
    color: Colors.text,
    lineHeight: 56,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 8,
  },
  meta: { marginLeft: 8, alignItems: 'center', marginBottom: 6 },
  unit: { fontFamily: Type.display, fontSize: Type.size.sm, fontWeight: Type.weight.bold, color: Colors.textMuted, letterSpacing: 2 },
  gearBox: {
    marginTop: 4,
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surfaceGlass,
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear: { fontFamily: Type.mono, fontSize: Type.size.lg, fontWeight: Type.weight.black, color: Colors.primary },
});
