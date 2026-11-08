import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const GROUNDING_OPTIONS = [
  'Splash cold water on face',
  'Drop and do 20 push-ups',
  'Step outside into fresh air',
  'Put phone in another room',
];

export default function PanicScreen() {
  const router = useRouter();
  const {
    reasons,
    recordPanicVictory,
    recordRelapse,
    panicCount,
    userName,
    activeRank,
  } = useRecovery();

  const userWhys = reasons && reasons.length > 0 ? reasons : DEFAULT_REASONS;

  // Step 0: Breathe, 1: Your Why, 2: Verse & Prayer, 3: Hold 15m, 4: Check-out, 5: Victory, 6: Lapse log, 7: Rise
  const [step, setStep] = useState<number>(0);

  // ── Step 0: 12-Second Breath Cycle (4s in, 2s hold, 6s out) ──
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathCountdown, setBreathCountdown] = useState(4);

  const breathScale = useSharedValue(0.62);
  const rippleScale = useSharedValue(0.2);
  const rippleOpacity = useSharedValue(0.9);

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
          withTiming(0.9, { duration: 500 }),
          withTiming(0.05, { duration: 3500 }),
          withTiming(0, { duration: 8000 })
        ),
        -1,
        false
      );

      let timer = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const interval = setInterval(() => {
        timer = (timer + 1) % 12;
        if (timer === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (timer === 4) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (timer === 6) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        if (timer < 4) {
          setBreathPhase('in');
          setBreathCountdown(4 - timer);
        } else if (timer < 6) {
          setBreathPhase('hold');
          setBreathCountdown(6 - timer);
        } else {
          setBreathPhase('out');
          setBreathCountdown(12 - timer);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step]);

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

  const handleConfirmLapse = async () => {
    try {
      setIsSubmitting(true);
      await recordRelapse(lapseTrigger, lapseNote);
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

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top 5-Segment Progress Bar */}
          <View style={styles.topProgressRow}>
            {[0, 1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  step >= s && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>

          {/* ══════════ STEP 0: BREATHE ══════════ */}
          {step === 0 && (
            <View style={styles.stepContentCenter}>
              <View style={styles.centerHeader}>
                <Text style={styles.eyebrow}>Breathe with me</Text>
                <Text style={styles.breatheHeadline}>
                  This will pass.{'\n'}Stay with me.
                </Text>
              </View>

              {/* Center Breathing Cross Shield with Ripples */}
              <View style={styles.shieldBreathContainer}>
                {/* Expanding Ripple Ring */}
                <Animated.View style={[styles.rippleRing, animatedRipple]} />

                {/* Animated Shield */}
                <Animated.View style={[styles.shieldWrapper, animatedShield]}>
                  <Svg width={240} height={240} viewBox="0 0 300 300">
                    <Defs>
                      <RadialGradient id="auraG" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.95" />
                        <Stop offset="30%" stopColor="#F6ECD2" stopOpacity="0.6" />
                        <Stop offset="65%" stopColor="#C9A24A" stopOpacity="0.2" />
                        <Stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    {/* Outer Shield Outlines */}
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
                    <Circle cx="150" cy="150" r="130" fill="url(#auraG)" />
                    {/* Cross */}
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

                {/* Breathing Status Text */}
                <View style={styles.breathTextRow}>
                  <Text style={styles.breathActionText}>
                    {breathPhase === 'in' ? 'Breathe in' : breathPhase === 'hold' ? 'Hold' : 'Breathe out'}
                  </Text>
                  <Text style={styles.breathCountdownText}>{breathCountdown}s</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(1)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>I feel calmer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════ STEP 1: YOUR WHY ══════════ */}
          {step === 1 && (
            <View style={styles.stepContentBetween}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.eyebrow}>Your why</Text>
                <Text style={styles.stepHeadline}>Remember why you started.</Text>

                <View style={styles.whyList}>
                  {userWhys.map((whyText, i) => (
                    <View key={i} style={styles.whyCard}>
                      <Text style={styles.whyQuoteMark}>“</Text>
                      <Text style={styles.whyQuoteText}>{whyText}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.whySub}>Your words, from the day you began.</Text>
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(2)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════ STEP 2: VERSE & PRAYER ══════════ */}
          {step === 2 && (
            <View style={styles.stepContentBetween}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.eyebrow}>God's word for this moment</Text>
                <Text style={styles.verseBody}>
                  There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also{' '}
                  <Text style={styles.highlightUnderline}>make a way to escape</Text>, that ye may be able to bear it.
                </Text>
                <Text style={styles.verseRef}>1 Corinthians 10:13</Text>

                {/* Prayer Audio Box */}
                <View style={styles.prayerAudioBox}>
                  <TouchableOpacity
                    onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                    style={styles.playCircle}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="#F4F7FD">
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

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.audioPrayerTitle}>A prayer for right now</Text>
                    <Text style={styles.audioDurationText}>1:20 · Grounding audio</Text>
                  </View>
                </View>

                <Text style={styles.writtenPrayer}>
                  Lord, this pull is strong, but You are stronger. Show me the way out You have already made, and give me the strength to take it. Amen.
                </Text>
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(3)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════ STEP 3: 15-MINUTE HOLD ══════════ */}
          {step === 3 && (
            <View style={styles.stepContentBetween}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.eyebrow}>Hold the line</Text>
                  <Text style={styles.timerHeadline}>
                    An urge peaks and passes.{'\n'}Give it 15 minutes.
                  </Text>
                </View>

                {/* 15m Countdown Ring */}
                <View style={styles.timerRingContainer}>
                  <Svg width={210} height={210} viewBox="0 0 220 220">
                    <Circle
                      cx="110"
                      cy="110"
                      r="96"
                      fill="none"
                      stroke="#C2CEEC"
                      strokeWidth={6}
                    />
                    <Circle
                      cx="110"
                      cy="110"
                      r="96"
                      fill="none"
                      stroke="#0A1640"
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={603}
                      strokeDashoffset={603 * strokeDashoffset}
                      transform="rotate(-90 110 110)"
                    />
                  </Svg>
                  <View style={styles.timerCenterNumbers}>
                    <Text style={styles.timerDigits}>{timerText}</Text>
                    <Text style={styles.timerUnitLabel}>minutes remaining</Text>
                  </View>
                </View>

                {/* Support Option Cards */}
                <View style={styles.supportCardsGroup}>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/companion')}
                    style={styles.supportCard}
                  >
                    <Text style={styles.supportCardTitle}>Talk to Companion</Text>
                    <Text style={styles.supportCardSub}>Open sacred AI spiritual guidance</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowGrounding(!showGrounding)}
                    style={styles.supportCard}
                  >
                    <Text style={styles.supportCardTitle}>Do something else</Text>
                    <Text style={styles.supportCardSub}>
                      {showGrounding ? 'Hide actions ▲' : 'Show physical grounding ideas ▼'}
                    </Text>
                  </TouchableOpacity>

                  {showGrounding && (
                    <View style={styles.groundingList}>
                      {GROUNDING_OPTIONS.map((opt, i) => (
                        <View key={i} style={styles.groundingRow}>
                          <Text style={{ fontSize: 14, color: color.ink }}>•</Text>
                          <Text style={styles.groundingText}>{opt}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => goToStep(2)}
                    style={styles.supportCard}
                  >
                    <Text style={styles.supportCardTitle}>Read the verse again</Text>
                    <Text style={styles.supportCardSub}>1 Corinthians 10:13</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => goToStep(4)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>I'm through it</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════ STEP 4: CHECK-OUT ══════════ */}
          {step === 4 && (
            <View style={styles.stepContentBetween}>
              <View style={{ paddingTop: 60 }}>
                <Text style={styles.eyebrow}>Check-out</Text>
                <Text style={styles.askHeadline}>Did you make it?</Text>
                <Text style={styles.askSub}>
                  Be honest. Only you see this, and either way you're not alone.
                </Text>
              </View>

              <View style={{ gap: 10, paddingBottom: 16 }}>
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
            <View style={styles.stepContentCenter}>
              <View style={styles.victoryCircle}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 12.5l4 4L18 8"
                    stroke="#F4F7FD"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>

              <Text style={styles.victoryTitle}>
                You stood your ground,{'\n'}{activeRank.title} {userName || 'Brother'}.
              </Text>
              <Text style={styles.victoryUrgesCount}>
                Urges faced: {panicCount + 1}
              </Text>

              <Text style={styles.victoryVerse}>
                "Submit yourselves therefore to God. Resist the devil, and he will flee from you."
              </Text>
              <Text style={styles.victoryVerseRef}>James 4:7</Text>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.back()}
                style={[styles.primaryButton, { width: '100%', marginTop: 32 }]}
              >
                <Text style={styles.primaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════ STEP 6: LAPSE LOG ══════════ */}
          {step === 6 && (
            <ScrollView contentContainerStyle={styles.scrollLapseContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.eyebrow}>Log a relapse</Text>
              <Text style={styles.lapseHeadline}>
                You watched porn or acted out, and you want to restart your count.
              </Text>

              <View style={styles.fieldLabel}>
                <Text style={styles.fieldLabelText}>What led to it?</Text>
              </View>
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

              <Text style={[styles.fieldLabelText, { marginTop: 18 }]}>Note to yourself</Text>
              <TextInput
                value={lapseNote}
                onChangeText={setLapseNote}
                placeholder="What happened? What will you do differently next time?"
                placeholderTextColor={color.inkTertiary}
                multiline
                style={styles.lapseTextArea}
              />

              <View style={{ marginTop: 24, gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleConfirmLapse}
                  disabled={isSubmitting}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Restart my count</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep(4)}
                  style={styles.ghostButton}
                >
                  <Text style={styles.ghostButtonText}>Go back</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ══════════ STEP 7: RISE ══════════ */}
          {step === 7 && (
            <View style={styles.stepContentCenter}>
              <Text style={styles.riseTitle}>
                You fell.{'\n'}A knight rises again.
              </Text>
              <Text style={styles.riseQuote}>
                For a just man falleth seven times, and riseth up again.
              </Text>
              <Text style={styles.riseRef}>Proverbs 24:16</Text>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.back()}
                style={[styles.primaryButton, { width: '100%', marginTop: 40 }]}
              >
                <Text style={styles.primaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  topProgressRow: {
    height: 4,
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.hairline,
  },
  progressSegmentActive: {
    backgroundColor: color.ink,
  },
  eyebrow: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: color.inkTertiary,
  },
  stepContentCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stepContentBetween: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 12,
  },
  centerHeader: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24,
  },
  breatheHeadline: {
    marginTop: 8,
    fontFamily: 'LibreCaslonText',
    fontSize: 30,
    lineHeight: 38,
    color: color.ink,
    textAlign: 'center',
  },
  shieldBreathContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  rippleRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: color.gold,
  },
  shieldWrapper: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathTextRow: {
    position: 'absolute',
    bottom: -36,
    alignItems: 'center',
  },
  breathActionText: {
    fontSize: 22,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  breathCountdownText: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
    marginTop: 2,
  },
  stepHeadline: {
    marginTop: 8,
    fontSize: 28,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: -0.28,
    color: color.ink,
  },
  whyList: {
    marginTop: 26,
    gap: 14,
  },
  whyCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  whyQuoteMark: {
    fontFamily: 'LibreCaslonText',
    fontSize: 28,
    lineHeight: 28,
    color: color.gold,
  },
  whyQuoteText: {
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 19,
    lineHeight: 26,
    color: color.ink,
  },
  whySub: {
    marginTop: 20,
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  verseBody: {
    marginTop: 18,
    fontFamily: 'LibreCaslonText',
    fontSize: 21,
    lineHeight: 33,
    color: color.ink,
  },
  highlightUnderline: {
    backgroundColor: 'rgba(201,162,74,0.25)',
  },
  verseRef: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: color.inkTertiary,
  },
  prayerAudioBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.borderSoft,
    backgroundColor: color.surfaceTint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPrayerTitle: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  audioDurationText: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  writtenPrayer: {
    marginTop: 18,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 17,
    lineHeight: 26,
    color: color.inkSecondary,
  },
  timerHeadline: {
    marginTop: 8,
    fontSize: 26,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
    textAlign: 'center',
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
    fontSize: 38,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: color.ink,
  },
  timerUnitLabel: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  supportCardsGroup: {
    gap: 10,
    marginBottom: 20,
  },
  supportCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  supportCardTitle: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  supportCardSub: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkSecondary,
    marginTop: 2,
  },
  groundingList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(227,233,247,0.5)',
    gap: 6,
  },
  groundingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groundingText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.ink,
  },
  askHeadline: {
    fontSize: 30,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
    marginTop: 8,
  },
  askSub: {
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: color.inkSecondary,
    marginTop: 12,
  },
  victoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  victoryTitle: {
    fontSize: 26,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
    textAlign: 'center',
  },
  victoryUrgesCount: {
    marginTop: 10,
    fontSize: 15,
    fontFamily: 'Geist-Medium',
    color: color.goldDeep,
  },
  victoryVerse: {
    marginTop: 24,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 17,
    lineHeight: 25,
    color: color.inkSecondary,
    textAlign: 'center',
  },
  victoryVerseRef: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  scrollLapseContent: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  lapseHeadline: {
    marginTop: 6,
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
  },
  fieldLabel: {
    marginTop: 18,
  },
  fieldLabelText: {
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  triggerChipSelected: {
    backgroundColor: color.ink,
    borderColor: color.ink,
  },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.ink,
  },
  triggerTextSelected: {
    color: color.onInk,
    fontFamily: 'Geist-SemiBold',
  },
  lapseTextArea: {
    marginTop: 8,
    height: 74,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geist',
    color: color.ink,
    textAlignVertical: 'top',
  },
  riseTitle: {
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 30,
    lineHeight: 38,
    color: color.ink,
    textAlign: 'center',
  },
  riseQuote: {
    marginTop: 16,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 16,
    lineHeight: 24,
    color: color.inkSecondary,
    textAlign: 'center',
  },
  riseRef: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.onInk,
  },
  outlineButton: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  ghostButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    fontSize: 15,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
});
