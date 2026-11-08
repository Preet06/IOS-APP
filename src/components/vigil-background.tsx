import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  Pattern,
  Line,
  RadialGradient,
  Stop,
  Mask,
  Rect,
  G,
} from 'react-native-svg';
import { gradient } from '@/theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VigilBackgroundProps {
  children?: React.ReactNode;
  showHatching?: boolean;
}

export function VigilBackground({ children, showHatching = true }: VigilBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* 1. Base Sky Gradient */}
      <LinearGradient
        colors={[...gradient.lightPage]}
        locations={[...gradient.lightPageStops]}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Navy Pen Hatching Overlay (Pattern A at -38deg, Pattern B at 42deg) */}
      {showHatching && (
        <Svg
          aria-hidden={true}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          style={[StyleSheet.absoluteFill, styles.hatchOverlay]}
        >
          <Defs>
            <Pattern
              id="penA"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-38)"
            >
              <Line x1="0" y1="0" x2="0" y2="4" stroke="#0A1640" strokeWidth="0.45" />
            </Pattern>
            <Pattern
              id="penB"
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(42)"
            >
              <Line x1="0" y1="0" x2="0" y2="5" stroke="#0A1640" strokeWidth="0.4" />
            </Pattern>
            <RadialGradient id="penMaskA" cx="50%" cy="42%" r="75%">
              <Stop offset="35%" stopColor="#000" stopOpacity="0" />
              <Stop offset="100%" stopColor="#fff" stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="penMaskB" cx="50%" cy="42%" r="70%">
              <Stop offset="62%" stopColor="#000" stopOpacity="0" />
              <Stop offset="100%" stopColor="#fff" stopOpacity="1" />
            </RadialGradient>
            <Mask id="mA">
              <Rect width="100%" height="100%" fill="url(#penMaskA)" />
            </Mask>
            <Mask id="mB">
              <Rect width="100%" height="100%" fill="url(#penMaskB)" />
            </Mask>
          </Defs>
          <G>
            <Rect width="100%" height="100%" fill="url(#penA)" mask="url(#mA)" opacity="0.11" />
            <Rect width="100%" height="100%" fill="url(#penB)" mask="url(#mB)" opacity="0.08" />
          </G>
        </Svg>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F7F9FE',
  },
  hatchOverlay: {
    pointerEvents: 'none',
  },
});
