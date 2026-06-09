import React, { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type ParticleKind = 'dust' | 'nitro' | 'spark';

export interface ParticleHandle {
  emit: (x: number, y: number, z: number, kind: ParticleKind, count?: number) => void;
  update: (dt: number, camera: THREE.Camera) => void;
}

const MAX = 96;

interface P {
  life: number;
  max: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  r: number;
  g: number;
  b: number;
  grav: number;
}

const KIND = {
  dust: { color: [0.72, 0.66, 0.55], size: 1.1, life: 0.6, grav: -3, spread: 2.2, up: 2.4 },
  nitro: { color: [1.0, 0.5, 0.12], size: 0.9, life: 0.34, grav: 0, spread: 1.6, up: 0.4 },
  spark: { color: [0.5, 1.0, 0.95], size: 0.35, life: 0.45, grav: -9, spread: 5, up: 3.5 },
} as const;

// Pooled additive billboards. One InstancedMesh => one draw call. The game loop
// emits from the player bike and ticks update() once per frame.
const ParticleFX = forwardRef<ParticleHandle, object>((_props, ref) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pool = useMemo<P[]>(
    () =>
      Array.from({ length: MAX }, () => ({
        life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, r: 0, g: 0, b: 0, grav: 0,
      })),
    [],
  );
  const cursor = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    for (let i = 0; i < MAX; i++) {
      dummy.position.set(0, -9999, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, col.setRGB(0, 0, 0));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [dummy, col]);

  useImperativeHandle(
    ref,
    (): ParticleHandle => ({
      emit(x, y, z, kind, count = 1) {
        const k = KIND[kind];
        for (let n = 0; n < count; n++) {
          const p = pool[cursor.current];
          cursor.current = (cursor.current + 1) % MAX;
          p.max = k.life * (0.7 + Math.random() * 0.6);
          p.life = p.max;
          p.x = x + (Math.random() - 0.5) * 0.4;
          p.y = y + Math.random() * 0.3;
          p.z = z + (Math.random() - 0.5) * 0.4;
          p.vx = (Math.random() - 0.5) * k.spread;
          p.vy = Math.random() * k.up;
          p.vz = (Math.random() - 0.5) * k.spread;
          p.size = k.size * (0.7 + Math.random() * 0.6);
          p.grav = k.grav;
          p.r = k.color[0];
          p.g = k.color[1];
          p.b = k.color[2];
        }
      },
      update(dt, camera) {
        const m = meshRef.current;
        if (!m) return;
        for (let i = 0; i < MAX; i++) {
          const p = pool[i];
          if (p.life <= 0) continue;
          p.life -= dt;
          if (p.life <= 0) {
            dummy.position.set(0, -9999, 0);
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            m.setMatrixAt(i, dummy.matrix);
            continue;
          }
          p.vy += p.grav * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          const f = p.life / p.max; // 1 -> 0
          dummy.position.set(p.x, p.y, p.z);
          dummy.quaternion.copy(camera.quaternion); // billboard
          dummy.scale.setScalar(p.size * (1.2 - f * 0.4));
          dummy.updateMatrix();
          m.setMatrixAt(i, dummy.matrix);
          m.setColorAt(i, col.setRGB(p.r * f, p.g * f, p.b * f));
        }
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      },
    }),
    [pool, dummy, col],
  );

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
});

ParticleFX.displayName = 'ParticleFX';
export default ParticleFX;
