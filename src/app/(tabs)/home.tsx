import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, Pattern, Line, Mask, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedRef,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  SharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';
import { ShieldMedallion } from '@/components/shield-medallion';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const S = SCREEN_WIDTH / 390;

// Carousel geometry: neighbours sit one ITEM_W away so they peek in at the screen edges
const ITEM_W = 200 * S;
const SIDE_PAD = (SCREEN_WIDTH - ITEM_W) / 2;
const CAROUSEL_H = 260 * S;
const MEDAL_W = 189 * S;
const MEDAL_H = 220 * S;
const RANK_IMAGE = require('../../../assets/images/rank-dummy.jpg');

const VIGIL_RANKS = [
  { id: 'page', name: 'Page', days: 0 },
  { id: 'squire', name: 'Squire', days: 7 },
  { id: 'knight', name: 'Knight', days: 30 },
  { id: 'banneret', name: 'Knight Banneret', days: 90 },
  { id: 'commander', name: 'Commander', days: 150 },
  { id: 'marshal', name: 'Marshal', days: 200 },
  { id: 'seneschal', name: 'Seneschal', days: 270 },
  { id: 'overcomer', name: 'Overcomer', days: 365 },
];

/**
 * Generates an SVG path string for a shield centered at (cx, cy) with given width and height.
 * Uses the exact parametric curve from Figma / 02_home.html.
 */
