import { Platform, TextStyle } from 'react-native';

// System fonts only (no bundled font assets) keeps the bundle lean and avoids
// async font loading on the critical path.
const display = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-condensed',
  default: 'system-ui',
}) as string;

const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
}) as string;

export const Type = {
  display,
  mono,
  size: {
    xs: 11,
    sm: 13,
    md: 16,
    lg: 20,
    xl: 26,
    xxl: 34,
    huge: 56,
  },
  weight: {
    regular: '500' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    black: '900' as TextStyle['fontWeight'],
  },
} as const;
