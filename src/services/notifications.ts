import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'session-end';

try {
  if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  // Local notifications are optional. The in-app timer still finishes.
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Session end',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 180, 80, 180],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    const current = await Notifications.getPermissionsAsync();
    return current.status === 'granted';
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    if (current.status === 'denied' && current.canAskAgain === false) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelSessionNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore. A missed cancel must not block pause or reset.
  }
}

export async function scheduleSessionEnd(input: {
  endsAt: number;
  title: string;
  body: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  if (input.endsAt - Date.now() < 750) return;
  try {
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(input.endsAt),
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  } catch {
    // Permission, channel, or OS limits. The countdown still uses endsAt.
  }
}
