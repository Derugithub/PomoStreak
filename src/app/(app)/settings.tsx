import { Card, Screen } from '@/components/screen';
import { theme, space } from '@/constants/theme';
import { useApp } from '@/state/app-state';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

function Stepper({
  label,
  detail,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  detail?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
          style={({ pressed }) => [styles.step, value <= min && styles.stepDisabled, pressed && styles.pressed]}>
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
          style={({ pressed }) => [styles.step, value >= max && styles.stepDisabled, pressed && styles.pressed]}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Toggle({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#2A2A2E', true: theme.accent }}
        thumbColor={theme.text}
        ios_backgroundColor="#2A2A2E"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, setNotificationsEnabled } = useApp();

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.kicker}>Settings</Text>
        <Text style={styles.title} accessibilityRole="header">
          Session lengths
        </Text>
        <Text style={styles.lead}>
          Idle phases use the new length. A running timer keeps its end time. Paused time is kept,
          and capped if it is longer than the new length.
        </Text>
      </View>

      <Card>
        <Stepper
          label="Focus"
          detail="Minutes"
          value={settings.focusMinutes}
          min={1}
          max={180}
          onChange={(focusMinutes) => updateSettings({ focusMinutes })}
        />
        <Stepper
          label="Short break"
          detail="Minutes"
          value={settings.shortBreakMinutes}
          min={1}
          max={60}
          onChange={(shortBreakMinutes) => updateSettings({ shortBreakMinutes })}
        />
        <Stepper
          label="Long break"
          detail="Minutes"
          value={settings.longBreakMinutes}
          min={1}
          max={90}
          onChange={(longBreakMinutes) => updateSettings({ longBreakMinutes })}
        />
        <Stepper
          label="Long break every"
          detail="Finished focus sessions"
          value={settings.longBreakInterval}
          min={2}
          max={12}
          onChange={(longBreakInterval) => updateSettings({ longBreakInterval })}
        />
      </Card>

      <Card>
        <Toggle
          label="Sound"
          detail="A short chime when a session ends in the app. It stays quiet if audio is unavailable."
          value={settings.soundEnabled}
          onChange={(soundEnabled) => updateSettings({ soundEnabled })}
        />
        <Toggle
          label="Haptics"
          detail="A light tap when a session ends. Ignored on devices without haptics."
          value={settings.hapticsEnabled}
          onChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
        />
        <Toggle
          label="Notifications"
          detail="Asked when you turn this on or start a session. If you decline, the timer still runs."
          value={settings.notificationsEnabled}
          onChange={(enabled) => {
            void setNotificationsEnabled(enabled);
          }}
        />
      </Card>

      <Card>
        <Text style={styles.rowLabel}>On this device</Text>
        <Text style={styles.privacy}>
          PomoStreak stores sessions and settings only on this phone. There is no account, no
          analytics, and nothing to sync.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space.sm,
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
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '500',
    letterSpacing: -0.6,
  },
  lead: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.xs,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  rowDetail: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
  },
  stepDisabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.75,
  },
  stepText: {
    color: theme.text,
    fontSize: 20,
    lineHeight: 22,
  },
  stepValue: {
    color: theme.text,
    minWidth: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  privacy: {
    color: theme.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
