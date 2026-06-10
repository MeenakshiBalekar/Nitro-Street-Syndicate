import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Colors } from '../theme/colors';
import { TrackModel } from '../game/track';
import { WorldMood } from '../game/world';

interface Props {
  track: TrackModel;
  mood: WorldMood;
}

const BUILDING_COLORS = ['#4A5878', '#5B6B8E', '#42566E', '#6E6488', '#3E6E74', '#7A6E5E'];
const NEON = ['#2EE6D6', '#FF3B5C', '#8A5BFF', '#FFD23F', '#3AA0FF'];

interface Building {
  x: number;
  z: number;
  rot: number;
  w: number;
  h: number;
  d: number;
  color: string;
  neon: string;
}

export default function Environment3D({ track, mood }: Props) {
  const night = mood.stars || mood.rain;

  const buildings = useMemo<Building[]>(() => {
    const out: Building[] = [];
    let s = 0;
    let i = 0;
    while (s < track.length) {
      const sm = track.sample(s);
      const side = i % 2 === 0 ? 1 : -1;
      const dist = track.halfWidth + 16 + ((i * 7) % 30);
      const h = 10 + ((i * 13) % 34);
      out.push({
        x: sm.x + sm.nx * dist * side,
        z: sm.z + sm.nz * dist * side,
        rot: Math.atan2(sm.tx, sm.tz),
        w: 9 + ((i * 5) % 10),
        h,
        d: 9 + ((i * 3) % 9),
        color: BUILDING_COLORS[i % BUILDING_COLORS.length],
        neon: NEON[i % NEON.length],
      });
      i++;
      s += 58;
    }
    return out;
  }, [track]);

  // Window grid across every building as one instanced, glowing mesh.
  const { matrices, colors } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const tmp = new THREE.Color();
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const litBase = night ? new THREE.Color('#FFE2A0') : new THREE.Color('#CFE6FF');
    const litMul = mood.stars ? 1.7 : mood.rain ? 1.0 : 0.55;
    const off = new THREE.Color('#0E1422');
    for (const b of buildings) {
      const nc = Math.max(2, Math.min(4, Math.round(b.w / 2.6)));
      const nr = Math.max(3, Math.min(9, Math.round(b.h / 3.2)));
      const cosR = Math.cos(b.rot);
      const sinR = Math.sin(b.rot);
      for (let r = 0; r < nr; r++) {
        for (let c = 0; c < nc; c++) {
          const lx = (c - (nc - 1) / 2) * (b.w / nc);
          const ly = (r + 0.5) * (b.h / nr) - b.h / 2;
          const lz = b.d / 2 + 0.06;
          dummy.position.set(b.x + lx * cosR + lz * sinR, b.h / 2 + ly, b.z - lx * sinR + lz * cosR);
          dummy.rotation.set(0, b.rot, 0);
          dummy.scale.set((b.w / nc) * 0.55, (b.h / nr) * 0.5, 1);
          dummy.updateMatrix();
          mats.push(dummy.matrix.clone());
          const lit = ((r * 7 + c * 3) % 10) > 3;
          cols.push((lit ? tmp.copy(litBase).multiplyScalar(litMul) : off).clone());
        }
      }
    }
    return { matrices: mats, colors: cols };
  }, [buildings, night, mood.stars, mood.rain]);

  const winRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = winRef.current;
    if (!m) return;
    for (let i = 0; i < matrices.length; i++) {
      m.setMatrixAt(i, matrices[i]);
      m.setColorAt(i, colors[i]);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

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
      {/* Ground (tinted by time of day) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial color={mood.ground} roughness={1} />
      </mesh>
      {/* Distant sea ring for the coastal horizon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <ringGeometry args={[1400, 3000, 48]} />
        <meshStandardMaterial color={Colors.sea} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Building bodies */}
      {buildings.map((b, i) => (
        <group key={`b${i}`} position={[b.x, b.h / 2, b.z]} rotation={[0, b.rot, 0]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.62} metalness={0.45} />
          </mesh>
          {/* neon rooftop edge */}
          <mesh position={[0, b.h / 2 + 0.2, 0]}>
            <boxGeometry args={[b.w * 1.02, 0.4, b.d * 1.02]} />
            <meshBasicMaterial color={b.neon} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* All windows in one instanced, bloom-friendly mesh */}
      <instancedMesh ref={winRef} args={[undefined, undefined, matrices.length]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

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
