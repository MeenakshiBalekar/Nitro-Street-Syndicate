// Premium arcade palette for Nitro Street Syndicate.
// Dark glossy base, high-contrast yellow/white accents, orange nitro, cyan map.

export const Colors = {
  // Base surfaces
  bgDeep: '#070912',
  bg: '#0B0E1A',
  surface: '#141A2E',
  surfaceGlass: 'rgba(20, 26, 46, 0.72)',
  surfaceGlassSoft: 'rgba(20, 26, 46, 0.45)',
  stroke: 'rgba(255, 255, 255, 0.10)',
  strokeStrong: 'rgba(255, 255, 255, 0.22)',

  // Accents
  primary: '#FFD23F', // signature yellow
  primaryDark: '#E0A400',
  nitro: '#FF7A1A',
  nitroHot: '#FF3D00',
  cyan: '#2EE6D6',
  blue: '#3AA0FF',
  purple: '#8A5BFF',
  danger: '#FF3B5C',
  success: '#2BD66A',

  // Text
  text: '#FFFFFF',
  textMuted: '#9AA3BF',
  textDim: '#5E6480',

  // Race world tints (also used by 3D scene)
  sky: '#5FB7FF',
  skyHaze: '#BFE6FF',
  sea: '#0E6BA8',
  road: '#23262F',
  roadEdge: '#FFD23F',
  grass: '#2E7D45',
  sand: '#D9C18B',
} as const;

// Distinct racer colors (player + AI). Index 0 is reserved for the player.
export const RacerColors = ['#FFD23F', '#FF3B5C', '#2EE6D6', '#8A5BFF'] as const;

export type ColorKey = keyof typeof Colors;
