import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'gold' | 'panic' | 'success' | 'neutral' | 'accent';
  icon?: string;
}

export function Badge({ label, variant = 'neutral', icon }: BadgeProps) {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const getColors = () => {
    switch (variant) {
      case 'gold':
        return { bg: theme.goldLight, text: theme.gold };
      case 'panic':
        return { bg: theme.panicBg, text: theme.panic };
      case 'success':
        return { bg: theme.successBg, text: theme.success };
      case 'accent':
        return { bg: scheme === 'dark' ? '#082F49' : '#E0F2FE', text: theme.accent };
      default:
        return { bg: theme.backgroundElement, text: theme.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Text style={[styles.iconText, { color: text }]}>{icon} </Text> : null}
      <Text style={[styles.labelText, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 8,
  },
  iconText: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