function makeShieldPath(cx: number, cy: number, w: number, h: number) {
  const halfW = w / 2;
  const halfH = h / 2;
  const topY = cy - halfH;
  const cornerY = topY + 0.12 * h;
  const midY = cy;
  const botY = cy + halfH;
  const cp1Y = cy + 0.25 * h;
  const cp2Y = cy + 0.42 * h;
  const cp2X = 0.6 * halfW;

  return [
    `M ${cx.toFixed(1)} ${topY.toFixed(1)}`,
    `L ${(cx + halfW).toFixed(1)} ${cornerY.toFixed(1)}`,
    `L ${(cx + halfW).toFixed(1)} ${midY.toFixed(1)}`,
    `C ${(cx + halfW).toFixed(1)} ${cp1Y.toFixed(1)} ${(cx + cp2X).toFixed(1)} ${cp2Y.toFixed(1)} ${cx.toFixed(1)} ${botY.toFixed(1)}`,
    `C ${(cx - cp2X).toFixed(1)} ${cp2Y.toFixed(1)} ${(cx - halfW).toFixed(1)} ${cp1Y.toFixed(1)} ${(cx - halfW).toFixed(1)} ${midY.toFixed(1)}`,
    `L ${(cx - halfW).toFixed(1)} ${cornerY.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function CarouselItem({
  rank,
  index,
  scrollX,
  isLocked,
  onPress,
}: {
  rank: (typeof VIGIL_RANKS)[number];
  index: number;
  scrollX: SharedValue<number>;
  isLocked: boolean;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const range = [(index - 1) * ITEM_W, index * ITEM_W, (index + 1) * ITEM_W];
    return {
      opacity: interpolate(scrollX.value, range, [0.45, 1, 0.45], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollX.value, range, [0.54, 1, 0.54], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.carouselItem, animatedStyle]}>
      <ShieldMedallion
        id={rank.id}
        width={MEDAL_W}
        height={MEDAL_H}
        imageSource={RANK_IMAGE}
        rimColor={isLocked ? '#C2CEEC' : '#2C4290'}
        isLocked={isLocked}
        onPress={onPress}
      />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    cleanDays,
    cleanHours,
    cleanMinutes,
    cleanSeconds,
    scriptureStreak,
    isCheckedInToday,
    userName,
    pendingMilestone,
  } = useRecovery();

  // Find user's active rank index based on cleanDays
  const currentRankIndex = Math.max(
    0,
    VIGIL_RANKS.reduce((acc, r, i) => (cleanDays >= r.days ? i : acc), 0)
  );

  const [selectedIndex, setSelectedIndex] = useState(currentRankIndex);

  // Carousel scroll state
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(currentRankIndex * ITEM_W);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_W);
    const clamped = Math.max(0, Math.min(VIGIL_RANKS.length - 1, idx));
    if (clamped !== selectedIndex) {
      Haptics.selectionAsync();
      setSelectedIndex(clamped);
    }
  };

  const scrollToIndex = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * ITEM_W, animated: true });
  };

  // Next rank calculation
  const nextRank = VIGIL_RANKS[currentRankIndex + 1] || null;
  const currentRank = VIGIL_RANKS[currentRankIndex];
  const daysTotalInLevel = nextRank ? nextRank.days - currentRank.days : 1;
  const daysIntoLevel = Math.max(0, cleanDays - currentRank.days);
  const levelProgressRatio = nextRank
    ? Math.min(1, Math.max(0, daysIntoLevel / daysTotalInLevel))
    : 1;
  const daysToGo = nextRank ? Math.max(0, nextRank.days - cleanDays) : 0;

  // Auto-trigger milestone bestowal celebration if pending
  useEffect(() => {
    if (pendingMilestone) {
      router.push({ pathname: '/milestone', params: { rankId: pendingMilestone.id } });
    }
  }, [pendingMilestone, router]);

  // Pulse "Now" Dot Animation
  const pulseOpacity = useSharedValue(0.35);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulseOpacity]);

  const animatedPulseDot = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Selected rank display
  const viewedRank = VIGIL_RANKS[selectedIndex] || currentRank;
  const isViewedLocked = viewedRank.days > cleanDays;
  const isCurrentViewed = selectedIndex === currentRankIndex;

  const timerText = `${cleanDays} days held · ${String(cleanHours).padStart(2, '0')}:${String(
    cleanMinutes
  ).padStart(2, '0')}:${String(cleanSeconds).padStart(2, '0')}`;

  const handlePressReading = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/check-in');
  };

  const handlePressHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/panic');
  };

  // Adaptive vertical layout positioning
  const topBarTop = Math.max(54, insets.top + 8);
  const centerCy = topBarTop + 200 * S; // Vertical center of the medallion
  const titleTop = centerCy + 134 * S;
  const pathTop = titleTop + 72 * S;
  const readBtnTop = pathTop + 72 * S;
  const helpBtnBottom = Math.max(96, insets.bottom + 66);

  // Background Concentric Shield Frame Geometry (centered at centerCy)
  const frameSvgH = 340 * S;
  const frameSvgW = SCREEN_WIDTH;
  const frameSvgTop = centerCy - frameSvgH / 2;
  const svgCx = frameSvgW / 2;
  const svgCy = frameSvgH / 2;

  // Exact concentric shield paths centered at (svgCx, svgCy)
  const outerShieldPath = makeShieldPath(svgCx, svgCy, 230 * S, 270 * S);
  const middleShieldPath = makeShieldPath(svgCx, svgCy, 216 * S, 254 * S);
  const innerMaskShieldPath = makeShieldPath(svgCx, svgCy, 190 * S, 226 * S);

  return (
    <VigilBackground>
      <View style={styles.root}>
        {/* Top Header Row (Vigil + Streak) */}
        <View style={[styles.topRow, { top: topBarTop, left: 20 * S, right: 20 * S }]}>
          <View style={styles.logoGroup}>
            <Svg width={26 * S} height={30 * S} viewBox="0 0 26 30">
              <Path
                d="M13 1 L24 5 V14 C24 21 19 26 13 29 C7 26 2 21 2 14 V5 Z"
                fill="none"
                stroke="#34489A"
                strokeWidth={1.3}
              />
              <Path
                d="M13 7 V22 M8.5 12 H17.5"
                stroke="#0A1640"
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={[styles.brandTitle, { fontSize: 17 * S }]}>Vigil</Text>
          </View>

          <View style={[styles.streakChip, { height: 30 * S, borderRadius: 15 * S }]}>
            <Svg
              width={14 * S}
              height={14 * S}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B08A36"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
              <Path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
            </Svg>
            <Text style={[styles.streakCount, { fontSize: 14 * S }]}>{scriptureStreak}</Text>
          </View>
        </View>

        {/* Concentric shield outlines framing the centered medallion (Figma) */}
        <View
          pointerEvents="none"
          style={[
            styles.hatchedWrapper,
            {
              top: frameSvgTop,
              left: 0,
              width: frameSvgW,
              height: frameSvgH,
            },
          ]}
        >
          <Svg width={frameSvgW} height={frameSvgH} viewBox={`0 0 ${frameSvgW} ${frameSvgH}`}>
            <Defs>
              <Pattern
                id="ringHatch"
                width={3 * S}
                height={3 * S}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-30)"
              >
                <Line x1="0" y1="0" x2="0" y2={3 * S} stroke="#2C4290" strokeWidth={0.5} />
              </Pattern>
              <Mask id="ringMask">
                <Path d={middleShieldPath} fill="#FFFFFF" />
                <Path d={innerMaskShieldPath} fill="#000000" />
              </Mask>
            </Defs>

            {/* Hatched textured band between middle frame and inner mask (Figma 02_home.html) */}
            <Rect
              x={svgCx - 115 * S}
              y={svgCy - 135 * S}
              width={230 * S}
              height={270 * S}
              fill="url(#ringHatch)"
              mask="url(#ringMask)"
              opacity={0.28}
            />

            {/* Translucent inner shield fill */}
            <Path
              d={middleShieldPath}
              fill="rgba(244, 247, 253, 0.45)"
            />

            {/* Middle solid outline */}
            <Path
              d={middleShieldPath}
              fill="none"
              stroke="#5566A0"
              strokeOpacity={0.5}
              strokeWidth={1}
            />

            {/* Outer dashed outline */}
            <Path
              d={outerShieldPath}
              fill="none"
              stroke="#5566A0"
              strokeOpacity={0.3}
              strokeWidth={0.8}
              strokeDasharray="2 4"
            />
          </Svg>
        </View>

        {/* Horizontal snap carousel of rank medallions */}
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_W}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          onMomentumScrollEnd={handleMomentumEnd}
          contentOffset={{ x: currentRankIndex * ITEM_W, y: 0 }}
          contentContainerStyle={styles.carouselContent}
          style={[styles.carousel, { top: centerCy - CAROUSEL_H / 2, height: CAROUSEL_H }]}
        >
          {VIGIL_RANKS.map((rank, idx) => (
            <CarouselItem
              key={rank.id}
              rank={rank}
              index={idx}
              scrollX={scrollX}
              isLocked={rank.days > cleanDays}
              onPress={() => scrollToIndex(idx)}
            />
          ))}
        </Animated.ScrollView>

        {/* Title & Live Timer */}
        <View style={[styles.titleSection, { top: titleTop }]}>
          <Text style={[styles.knightName, { fontSize: 24 * S }]}>
            {viewedRank.name} {isCurrentViewed ? (userName || 'John') : ''}
          </Text>
          <Text style={[styles.liveTimer, { fontSize: 13 * S }]}>
            {isViewedLocked
              ? `Unlocks in ${viewedRank.days - cleanDays} days`
              : isCurrentViewed
              ? timerText
              : `Earned at Day ${viewedRank.days}`}
          </Text>
        </View>

        {/* Path to Knighthood Track */}
        <View style={[styles.pathSection, { top: pathTop, left: 44 * S, right: 44 * S }]}>
          <View style={[styles.pathTrackWrapper, { height: 22 * S }]}>
            {/* Start Solid Dot */}
            <View style={[styles.pathStartDot, { width: 9 * S, height: 9 * S, borderRadius: 4.5 * S }]} />

            {/* Dashed Background Track */}
            <View style={[styles.pathDashedLine, { left: 10 * S, right: 10 * S }]} />

            {/* Navy Solid Progress Fill */}
            <View
              style={[
                styles.pathFillBar,
                {
                  left: 10 * S,
                  width: `${Math.round(levelProgressRatio * 100 * 0.9)}%`,
                  height: 2 * S,
                },
              ]}
            />

            {/* Pulsing Gold "Now" Dot */}
            <Animated.View
              style={[
                styles.pathPulsingDot,
                {
                  left: `${Math.round(levelProgressRatio * 100 * 0.9)}%`,
                  width: 8 * S,
                  height: 8 * S,
                  borderRadius: 4 * S,
                },
                animatedPulseDot,
              ]}
            />

            {/* Outlined End Dot */}
            <View style={[styles.pathEndDot, { width: 9 * S, height: 9 * S, borderRadius: 4.5 * S }]} />
          </View>

          <View style={styles.pathLabelsRow}>
            <Text style={[styles.pathLabelLeft, { fontSize: 12 * S }]}>{currentRank.name}</Text>
            <Text style={[styles.pathLabelCenter, { fontSize: 12 * S }]}>
              {nextRank ? `${daysToGo} days to go` : 'Maximum Rank'}
            </Text>
            <Text style={[styles.pathLabelRight, { fontSize: 12 * S }]}>
              {nextRank ? nextRank.name : 'Overcomer'}
            </Text>
          </View>
        </View>

        {/* "Start today's reading" Secondary Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePressReading}
          style={[
            styles.readButton,
            {
              top: readBtnTop,
              left: 20 * S,
              right: 20 * S,
              height: 60 * S,
              borderRadius: 18 * S,
            },
            isCheckedInToday && styles.readButtonDone,
          ]}
        >
          {isCheckedInToday ? (
            <View style={[styles.checkCircleGold, { width: 20 * S, height: 20 * S, borderRadius: 10 * S }]}>
              <Svg width={12 * S} height={12 * S} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M7 12.5l3.2 3.2L17 9"
                  stroke="#F4F7FD"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          ) : (
            <Svg
              width={18 * S}
              height={18 * S}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A1640"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
              <Path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
            </Svg>
          )}
          <Text style={[styles.readButtonText, { fontSize: 16 * S }]}>
            {isCheckedInToday ? 'Read today' : "Start today's reading"}
          </Text>
        </TouchableOpacity>

        {/* "I need help now" Primary Navy Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePressHelp}
          style={[
            styles.helpButton,
            {
              bottom: helpBtnBottom,
              left: 20 * S,
              right: 20 * S,
              height: 60 * S,
              borderRadius: 18 * S,
            },
          ]}
        >
          <Svg
            width={18 * S}
            height={18 * S}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F4F7FD"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" />
          </Svg>
          <Text style={[styles.helpButtonText, { fontSize: 17 * S }]}>I need help now</Text>
        </TouchableOpacity>
      </View>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  carousel: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 3,
  },
  carouselContent: {
    paddingHorizontal: SIDE_PAD,
    alignItems: 'center',
  },
  carouselItem: {
    width: ITEM_W,
    height: CAROUSEL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  topRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandTitle: {
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: -0.17,
    color: color.ink,
  },
  streakChip: {
    paddingHorizontal: 12,
    backgroundColor: color.chip,
    borderWidth: 1,
    borderColor: color.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  streakCount: {
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: color.ink,
  },
  auraGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(201,162,74,0.16)',
  },
  hatchedWrapper: {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: 2,
  },
  titleSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 10,
  },
  knightName: {
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    letterSpacing: -0.48,
    color: color.ink,
  },
  liveTimer: {
    marginTop: 6,
    fontFamily: 'Geist',
    fontVariant: ['tabular-nums'],
    color: color.inkTertiary,
  },
  pathSection: {
    position: 'absolute',
    zIndex: 10,
  },
  pathTrackWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  pathStartDot: {
    position: 'absolute',
    left: 0,
    backgroundColor: color.ink,
  },
  pathDashedLine: {
    position: 'absolute',
    height: 1,
    borderWidth: 1,
    borderColor: color.border,
    borderStyle: 'dashed',
  },
  pathFillBar: {
    position: 'absolute',
    backgroundColor: color.ink,
  },
  pathPulsingDot: {
    position: 'absolute',
    marginLeft: 6,
    backgroundColor: color.goldDeep,
    shadowColor: color.gold,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  pathEndDot: {
    position: 'absolute',
    right: 0,
    borderWidth: 1,
    borderColor: color.inkMuted,
    backgroundColor: '#F7F9FE',
  },
  pathLabelsRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pathLabelLeft: {
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  pathLabelCenter: {
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: color.ink,
  },
  pathLabelRight: {
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  readButton: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surfaceTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10,
  },
  readButtonDone: {
    backgroundColor: 'rgba(244,247,253,0.92)',
    borderColor: color.gold,
  },
  checkCircleGold: {
    backgroundColor: color.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readButtonText: {
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  helpButton: {
    position: 'absolute',
    backgroundColor: color.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: color.ink,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 10,
  },
  helpButtonText: {
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.onInk,
  },
});
