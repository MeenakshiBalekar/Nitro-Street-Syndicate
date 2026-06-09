import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/colors';

// Shared premium background: deep vertical gradient with a warm horizon glow.
export default function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.bgDeep, Colors.bg, Colors.surface]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,122,26,0.18)', 'transparent']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.bg } });
