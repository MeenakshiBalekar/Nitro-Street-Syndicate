import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { GhostState } from '../game/ghost';

export interface GhostHandle {
  sync: (g: GhostState) => void;
}

// A translucent, glowing silhouette of the player's best run. Visual only —
// deliberately simplified (and additive) so it reads clearly as a "ghost".
const GhostBike3D = forwardRef<GhostHandle, object>((_props, ref) => {
  const root = useRef<THREE.Group>(null);
  const front = useRef<THREE.Group>(null);
  const rear = useRef<THREE.Group>(null);

  useImperativeHandle(
    ref,
    () => ({
      sync(g: GhostState) {
        const r = root.current;
        if (!r) return;
        r.visible = g.active;
        if (!g.active) return;
        r.position.set(g.worldX, g.worldY, g.worldZ);
        r.rotation.set(g.pitch, g.heading, g.lean, 'YXZ');
        if (front.current) front.current.rotation.x = g.spin;
        if (rear.current) rear.current.rotation.x = g.spin;
      },
    }),
    [],
  );

  const mat = (
    <meshBasicMaterial color="#2EE6D6" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
  );

  return (
    <group ref={root} visible={false}>
      <mesh position={[0, 0.72, -0.05]}>
        <boxGeometry args={[0.44, 0.36, 1.95]} />
        {mat}
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.4, 0.7, 0.4]} />
        {mat}
      </mesh>
      <group ref={front} position={[0, 0.42, 0.92]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.18, 14]} />
          {mat}
        </mesh>
      </group>
      <group ref={rear} position={[0, 0.42, -0.95]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.46, 0.46, 0.22, 14]} />
          {mat}
        </mesh>
      </group>
    </group>
  );
});

GhostBike3D.displayName = 'GhostBike3D';
export default GhostBike3D;
