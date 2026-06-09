// Time-of-day + weather presets. Chosen per race (RaceController.world) and read
// by the renderer for sky/fog/lighting, plus rain and star-field toggles. Kept
// as plain data so it can later be synced across the network.

export interface WorldMood {
  name: string;
  sky: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sun: { color: string; intensity: number; pos: [number, number, number] };
  hemi: { sky: string; ground: string; intensity: number };
  ambient: number;
  ground: string;
  stars: boolean;
  rain: boolean;
}

export const MOODS: WorldMood[] = [
  {
    name: 'CLEAR DAY',
    sky: '#5FB7FF',
    fog: '#BFE6FF',
    fogNear: 140,
    fogFar: 1000,
    sun: { color: '#FFF4E0', intensity: 1.35, pos: [90, 140, 50] },
    hemi: { sky: '#CFE8FF', ground: '#3A5A2A', intensity: 0.8 },
    ambient: 0.35,
    ground: '#2E7D45',
    stars: false,
    rain: false,
  },
  {
    name: 'GOLDEN SUNSET',
    sky: '#FF9E5A',
    fog: '#FFC49A',
    fogNear: 120,
    fogFar: 820,
    sun: { color: '#FFB070', intensity: 1.25, pos: [120, 55, -50] },
    hemi: { sky: '#FFD9B0', ground: '#3A2A22', intensity: 0.6 },
    ambient: 0.4,
    ground: '#3E6B3A',
    stars: false,
    rain: false,
  },
  {
    name: 'NEON NIGHT',
    sky: '#0B1430',
    fog: '#0E1A38',
    fogNear: 100,
    fogFar: 680,
    sun: { color: '#9FB8FF', intensity: 0.5, pos: [60, 120, 40] },
    hemi: { sky: '#3A4A80', ground: '#10131C', intensity: 0.35 },
    ambient: 0.25,
    ground: '#16321F',
    stars: true,
    rain: false,
  },
  {
    name: 'STORM',
    sky: '#7E8AA0',
    fog: '#9AA6BC',
    fogNear: 80,
    fogFar: 540,
    sun: { color: '#C9D2E3', intensity: 0.7, pos: [40, 120, 20] },
    hemi: { sky: '#AEB8CC', ground: '#2A3340', intensity: 0.45 },
    ambient: 0.45,
    ground: '#26512F',
    stars: false,
    rain: true,
  },
  {
    name: 'NIGHT STORM',
    sky: '#0A0F1F',
    fog: '#101830',
    fogNear: 70,
    fogFar: 480,
    sun: { color: '#6E7DB0', intensity: 0.4, pos: [50, 120, 30] },
    hemi: { sky: '#2A3560', ground: '#0C0F18', intensity: 0.3 },
    ambient: 0.3,
    ground: '#122A1A',
    stars: false,
    rain: true,
  },
];

export const pickWorld = (): WorldMood => MOODS[Math.floor(Math.random() * MOODS.length)];
