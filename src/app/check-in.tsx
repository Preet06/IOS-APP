import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';
import { getPassageForDay } from '@/constants/passages';

const TRIGGERS = [
  'Late night',
  'Stress',
  'Boredom',
  'Alone',
  'Scrolling',
  'Other',
];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CheckInScreen() {
  const router = useRouter();
  const {
    cleanDays,
    completeCheckIn,
    recordRelapse,
    isCheckedInToday,
    scriptureStreak,
    userName,
    activeRank,
  } = useRecovery();

  const passage = getPassageForDay(cleanDays);

  // Phases: 'ask' | 'read' | 'lapse' | 'rise'
  const [phase, setPhase] = useState<'ask' | 'read' | 'lapse' | 'rise'>(
    isCheckedInToday ? 'read' : 'ask'
  );
  const [readStep, setReadStep] = useState(0); // 0: scripture, 1: reflection, 2: prayer, 3: done
  const [selectedTrigger, setSelectedTrigger] = useState<string>('Late night');
  const [lapseNote, setLapseNote] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Equalizer animation for audio bar
  const eqBar1 = useSharedValue(0.4);
  const eqBar2 = useSharedValue(0.9);
  const eqBar3 = useSharedValue(0.5);

  useEffect(() => {
    if (isPlayingAudio) {
      eqBar1.value = withRepeat(withTiming(1, { duration: 400 }), -1, true);
      eqBar2.value = withRepeat(withTiming(0.3, { duration: 550 }), -1, true);
      eqBar3.value = withRepeat(withTiming(0.8, { duration: 480 }), -1, true);
    } else {
      eqBar1.value = 0.4;
      eqBar2.value = 0.9;
      eqBar3.value = 0.5;
    }
  }, [isPlayingAudio]);

  const eqStyle1 = useAnimatedStyle(() => ({ transform: [{ scaleY: eqBar1.value }] }));
  const eqStyle2 = useAnimatedStyle(() => ({ transform: [{ scaleY: eqBar2.value }] }));
  const eqStyle3 = useAnimatedStyle(() => ({ transform: [{ scaleY: eqBar3.value }] }));

  // Handle Done
  const handleDone = async () => {
    try {
      setIsSubmitting(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await completeCheckIn(passage.id);
      router.back();
    } catch (e) {
      console.warn(e);
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Relapse Confirm
  const handleConfirmLapse = async () => {
    try {
      setIsSubmitting(true);
      await recordRelapse(selectedTrigger, lapseNote);
      setPhase('rise');
    } catch (e) {
      console.warn(e);
      setPhase('rise');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Row: Close Button + 4-Segment Progress Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeButton}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={2.2} strokeLinecap="round">
                <Path d="M6 6l12 12M18 6L6 18" />
              </Svg>
            </TouchableOpacity>

            {phase === 'read' ? (
              <View style={styles.progressBarWrapper}>
                {[0, 1, 2, 3].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.progressSegment,
                      readStep >= s && styles.progressSegmentActive,
                    ]}
                  />
                ))}
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <View style={{ width: 28 }} />
          </View>

          {/* ══════════ PHASE: ASK ══════════ */}
          {phase === 'ask' && (
            <View style={styles.contentAsk}>
              <View>
                <Text style={styles.eyebrow}>Before you read</Text>
                <Text style={styles.askHeadline}>Did you stay clean yesterday?</Text>
                <Text style={styles.askSub}>No porn, no acting out. Only you see this answer.</Text>
              </View>

              <View style={styles.askActions}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    setPhase('read');
                    setReadStep(0);
                  }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Yes, I stayed clean</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPhase('lapse')}
                  style={styles.outlineButton}
                >
                  <Text style={styles.outlineButtonText}>No, I slipped</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ══════════ PHASE: LAPSE CONFIRM ══════════ */}
          {phase === 'lapse' && (
            <ScrollView
              contentContainerStyle={styles.scrollLapseContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.eyebrow}>Log a relapse</Text>
              <Text style={styles.lapseHeadline}>
                You watched porn or acted out, and you want to restart your count.
              </Text>

              {/* Status changes table */}
              <View style={styles.lapseTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableKey}>Clean time</Text>
                  <Text style={styles.tableVal}>
                    {cleanDays} days <Text style={{ color: color.inkTertiary, fontWeight: '400' }}>→</Text> 0
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableKey}>Rank</Text>
                  <Text style={styles.tableVal}>
                    {activeRank.title} <Text style={{ color: color.inkTertiary, fontWeight: '400' }}>→</Text> Page
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableKey}>Scripture streak</Text>
                  <Text style={styles.tableVal}>Stays at {scriptureStreak}</Text>
                </View>
              </View>

              {/* Triggers */}
              <Text style={styles.fieldLabel}>
                What led to it? <Text style={{ color: color.inkMuted }}>Optional</Text>
              </Text>
              <View style={styles.triggerWrap}>
                {TRIGGERS.map((t) => {
                  const isSelected = selectedTrigger === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setSelectedTrigger(t)}
                      style={[styles.triggerChip, isSelected && styles.triggerChipSelected]}
                    >
                      <Text style={[styles.triggerText, isSelected && styles.triggerTextSelected]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Note */}
              <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
                Note to yourself <Text style={{ color: color.inkMuted }}>Optional</Text>
              </Text>
              <TextInput
                value={lapseNote}
                onChangeText={setLapseNote}
                placeholder="What happened? What will you do differently next time?"
                placeholderTextColor={color.inkTertiary}
                multiline
                style={styles.lapseTextArea}
              />

              <View style={{ marginTop: 24, gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleConfirmLapse}
                  disabled={isSubmitting}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Restart my count</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPhase('ask')}
                  style={styles.ghostButton}
                >
                  <Text style={styles.ghostButtonText}>Go back</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* ══════════ PHASE: RISE (PROVERBS 24:16) ══════════ */}
          {phase === 'rise' && (
            <View style={styles.contentRise}>
              <View style={styles.riseAuraGlow} />

              <View style={styles.riseCard}>
                <Text style={styles.riseTitle}>
                  You fell.{'\n'}A knight rises again.
                </Text>
                <Text style={styles.riseQuote}>
                  For a just man falleth seven times, and riseth up again.
                </Text>
                <Text style={styles.riseRef}>Proverbs 24:16</Text>

                <Text style={styles.riseRestartText}>
                  Day 1 starts now, Page {userName || 'Brother'}.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  setPhase('read');
                  setReadStep(0);
                }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Continue to today's reading</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════ PHASE: READ (STEPS 0 - 3) ══════════ */}
          {phase === 'read' && (
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <ScrollView
                contentContainerStyle={styles.scrollReadContent}
                showsVerticalScrollIndicator={false}
              >
                {/* STEP 0: SCRIPTURE */}
                {readStep === 0 && (
                  <View>
                    <Text style={styles.eyebrow}>Your orders for today</Text>
                    <Text style={styles.passageRef}>{passage.verseRef}</Text>
                    <Text style={styles.scriptureBody}>
                      {passage.scriptureText}
                    </Text>
                  </View>
                )}

                {/* STEP 1: REFLECTION */}
                {readStep === 1 && (
                  <View>
                    <Text style={styles.eyebrow}>For today</Text>
                    <Text style={styles.reflectionHeadline}>Stand.</Text>
                    <Text style={styles.reflectionBody}>
                      {passage.reflectionText}
                    </Text>
                  </View>
                )}

                {/* STEP 2: PRAYER & AUDIO */}
                {readStep === 2 && (
                  <View>
                    <Text style={styles.eyebrow}>Prayer</Text>
                    <Text style={styles.prayerBody}>
                      "{passage.prayerText}"
                    </Text>

                    {/* Audio Player Bar */}
                    <View style={styles.audioPlayerCard}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                        style={styles.audioPlayButton}
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
                        <Text style={styles.audioTitle}>A prayer for right now</Text>
                        <View style={styles.equalizerRow}>
                          <Animated.View style={[styles.eqBar, eqStyle1]} />
                          <Animated.View style={[styles.eqBar, eqStyle2]} />
                          <Animated.View style={[styles.eqBar, eqStyle3]} />
                          <Animated.View style={[styles.eqBar, eqStyle1]} />
                          <Animated.View style={[styles.eqBar, eqStyle2]} />
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* STEP 3: DONE CELEBRATION */}
                {readStep === 3 && (
                  <View style={styles.doneContainer}>
                    <View style={styles.doneWeekRow}>
                      {WEEK_DAYS.map((day, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.doneWeekSquare,
                            idx === 4 && styles.doneWeekSquareToday,
                          ]}
                        >
                          <Text
                            style={[
                              styles.doneWeekText,
                              idx === 4 && styles.doneWeekTextToday,
                            ]}
                          >
                            {day}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.doneStreakNumber}>
                      {scriptureStreak + 1}
                    </Text>
                    <Text style={styles.doneStreakLabel}>days in the Word</Text>

                    <Text style={styles.doneVerseQuote}>
                      "Having done all, to stand."
                    </Text>
                    <Text style={styles.doneVerseRef}>Ephesians 6:13</Text>
                  </View>
                )}
              </ScrollView>

              {/* Bottom Buttons */}
              <View style={styles.readBottomBar}>
                {readStep > 0 && readStep < 3 && (
                  <TouchableOpacity
                    onPress={() => setReadStep(readStep - 1)}
                    style={styles.backButton}
                  >
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}

                {readStep < 2 && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => setReadStep(readStep + 1)}
                    style={[styles.primaryButton, { flex: 1 }]}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  </TouchableOpacity>
                )}

                {readStep === 2 && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => setReadStep(3)}
                    style={[styles.primaryButton, { flex: 1 }]}
                  >
                    <Text style={styles.primaryButtonText}>Amen</Text>
                  </TouchableOpacity>
                )}

                {readStep === 3 && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleDone}
                    disabled={isSubmitting}
                    style={[styles.primaryButton, { flex: 1 }]}
                  >
                    <Text style={styles.primaryButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 4,
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
  contentAsk: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 24,
  },
  askHeadline: {
    marginTop: 8,
    fontSize: 30,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.3,
    color: color.ink,
  },
  askSub: {
    marginTop: 14,
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: color.inkSecondary,
  },
  askActions: {
    gap: 10,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
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
    height: 56,
    borderRadius: 16,
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
    fontWeight: '500',
    color: color.inkSecondary,
  },
  scrollLapseContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  lapseHeadline: {
    marginTop: 6,
    fontSize: 24,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    lineHeight: 30,
    color: color.ink,
  },
  lapseTable: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  tableRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  tableKey: {
    fontSize: 15,
    fontFamily: 'Geist',
    color: color.inkSecondary,
  },
  tableVal: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  fieldLabel: {
    marginTop: 18,
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
    backgroundColor: 'rgba(244,247,253,0.7)',
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
  contentRise: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 24,
  },
  riseAuraGlow: {
    position: 'absolute',
    left: '50%',
    top: 200,
    width: 380,
    height: 380,
    marginLeft: -190,
    borderRadius: 190,
    backgroundColor: 'rgba(201,162,74,0.14)',
  },
  riseCard: {
    alignItems: 'center',
    textAlign: 'center',
  },
  riseTitle: {
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 30,
    lineHeight: 38,
    color: color.ink,
    textAlign: 'center',
  },
  riseQuote: {
    marginTop: 18,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 16,
    lineHeight: 24,
    color: color.inkSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  riseRef: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  riseRestartText: {
    marginTop: 28,
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    color: color.ink,
  },
  scrollReadContent: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  passageRef: {
    marginTop: 4,
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  scriptureBody: {
    marginTop: 22,
    fontFamily: 'LibreCaslonText',
    fontSize: 21,
    lineHeight: 34,
    color: color.ink,
  },
  reflectionHeadline: {
    marginTop: 6,
    fontFamily: 'LibreCaslonText',
    fontSize: 40,
    lineHeight: 46,
    color: color.ink,
  },
  reflectionBody: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Geist',
    lineHeight: 25,
    color: color.inkSecondary,
  },
  prayerBody: {
    marginTop: 14,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 18,
    lineHeight: 28,
    color: color.inkSecondary,
  },
  audioPlayerCard: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: color.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  audioPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTitle: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  equalizerRow: {
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eqBar: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
    backgroundColor: color.inkSecondary,
  },
  doneContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  doneWeekRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  doneWeekSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneWeekSquareToday: {
    backgroundColor: color.gold,
    borderColor: color.gold,
  },
  doneWeekText: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: color.inkTertiary,
  },
  doneWeekTextToday: {
    color: '#FFFFFF',
    fontFamily: 'Geist-Bold',
  },
  doneStreakNumber: {
    fontSize: 64,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
  },
  doneStreakLabel: {
    fontSize: 17,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
    marginTop: -4,
  },
  doneVerseQuote: {
    marginTop: 36,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 20,
    color: color.ink,
    textAlign: 'center',
  },
  doneVerseRef: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  readBottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  backButton: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    color: color.ink,
  },
});
