import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, {
  Path,
  Rect,
  Circle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEKS_DATA = [
  { n: 4, heightRatio: 0.8 },
  { n: 3, heightRatio: 0.6 },
  { n: 2, heightRatio: 0.4 },
  { n: 1, heightRatio: 0.2 },
  { n: 2, heightRatio: 0.4 },
  { n: 1, heightRatio: 0.2 },
  { n: 0, heightRatio: 0.05 },
  { n: 1, heightRatio: 0.2 },
  { n: 0, heightRatio: 0.05 },
  { n: 0, heightRatio: 0.05 },
];

export default function ProgressScreen() {
  const router = useRouter();
  const {
    cleanDays,
    cleanHours,
    cleanMinutes,
    scriptureStreak,
    panicCount,
    userName,
    activeRank,
    recordRelapse,
  } = useRecovery();

  const [isLapseSheetOpen, setIsLapseSheetOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState('Late night');
  const [lapseNote, setLapseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pulsing Dot Animation
  const pulseOpacity = useSharedValue(0.5);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleLapseConfirm = async () => {
    try {
      setIsSubmitting(true);
      await recordRelapse(selectedTrigger, lapseNote);
      setIsLapseSheetOpen(false);
    } catch (e) {
      console.warn(e);
      setIsLapseSheetOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timerClock = `${cleanDays}d ${cleanHours}h ${cleanMinutes}m`;

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>Progress</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════ SECTION 1: RANKS STAIRCASE CHART ══════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Ranks</Text>
              <TouchableOpacity
                onPress={() => router.push('/rank-list')}
                style={styles.linkRow}
              >
                <Text style={styles.linkText}>All ranks</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 6l6 6-6 6" />
                </Svg>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>
              Climbed by clean time · <Text style={{ color: color.inkSecondary }}>{timerClock}</Text>
            </Text>

            {/* SVG Staircase Climb Chart */}
            <View style={styles.chartWrapper}>
              <Svg width={350} height={200} viewBox="0 0 350 200">
                <Defs>
                  <SvgGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#0A1640" stopOpacity={0.16} />
                    <Stop offset="100%" stopColor="#0A1640" stopOpacity={0} />
                  </SvgGradient>
                </Defs>

                {/* Grid Lines */}
                {[30, 70, 110, 150].map((y) => (
                  <Line key={y} x1={0} y1={y} x2={350} y2={y} stroke="#D3DCF2" strokeWidth={0.8} />
                ))}

                {/* Shaded Area Fill */}
                <Path
                  d="M0 160 L60 160 L60 120 L140 120 L140 160 L0 160 Z"
                  fill="url(#areaG)"
                />

                {/* Future Dashed Step Projection */}
                <Path
                  d="M140 120 L210 120 L210 70 L280 70 L280 30 L350 30"
                  fill="none"
                  stroke="#A3B3DE"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />

                {/* Earned Solid Navy Step Line */}
                <Path
                  d="M0 160 L60 160 L60 120 L140 120"
                  fill="none"
                  stroke="#0A1640"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Ranks Labels */}
                <SvgText x={135} y={112} fontSize={12} fontWeight="600" fill="#0A1640" textAnchor="end">
                  Squire
                </SvgText>
                <SvgText x={215} y={112} fontSize={12} fontWeight="500" fill="#34489A">
                  Knight
                </SvgText>
                <SvgText x={350} y={24} fontSize={12} fontWeight="500" fill="#34489A" textAnchor="end">
                  Knight Banneret · 90d
                </SvgText>

                {/* Gold Dot on Today */}
                <Circle cx={140} cy={120} r={5} fill="#B08A36" />

                {/* Day Labels along bottom */}
                <SvgText x={0} y={185} fontSize={11} fill="#5566A0">Day 1</SvgText>
                <SvgText x={140} y={185} fontSize={11} fill="#0A1640" fontWeight="600" textAnchor="middle">Today</SvgText>
                <SvgText x={350} y={185} fontSize={11} fill="#5566A0" textAnchor="end">Day 90</SvgText>
              </Svg>
            </View>
          </View>

          {/* ══════════ SECTION 2: SCRIPTURE HEATMAP GRID ══════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Scripture</Text>
              <Text style={styles.badgeHighlight}>{scriptureStreak}-day streak</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Consecutive daily habit in the Word</Text>

            {/* 35-Day Mini Heatmap */}
            <View style={styles.heatmapGrid}>
              {Array.from({ length: 35 }).map((_, i) => {
                const isRead = i < scriptureStreak;
                const isToday = i === scriptureStreak;
                return (
                  <View
                    key={i}
                    style={[
                      styles.heatCell,
                      isRead && styles.heatCellRead,
                      isToday && styles.heatCellToday,
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* ══════════ SECTION 3: URGES FACED BAR CHART ══════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Urges faced</Text>
              <Text style={styles.badgeHighlight}>The enemy is losing ground</Text>
            </View>

            <View style={styles.barChartContainer}>
              {WEEKS_DATA.map((w, idx) => (
                <View key={idx} style={styles.barColumn}>
                  <Text style={styles.barNumberText}>{w.n}</Text>
                  <View style={[styles.barFill, { height: Math.max(4, w.heightRatio * 52) }]} />
                </View>
              ))}
            </View>
            <View style={styles.barFooterRow}>
              <Text style={styles.barFooterText}>Week 1</Text>
              <Text style={styles.barFooterText}>This week</Text>
              <Text style={styles.barFooterText}>Week 10</Text>
            </View>
          </View>

          {/* ══════════ SECTION 4: LAPSES SUMMARY ══════════ */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Lapses</Text>
              <Text style={styles.badgeHighlight}>Rose every time</Text>
            </View>

            <View style={styles.lapseMetricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricBigNumber}>0</Text>
                <Text style={styles.metricLabel}>So far</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricBigNumber}>
                  {cleanDays}
                  <Text style={{ fontSize: 15, fontWeight: '500', color: color.inkSecondary }}> days</Text>
                </Text>
                <Text style={styles.metricLabel}>Longest hold</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricBigNumber, { fontSize: 16, marginTop: 4 }]}>Late night</Text>
                <Text style={styles.metricLabel}>Most common</Text>
              </View>
            </View>
          </View>

          {/* ══════════ ACTION: "I SLIPPED" ══════════ */}
          <View style={styles.slippedContainer}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsLapseSheetOpen(true)}
              style={styles.slippedButton}
            >
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 12a9 9 0 1 0 3-6.7" />
                <Path d="M3 4v5h5" />
              </Svg>
              <Text style={styles.slippedButtonText}>I slipped</Text>
            </TouchableOpacity>
            <Text style={styles.slippedSub}>Log a relapse and restart your clean time</Text>
          </View>
        </ScrollView>

        {/* ══════════ BOTTOM SHEET: RELAPSE LOG ══════════ */}
        {isLapseSheetOpen && (
          <View style={styles.sheetModalOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsLapseSheetOpen(false)}
              style={styles.sheetScrim}
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />

              <Text style={styles.sheetEyebrow}>Log a relapse</Text>
              <Text style={styles.sheetTitle}>
                You watched porn or acted out, and you want to restart your count.
              </Text>

              {/* Status changes table */}
              <View style={styles.sheetTable}>
                <View style={styles.sheetTableRow}>
                  <Text style={styles.sheetTableKey}>Clean time</Text>
                  <Text style={styles.sheetTableVal}>{cleanDays} days → 0</Text>
                </View>
                <View style={styles.sheetTableRow}>
                  <Text style={styles.sheetTableKey}>Rank</Text>
                  <Text style={styles.sheetTableVal}>{activeRank.title} → Page</Text>
                </View>
                <View style={styles.sheetTableRow}>
                  <Text style={styles.sheetTableKey}>Scripture streak</Text>
                  <Text style={styles.sheetTableVal}>Stays at {scriptureStreak}</Text>
                </View>
              </View>

              <Text style={styles.sheetFieldLabel}>What led to it? Optional</Text>
              <View style={styles.triggerWrap}>
                {['Late night', 'Stress', 'Boredom', 'Alone', 'Scrolling', 'Other'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSelectedTrigger(t)}
                    style={[styles.triggerChip, selectedTrigger === t && styles.triggerChipSelected]}
                  >
                    <Text style={[styles.triggerText, selectedTrigger === t && styles.triggerTextSelected]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sheetFieldLabel, { marginTop: 14 }]}>Note to yourself Optional</Text>
              <TextInput
                value={lapseNote}
                onChangeText={setLapseNote}
                placeholder="What happened? What will you do differently next time?"
                placeholderTextColor={color.inkTertiary}
                multiline
                style={styles.sheetTextArea}
              />

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleLapseConfirm}
                disabled={isSubmitting}
                style={styles.sheetConfirmButton}
              >
                <Text style={styles.sheetConfirmText}>Restart my count</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsLapseSheetOpen(false)}
                style={styles.sheetCancelButton}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  sectionCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
  badgeHighlight: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.inkSecondary,
  },
  chartWrapper: {
    marginTop: 14,
    alignItems: 'center',
  },
  heatmapGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heatCell: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSoft,
  },
  heatCellRead: {
    backgroundColor: color.ink,
    borderColor: color.ink,
  },
  heatCellToday: {
    backgroundColor: color.surface,
    borderColor: color.goldDeep,
    borderWidth: 2,
  },
  barChartContainer: {
    marginTop: 16,
    height: 64,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    gap: 4,
  },
  barNumberText: {
    fontSize: 11,
    fontFamily: 'Geist',
    color: color.inkSecondary,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: color.ink,
  },
  barFooterRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barFooterText: {
    fontSize: 11,
    fontFamily: 'Geist',
    color: color.inkMuted,
  },
  lapseMetricsRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: color.hairline,
    marginHorizontal: 12,
  },
  metricBigNumber: {
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
    marginTop: 2,
  },
  slippedContainer: {
    marginTop: 10,
    alignItems: 'center',
    gap: 8,
  },
  slippedButton: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.inkMuted,
    backgroundColor: color.surfaceTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  slippedButtonText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  slippedSub: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  sheetModalOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    justifyContent: 'flex-end',
  },
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,22,64,0.5)',
  },
  sheetContent: {
    backgroundColor: '#F4F7FD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: color.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetEyebrow: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: color.inkTertiary,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
    marginTop: 4,
    lineHeight: 28,
  },
  sheetTable: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  sheetTableRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  sheetTableKey: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.inkSecondary,
  },
  sheetTableVal: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  sheetFieldLabel: {
    marginTop: 14,
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: color.inkTertiary,
  },
  triggerWrap: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  triggerChipSelected: {
    backgroundColor: color.ink,
    borderColor: color.ink,
  },
  triggerText: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.ink,
  },
  triggerTextSelected: {
    color: color.onInk,
    fontFamily: 'Geist-SemiBold',
  },
  sheetTextArea: {
    marginTop: 6,
    height: 64,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.ink,
    textAlignVertical: 'top',
  },
  sheetConfirmButton: {
    marginTop: 16,
    height: 54,
    borderRadius: 16,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetConfirmText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.onInk,
  },
  sheetCancelButton: {
    marginTop: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
});
