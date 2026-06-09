import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AudioManager } from './src/audio/AudioManager';
import { useGameStore } from './src/state/gameStore';
import { useUIStore } from './src/state/uiStore';
import { Colors } from './src/theme/colors';
import ScreenTransition from './src/ui/components/ScreenTransition';
import GarageScreen from './src/ui/screens/GarageScreen';
import MainMenuScreen from './src/ui/screens/MainMenuScreen';
import RaceScreen from './src/ui/screens/RaceScreen';
import ResultsScreen from './src/ui/screens/ResultsScreen';
import SettingsScreen from './src/ui/screens/SettingsScreen';
import SplashScreen from './src/ui/screens/SplashScreen';

function ActiveScreen({ screen }: { screen: ReturnType<typeof useUIStore.getState>['screen'] }) {
  switch (screen) {
    case 'menu':
      return <MainMenuScreen />;
    case 'garage':
      return <GarageScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'race':
      return <RaceScreen />;
    case 'results':
      return <ResultsScreen />;
    default:
      return <SplashScreen />;
  }
}

export default function App() {
  const screen = useUIStore((s) => s.screen);
  const hydrate = useGameStore((s) => s.hydrate);
  const sound = useGameStore((s) => s.settings.sound);

  useEffect(() => {
    void hydrate();
    AudioManager.init();
  }, [hydrate]);

  useEffect(() => {
    AudioManager.setEnabled(sound);
  }, [sound]);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" hidden={screen === 'race'} />
        {/* keyed by screen so each navigation re-triggers the entrance animation */}
        <ScreenTransition key={screen}>
          <ActiveScreen screen={screen} />
        </ScreenTransition>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
});
