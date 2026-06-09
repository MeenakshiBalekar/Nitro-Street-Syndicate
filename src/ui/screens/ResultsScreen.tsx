import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getBike } from '../../game/bikes';
import { useGameStore } from '../../state/gameStore';
import { useUIStore } from '../../state/uiStore';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { formatTime, ordinal } from '../../util/math';
import Backdrop from '../components/Backdrop';
import GlossyButton from '../components/GlossyButton';

const PLACE_COLOR = [Colors.primary, '#C8CCD8', '#CD7F32', Colors.textMuted];

export default function ResultsScreen() {
  const results = useUIStore((s) => s.results);
  const startRace = useUIStore((s) => s.startRace);
  const go = useUIStore((s) => s.go);
  const selectedBikeId = useGameStore((s) => s.selectedBikeId);

  if (!results) {
    return (
      <Backdrop>
        <View style={styles.center}>
          <GlossyButton label="BACK TO MENU" onPress={() => go('menu')} />
        </View>
      </Backdrop>
    );
  }

  const win = results.playerPlacement === 1;

  return (
    <Backdrop>
      <View style={styles.root}>
        <Text style={[styles.headline, { color: win ? Colors.primary : Colors.text }]}>
          {win ? 'VICTORY' : 'RACE COMPLETE'}
        </Text>
        <Text style={styles.place}>{ordinal(results.playerPlacement)} PLACE</Text>
        {results.newRecord ? <Text style={styles.record}>★ NEW TRACK RECORD ★</Text> : null}

        <View style={styles.cards}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>{formatTime(results.timeMs)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>REWARD</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>◆ {results.reward}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>STUNT</Text>
            <Text style={[styles.statValue, { color: Colors.cyan }]}>{results.stuntScore}</Text>
          </View>
        </View>

        <View style={styles.board}>
          {results.order.map((r, i) => (
            <View key={r.id} style={[styles.boardRow, r.isPlayer && styles.boardRowMe]}>
              <Text style={[styles.boardPos, { color: PLACE_COLOR[i] ?? Colors.text }]}>{i + 1}</Text>
              <View style={[styles.boardSwatch, { backgroundColor: r.color }]} />
              <Text style={styles.boardName}>{r.isPlayer ? 'YOU' : r.name}</Text>
              <Text style={styles.boardBike}>{getBike(r.bikeId).name}</Text>
              <Text style={styles.boardTime}>
                {r.finished ? formatTime(r.finishTimeMs) : `LAP ${r.lap + 1}`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <GlossyButton label="REMATCH" variant="nitro" onPress={() => startRace(selectedBikeId)} />
          <GlossyButton label="GARAGE" variant="ghost" style={styles.gapL} onPress={() => go('garage')} />
          <GlossyButton label="MENU" variant="ghost" style={styles.gapL} onPress={() => go('menu')} />
        </View>
      </View>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, alignItems: 'center', paddingTop: 26, paddingHorizontal: 20 },
  headline: { fontFamily: Type.display, fontSize: Type.size.xxl, fontWeight: '900', letterSpacing: 4 },
  place: { fontFamily: Type.display, fontSize: Type.size.lg, fontWeight: '900', color: Colors.text, letterSpacing: 2, marginTop: 2 },
  record: { fontFamily: Type.display, fontSize: Type.size.sm, fontWeight: '900', color: Colors.nitro, letterSpacing: 2, marginTop: 6 },
  cards: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.stroke,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    minWidth: 110,
  },
  statLabel: { fontFamily: Type.display, fontSize: Type.size.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2 },
  statValue: { fontFamily: Type.mono, fontSize: Type.size.xl, fontWeight: '900', color: Colors.text, marginTop: 2 },
  board: {
    width: '100%',
    maxWidth: 620,
    marginTop: 18,
    backgroundColor: Colors.surfaceGlassSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.stroke,
    padding: 8,
  },
  boardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  boardRowMe: { backgroundColor: 'rgba(255,210,63,0.12)' },
  boardPos: { fontFamily: Type.mono, fontSize: Type.size.lg, fontWeight: '900', width: 26 },
  boardSwatch: { width: 16, height: 16, borderRadius: 4, marginRight: 10 },
  boardName: { fontFamily: Type.display, fontSize: Type.size.md, fontWeight: '900', color: Colors.text, width: 70 },
  boardBike: { fontFamily: Type.display, fontSize: Type.size.sm, color: Colors.textMuted, flex: 1 },
  boardTime: { fontFamily: Type.mono, fontSize: Type.size.sm, color: Colors.cyan },
  actions: { flexDirection: 'row', marginTop: 20 },
  gapL: { marginLeft: 12 },
});
