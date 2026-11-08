import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Image as RNImage } from 'react-native';
import Svg, {
  Path,
  Defs,
  ClipPath,
  Image as SvgImage,
  Rect,
  G,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface ShieldMedallionProps {
  width: number;
  height: number;
  imageSource: any;
  rimColor?: string;
  isLocked?: boolean;
  isCenter?: boolean;
  onPress?: () => void;
  style?: any;
}

export function ShieldMedallion({
  width,
  height,
  imageSource,
  rimColor = '#2C4290',
  isLocked = false,
  isCenter = false,
  onPress,
  style,
}: ShieldMedallionProps) {
  const clipId = `clip-${Math.round(width)}-${Math.round(height)}-${isCenter ? 'center' : 'side'}`;
  const sheenId = `${clipId}-sheen`;

  // Reflection sweep: glide across (~1.1s), then rest ~2s, repeat forever
  const sheenX = useSharedValue(-60);
  useEffect(() => {
    if (isLocked) return;
    sheenX.value = withRepeat(
      withSequence(
        withTiming(-60, { duration: 0 }),
        withTiming(140, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withDelay(2000, withTiming(140, { duration: 0 }))
      ),
      -1,
      false
    );
    return () => cancelAnimation(sheenX);
  }, [isLocked, sheenX]);

  const sheenProps = useAnimatedProps(() => ({ x: sheenX.value }));

  // Shield Path definition
  const shieldPath = 'M50 0 L100 12 L100 50 C100 75 80 92 50 100 C20 92 0 75 0 50 L0 12 Z';
  const resolvedSource = RNImage.resolveAssetSource(imageSource);

  return (
    <TouchableOpacity
      activeOpacity={isCenter ? 1 : 0.75}
      onPress={onPress}
      disabled={isCenter}
      style={[{ width, height }, style]}
    >
      <Svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Path d={shieldPath} />
          </ClipPath>
          <LinearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.32" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Shield Image Clipped */}
        <G clipPath={`url(#${clipId})`}>
          <Rect width="100" height="100" fill="#F4F7FD" />
          <SvgImage
            href={resolvedSource || imageSource}
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
            opacity={isLocked ? 0.35 : 1}
          />
          {/* Subtle reflection sweep, clipped to the shield shape */}
          {!isLocked && (
            <G transform="rotate(20 50 50)">
              <AnimatedRect
                animatedProps={sheenProps}
                y="-40"
                width="22"
                height="180"
                fill={`url(#${sheenId})`}
              />
            </G>
          )}
        </G>

        {/* Outer Shield Rim */}
        <Path
          d={shieldPath}
          fill="none"
          stroke={rimColor}
          strokeWidth="1.3"
        />

        {/* Inner Shield Rim */}
        <Path
          d={shieldPath}
          transform="translate(2.2 2.2) scale(.956)"
          fill="none"
          stroke={rimColor}
          strokeOpacity="0.45"
          strokeWidth="0.8"
        />

        {/* Padlock Icon if locked */}
        {isLocked && (
          <G transform="translate(38, 38)">
            <Rect x="2" y="9" width="20" height="15" rx="3" fill="#081030" opacity="0.6" />
            <Rect x="2" y="9" width="20" height="15" rx="3" fill="none" stroke="#C2CEEC" strokeWidth="1.6" />
            <Path d="M6 9V5a6 6 0 0 1 12 0v4" fill="none" stroke="#C2CEEC" strokeWidth="1.6" strokeLinecap="round" />
          </G>
        )}
      </Svg>

    </TouchableOpacity>
  );
}

