import { PrimaryButton } from '@/components/buttons';
import { theme, space } from '@/constants/theme';
import { useApp } from '@/state/app-state';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SLIDES = [
  {
    kicker: 'On this device',
    title: 'A focus timer that stays here.',
    body: 'PomoStreak has no account and no cloud. Sessions, streaks, and settings live in local storage on this phone. After the app has loaded, airplane mode is fine.',
  },
  {
    kicker: 'The rhythm',
    title: 'Finish the block. Keep the day.',
    body: 'Focus runs 25 minutes by default, then a short break. Every fourth focus opens a longer pause. Only a finished focus session counts toward today and the streak. Lengths can be changed in Settings.',
  },
] as const;

export default function OnboardingScreen() {
  const { onboardingComplete, completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index] ?? SLIDES[0];
  const last = index === SLIDES.length - 1;

  if (onboardingComplete) {
    return <Redirect href="/" />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.copy}>
        <Text style={styles.kicker}>{slide.kicker}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {slide.title}
        </Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityRole="tablist">
          {SLIDES.map((item, dot) => (
            <View
              key={item.kicker}
              style={[styles.dot, dot === index ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>
        <PrimaryButton
          label={last ? 'Begin' : 'Continue'}
          onPress={() => {
            if (last) completeOnboarding();
            else setIndex((current) => current + 1);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: space.lg,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    gap: space.md,
    maxWidth: 460,
    alignSelf: 'center',
    width: '100%',
  },
  kicker: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.text,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '500',
    letterSpacing: -0.8,
  },
  body: {
    color: theme.textMuted,
    fontSize: 17,
    lineHeight: 26,
    marginTop: space.sm,
  },
  footer: {
    gap: space.lg,
    maxWidth: 460,
    alignSelf: 'center',
    width: '100%',
  },
  dots: {
    flexDirection: 'row',
    gap: space.sm,
  },
  dot: {
    height: 3,
    width: 28,
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: theme.accent,
  },
  dotIdle: {
    backgroundColor: theme.border,
  },
});
