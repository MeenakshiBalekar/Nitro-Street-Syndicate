import { Canvas } from '@react-three/fiber';
import React from 'react';
import { RaceController } from '../game/race';
import RaceScene from './RaceScene';
import { Rain, Stars } from './Weather3D';

interface Props {
  controller: RaceController;
  onFinish: () => void;
}

// Cross-platform 3D surface. Sky / fog / lighting are driven by the race's chosen
// time-of-day + weather mood. `@react-three/fiber` resolves to its expo-gl native
// build on device and its WebGL build on web from this single import.
export default function RaceCanvas({ controller, onFinish }: Props) {
  const w = controller.world;
  return (
    <Canvas
      style={{ flex: 1 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 68, near: 0.1, far: 2200, position: [0, 6, -12] }}
    >
      <color attach="background" args={[w.sky]} />
      <fog attach="fog" args={[w.fog, w.fogNear, w.fogFar]} />
      <hemisphereLight args={[w.hemi.sky, w.hemi.ground, w.hemi.intensity]} />
      <ambientLight intensity={w.ambient} />
      <directionalLight position={w.sun.pos} intensity={w.sun.intensity} color={w.sun.color} />
      {w.stars && <Stars />}
      {w.rain && <Rain />}
      <RaceScene controller={controller} onFinish={onFinish} />
    </Canvas>
  );
}
