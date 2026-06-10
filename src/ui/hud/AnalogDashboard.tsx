import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { useHudStore } from '../../state/hudStore';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { clamp01 } from '../../util/math';

const SIZE = 192;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 86;
const START = 225; // clock degrees (0 = top, clockwise); gap at the bottom
const SWEEP = 270;
const MAX = 280;

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const arc = (r: number, startDeg: number, endDeg: number): string => {
  const s = polar(CX, CY, r, startDeg);
  const e = polar(CX, CY, r, endDeg);
  const large = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

// Original analog instrument cluster, driven by the live HUD snapshot. Shown in
// cockpit view as the bike's dashboard.
export default function AnalogDashboard() {
  const speed = useHudStore((s) => s.speed);
  const gear = useHudStore((s) => s.gear);
  const nitro = useHudStore((s) => s.nitro);
  const nitroActive = useHudStore((s) => s.nitroActive);

  const ratio = clamp01(speed / MAX);
  const speedAngle = START + ratio * SWEEP;
  const needle = polar(CX, CY, R - 22, speedAngle);
  const arcColor = nitroActive ? Colors.nitro : ratio > 0.85 ? Colors.danger : ratio > 0.6 ? Colors.primary : Colors.success;

  const ticks = [];
  for (let i = 0; i <= 14; i++) {
    const major = i % 2 === 0;
    const ang = START + (i / 14) * SWEEP;
    const outer = polar(CX, CY, R - 3, ang);
    const inner = polar(CX, CY, R - (major ? 16 : 10), ang);
    ticks.push(
      <Line key={`t${i}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={major ? '#E7ECF5' : '#6A7388'} strokeWidth={major ? 2.4 : 1.2} />,
    );
    if (major) {
      const np = polar(CX, CY, R - 30, ang);
      ticks.push(
        <SvgText key={`n${i}`} x={np.x} y={np.y + 4} fill="#AEB6C8" fontSize={11} fontWeight="700" textAnchor="middle">
          {i * 20}
        </SvgText>,
      );
    }
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* bezel */}
        <Circle cx={CX} cy={CY} r={R + 4} fill="#0A0D15" stroke="#2A3242" strokeWidth={3} />
        {/* track */}
        <Path d={arc(R - 8, START, START + SWEEP)} stroke="rgba(255,255,255,0.10)" strokeWidth={7} fill="none" strokeLinecap="round" />
        {/* nitro inner arc */}
        <Path d={arc(R - 18, START, START + clamp01(nitro) * SWEEP)} stroke={Colors.nitro} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />
        {/* speed progress */}
        <Path d={arc(R - 8, START, speedAngle)} stroke={arcColor} strokeWidth={7} fill="none" strokeLinecap="round" />
        <G>{ticks}</G>
        {/* needle */}
        <Line x1={CX} y1={CY} x2={needle.x} y2={needle.y} stroke={Colors.danger} strokeWidth={3.5} strokeLinecap="round" />
        <Circle cx={CX} cy={CY} r={8} fill="#1A1F2B" stroke={Colors.danger} strokeWidth={2} />
      </Svg>
      {/* digital readout overlay */}
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.speed, nitroActive && { color: Colors.nitro }]}>{speed}</Text>
        <Text style={styles.unit}>KM/H</Text>
      </View>
      <View style={styles.gearBox} pointerEvents="none">
        <Text style={styles.gear}>{gear}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', top: SIZE * 0.34, alignItems: 'center' },
  speed: { fontFamily: Type.mono, fontSize: 40, fontWeight: '900', color: Colors.text, lineHeight: 42 },
  unit: { fontFamily: Type.display, fontSize: Type.size.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 3, marginTop: -2 },
  gearBox: {
    position: 'absolute',
    bottom: SIZE * 0.2,
    width: 30,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(255,210,63,0.14)',
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear: { fontFamily: Type.mono, fontSize: Type.size.lg, fontWeight: '900', color: Colors.primary },
});
