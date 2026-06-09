import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AudioManager } from '../../audio/AudioManager';
import { getBike } from '../../game/bikes';
import { input, requestCameraToggle, resetInput } from '../../game/input';
import { RaceController } from '../../game/race';
import { useGameStore } from '../../state/gameStore';
import { EMPTY_HUD, useHudStore } from '../../state/hudStore';
import { useUIStore } from '../../state/uiStore';
import RaceCanvas from '../../three/RaceCanvas';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import GlossyButton from '../components/GlossyButton';
import HUD from '../hud/HUD';

const REWARD_BY_PLACE = [1000, 600, 350, 200];

export default function RaceScreen() {
  const raceBikeId = useUIStore((s) => s.raceBikeId);
  const selectedBikeId = useGameStore((s) => s.selectedBikeId);
  const defaultCam = useGameStore((s) => s.settings.defaultCam);
  const finishRace = useUIStore((s) => s.finishRace);
  const go = useUIStore((s) => s.go);
  const recordResult = useGameStore((s) => s.recordResult);
  const bestTimes = useGameStore((s) => s.bestTimes);

  const bikeId = raceBikeId ?? selectedBikeId;
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);

  const controller = useMemo(() => {
    const c = new RaceController(bikeId);
    c.start();
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bikeId, runId]);

  // Reset HUD + camera each run.
  useEffect(() => {
    useHudStore.getState().setHud(EMPTY_HUD);
    useHudStore.getState().setCamMode(defaultCam);
  }, [defaultCam, runId]);

  // Pause should freeze the simulation without unmounting the GL surface.
  useEffect(() => {
    controller.paused = paused;
  }, [controller, paused]);

  // Keyboard controls (web).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const left = { v: false };
    const right = { v: false };
    const apply = () => (input.steer = (right.v ? 1 : 0) - (left.v ? 1 : 0));
    const down = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': left.v = true; apply(); break;
        case 'ArrowRight': case 'd': right.v = true; apply(); break;
        case 'ArrowDown': case 's': input.brake = 1; break;
        case ' ': input.nitro = true; break;
        case 'Shift': input.stunt = true; break;
        case 'c': requestCameraToggle(); break;
        case 'Escape': case 'p': setPaused((p) => !p); break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': case 'a': left.v = false; apply(); break;
        case 'ArrowRight': case 'd': right.v = false; apply(); break;
        case 'ArrowDown': case 's': input.brake = 0; break;
        case ' ': input.nitro = false; break;
        case 'Shift': input.stunt = false; break;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(
    () => () => {
      resetInput();
      AudioManager.stopEngine();
    },
    [],
  );

  const handleFinish = () => {
    const order = controller.results();
    const player = controller.player;
    const placement = player.placement;
    const reward = (REWARD_BY_PLACE[placement - 1] ?? 150) + Math.round(player.stuntScore / 10);
    const prevBest = bestTimes['coastal'];
    const newRecord = placement === 1 && (prevBest == null || player.finishTimeMs < prevBest);
    recordResult({ timeMs: player.finishTimeMs, reward, placement });
    finishRace({
      order,
      playerPlacement: placement,
      timeMs: player.finishTimeMs,
      reward,
      stuntScore: Math.round(player.stuntScore),
      newRecord,
    });
  };

  const quit = () => {
    resetInput();
    AudioManager.stopEngine();
    setPaused(false);
    go('menu');
  };

  return (
    <View style={styles.root}>
      <RaceCanvas key={runId} controller={controller} onFinish={handleFinish} />
      <HUD controller={controller} onPause={() => setPaused(true)} />

      {paused && (
        <View style={styles.overlay}>
          <Text style={styles.paused}>PAUSED</Text>
          <Text style={styles.bikeName}>{getBike(bikeId).name}</Text>
          <View style={styles.btns}>
            <GlossyButton label="RESUME" onPress={() => setPaused(false)} />
            <GlossyButton
              label="RESTART"
              variant="ghost"
              style={styles.gap}
              onPress={() => {
                resetInput();
                setPaused(false);
                setRunId((x) => x + 1);
              }}
            />
            <GlossyButton label="QUIT" variant="ghost" style={styles.gap} onPress={quit} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.sky },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5,7,14,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paused: { fontFamily: Type.display, fontSize: Type.size.huge, fontWeight: '900', color: Colors.text, letterSpacing: 4 },
  bikeName: { fontFamily: Type.display, fontSize: Type.size.lg, fontWeight: '700', color: Colors.primary, marginBottom: 28 },
  btns: { width: 260 },
  gap: { marginTop: 12 },
});
