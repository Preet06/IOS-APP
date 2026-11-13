import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { color } from '@/theme/tokens';
import { useRecovery, DEFAULT_REASONS } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';

const WAVE_BARS = [4, 8, 14, 18, 12, 16, 20, 10, 6, 12, 18, 14, 8, 16, 20, 18, 10, 6, 14, 18, 12, 8, 16, 12, 6, 10, 14, 8, 4];

export default function PanicScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    reasons,
    recordPanicVictory,
    recordRelapse,
    panicCount,
    userName,
    activeRank,
    cleanDays,
    scriptureStreak,
  } = useRecovery();

  const userWhys = reasons && reasons.length > 0 ? reasons : DEFAULT_REASONS;

  // Step 0: Breathe, 1: Your Why, 2: Verse & Prayer, 3: Hold 15m, 4: Check-out, 5: Victory, 6: Lapse log, 7: Rise
  const [step, setStep] = useState<number>(0);

  // ── Step 0: 12-Second Breath Cycle (4s in, 2s hold, 6s out) + 60s countdown ──
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathTimerTotal, setBreathTimerTotal] = useState(60);

  const breathScale = useSharedValue(0.62);
  const rippleScale = useSharedValue(0.25);
  const rippleOpacity = useSharedValue(0.85);

  useEffect(() => {
    if (step === 0) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 4000, easing: Easing.bezier(0.45, 0, 0.35, 1) }),
          withTiming(1, { duration: 2000 }), // hold
          withTiming(0.62, { duration: 6000, easing: Easing.bezier(0.45, 0, 0.35, 1) })
        ),
        -1,
        false
      );

      rippleScale.value = withRepeat(
        withTiming(1.05, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.3, 1) }),
        -1,
        false
      );

      rippleOpacity.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 500 }),
          withTiming(0.12, { duration: 3500 }),
          withTiming(0, { duration: 8000 })
        ),
        -1,
        false
      );

      let timer = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const interval = setInterval(() => {
        timer = (timer + 1) % 12;
        setBreathTimerTotal((prev) => (prev > 0 ? prev - 1 : 60));

        if (timer === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (timer === 4) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (timer === 6) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (timer < 4) {
          setBreathPhase('in');
        } else if (timer < 6) {
          setBreathPhase('hold');
        } else {
          setBreathPhase('out');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, breathScale, rippleOpacity, rippleScale]);

  const animatedShield = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const animatedRipple = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  // ── Step 2: Audio Prayer ──
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // ── Step 3: 15-Minute Countdown ──
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 mins
  const [showGrounding, setShowGrounding] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 3 && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, secondsRemaining]);

  const timerMinutes = Math.floor(secondsRemaining / 60);
  const timerSeconds = secondsRemaining % 60;
  const timerText = `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`;
  const strokeDashoffset = 1 - secondsRemaining / 900;

  // ── Step 6: Relapse Form ──
  const [lapseTrigger, setLapseTrigger] = useState('Late night');
  const [lapseNote, setLapseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lapseScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const goToStep = (nextStep: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(nextStep);
  };

  const handleVictory = async () => {
    try {
      setIsSubmitting(true);
      await recordPanicVictory();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(5);
    } catch (e) {
      console.warn(e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLapseNoteValid = lapseNote.trim().length > 0;

  const handleConfirmLapse = async () => {
    if (!isLapseNoteValid) return;
    try {
      setIsSubmitting(true);
      await recordRelapse(lapseTrigger, lapseNote.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep(7);
    } catch (e) {
      console.warn(e);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep(7);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine active segment count based on step
  const activeSegmentIndex = step >= 5 ? 4 : Math.min(4, step);

  return (
    <VigilBackground>
      <View style={styles.root}>
        {/* Top Header: Dismiss X & 5-Segment Progress Bar */}
        <View style={[styles.topBar, { paddingTop: Math.max(50, insets.top + 8) }]}>
          <TouchableOpacity
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#5566A0" strokeWidth={2.2} strokeLinecap="round">
              <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.topProgressRow}>
            {[0, 1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  activeSegmentIndex >= s && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ══════════ STEP 0: BREATHE ══════════ */}
        {step === 0 && (
          <View style={styles.step0Container}>
            {/* Top Text */}
            <View style={styles.step0Header}>
              <Text style={styles.eyebrow}>Breathe with me</Text>
              <Text style={styles.breatheHeadline}>
                This will pass.{'\n'}Stay with me.
              </Text>
            </View>

            {/* Center Breathing Aura & Cross */}
            <View style={styles.breathCenterGroup}>
              <View style={styles.shieldBreathContainer}>
                {/* Ripple Aura Rings */}
                <Animated.View style={[styles.rippleRing, animatedRipple]} />

                {/* Animated Cross & Shield */}
                <Animated.View style={[styles.shieldWrapper, animatedShield]}>
                  <Svg width={260} height={260} viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
                    <Defs>
                      <RadialGradient id="auraG" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.95" />
                        <Stop offset="30%" stopColor="#F6ECD2" stopOpacity="0.6" />
                        <Stop offset="65%" stopColor="#C9A24A" stopOpacity="0.2" />
                        <Stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    {/* Outer Concentric Shield Frames */}
                    <Path
                      d="M150 26 L246 60 V146 C246 210 204 256 150 282 C96 256 54 210 54 146 V60 Z"
                      fill="none"
                      stroke="#0A1640"
                      strokeOpacity={0.28}
                      strokeWidth={1.2}
                    />
                    <Path
                      d="M150 38 L234 68 V146 C234 203 197 244 150 268 C103 244 66 203 66 146 V68 Z"
                      fill="none"
                      stroke="#0A1640"
                      strokeOpacity={0.14}
                      strokeWidth={0.8}
                    />
                    {/* Golden Center Aura */}
                    <Circle cx="150" cy="150" r="140" fill="url(#auraG)" />
                    {/* Cross with halo and layered strokes */}
                    <Path
                      d="M150 84 V222 M108 128 H192"
                      stroke="#F6ECD2"
                      strokeWidth={12}
                      strokeLinecap="round"
                    />
                    <Path
                      d="M150 84 V222 M108 128 H192"
                      stroke="#0A1640"
                      strokeWidth={5}
                      strokeLinecap="round"
                    />
                    <Path
                      d="M150 84 V222 M108 128 H192"
                      stroke="#C9A24A"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </Svg>
                </Animated.View>
              </View>

              {/* Breathing Status Text */}
              <View style={styles.breathTextRow}>
                <Text style={styles.breathActionText}>
                  {breathPhase === 'in' ? 'Breathe in' : breathPhase === 'hold' ? 'Hold' : 'Breathe out'}
                </Text>
                <Text style={styles.breathCountdownText}>
                  0:{String(breathTimerTotal).padStart(2, '0')}
                </Text>
              </View>
            </View>

            {/* Pinned Bottom CTA */}
            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(1)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>I feel calmer</Text>
              </TouchableOpacity>
              <Text style={styles.bottomHintText}>Follow the circle</Text>
            </View>
          </View>
        )}

        {/* ══════════ STEP 1: YOUR WHY ══════════ */}
        {step === 1 && (
          <View style={styles.stepFlexContainer}>
            <ScrollView
              style={styles.stepScroll}
              contentContainerStyle={styles.stepScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.eyebrow}>Your why</Text>
              <Text style={styles.stepHeadline}>Remember why you started.</Text>

              <View style={styles.whyList}>
                {userWhys.map((whyText, i) => (
                  <View key={i} style={styles.whyRow}>
                    <Text style={styles.whyQuoteMark}>“</Text>
                    <Text style={styles.whyQuoteText}>{whyText}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.whySub}>Your words, from the day you began.</Text>
            </ScrollView>

            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(2)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════ STEP 2: VERSE & PRAYER ══════════ */}
        {step === 2 && (
          <View style={styles.stepFlexContainer}>
            <ScrollView
              style={styles.stepScroll}
              contentContainerStyle={styles.stepScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.eyebrow}>God's word for this moment</Text>
              <Text style={styles.verseBody}>
                There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also{' '}
                <Text style={styles.highlightUnderline}>make a way to escape</Text>
                {', '}that ye may be able to bear it.
              </Text>
              <Text style={styles.verseRef}>1 Corinthians 10:13</Text>

              {/* Divider */}
              <View style={styles.stepDivider} />

              {/* Prayer Audio Box */}
              <View style={styles.prayerAudioBox}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsPlayingAudio(!isPlayingAudio);
                  }}
                  style={styles.playCircle}
                  activeOpacity={0.85}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#F4F7FD">
                    {isPlayingAudio ? (
                      <>
                        <Rect x="6" y="5" width="4" height="14" rx="1" />
                        <Rect x="14" y="5" width="4" height="14" rx="1" />
                      </>
                    ) : (
                      <Path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                    )}
                  </Svg>
                </TouchableOpacity>

                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.audioPrayerTitle}>A prayer for right now</Text>
                  {/* Waveform */}
                  <View style={styles.waveformContainer}>
                    {WAVE_BARS.map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          {
                            height: isPlayingAudio ? (i % 2 === 0 ? Math.max(5, h * 0.7) : Math.min(20, h * 1.3)) : h,
                            backgroundColor: isPlayingAudio ? '#34489A' : '#A3B3DE',
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.writtenPrayer}>
                Lord, this pull is strong, but you are stronger. Show me the way out you have already made, and give me the strength to take it. Amen.
              </Text>
            </ScrollView>

            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(3)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════ STEP 3: 15-MINUTE HOLD ══════════ */}
        {step === 3 && (
          <View style={styles.stepFlexContainer}>
            <ScrollView
              style={styles.stepScroll}
              contentContainerStyle={styles.stepScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.eyebrow, { textAlign: 'center' }]}>Hold the line</Text>
              <Text style={styles.timerHeadline}>
                An urge peaks and passes.{'\n'}Give it 15 minutes.
              </Text>

              {/* Circular Timer Ring */}
              <View style={styles.timerRingContainer}>
                <Svg width={220} height={220} viewBox="0 0 220 220">
                  <Circle cx="110" cy="110" r="96" fill="none" stroke="#C2CEEC" strokeWidth="6" />
                  <Circle
                    cx="110"
                    cy="110"
                    r="96"
                    fill="none"
                    stroke="#0A1640"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="603"
                    strokeDashoffset={603 * strokeDashoffset}
                    transform="rotate(-90 110 110)"
                  />
                  <Circle cx="110" cy="110" r="84" fill="none" stroke="#0A1640" strokeOpacity="0.18" strokeWidth="0.8" strokeDasharray="2 4" />
                </Svg>

                <View style={styles.timerCenterNumbers}>
                  <Text style={styles.timerDigits}>{timerText}</Text>
                  <Text style={styles.timerUnitLabel}>left</Text>
                </View>
              </View>

              {/* Action Options */}
              <View style={styles.supportCardsGroup}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.optionRow}
                  onPress={() => router.push('/profile')}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                  </Svg>
                  <Text style={styles.optionRowTitle}>Talk to Companion</Text>
                  <View style={styles.nowBadge}>
                    <Text style={styles.nowBadgeText}>Now</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.optionCol}
                  onPress={() => setShowGrounding(!showGrounding)}
                >
                  <View style={styles.optionRowInner}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M13 4a1.5 1.5 0 1 0 0 .01M9 21l2-6 3 2v5M7 12l3-3 4 1 3 3" />
                    </Svg>
                    <Text style={styles.optionRowTitle}>Do something else</Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#5566A0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d={showGrounding ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </Svg>
                  </View>

                  {showGrounding && (
                    <View style={styles.groundingChipsWrap}>
                      {['Walk outside', '20 push-ups', 'Cold water on your face', 'Leave the room'].map((g) => (
                        <View key={g} style={styles.groundingChip}>
                          <Text style={styles.groundingChipText}>{g}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.optionRow}
                  onPress={() => goToStep(2)}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
                    <Path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
                  </Svg>
                  <Text style={styles.optionRowTitle}>Read the verse again</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(4)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>I'm through it</Text>
              </TouchableOpacity>
              <Text style={styles.bottomHintText}>Stay with it. Or check out when the urge has passed.</Text>
            </View>
          </View>
        )}

        {/* ══════════ STEP 4: CHECK-OUT ══════════ */}
        {step === 4 && (
          <View style={styles.stepFlexContainer}>
            <View style={styles.checkoutHeader}>
              <Text style={styles.eyebrow}>Check-out</Text>
              <Text style={styles.askHeadline}>Did you make it?</Text>
              <Text style={styles.askSub}>
                Be honest. Only you see this, and either way you're not alone.
              </Text>
            </View>

            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleVictory}
                disabled={isSubmitting}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Yes, I made it</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => goToStep(6)}
                style={styles.outlineButton}
              >
                <Text style={styles.outlineButtonText}>No, I slipped</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════ STEP 5: VICTORY CELEBRATION ══════════ */}
        {step === 5 && (
          <View style={styles.stepFlexContainer}>
            <View style={styles.victoryCenterGroup}>
              {/* Victory Shield */}
              <View style={styles.victoryCircle}>
                <Svg width={64} height={64} viewBox="0 0 24 24">
                  <Path d="M12 3l7 3v6c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" fill="#0A1640" />
                  <Path d="M8.5 12.2l2.4 2.4 4.6-5" stroke="#C9A24A" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>

              <Text style={styles.victoryTitle}>
                You stood your ground,{'\n'}{activeRank.title} {userName || 'Brother'}.
              </Text>

              <Text style={styles.victoryUrgesCount}>
                Urges faced: <Text style={{ color: color.ink, fontFamily: 'Geist-Bold' }}>{panicCount + 1}</Text>. Every one you hold makes the next one weaker.
              </Text>

              <Text style={styles.victoryVerse}>
                Resist the devil, and he will flee from you.
              </Text>
              <Text style={styles.victoryVerseRef}>James 4:7</Text>
            </View>

            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.back()}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════ STEP 6: LAPSE LOG ══════════ */}
        {step === 6 && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.stepFlexContainer}
          >
            <ScrollView
              ref={lapseScrollRef}
              keyboardShouldPersistTaps="handled"
              style={styles.stepScroll}
              contentContainerStyle={styles.stepScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.eyebrow}>Log a relapse</Text>
              <Text style={styles.lapseHeadline}>
                You watched porn or acted out, and you want to restart your count.
              </Text>

              {/* Stats Summary Rows */}
              <View style={styles.lapseStatsBox}>
                <View style={styles.lapseStatRow}>
                  <Text style={styles.lapseStatLabel}>Clean time</Text>
                  <Text style={styles.lapseStatValue}>{cleanDays} days <Text style={{ color: '#5566A0', fontWeight: '400' }}>→</Text> 0</Text>
                </View>
                <View style={styles.lapseStatRow}>
                  <Text style={styles.lapseStatLabel}>Rank</Text>
                  <Text style={styles.lapseStatValue}>{activeRank.title} <Text style={{ color: '#5566A0', fontWeight: '400' }}>→</Text> Page</Text>
                </View>
                <View style={[styles.lapseStatRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.lapseStatLabel}>Scripture streak</Text>
                  <Text style={styles.lapseStatValue}>Stays at {scriptureStreak || 0}</Text>
                </View>
              </View>

              <Text style={styles.fieldLabelText}>What led to it? <Text style={{ color: '#8798CC' }}>Optional</Text></Text>
              <View style={styles.triggerWrap}>
                {['Late night', 'Stress', 'Boredom', 'Alone', 'Scrolling', 'Other'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setLapseTrigger(t)}
                    style={[styles.triggerChip, lapseTrigger === t && styles.triggerChipSelected]}
                  >
                    <Text style={[styles.triggerText, lapseTrigger === t && styles.triggerTextSelected]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabelText, { marginTop: 18 }]}>
                Note to yourself <Text style={{ color: '#B4413A' }}>Required</Text>
              </Text>
              <TextInput
                value={lapseNote}
                onChangeText={setLapseNote}
                placeholder="What happened? What will you do differently next time?"
                placeholderTextColor={color.inkTertiary}
                multiline
                returnKeyType="done"
                blurOnSubmit
                onFocus={() => {
                  setTimeout(() => {
                    lapseScrollRef.current?.scrollToEnd({ animated: true });
                  }, 200);
                }}
                style={styles.lapseTextArea}
              />
            </ScrollView>

            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleConfirmLapse}
                disabled={isSubmitting || !isLapseNoteValid}
                style={[styles.primaryButton, !isLapseNoteValid && { opacity: 0.45 }]}
              >
                <Text style={styles.primaryButtonText}>Restart my count</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => goToStep(4)}
                style={styles.ghostButton}
              >
                <Text style={styles.ghostButtonText}>Go back</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ══════════ STEP 7: RISE ══════════ */}
        {step === 7 && (
          <View style={styles.stepFlexContainer}>
            <View style={styles.riseCenterGroup}>
              <Text style={styles.riseTitle}>
                You fell.{'\n'}A knight rises again.
              </Text>
              <Text style={styles.riseQuote}>
                For a just man falleth seven times, and riseth up again.
              </Text>
              <Text style={styles.riseRef}>Proverbs 24:16</Text>
              <Text style={styles.riseSub}>Day 1 starts now, Page {userName || 'Brother'}.</Text>
            </View>

            <View style={[styles.pinnedBottomContainer, { paddingBottom: Math.max(34, insets.bottom + 14) }]}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.back()}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topProgressRow: {
    flex: 1,
    height: 3,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C2CEEC',
  },
  progressSegmentActive: {
    backgroundColor: '#0A1640',
  },
  eyebrow: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#5566A0',
  },
  step0Container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  step0Header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  breatheHeadline: {
    marginTop: 8,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '400',
    color: '#0A1640',
    textAlign: 'center',
    letterSpacing: -0.45,
  },
  breathCenterGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldBreathContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rippleRing: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1.8,
    borderColor: '#C9A24A',
  },
  shieldWrapper: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathTextRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  breathActionText: {
    fontSize: 24,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
    textAlign: 'center',
  },
  breathCountdownText: {
    fontSize: 13,
    fontFamily: 'Geist',
    fontVariant: ['tabular-nums'],
    color: '#5566A0',
    marginTop: 4,
    textAlign: 'center',
  },
  pinnedBottomContainer: {
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0A1640',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#F4F7FD',
  },
  outlineButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  ghostButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    fontSize: 15,
    fontFamily: 'Geist-Medium',
    color: '#34489A',
  },
  bottomHintText: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#5566A0',
    textAlign: 'center',
  },
  stepFlexContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  stepScroll: {
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  stepHeadline: {
    marginTop: 8,
    fontSize: 28,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: -0.28,
    color: '#0A1640',
  },
  whyList: {
    marginTop: 28,
    gap: 16,
  },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  whyQuoteMark: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 28,
    lineHeight: 28,
    color: '#C9A24A',
  },
  whyQuoteText: {
    flex: 1,
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 28,
    color: '#0A1640',
  },
  whySub: {
    marginTop: 26,
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#5566A0',
  },
  verseBody: {
    marginTop: 18,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 21,
    lineHeight: 33,
    color: '#0A1640',
  },
  highlightUnderline: {
    backgroundColor: 'rgba(201,162,74,0.3)',
  },
  verseRef: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: '#5566A0',
  },
  stepDivider: {
    height: 1,
    backgroundColor: '#C2CEEC',
    marginTop: 26,
    marginBottom: 20,
  },
  prayerAudioBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2CEEC',
    backgroundColor: 'rgba(227,233,247,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A1640',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPrayerTitle: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  waveformContainer: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  writtenPrayer: {
    marginTop: 18,
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 26,
    color: '#34489A',
  },
  timerHeadline: {
    marginTop: 8,
    fontSize: 26,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#0A1640',
    textAlign: 'center',
    letterSpacing: -0.26,
  },
  timerRingContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 18,
  },
  timerCenterNumbers: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerDigits: {
    fontSize: 46,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    color: '#0A1640',
  },
  timerUnitLabel: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#5566A0',
    marginTop: 2,
  },
  supportCardsGroup: {
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  optionRow: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: 'rgba(244,247,253,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCol: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: 'rgba(244,247,253,0.7)',
    justifyContent: 'center',
  },
  optionRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionRowTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  nowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#E3E9F7',
  },
  nowBadgeText: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: '#5566A0',
  },
  groundingChipsWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 32,
  },
  groundingChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#E3E9F7',
  },
  groundingChipText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#0A1640',
  },
  checkoutHeader: {
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  askHeadline: {
    fontSize: 34,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#0A1640',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  askSub: {
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: '#34489A',
    marginTop: 14,
    textAlign: 'center',
  },
  victoryCenterGroup: {
    paddingTop: 70,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  victoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  victoryTitle: {
    fontSize: 32,
    fontFamily: 'LibreCaslonText_400Regular',
    fontWeight: '400',
    color: '#0A1640',
    textAlign: 'center',
    lineHeight: 40,
  },
  victoryUrgesCount: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#34489A',
    textAlign: 'center',
  },
  victoryVerse: {
    marginTop: 26,
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    color: '#34489A',
    textAlign: 'center',
  },
  victoryVerseRef: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#5566A0',
    textAlign: 'center',
  },
  lapseHeadline: {
    marginTop: 6,
    fontSize: 26,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#0A1640',
    letterSpacing: -0.26,
  },
  lapseStatsBox: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#D3DCF2',
    borderBottomWidth: 1,
    borderBottomColor: '#D3DCF2',
  },
  lapseStatRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#D3DCF2',
  },
  lapseStatLabel: {
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#34489A',
  },
  lapseStatValue: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  fieldLabelText: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: '#5566A0',
    marginTop: 20,
  },
  triggerWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: 'rgba(244,247,253,0.7)',
  },
  triggerChipSelected: {
    backgroundColor: '#0A1640',
    borderColor: '#0A1640',
  },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#0A1640',
  },
  triggerTextSelected: {
    color: '#F4F7FD',
    fontFamily: 'Geist-SemiBold',
  },
  lapseTextArea: {
    marginTop: 8,
    height: 74,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#0A1640',
    textAlignVertical: 'top',
  },
  riseCenterGroup: {
    paddingTop: 100,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  riseTitle: {
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 30,
    lineHeight: 38,
    color: '#0A1640',
    textAlign: 'center',
  },
  riseQuote: {
    marginTop: 18,
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    color: '#34489A',
    textAlign: 'center',
  },
  riseRef: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#5566A0',
    textAlign: 'center',
  },
  riseSub: {
    marginTop: 28,
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#0A1640',
    textAlign: 'center',
  },
});
