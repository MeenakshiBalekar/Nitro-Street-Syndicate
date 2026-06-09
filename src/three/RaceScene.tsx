import { useFrame, useThree } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import { getBike } from '../game/bikes';
import { consumeCameraToggle, input } from '../game/input';
import { RaceController } from '../game/race';
import type { RacePhase } from '../game/types';
import { useHudStore } from '../state/hudStore';
import { damp } from '../util/math';
import Bike3D, { BikeHandle } from './Bike3D';
import Environment3D from './Environment3D';
import GhostBike3D, { GhostHandle } from './GhostBike3D';
import ParticleFX, { ParticleHandle } from './ParticleFX';
import Track3D from './Track3D';
import Traffic3D, { TrafficHandle } from './Traffic3D';

interface Props {
  controller: RaceController;
  onFinish: () => void;
}

const BASE_FOV = 68;

export default function RaceScene({ controller, onFinish }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const bikeHandles = useRef<(BikeHandle | null)[]>([]);
  const trafficHandle = useRef<TrafficHandle | null>(null);
  const ghostHandle = useRef<GhostHandle | null>(null);
  const particles = useRef<ParticleHandle | null>(null);

  const hudAccum = useRef(0);
  const finishTimer = useRef(-1);
  const tmp = useMemo(() => ({ desired: new THREE.Vector3(), look: new THREE.Vector3() }), []);

  // Edge-detection state for one-shot audio/VFX triggers.
  const prevPhase = useRef<RacePhase>('countdown');
  const prevCountInt = useRef(99);
  const prevShake = useRef(0);
  const prevNitro = useRef(false);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);

    // Frozen while paused: keep rendering the last frame, idle the engine sound.
    if (controller.paused) {
      AudioManager.setEngine(0, false);
      return;
    }

    if (consumeCameraToggle()) {
      const cur = useHudStore.getState().camMode;
      useHudStore.getState().setCamMode(cur === 'chase' ? 'cockpit' : 'chase');
    }

    controller.tick(dt, input);

    const racers = controller.racers;
    for (let i = 0; i < racers.length; i++) bikeHandles.current[i]?.sync(racers[i]);
    trafficHandle.current?.sync();
    ghostHandle.current?.sync(controller.ghostState);

    // --- Camera ----------------------------------------------------------
    const p = controller.player;
    const h = p.heading;
    const fx = Math.sin(h);
    const fz = Math.cos(h);
    const cam = useHudStore.getState().camMode;
    const speedRatio = Math.min(1, p.speed / 240);

    if (cam === 'cockpit') {
      tmp.desired.set(p.worldX + fx * 0.1, p.worldY + 1.55, p.worldZ + fz * 0.1);
      tmp.look.set(p.worldX + fx * 14, p.worldY + 1.4, p.worldZ + fz * 14);
    } else {
      const dist = 7.5 + speedRatio * 1.5;
      tmp.desired.set(p.worldX - fx * dist, p.worldY + 3.4, p.worldZ - fz * dist);
      tmp.look.set(p.worldX + fx * 7, p.worldY + 1.2, p.worldZ + fz * 7);
    }

    if (controller.shake > 0) {
      const a = controller.shake * 0.6;
      tmp.desired.x += (Math.random() - 0.5) * a;
      tmp.desired.y += (Math.random() - 0.5) * a;
    }

    const rate = cam === 'cockpit' ? 30 : 9;
    camera.position.x = damp(camera.position.x, tmp.desired.x, rate, dt);
    camera.position.y = damp(camera.position.y, tmp.desired.y, rate, dt);
    camera.position.z = damp(camera.position.z, tmp.desired.z, rate, dt);
    camera.lookAt(tmp.look);

    const targetFov = BASE_FOV + speedRatio * 10 + (p.nitroActive ? 6 : 0);
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov = damp(camera.fov, targetFov, 6, dt);
      camera.updateProjectionMatrix();
    }

    // --- Audio (engine + one-shot SFX on edges) -------------------------
    const phase = controller.phase;
    if (prevPhase.current !== 'racing' && phase === 'racing') {
      AudioManager.unlock();
      AudioManager.startEngine();
      AudioManager.play('go');
    }
    if (prevPhase.current !== 'finished' && phase === 'finished') {
      AudioManager.play('finish');
      AudioManager.stopEngine();
    }
    if (phase === 'countdown') {
      const ci = Math.ceil(controller.countdownMs / 1000);
      if (ci !== prevCountInt.current) {
        prevCountInt.current = ci;
        if (ci > 0 && ci <= 3) AudioManager.play('countdown');
      }
    }
    if (phase === 'racing') AudioManager.setEngine(speedRatio, p.nitroActive);
    if (p.nitroActive && !prevNitro.current) AudioManager.play('nitro');
    if (controller.shake > 0.6 && prevShake.current <= 0.6) AudioManager.play('crash');
    prevPhase.current = phase;
    prevNitro.current = p.nitroActive;

    // --- Particle VFX ----------------------------------------------------
    const rx = p.worldX - fx * 1.2;
    const rz = p.worldZ - fz * 1.2;
    const ry = p.worldY + 0.4;
    if (p.nitroActive) particles.current?.emit(rx, ry, rz, 'nitro', 2);
    const offRoad = Math.abs(p.lateral) > controller.track.halfWidth;
    const hardSteer = Math.abs(input.steer) > 0.6 && speedRatio > 0.5;
    if ((input.brake > 0.3 || offRoad || hardSteer) && p.speed > 40) {
      particles.current?.emit(rx, p.worldY + 0.25, rz, 'dust', 2);
    }
    if (controller.shake > 0.6 && prevShake.current <= 0.6) {
      particles.current?.emit(p.worldX, p.worldY + 0.4, p.worldZ, 'spark', 12);
    }
    prevShake.current = controller.shake;
    particles.current?.update(dt, camera);

    // --- HUD publish (throttled) ----------------------------------------
    hudAccum.current += dt;
    if (hudAccum.current >= 1 / 15) {
      hudAccum.current = 0;
      useHudStore.getState().setHud(controller.getHud());
    }

    // --- Finish transition ----------------------------------------------
    if (controller.phase === 'finished') {
      if (finishTimer.current < 0) finishTimer.current = 0;
      else {
        finishTimer.current += dt;
        if (finishTimer.current > 2.6) {
          finishTimer.current = Number.POSITIVE_INFINITY;
          onFinish();
        }
      }
    }
  });

  return (
    <>
      <Environment3D track={controller.track} mood={controller.world} />
      <Track3D track={controller.track} />
      <Traffic3D ref={trafficHandle} vehicles={controller.traffic.vehicles} track={controller.track} />
      {controller.racers.map((r, i) => (
        <Bike3D
          key={r.id}
          ref={(el) => {
            bikeHandles.current[i] = el;
          }}
          color={r.color}
          accent={getBike(r.bikeId).accent}
          isPlayer={r.isPlayer}
        />
      ))}
      <GhostBike3D ref={ghostHandle} />
      <ParticleFX ref={particles} />
    </>
  );
}
