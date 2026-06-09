import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BIKES, getBike } from '../../game/bikes';
import { useGameStore } from '../../state/gameStore';
import { useUIStore } from '../../state/uiStore';
import { clamp01 } from '../../util/math';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import Backdrop from '../components/Backdrop';
import GlossyButton from '../components/GlossyButton';

function StatBar({ label, t }: { label: string; t: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${Math.round(clamp01(t) * 100)}%` }]} />
      </View>
    </View>
  );
}

export default function GarageScreen() {
  const go = useUIStore((s) => s.go);
  const currency = useGameStore((s) => s.currency);
  const ownedBikes = useGameStore((s) => s.ownedBikes);
  const selectedBikeId = useGameStore((s) => s.selectedBikeId);
  const selectBike = useGameStore((s) => s.selectBike);
  const buyBike = useGameStore((s) => s.buyBike);

  const [previewId, setPreviewId] = useState(selectedBikeId);
  const bike = getBike(previewId);
  const owned = ownedBikes.includes(bike.id);
  const selected = selectedBikeId === bike.id;
  const canAfford = currency >= bike.price;

  const notify = (msg: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(msg);
  };

  return (
    <Backdrop>
      <View style={styles.header}>
        <Pressable onPress={() => go('menu')} style={styles.back}>
          <Text style={styles.backText}>‹ MENU</Text>
        </Pressable>
        <Text style={styles.title}>GARAGE</Text>
        <Text style={styles.coin}>◆ {currency.toLocaleString()}</Text>
      </View>

      <View style={styles.body}>
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 12 }}>
          {BIKES.map((b) => {
            const isOwned = ownedBikes.includes(b.id);
            return (
              <Pressable
                key={b.id}
                onPress={() => setPreviewId(b.id)}
                style={[styles.chip, previewId === b.id && styles.chipActive]}
              >
                <View style={[styles.chipSwatch, { backgroundColor: b.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.chipName}>{b.name}</Text>
                  <Text style={styles.chipTag}>{b.tagline}</Text>
                </View>
                <Text style={styles.chipStatus}>
                  {selectedBikeId === b.id ? 'EQUIPPED' : isOwned ? 'OWNED' : `◆ ${b.price.toLocaleString()}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.preview}>
          <View style={[styles.previewSwatch, { backgroundColor: bike.color }]} />
          <Text style={styles.previewName}>{bike.name}</Text>
          <Text style={styles.previewTag}>{bike.tagline}</Text>
          <View style={styles.stats}>
            <StatBar label="TOP SPEED" t={(bike.topSpeed - 200) / 100} />
            <StatBar label="ACCEL" t={(bike.accel - 120) / 60} />
            <StatBar label="HANDLING" t={(bike.handling - 4) / 3} />
            <StatBar label="GRIP" t={bike.grip} />
            <StatBar label="NITRO" t={(bike.nitroPower - 1.3) / 0.5} />
          </View>
          {selected ? (
            <GlossyButton label="EQUIPPED" disabled onPress={() => {}} />
          ) : owned ? (
            <GlossyButton label="EQUIP" onPress={() => selectBike(bike.id)} />
          ) : (
            <GlossyButton
              label={canAfford ? `BUY  ◆ ${bike.price.toLocaleString()}` : 'NOT ENOUGH ◆'}
              variant={canAfford ? 'nitro' : 'ghost'}
              disabled={!canAfford}
              onPress={() => {
                if (buyBike(bike.id)) notify(`${bike.name} unlocked & equipped!`);
              }}
            />
          )}
        </View>
      </View>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 24 },
  back: { paddingVertical: 6, paddingRight: 12 },
  backText: { fontFamily: Type.display, fontSize: Type.size.md, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1 },
  title: { fontFamily: Type.display, fontSize: Type.size.xl, fontWeight: '900', color: Colors.text, letterSpacing: 4 },
  coin: { fontFamily: Type.mono, fontSize: Type.size.lg, fontWeight: '900', color: Colors.primary },
  body: { flex: 1, flexDirection: 'row', padding: 22, gap: 18 },
  list: { flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceGlassSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.stroke,
    padding: 12,
    marginBottom: 10,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.surfaceGlass },
  chipSwatch: { width: 38, height: 38, borderRadius: 10, marginRight: 12 },
  chipName: { fontFamily: Type.display, fontSize: Type.size.lg, fontWeight: '900', color: Colors.text },
  chipTag: { fontFamily: Type.display, fontSize: Type.size.xs, color: Colors.textMuted },
  chipStatus: { fontFamily: Type.mono, fontSize: Type.size.sm, fontWeight: '900', color: Colors.primary },
  preview: {
    flex: 1,
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.stroke,
    alignItems: 'center',
    padding: 18,
  },
  previewSwatch: { width: 80, height: 80, borderRadius: 18, borderWidth: 2, borderColor: Colors.strokeStrong },
  previewName: { fontFamily: Type.display, fontSize: Type.size.xxl, fontWeight: '900', color: Colors.text, marginTop: 10 },
  previewTag: { fontFamily: Type.display, fontSize: Type.size.sm, color: Colors.textMuted, marginBottom: 12 },
  stats: { alignSelf: 'stretch', marginBottom: 16 },
  statRow: { marginBottom: 8 },
  statLabel: { fontFamily: Type.display, fontSize: Type.size.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 3 },
  statTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  statFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
});
