import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

// Night star field — fixed points on a far dome (constant pixel size).
export function Stars() {
  const geo = useMemo(() => {
    const N = 420;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2;
      const e = Math.random() * 0.5 + 0.05; // upper hemisphere
      const r = 900;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#FFFFFF" size={2.4} sizeAttenuation={false} toneMapped={false} />
    </points>
  );
}

// Rain — a pool of falling streaks kept in a box around the camera so it always
// surrounds the player. Self-contained cosmetic loop (no sim dependency).
export function Rain() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 340;
  const span = 70;
  const data = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        x: (Math.random() - 0.5) * span,
        y: Math.random() * 40,
        z: (Math.random() - 0.5) * span,
        v: 36 + Math.random() * 24,
      })),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const m = ref.current;
    if (!m) return;
    const dt = Math.min(delta, 1 / 20);
    const cam = state.camera;
    for (let i = 0; i < N; i++) {
      const p = data[i];
      p.y -= p.v * dt;
      if (p.y < cam.position.y - 12) {
        p.y = cam.position.y + 28 + Math.random() * 8;
        p.x = (Math.random() - 0.5) * span;
        p.z = (Math.random() - 0.5) * span;
      }
      dummy.position.set(cam.position.x + p.x, p.y, cam.position.z + p.z);
      dummy.scale.set(1, 1.6, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.03, 1.3, 0.03]} />
      <meshBasicMaterial color="#AEC2DA" transparent opacity={0.45} toneMapped={false} />
    </instancedMesh>
  );
}
