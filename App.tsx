import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGameStore } from './src/state/gameStore';
import { useUIStore } from './src/state/uiStore';
import { Colors } from './src/theme/colors';
import GarageScreen from './src/ui/screens/GarageScreen';
import MainMenuScreen from './src/ui/screens/MainMenuScreen';
import RaceScreen from './src/ui/screens/RaceScreen';
import ResultsScreen from './src/ui/screens/ResultsScreen';
import SettingsScreen from './src/ui/screens/SettingsScreen';
import SplashScreen from './src/ui/screens/SplashScreen';

export default function App() {
  const screen = useUIStore((s) => s.screen);
  const hydrate = useGameStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" hidden={screen === 'race'} />
        {screen === 'splash' && <SplashScreen />}
        {screen === 'menu' && <MainMenuScreen />}
        {screen === 'garage' && <GarageScreen />}
        {screen === 'settings' && <SettingsScreen />}
        {screen === 'race' && <RaceScreen />}
        {screen === 'results' && <ResultsScreen />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
