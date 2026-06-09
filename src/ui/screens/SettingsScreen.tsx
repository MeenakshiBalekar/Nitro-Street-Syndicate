import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useGameStore } from '../../state/gameStore';
import { useUIStore } from '../../state/uiStore';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import Backdrop from '../components/Backdrop';

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[styles.segItem, value === o.key && styles.segItemActive]}
        >
          <Text style={[styles.segText, value === o.key && styles.segTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const go = useUIStore((s) => s.go);
  const settings = useGameStore((s) => s.settings);
  const setSetting = useGameStore((s) => s.setSetting);

  return (
    <Backdrop>
      <View style={styles.header}>
        <Pressable onPress={() => go('menu')} style={styles.back}>
          <Text style={styles.backText}>‹ MENU</Text>
        </Pressable>
        <Text style={styles.title}>SETTINGS</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>HAPTICS</Text>
              <Text style={styles.rowHint}>Vibration on control taps</Text>
            </View>
            <Switch
              value={settings.haptics}
              onValueChange={(v) => setSetting('haptics', v)}
              trackColor={{ true: Colors.primary, false: '#333' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowCol}>
            <Text style={styles.rowLabel}>DEFAULT CAMERA</Text>
            <Segmented
              value={settings.defaultCam}
              options={[
                { key: 'chase', label: 'CHASE' },
                { key: 'cockpit', label: 'COCKPIT' },
              ]}
              onChange={(v) => setSetting('defaultCam', v)}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowCol}>
            <Text style={styles.rowLabel}>QUALITY</Text>
            <Text style={styles.rowHint}>Auto adapts resolution to the device</Text>
            <Segmented
              value={settings.quality}
              options={[
                { key: 'auto', label: 'AUTO' },
                { key: 'high', label: 'HIGH' },
                { key: 'low', label: 'LOW' },
              ]}
              onChange={(v) => setSetting('quality', v)}
            />
          </View>
        </View>

        <Text style={styles.note}>
          Controls — Touch: drag the left pad to steer, hold BRAKE / NITRO / STUNT on the right, tap CAM to
          switch view. Web: Arrow keys / A-D steer, Down brakes, Space nitro, Shift wheelie, C camera, Esc pause.
          Throttle is automatic.
        </Text>
      </View>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 24 },
  back: { paddingVertical: 6, width: 70 },
  backText: { fontFamily: Type.display, fontSize: Type.size.md, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1 },
  title: { fontFamily: Type.display, fontSize: Type.size.xl, fontWeight: '900', color: Colors.text, letterSpacing: 4 },
  body: { flex: 1, padding: 24, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.stroke,
    padding: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCol: { },
  rowLabel: { fontFamily: Type.display, fontSize: Type.size.md, fontWeight: '900', color: Colors.text, letterSpacing: 1 },
  rowHint: { fontFamily: Type.display, fontSize: Type.size.xs, color: Colors.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.stroke, marginVertical: 16 },
  seg: { flexDirection: 'row', marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 4 },
  segItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segItemActive: { backgroundColor: Colors.primary },
  segText: { fontFamily: Type.display, fontSize: Type.size.sm, fontWeight: '900', color: Colors.textMuted, letterSpacing: 1 },
  segTextActive: { color: '#15110A' },
  note: { fontFamily: Type.display, fontSize: Type.size.xs, color: Colors.textDim, marginTop: 18, maxWidth: 560, lineHeight: 18 },
});
