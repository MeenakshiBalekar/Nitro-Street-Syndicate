import { BikeConfig } from './types';

// Four launch bikes — a balanced starter plus speed / grip / nitro specialists.
// Stats are tuned against the arcade physics in physics.ts. Keep these as data;
// no behavior lives here.
export const BIKES: BikeConfig[] = [
  {
    id: 'striker',
    name: 'Striker',
    tagline: 'Balanced all-rounder',
    color: '#FFD23F',
    accent: '#1A1A1A',
    price: 0,
    topSpeed: 240,
    accel: 150,
    brake: 220,
    handling: 5.4,
    grip: 0.82,
    nitroPower: 1.45,
    lean: 0.5,
  },
  {
    id: 'tempest',
    name: 'Tempest',
    tagline: 'Top-end speed demon',
    color: '#FF3B5C',
    accent: '#150406',
    price: 6500,
    topSpeed: 285,
    accel: 138,
    brake: 200,
    handling: 4.6,
    grip: 0.72,
    nitroPower: 1.5,
    lean: 0.46,
  },
  {
    id: 'gripster',
    name: 'Gripster',
    tagline: 'Razor cornering grip',
    color: '#2EE6D6',
    accent: '#03201E',
    price: 6500,
    topSpeed: 228,
    accel: 158,
    brake: 250,
    handling: 6.6,
    grip: 0.94,
    nitroPower: 1.4,
    lean: 0.58,
  },
  {
    id: 'voltage',
    name: 'Voltage',
    tagline: 'Nitro overcharge build',
    color: '#8A5BFF',
    accent: '#120A26',
    price: 9000,
    topSpeed: 250,
    accel: 165,
    brake: 215,
    handling: 5.0,
    grip: 0.8,
    nitroPower: 1.7,
    lean: 0.5,
  },
];

export const getBike = (id: string): BikeConfig =>
  BIKES.find((b) => b.id === id) ?? BIKES[0];
