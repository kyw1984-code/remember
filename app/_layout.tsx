import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import { storageGet, storageSet } from '../services/storage';
import { initAds } from '../services/adManager';

// Safe dynamic import — not available in dev simulator builds
let requestTrackingPermissionsAsync: (() => Promise<{ status: string }>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  requestTrackingPermissionsAsync = (require('expo-tracking-transparency') as typeof import('expo-tracking-transparency')).requestTrackingPermissionsAsync;
} catch {}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      const seen = await storageGet('onboarded');
      setOnboarded(seen === 'true');
      if (Platform.OS === 'ios' && requestTrackingPermissionsAsync) {
        await requestTrackingPermissionsAsync();
      }
      initAds();
      SplashScreen.hideAsync();
    };
    init();
  }, []);

  if (onboarded === null) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName={onboarded ? '(tabs)' : 'onboarding'}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="study/[setId]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="study/review" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
