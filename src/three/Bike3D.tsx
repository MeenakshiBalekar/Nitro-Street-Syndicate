import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { RacerState } from '../game/types';

export interface BikeHandle {
  sync: (r: RacerState) => void;
}

interface Props {
  color: string;
  accent: string;
  isPlayer?: boolean;
}

// A stylized sport bike assembled from primitives. The root group is positioned
// and oriented every frame by RaceScene via the imperative `sync` handle; the
// wheel sub-groups spin around their axle (local X).
const Bike3D = forwardRef<BikeHandle, Props>(({ color, accent, isPlayer }, ref) => {
  const root = useRef<THREE.Group>(null);
  const frontSpin = useRef<THREE.Group>(null);
  const rearSpin = useRef<THREE.Group>(null);

  useImperativeHandle(
    ref,
    () => ({
      sync(r: RacerState) {
        const g = root.current;
        if (!g) return;
        g.position.set(r.worldX, r.worldY, r.worldZ);
        g.rotation.set(r.pitch, r.heading, r.lean, 'YXZ');
        if (frontSpin.current) frontSpin.current.rotation.x = r.wheelSpin;
        if (rearSpin.current) rearSpin.current.rotation.x = r.wheelSpin;
      },
    }),
    [],
  );

  const tire = '#15171C';
  const rim = isPlayer ? '#FFFFFF' : '#C8CCD8';

  return (
    <group ref={root}>
      {/* Wheels */}
      <group ref={frontSpin} position={[0, 0.42, 0.92]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.22, 18]} />
          <meshStandardMaterial color={tire} roughness={0.85} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.24, 12]} />
          <meshStandardMaterial color={rim} metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      <group ref={rearSpin} position={[0, 0.42, -0.95]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.28, 18]} />
          <meshStandardMaterial color={tire} roughness={0.85} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.3, 12]} />
          <meshStandardMaterial color={rim} metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Chassis / tank / fairing */}
      <mesh position={[0, 0.72, -0.05]} castShadow>
        <boxGeometry args={[0.42, 0.34, 1.9]} />
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.92, 0.25]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.28, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Front fairing + headlight */}
      <mesh position={[0, 0.78, 0.95]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.46, 0.5, 0.4]} />
        <meshStandardMaterial color={accent} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.86, 1.16]}>
        <boxGeometry args={[0.26, 0.16, 0.08]} />
        <meshStandardMaterial color="#FFF6CC" emissive="#FFE08A" emissiveIntensity={1.4} />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.95, -0.85]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.34, 0.18, 0.5]} />
        <meshStandardMaterial color={accent} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Rider */}
      <group position={[0, 0, -0.05]}>
        <mesh position={[0, 1.18, -0.12]} rotation={[0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.6, 0.34]} />
          <meshStandardMaterial color="#1B1E2A" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.5, 0.18]} castShadow>
          <boxGeometry args={[0.28, 0.3, 0.3]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
        {/* visor */}
        <mesh position={[0, 1.5, 0.34]}>
          <boxGeometry args={[0.22, 0.12, 0.04]} />
          <meshStandardMaterial color="#0A0A0A" metalness={0.6} roughness={0.2} />
        </mesh>
        {/* arms to bars */}
        <mesh position={[0, 1.2, 0.42]} rotation={[1.0, 0, 0]}>
          <boxGeometry args={[0.5, 0.12, 0.5]} />
          <meshStandardMaterial color="#23262F" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
});

Bike3D.displayName = 'Bike3D';
export default Bike3D;
