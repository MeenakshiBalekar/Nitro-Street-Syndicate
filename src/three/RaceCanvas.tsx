import { Canvas } from '@react-three/fiber';
import React from 'react';
import { Colors } from '../theme/colors';
import { RaceController } from '../game/race';
import RaceScene from './RaceScene';

interface Props {
  controller: RaceController;
  onFinish: () => void;
}

// Cross-platform 3D surface. `@react-three/fiber` resolves to its expo-gl native
// build on device and its WebGL build on web from this single import.
export default function RaceCanvas({ controller, onFinish }: Props) {
  return (
    <Canvas
      style={{ flex: 1 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 68, near: 0.1, far: 2200, position: [0, 6, -12] }}
    >
      <color attach="background" args={[Colors.sky]} />
      <fog attach="fog" args={[Colors.skyHaze, 140, 1000]} />
      <hemisphereLight args={['#CFE8FF', '#3A5A2A', 0.8]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[90, 140, 50]} intensity={1.35} color="#FFF4E0" />
      <RaceScene controller={controller} onFinish={onFinish} />
    </Canvas>
  );
}
