import { theme } from '@/constants/theme';
import { View, type ColorValue } from 'react-native';

export function TimerIcon({ color }: { color: ColorValue }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
      }}>
      <View
        style={{
          width: 1.5,
          height: 6,
          borderRadius: 1,
          backgroundColor: color,
          marginTop: 5,
        }}
      />
    </View>
  );
}

export function StreakIcon({ color }: { color: ColorValue }) {
  const bars = [8, 13, 18];
  return (
    <View
      style={{
        width: 22,
        height: 22,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
      {bars.map((height, index) => (
        <View
          key={height}
          style={{
            width: 4,
            height,
            borderRadius: 2,
            backgroundColor: color,
            opacity: index === bars.length - 1 ? 1 : 0.45,
          }}
        />
      ))}
    </View>
  );
}

export function SettingsIcon({ color }: { color: ColorValue }) {
  return (
    <View style={{ width: 22, height: 18, justifyContent: 'space-between' }}>
      {[4, 12].map((left) => (
        <View key={left} style={{ height: 7, justifyContent: 'center' }}>
          <View style={{ height: 1.5, borderRadius: 1, backgroundColor: color }} />
          <View
            style={{
              position: 'absolute',
              left,
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: theme.bg,
              borderWidth: 1.5,
              borderColor: color,
            }}
          />
        </View>
      ))}
    </View>
  );
}
