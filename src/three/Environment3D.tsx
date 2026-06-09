import React, { useMemo } from 'react';
import { Colors } from '../theme/colors';
import { TrackModel } from '../game/track';

interface Props {
  track: TrackModel;
}

const BUILDING_COLORS = ['#3A4154', '#2C3346', '#454D63', '#5A6178', '#343B4F'];

export default function Environment3D({ track }: Props) {
  const buildings = useMemo(() => {
    const out: {
      x: number;
      z: number;
      rot: number;
      w: number;
      h: number;
      d: number;
      color: string;
    }[] = [];
    let s = 0;
    let i = 0;
    while (s < track.length) {
      const sm = track.sample(s);
      const side = i % 2 === 0 ? 1 : -1;
      const dist = track.halfWidth + 16 + ((i * 7) % 30);
      const h = 8 + ((i * 13) % 30);
      out.push({
        x: sm.x + sm.nx * dist * side,
        z: sm.z + sm.nz * dist * side,
        rot: Math.atan2(sm.tx, sm.tz),
        w: 8 + ((i * 5) % 9),
        h,
        d: 8 + ((i * 3) % 8),
        color: BUILDING_COLORS[i % BUILDING_COLORS.length],
      });
      i++;
      s += 58;
    }
    return out;
  }, [track]);

  const palms = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    let s = 24;
    let i = 0;
    while (s < track.length) {
      const sm = track.sample(s);
      const side = i % 2 === 0 ? -1 : 1;
      const dist = track.halfWidth + 5 + ((i * 3) % 5);
      out.push({ x: sm.x + sm.nx * dist * side, z: sm.z + sm.nz * dist * side });
      i++;
      s += 47;
    }
    return out;
  }, [track]);

  return (
    <group>
      {/* Grass ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial color={Colors.grass} roughness={1} />
      </mesh>
      {/* Distant sea ring for the coastal horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <ringGeometry args={[1400, 3000, 48]} />
        <meshStandardMaterial color={Colors.sea} roughness={0.4} metalness={0.1} />
      </mesh>

      {buildings.map((b, i) => (
        <mesh key={`b${i}`} position={[b.x, b.h / 2, b.z]} rotation={[0, b.rot, 0]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.8} metalness={0.2} />
        </mesh>
      ))}

      {palms.map((p, i) => (
        <group key={`p${i}`} position={[p.x, 0, p.z]}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.26, 3.2, 6]} />
            <meshStandardMaterial color="#6E4A2B" roughness={1} />
          </mesh>
          <mesh position={[0, 3.4, 0]}>
            <sphereGeometry args={[1.1, 8, 6]} />
            <meshStandardMaterial color="#2FA84F" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
