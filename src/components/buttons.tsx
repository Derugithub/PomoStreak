import { theme, space } from '@/constants/theme';
import { Pressable, StyleSheet, Text } from 'react-native';

export function PrimaryButton({
  label,
  onPress,
  variant = 'accent',
}: {
  label: string;
  onPress: () => void;
  variant?: 'accent' | 'quiet';
}) {
  const accent = variant === 'accent';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        accent ? styles.accent : styles.quiet,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.primaryLabel, accent ? styles.accentLabel : styles.quietLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
      <Text style={styles.textLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  accent: {
    backgroundColor: theme.accent,
  },
  quiet: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pressed: {
    opacity: 0.82,
  },
  primaryLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  accentLabel: {
    color: theme.onAccent,
  },
  quietLabel: {
    color: theme.text,
  },
  textButton: {
    minHeight: 44,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLabel: {
    color: theme.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
});
