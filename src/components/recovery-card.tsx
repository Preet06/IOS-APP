import React from 'react';
import { StyleSheet, View, ViewProps, useColorScheme } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface RecoveryCardProps extends ViewProps {
  variant?: 'default' | 'gold' | 'panic' | 'success';
}

export function RecoveryCard({ children, style, variant = 'default', ...props }: RecoveryCardProps) {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const getBorderColor = () => {
    switch (variant) {
      case 'gold':
        return theme.gold;
      case 'panic':
        return theme.panic;
      case 'success':
        return theme.success;
      default:
        return theme.cardBorder;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: getBorderColor(),
        },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    marginVertical: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
});

