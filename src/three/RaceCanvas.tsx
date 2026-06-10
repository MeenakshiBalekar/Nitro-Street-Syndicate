import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import React from 'react';
import { Platform } from 'react-native';
import * as THREE from 'three';
import { RaceController } from '../game/race';
import RaceScene from './RaceScene';
import { Rain, Stars } from './Weather3D';

interface Props {
  controller: RaceController;
  onFinish: () => void;
}

// Cross-platform 3D surface. Filmic tone-mapping + a bloom pass give emissive
// elements (nitro, lit windows, neon edges, sun) a premium glow. Sky / fog /
// lighting come from the race's time-of-day + weather mood.
export default function RaceCanvas({ controller, onFinish }: Props) {
  const w = controller.world;
  return (
    <Canvas
      style={{ flex: 1 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15;
      }}
      camera={{ fov: 68, near: 0.1, far: 2200, position: [0, 6, -12] }}
    >
      <color attach="background" args={[w.sky]} />
      <fog attach="fog" args={[w.fog, w.fogNear, w.fogFar]} />
      <hemisphereLight args={[w.hemi.sky, w.hemi.ground, w.hemi.intensity]} />
      <ambientLight intensity={w.ambient} />
      <directionalLight position={w.sun.pos} intensity={w.sun.intensity} color={w.sun.color} />
      {/* cool fill from the opposite side so bikes/buildings never go pure black */}
      <directionalLight position={[-w.sun.pos[0], 60, -w.sun.pos[2]]} intensity={0.5} color="#9FB8E0" />
      {w.stars && <Stars />}
      {w.rain && <Rain />}
      <RaceScene controller={controller} onFinish={onFinish} />
      {Platform.OS === 'web' && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.6} luminanceSmoothing={0.25} mipmapBlur radius={0.7} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
