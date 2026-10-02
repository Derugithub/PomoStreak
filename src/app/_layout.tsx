import { theme } from '@/constants/theme';
import { AppProvider, useApp } from '@/state/app-state';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import '@/services/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});
void SystemUI.setBackgroundColorAsync(theme.bg);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { ready, onboardingComplete } = useApp();

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  return (
    <Stack
      initialRouteName={onboardingComplete ? '(app)' : 'onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: 'fade',
      }}>
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
