import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RaceController } from '../../game/race';
import { Colors } from '../../theme/colors';

const SIZE = 104;
const PAD = 12;

interface Props {
  controller: RaceController;
}

export default function Minimap({ controller }: Props) {
  const layout = useMemo(() => {
    const pts = controller.track.points;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    const spanX = maxX - minX || 1;
    const spanZ = maxZ - minZ || 1;
    const span = Math.max(spanX, spanZ);
    const map = (x: number, z: number) => ({
      x: PAD + ((x - minX) / span) * (SIZE - 2 * PAD),
      y: PAD + ((z - minZ) / span) * (SIZE - 2 * PAD),
    });
    const outline = pts.filter((_, i) => i % 3 === 0).map((p) => map(p.x, p.z));
    return { map, outline };
  }, [controller]);

  const [dots, setDots] = useState<{ x: number; y: number; color: string; me: boolean }[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      setDots(
        controller.racers.map((r) => ({
          ...layout.map(r.worldX, r.worldZ),
          color: r.color,
          me: r.isPlayer,
        })),
      );
    }, 90);
    return () => clearInterval(id);
  }, [controller, layout]);

  return (
    <View style={styles.wrap} pointerEvents="none">
      {layout.outline.map((p, i) => (
        <View key={i} style={[styles.track, { left: p.x - 2, top: p.y - 2 }]} />
      ))}
      {dots.map((d, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { left: d.x - (d.me ? 4 : 3), top: d.y - (d.me ? 4 : 3), backgroundColor: d.color },
            d.me && styles.me,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    borderRadius: 14,
    backgroundColor: 'rgba(8,12,22,0.66)',
    borderWidth: 1,
    borderColor: Colors.strokeStrong,
    overflow: 'hidden',
  },
  track: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)' },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  me: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' },
});
