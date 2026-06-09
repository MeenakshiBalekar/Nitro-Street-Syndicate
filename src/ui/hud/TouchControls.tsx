import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { input, requestCameraToggle } from '../../game/input';
import { useGameStore } from '../../state/gameStore';
import { useHudStore } from '../../state/hudStore';
import { clamp } from '../../util/math';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';

const PAD_W = 188;

function tap(haptic: boolean) {
  if (!haptic) return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* no-op on web */
  }
}

function RoundBtn({
  label,
  glyph,
  color,
  big,
  onIn,
  onOut,
  haptic,
}: {
  label: string;
  glyph: string;
  color: string;
  big?: boolean;
  onIn: () => void;
  onOut?: () => void;
  haptic: boolean;
}) {
  const size = big ? 92 : 68;
  return (
    <Pressable
      onPressIn={() => {
        tap(haptic);
        onIn();
      }}
      onPressOut={onOut}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        pressed && { backgroundColor: color, transform: [{ scale: 0.93 }] },
      ]}
    >
      <Text style={[styles.glyph, big && { fontSize: 30 }]}>{glyph}</Text>
      <Text style={styles.btnLabel}>{label}</Text>
    </Pressable>
  );
}

export default function TouchControls() {
  const haptic = useGameStore((s) => s.settings.haptics);
  const nitro = useHudStore((s) => s.nitro);
  const knob = useRef<View>(null);
  const padCenter = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        // locationX is relative to the pad; center maps to 0 steer.
        input.steer = clamp((e.nativeEvent.locationX - PAD_W / 2) / (PAD_W / 2), -1, 1);
      },
      onPanResponderMove: (e) => {
        input.steer = clamp((e.nativeEvent.locationX - PAD_W / 2) / (PAD_W / 2), -1, 1);
      },
      onPanResponderRelease: () => {
        input.steer = 0;
      },
      onPanResponderTerminate: () => {
        input.steer = 0;
      },
    }),
  ).current;

  return (
    <>
      {/* Left: steering pad */}
      <View style={styles.left} pointerEvents="box-none">
        <View ref={knob} style={styles.pad} {...pan.panHandlers}>
          <Text style={styles.padArrow}>‹</Text>
          <View style={styles.padCenterLine} />
          <Text style={styles.padArrow}>›</Text>
        </View>
        <Text style={styles.padHint}>STEER · AUTO-THROTTLE</Text>
      </View>

      {/* Right: action cluster */}
      <View style={styles.right} pointerEvents="box-none">
        <View style={styles.actionRow}>
          <RoundBtn label="CAM" glyph="◎" color={Colors.blue} haptic={haptic} onIn={requestCameraToggle} />
          <RoundBtn
            label="STUNT"
            glyph="✦"
            color={Colors.purple}
            haptic={haptic}
            onIn={() => (input.stunt = true)}
            onOut={() => (input.stunt = false)}
          />
        </View>
        <View style={styles.actionRow}>
          <View style={styles.nitroWrap}>
            <View style={styles.nitroTrack}>
              <View style={[styles.nitroFill, { height: `${Math.round(nitro * 100)}%` }]} />
            </View>
            <RoundBtn
              label="NITRO"
              glyph="⚡"
              color={Colors.nitro}
              haptic={haptic}
              onIn={() => (input.nitro = true)}
              onOut={() => (input.nitro = false)}
            />
          </View>
          <RoundBtn
            label="BRAKE"
            glyph="▬"
            color={Colors.danger}
            big
            haptic={haptic}
            onIn={() => (input.brake = 1)}
            onOut={() => (input.brake = 0)}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  left: { position: 'absolute', left: 18, bottom: 22, alignItems: 'center' },
  pad: {
    width: PAD_W,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(10,14,24,0.6)',
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  padCenterLine: { width: 2, height: 30, backgroundColor: 'rgba(255,255,255,0.25)' },
  padArrow: { color: Colors.primary, fontSize: 34, fontWeight: '900', marginTop: -4 },
  padHint: { color: Colors.textMuted, fontSize: Type.size.xs, fontWeight: Type.weight.bold, marginTop: 6, letterSpacing: 1 },
  right: { position: 'absolute', right: 18, bottom: 22, alignItems: 'flex-end' },
  actionRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 },
  btn: {
    backgroundColor: 'rgba(10,14,24,0.6)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  glyph: { color: Colors.text, fontSize: 22, fontWeight: '900' },
  btnLabel: { color: Colors.text, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 1 },
  nitroWrap: { alignItems: 'center', flexDirection: 'row' },
  nitroTrack: {
    width: 10,
    height: 64,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginRight: 2,
  },
  nitroFill: { width: '100%', backgroundColor: Colors.nitro, borderRadius: 5 },
});
