import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TrackModel } from '../game/track';
import { TrafficVehicle } from '../game/types';

export interface TrafficHandle {
  sync: () => void;
}

interface Props {
  vehicles: TrafficVehicle[];
  track: TrackModel;
}

// One reusable slot per pooled vehicle. The slot is repositioned, rescaled and
// recolored each frame from the simulation, so trucks/buses/sedans all share the
// same primitive meshes.
const Traffic3D = forwardRef<TrafficHandle, Props>(({ vehicles, track }, ref) => {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const bodyMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      sync() {
        for (let i = 0; i < vehicles.length; i++) {
          const v = vehicles[i];
          const g = groups.current[i];
          if (!g) continue;
          const sm = track.sample(v.s);
          g.position.set(sm.x + sm.nx * v.lane, v.length * 0.18, sm.z + sm.nz * v.lane);
          g.rotation.set(0, Math.atan2(sm.tx, sm.tz), 0);
          g.scale.set(v.width, 1, v.length);
          const mat = bodyMats.current[i];
          if (mat) mat.color.set(v.color);
        }
      },
    }),
    [vehicles, track],
  );

  return (
    <group>
      {vehicles.map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          {/* body (unit box, scaled by slot) */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              ref={(m) => {
                bodyMats.current[i] = m;
              }}
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
          {/* cabin / windows */}
          <mesh position={[0, 1.0, -0.05]}>
            <boxGeometry args={[0.86, 0.5, 0.5]} />
            <meshStandardMaterial color="#10131C" metalness={0.5} roughness={0.25} />
          </mesh>
          {/* tail lights */}
          <mesh position={[0, 0.5, -0.5]}>
            <boxGeometry args={[0.9, 0.3, 0.05]} />
            <meshStandardMaterial color="#FF3B5C" emissive="#FF3B5C" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

Traffic3D.displayName = 'Traffic3D';
export default Traffic3D;
