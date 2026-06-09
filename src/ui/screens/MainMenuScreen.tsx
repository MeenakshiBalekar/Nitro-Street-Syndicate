import React from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { getBike } from '../../game/bikes';
import { useGameStore } from '../../state/gameStore';
import { useUIStore } from '../../state/uiStore';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { formatTime } from '../../util/math';
import Backdrop from '../components/Backdrop';
import GlossyButton from '../components/GlossyButton';

export default function MainMenuScreen() {
  const go = useUIStore((s) => s.go);
  const startRace = useUIStore((s) => s.startRace);
  const currency = useGameStore((s) => s.currency);
  const selectedBikeId = useGameStore((s) => s.selectedBikeId);
  const bestTimes = useGameStore((s) => s.bestTimes);
  const lastDaily = useGameStore((s) => s.lastDailyClaim);
  const claimDaily = useGameStore((s) => s.claimDaily);

  const bike = getBike(selectedBikeId);
  const best = bestTimes['coastal'];
  const dailyReady = Date.now() - lastDaily > 20 * 3600 * 1000;

  const notify = (msg: string) => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert(msg);
    }
  };

  return (
    <Backdrop>
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>NITRO</Text>
          <Text style={styles.subtitle}>STREET SYNDICATE</Text>
        </View>
        <View style={styles.wallet}>
          <Text style={styles.coin}>◆ {currency.toLocaleString()}</Text>
          {best ? <Text style={styles.best}>BEST {formatTime(best)}</Text> : null}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.menu}>
          <GlossyButton label="QUICK RACE" sub={`Ride the ${bike.name}`} onPress={() => startRace(selectedBikeId)} />
          <GlossyButton label="GARAGE" variant="ghost" style={styles.gap} onPress={() => go('garage')} />
          <GlossyButton
            label="ONLINE  ·  SOON"
            variant="ghost"
            style={styles.gap}
            onPress={() => notify('Online 4-player rooms arrive in the next phase — the netcode layer is already stubbed in src/net.')}
          />
          <GlossyButton label="SETTINGS" variant="ghost" style={styles.gap} onPress={() => go('settings')} />
          {dailyReady ? (
            <GlossyButton
              label="DAILY BONUS  +500"
              variant="nitro"
              style={styles.gap}
              onPress={() => {
                const got = claimDaily();
                if (got) notify(`+${got} credits claimed!`);
              }}
            />
          ) : null}
        </View>

        <View style={styles.featured}>
          <Text style={styles.featLabel}>SELECTED BIKE</Text>
          <View style={[styles.swatch, { backgroundColor: bike.color }]} />
          <Text style={styles.featName}>{bike.name}</Text>
          <Text style={styles.featTag}>{bike.tagline}</Text>
          <Text style={styles.featStat}>TOP {bike.topSpeed}  ·  GRIP {Math.round(bike.grip * 100)}</Text>
        </View>
      </View>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 22, paddingHorizontal: 26 },
  title: { fontFamily: Type.display, fontSize: 40, fontWeight: '900', color: Colors.primary, letterSpacing: 2, lineHeight: 42 },
  subtitle: { fontFamily: Type.display, fontSize: Type.size.md, fontWeight: '900', color: Colors.text, letterSpacing: 5 },
  wallet: { alignItems: 'flex-end' },
  coin: { fontFamily: Type.mono, fontSize: Type.size.xl, fontWeight: '900', color: Colors.primary },
  best: { fontFamily: Type.mono, fontSize: Type.size.sm, color: Colors.cyan, marginTop: 2 },
  body: { flex: 1, flexDirection: 'row', paddingHorizontal: 26, paddingVertical: 18, gap: 22 },
  menu: { flex: 1, justifyContent: 'center', maxWidth: 360 },
  gap: { marginTop: 12 },
  featured: {
    flex: 1,
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.stroke,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  featLabel: { fontFamily: Type.display, fontSize: Type.size.xs, fontWeight: '700', color: Colors.textMuted, letterSpacing: 3 },
  swatch: { width: 90, height: 90, borderRadius: 20, marginVertical: 16, borderWidth: 2, borderColor: Colors.strokeStrong },
  featName: { fontFamily: Type.display, fontSize: Type.size.xxl, fontWeight: '900', color: Colors.text },
  featTag: { fontFamily: Type.display, fontSize: Type.size.sm, color: Colors.textMuted, marginTop: 2 },
  featStat: { fontFamily: Type.mono, fontSize: Type.size.sm, color: Colors.primary, marginTop: 10, letterSpacing: 1 },
});
