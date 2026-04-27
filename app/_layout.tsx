import '../global.css';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { storageGet } from '../services/storage';
import { initAds } from '../services/adManager';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      const seen = await storageGet('onboarded');
      setOnboarded(seen === 'true');
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
