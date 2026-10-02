import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import type { Settings } from '@/core/types';

let player: AudioPlayer | null = null;
let audioReady = false;

async function chime(): Promise<void> {
  if (!audioReady) {
    await setAudioModeAsync({ playsInSilentMode: true });
    audioReady = true;
  }
  if (!player) {
    player = createAudioPlayer(require('@/assets/sounds/complete.wav'));
  }
  await player.seekTo(0);
  player.play();
}

export async function playSessionFeedback(settings: Settings): Promise<void> {
  if (settings.hapticsEnabled) {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics are unavailable on some devices and simulators.
    }
  }

  if (settings.soundEnabled) {
    try {
      await chime();
    } catch {
      // Missing audio hardware or a blocked autoplay policy should not fail the session.
    }
  }
}

export async function playTap(settings: Settings): Promise<void> {
  if (!settings.hapticsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore.
  }
}
