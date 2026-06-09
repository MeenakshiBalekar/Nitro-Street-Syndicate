import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Colors } from '../theme/colors';
import { TrackModel } from '../game/track';

function buildRibbon(track: TrackModel, offA: number, offB: number, y: number): THREE.BufferGeometry {
  const n = track.points.length;
  const positions = new Float32Array(n * 2 * 3);
  for (let i = 0; i < n; i++) {
    const p = track.points[i];
    const nm = track.normals[i];
    positions[i * 6 + 0] = p.x + nm.x * offA;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = p.z + nm.z * offA;
    positions[i * 6 + 3] = p.x + nm.x * offB;
    positions[i * 6 + 4] = y;
    positions[i * 6 + 5] = p.z + nm.z * offB;
  }
  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const a0 = i * 2;
    const a1 = i * 2 + 1;
    const b0 = next * 2;
    const b1 = next * 2 + 1;
    indices.push(a0, a1, b1, a0, b1, b0);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

interface Props {
  track: TrackModel;
}

// Static road geometry, rebuilt only if the track changes.
export default function Track3D({ track }: Props) {
  const road = useMemo(() => buildRibbon(track, track.halfWidth, -track.halfWidth, 0.02), [track]);
  const shoulder = useMemo(
    () => buildRibbon(track, track.halfWidth + 3.5, -track.halfWidth - 3.5, 0.0),
    [track],
  );
  const edgeL = useMemo(
    () => buildRibbon(track, track.halfWidth, track.halfWidth - 0.5, 0.05),
    [track],
  );
  const edgeR = useMemo(
    () => buildRibbon(track, -track.halfWidth + 0.5, -track.halfWidth, 0.05),
    [track],
  );

  // Center lane dashes as a single instanced mesh.
  const dashes = useMemo(() => {
    const dummy = new THREE.Object3D();
    const list: THREE.Matrix4[] = [];
    const step = 16;
    let s = 0;
    let toggle = 0;
    while (s < track.length) {
      if (toggle % 2 === 0) {
        const sm = track.sample(s);
        dummy.position.set(sm.x, 0.06, sm.z);
        dummy.rotation.set(0, Math.atan2(sm.tx, sm.tz), 0);
        dummy.updateMatrix();
        list.push(dummy.matrix.clone());
      }
      toggle++;
      s += step;
    }
    return list;
  }, [track]);

  const dashRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = dashRef.current;
    if (!m) return;
    dashes.forEach((mat, i) => m.setMatrixAt(i, mat));
    m.instanceMatrix.needsUpdate = true;
  }, [dashes]);

  // Transverse bands (start line + ramp/boost markers).
  const bands = useMemo(() => {
    const out: { x: number; z: number; rot: number; color: string; depth: number }[] = [];
    const start = track.sample(0);
    out.push({ x: start.x, z: start.z, rot: Math.atan2(start.tx, start.tz), color: '#FFFFFF', depth: 2.4 });
    for (const r of track.ramps) {
      const sm = track.sample(r.s + r.length / 2);
      out.push({
        x: sm.x,
        z: sm.z,
        rot: Math.atan2(sm.tx, sm.tz),
        color: r.kind === 'boost' ? Colors.blue : Colors.nitro,
        depth: r.length,
      });
    }
    return out;
  }, [track]);

  return (
    <group>
      <mesh geometry={shoulder} receiveShadow>
        <meshStandardMaterial color={Colors.sand} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial color={Colors.road} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={edgeL}>
        <meshStandardMaterial color={Colors.primary} emissive={Colors.primary} emissiveIntensity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={edgeR}>
        <meshStandardMaterial color={Colors.primary} emissive={Colors.primary} emissiveIntensity={0.35} side={THREE.DoubleSide} />
      </mesh>

      <instancedMesh ref={dashRef} args={[undefined, undefined, dashes.length]}>
        <boxGeometry args={[0.32, 0.02, 3]} />
        <meshStandardMaterial color="#EEF1F7" emissive="#EEF1F7" emissiveIntensity={0.2} />
      </instancedMesh>

      {bands.map((b, i) => (
        <mesh key={i} position={[b.x, 0.07, b.z]} rotation={[0, b.rot, 0]}>
          <boxGeometry args={[track.halfWidth * 2, 0.03, b.depth]} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={0.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
