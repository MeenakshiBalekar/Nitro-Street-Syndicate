import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RaceController } from '../../game/race';
import { useHudStore } from '../../state/hudStore';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { formatTime, ordinal } from '../../util/math';
import Minimap from './Minimap';
import SpeedFX from './SpeedFX';
import Speedometer from './Speedometer';
import TouchControls from './TouchControls';

interface Props {
  controller: RaceController;
  onPause: () => void;
}

function TopCenter() {
  const lap = useHudStore((s) => s.lap);
  const totalLaps = useHudStore((s) => s.totalLaps);
  const timeMs = useHudStore((s) => s.timeMs);
  const position = useHudStore((s) => s.position);
  const racerCount = useHudStore((s) => s.racerCount);
  return (
    <View style={styles.topCenter} pointerEvents="none">
      <View style={styles.posPill}>
        <Text style={styles.posValue}>{ordinal(position)}</Text>
        <Text style={styles.posOf}>/ {racerCount}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>LAP </Text>
        <Text style={styles.infoValue}>{lap}/{totalLaps}</Text>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.infoValue}>{formatTime(timeMs)}</Text>
      </View>
    </View>
  );
}

function Combo() {
  const label = useHudStore((s) => s.comboLabel);
  const timer = useHudStore((s) => s.comboTimer);
  const stunt = useHudStore((s) => s.stuntScore);
  if (!label) {
    return (
      <View style={styles.comboWrap} pointerEvents="none">
        <Text style={styles.score}>{stunt > 0 ? `STUNT ${stunt}` : ''}</Text>
      </View>
    );
  }
  return (
    <View style={styles.comboWrap} pointerEvents="none">
      <Text style={[styles.combo, { opacity: Math.min(1, timer) }]}>{label}</Text>
      <Text style={styles.score}>{stunt > 0 ? `STUNT ${stunt}` : ''}</Text>
    </View>
  );
}

function Countdown() {
  const phase = useHudStore((s) => s.phase);
  const n = useHudStore((s) => s.countdown);
  const conditions = useHudStore((s) => s.conditions);
  if (phase !== 'countdown') return null;
  return (
    <View style={styles.countWrap} pointerEvents="none">
      {conditions ? <Text style={styles.conditions}>{conditions}</Text> : null}
      <Text style={styles.countNum}>{n > 0 ? n : 'GO!'}</Text>
      <Text style={styles.countSub}>{n > 0 ? 'GET READY' : ''}</Text>
    </View>
  );
}

function Draft() {
  const drafting = useHudStore((s) => s.drafting);
  if (!drafting) return null;
  return (
    <View style={styles.draft} pointerEvents="none">
      <Text style={styles.draftText}>▲ SLIPSTREAM</Text>
    </View>
  );
}

export default function HUD({ controller, onPause }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <SpeedFX />
      <View style={styles.topLeft} pointerEvents="none">
        <Minimap controller={controller} />
      </View>
      <TopCenter />
      <View style={styles.topRight} pointerEvents="box-none">
        <Pressable style={styles.pause} onPress={onPause}>
          <Text style={styles.pauseGlyph}>II</Text>
        </Pressable>
      </View>

      <View style={styles.center} pointerEvents="none">
        <Combo />
        <Countdown />
      </View>

      <Draft />

      <View style={styles.bottomCenter} pointerEvents="none">
        <Speedometer />
      </View>

      <TouchControls />
    </View>
  );
}

const styles = StyleSheet.create({
  topLeft: { position: 'absolute', top: 16, left: 16 },
  topRight: { position: 'absolute', top: 16, right: 16 },
  topCenter: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center' },
  posPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(8,12,22,0.66)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  posValue: { fontFamily: Type.mono, fontSize: 30, fontWeight: '900', color: Colors.primary, lineHeight: 32 },
  posOf: { fontFamily: Type.display, fontSize: Type.size.sm, color: Colors.textMuted, marginLeft: 4, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  infoLabel: { fontFamily: Type.display, fontSize: Type.size.sm, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  infoValue: { fontFamily: Type.mono, fontSize: Type.size.md, fontWeight: '900', color: Colors.text },
  dot: { color: Colors.textDim, marginHorizontal: 8 },
  pause: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(8,12,22,0.66)',
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseGlyph: { color: Colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  comboWrap: { position: 'absolute', top: '24%', alignItems: 'center' },
  combo: {
    fontFamily: Type.display,
    fontSize: Type.size.xxl,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 10,
  },
  score: { fontFamily: Type.mono, fontSize: Type.size.md, fontWeight: '900', color: Colors.cyan, marginTop: 4 },
  countWrap: { alignItems: 'center' },
  countNum: {
    fontFamily: Type.display,
    fontSize: 120,
    fontWeight: '900',
    color: Colors.primary,
    textShadowColor: 'rgba(255,122,26,0.7)',
    textShadowRadius: 24,
  },
  countSub: { fontFamily: Type.display, fontSize: Type.size.lg, fontWeight: '900', color: Colors.text, letterSpacing: 4 },
  conditions: { fontFamily: Type.display, fontSize: Type.size.md, fontWeight: '900', color: Colors.cyan, letterSpacing: 4, marginBottom: 6 },
  bottomCenter: { position: 'absolute', bottom: 18, left: 0, right: 0, alignItems: 'center' },
  draft: { position: 'absolute', bottom: 118, left: 0, right: 0, alignItems: 'center' },
  draftText: {
    fontFamily: Type.display,
    fontSize: Type.size.md,
    fontWeight: '900',
    color: Colors.cyan,
    letterSpacing: 3,
    backgroundColor: 'rgba(8,12,22,0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cyan,
    paddingHorizontal: 14,
    paddingVertical: 4,
    textShadowColor: 'rgba(46,230,214,0.7)',
    textShadowRadius: 8,
  },
});
