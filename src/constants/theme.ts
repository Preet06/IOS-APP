import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    backgroundElement: '#EDF2F7',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#64748B',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    gold: '#B45309',
    goldLight: '#FEF3C7',
    panic: '#DC2626',
    panicBg: '#FEF2F2',
    accent: '#2563EB',
    success: '#059669',
    successBg: '#ECFDF5',
  },
  dark: {
    text: '#F8FAFC',
    background: '#090D16',
    backgroundElement: '#141A29',
    backgroundSelected: '#1E2738',
    textSecondary: '#94A3B8',
    card: '#111827',
    cardBorder: '#1F293D',
    gold: '#F59E0B',
    goldLight: '#451A03',
    panic: '#EF4444',
    panicBg: '#450A0A',
    accent: '#38BDF8',
    success: '#10B981',
    successBg: '#064E3B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 60, android: 80 }) ?? 60;
export const MaxContentWidth = 800;
