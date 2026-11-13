import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';
import { DevotionalPassage, getPassageForDay } from '@/constants/passages';
import { ScriptureService } from '@/services/scripture-service';

const TRIGGERS = [
  'Late night',
  'Stress',
  'Boredom',
  'Alone',
  'Scrolling',
  'Other',
];

const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WAVEFORM_HEIGHTS = [
  6, 10, 14, 9, 18, 22, 12, 8, 16, 24, 20, 11, 7, 13, 19, 26, 17, 10,
  8, 15, 21, 12, 9, 18, 23, 14, 10, 6, 12, 17, 20, 13, 9, 7, 11, 6,
];
const AUDIO_DURATION_SEC = 80; // 1:20

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    cleanDays,
    completeCheckIn,
    recordRelapse,
    scriptureStreak,
    isCheckedInToday,
    userName,
    activeRank,
  } = useRecovery();

  const [passage, setPassage] = useState<DevotionalPassage>(() =>
    getPassageForDay(cleanDays)
  );

  // Fetch today's new Scripture verse from GetHolyBible API (/votd?format=json)
  useEffect(() => {
    let active = true;
    ScriptureService.getTodayPassage(cleanDays)
      .then((dailyPassage) => {
        if (active && dailyPassage) {
          setPassage(dailyPassage);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cleanDays]);

  // Phases: 'ask' (honesty question) | 'read' (scripture flow) | 'lapse' (log slip) | 'rise' (restoration)
  // ALWAYS start at 'ask' to match Figma honesty check
  const [phase, setPhase] = useState<'ask' | 'read' | 'lapse' | 'rise'>('ask');
  const [readStep, setReadStep] = useState(0); // 0: scripture, 1: reflection, 2: prayer, 3: done
  const [selectedTriggers, setSelectedTriggers] = useState<Record<string, boolean>>({
    'Late night': true,
  });
  const [lapseNote, setLapseNote] = useState<string>('');

  // Audio Player State (Step 2)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioPos, setAudioPos] = useState<number>(0);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const lapseScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Clean up audio playback on unmount or step change
  const stopAudio = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      setIsPlayingAudio(true);
      audioIntervalRef.current = setInterval(() => {
        setAudioPos((prev) => {
          if (prev >= AUDIO_DURATION_SEC) {
            stopAudio();
            return AUDIO_DURATION_SEC;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleNextStep = () => {
    stopAudio();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (readStep < 3) {
      const nextStep = readStep + 1;
      if (nextStep === 3) {
        completeCheckIn(passage.id).catch(() => {});
      }
      setReadStep(nextStep);
    } else {
      handleDone();
    }
  };

  const handlePrevStep = () => {
    stopAudio();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReadStep(Math.max(0, readStep - 1));
  };

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

  const handleConfirmLapse = async () => {
    try {
      setIsSubmitting(true);
      const activeTrigger = Object.keys(selectedTriggers).find((k) => selectedTriggers[k]) || 'Late night';
      await recordRelapse(activeTrigger, lapseNote);
      setPhase('rise');
    } catch (e) {
      console.warn(e);
      setPhase('rise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) => ({
      ...prev,
      [trigger]: !prev[trigger],
    }));
  };

  // Safe area padding calculations
  const topBarPaddingTop = Math.max(52, insets.top + 8);
  const bottomBarPaddingBottom = Math.max(34, insets.bottom + 16);

  // Audio elapsed time format
  const audioMinutes = Math.floor(audioPos / 60);
  const audioSeconds = audioPos % 60;
  const audioElapsedStr = `${audioMinutes}:${String(audioSeconds).padStart(2, '0')}`;
  const playedRatio = audioPos / AUDIO_DURATION_SEC;

  // Determine current day of week (0: Sun .. 6: Sat)
  const todayDayIdx = new Date().getDay();

  return (
    <VigilBackground>
      <View style={[styles.root, { paddingTop: topBarPaddingTop, paddingBottom: bottomBarPaddingBottom }]}>
        {/* ══════════ TOP BAR: CLOSE + SEGMENTED PROGRESS ══════════ */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            style={styles.closeButton}
            aria-label="Close"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={2.2} strokeLinecap="round">
              <Path d="M6 6l12 12M18 6L6 18" />
            </Svg>
          </TouchableOpacity>

          {/* Segmented Progress Bar: ONLY visible during read phase */}
          {phase === 'read' ? (
            <View style={styles.progressBarWrapper}>
              {[0, 1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.progressSegment,
                    readStep >= s ? styles.progressSegmentActive : styles.progressSegmentInactive,
                  ]}
                />
              ))}
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {/* Spacer to keep progress bar symmetrically centered */}
          <View style={styles.topBarSpacer} />
        </View>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PHASE: ASK (Honesty Question — Matches Figma Image 2 exactly) */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {phase === 'ask' && (
          <View style={styles.askContainer}>
            <View style={styles.askContent}>
              <Text style={styles.eyebrow}>Before you read</Text>
              <Text style={styles.askHeadline}>Did you stay clean yesterday?</Text>
              <Text style={styles.askSubtitle}>No porn, no acting out. Only you see this answer.</Text>
            </View>

            <View style={styles.askActions}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPhase('read');
                  setReadStep(0);
                }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Yes, I stayed clean</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPhase('lapse');
                }}
                style={styles.secondaryOutlineButton}
              >
                <Text style={styles.secondaryOutlineButtonText}>No, I slipped</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PHASE: LAPSE CONFIRM (Log a relapse)                          */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {phase === 'lapse' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.lapseContainer}
          >
            <ScrollView
              ref={lapseScrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.lapseScrollContent}
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
                  const isSelected = !!selectedTriggers[t];
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => toggleTrigger(t)}
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

            <View style={styles.lapseActions}>
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
          </KeyboardAvoidingView>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PHASE: RISE (Proverbs 24:16 Restoration)                      */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {phase === 'rise' && (
          <View style={styles.riseContainer}>
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

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* PHASE: READ (Steps 0 - 3: Scripture, Reflection, Prayer, Done)*/}
        {/* ══════════════════════════════════════════════════════════════ */}
        {phase === 'read' && (
          <View style={styles.readContainer}>
            <ScrollView
              contentContainerStyle={styles.readScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* STEP 0: SCRIPTURE ORDERS */}
              {readStep === 0 && (
                <View style={styles.stepContent}>
                  <Text style={styles.eyebrow}>Your orders for today</Text>
                  <Text style={styles.passageRef}>{passage.verseRef}</Text>
                  <Text style={styles.scriptureBody}>
                    {passage.scriptureText}
                  </Text>
                </View>
              )}

              {/* STEP 1: REFLECTION / TAKEAWAY */}
              {readStep === 1 && (
                <View style={styles.stepContent}>
                  <Text style={styles.eyebrow}>For today</Text>
                  <Text style={styles.reflectionHeadline}>
                    {passage.reflectionHeadline || 'Stand.'}
                  </Text>
                  <Text style={styles.reflectionBody}>
                    {passage.reflectionText}
                  </Text>
                  <Text style={[styles.reflectionBody, { marginTop: 16, color: '#34489A' }]}>
                    {passage.reflectionSubText ||
                      "The pull you feel today is real. But it isn't you, and it isn't stronger than the One you belong to. Hold your ground for this one day."}
                  </Text>
                </View>
              )}

              {/* STEP 2: PRAYER & AUDIO */}
              {readStep === 2 && (
                <View style={styles.stepContent}>
                  <Text style={styles.eyebrow}>Prayer</Text>

                  {/* Audio Player Card (Figma 03_daily_checkin.html) */}
                  <View style={styles.audioPlayerCard}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={togglePlayAudio}
                      style={styles.audioPlayButton}
                      aria-label={isPlayingAudio ? 'Pause prayer' : 'Play prayer'}
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="#F4F7FD">
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

                    <View style={styles.waveformColumn}>
                      <View style={styles.waveformRow}>
                        {WAVEFORM_HEIGHTS.map((h, i) => {
                          const isPlayed = i / WAVEFORM_HEIGHTS.length < playedRatio;
                          return (
                            <View
                              key={i}
                              style={[
                                styles.waveformBar,
                                {
                                  height: h,
                                  backgroundColor: isPlayed ? '#0A1640' : '#A3B3DE',
                                },
                              ]}
                            />
                          );
                        })}
                      </View>
                      <View style={styles.audioTimeRow}>
                        <Text style={styles.audioTimeText}>{audioElapsedStr}</Text>
                        <Text style={styles.audioTimeText}>1:20</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.prayerBody}>
                    "{passage.prayerText}"
                  </Text>
                </View>
              )}

              {/* STEP 3: DONE CELEBRATION */}
              {readStep === 3 && (
                <View style={styles.doneContainer}>
                  {/* Gold aura glow */}
                  <View style={styles.doneAuraGlow} />

                  {/* Weekly Check-in Squares (S M T W T F S) */}
                  <View style={styles.doneWeekRow}>
                    {WEEK_LABELS.map((dayLabel, idx) => {
                      const isToday = idx === todayDayIdx;
                      const isPast = idx < todayDayIdx;
                      return (
                        <View key={idx} style={styles.doneWeekItem}>
                          <View
                            style={[
                              styles.doneWeekSquare,
                              isPast && styles.doneWeekSquarePast,
                              isToday && styles.doneWeekSquareToday,
                            ]}
                          />
                          <Text style={[styles.doneWeekLabel, isToday && styles.doneWeekLabelToday]}>
                            {dayLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Big Animated Streak Number */}
                  <Text style={styles.doneStreakNumber}>
                    {isCheckedInToday ? Math.max(1, scriptureStreak) : scriptureStreak + 1}
                  </Text>
                  <Text style={styles.doneStreakLabel}>days in the Word</Text>
                  <Text style={styles.doneStreakSub}>Your armour holds.</Text>

                  {/* Quote */}
                  <Text style={styles.doneVerseQuote}>“Having done all, to stand.”</Text>
                  <Text style={styles.doneVerseRef}>
                    Rest well, {activeRank.title} {userName || 'Brother'}. Report at first light.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Read Bottom Action Bar */}
            <View style={styles.readActions}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleNextStep}
                disabled={isSubmitting}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {readStep === 2 ? 'Amen' : readStep === 3 ? 'Done' : 'Continue'}
                </Text>
              </TouchableOpacity>

              {readStep > 0 && readStep < 3 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePrevStep}
                  style={styles.ghostBackButton}
                >
                  <Text style={styles.ghostBackButtonText}>Back</Text>
                </TouchableOpacity>
              )}
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
    width: '100%',
    height: '100%',
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    marginLeft: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 3,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: color.ink,
  },
  progressSegmentInactive: {
    backgroundColor: '#C2CEEC',
  },
  topBarSpacer: {
    width: 26,
  },
  eyebrow: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#5566A0',
  },

  /* ─── PHASE: ASK (Figma Image 2) ─── */
  askContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  askContent: {
    paddingTop: 120,
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
  askSubtitle: {
    marginTop: 14,
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: '#34489A',
  },
  askActions: {
    gap: 10,
    paddingHorizontal: 0,
  },
  primaryButton: {
    width: '100%',
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
  secondaryOutlineButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryOutlineButtonText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },

  /* ─── PHASE: LAPSE ─── */
  lapseContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  lapseScrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  lapseHeadline: {
    marginTop: 6,
    fontSize: 26,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.2,
    color: color.ink,
  },
  lapseTable: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#D3DCF2',
  },
  tableRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#D3DCF2',
  },
  tableKey: {
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#34489A',
  },
  tableVal: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  fieldLabel: {
    marginTop: 20,
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: '#5566A0',
  },
  triggerWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  triggerChip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerChipSelected: {
    backgroundColor: color.ink,
    borderColor: color.ink,
  },
  triggerText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#34489A',
  },
  triggerTextSelected: {
    color: color.onInk,
    fontFamily: 'Geist-SemiBold',
  },
  lapseTextArea: {
    marginTop: 8,
    height: 74,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Geist',
    color: color.ink,
    textAlignVertical: 'top',
  },
  lapseActions: {
    gap: 4,
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
    color: '#34489A',
  },

  /* ─── PHASE: RISE ─── */
  riseContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  riseAuraGlow: {
    position: 'absolute',
    left: '50%',
    top: 220,
    width: 440,
    height: 440,
    marginLeft: -220,
    borderRadius: 220,
    backgroundColor: 'rgba(201,162,74,0.12)',
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
    color: '#34489A',
    textAlign: 'center',
  },
  riseRef: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#5566A0',
  },
  riseRestartText: {
    marginTop: 28,
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    color: color.ink,
  },

  /* ─── PHASE: READ ─── */
  readContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  readScrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  stepContent: {
    width: '100%',
  },
  passageRef: {
    marginTop: 4,
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  scriptureBody: {
    marginTop: 26,
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
    marginTop: 20,
    fontSize: 18,
    fontFamily: 'Geist',
    lineHeight: 28,
    color: color.ink,
  },
  audioPlayerCard: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  audioPlayButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformColumn: {
    flex: 1,
    gap: 8,
  },
  waveformRow: {
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 2,
  },
  audioTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  audioTimeText: {
    fontSize: 12,
    fontFamily: 'Geist',
    fontVariant: ['tabular-nums'],
    color: '#5566A0',
  },
  prayerBody: {
    marginTop: 30,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 21,
    lineHeight: 34,
    color: color.ink,
  },

  /* ─── STEP 3: DONE ─── */
  doneContainer: {
    alignItems: 'center',
    paddingTop: 36,
  },
  doneAuraGlow: {
    position: 'absolute',
    left: '50%',
    top: 40,
    width: 360,
    height: 260,
    marginLeft: -180,
    borderRadius: 130,
    backgroundColor: 'rgba(201,162,74,0.18)',
  },
  doneWeekRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 32,
    alignItems: 'flex-end',
  },
  doneWeekItem: {
    alignItems: 'center',
    gap: 6,
  },
  doneWeekSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#C2CEEC',
  },
  doneWeekSquarePast: {
    backgroundColor: color.ink,
  },
  doneWeekSquareToday: {
    backgroundColor: color.gold,
    borderWidth: 1.5,
    borderColor: color.goldDeep,
    shadowColor: color.gold,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  doneWeekLabel: {
    fontSize: 11,
    fontFamily: 'Geist',
    color: '#8798CC',
  },
  doneWeekLabelToday: {
    color: color.goldDeep,
    fontFamily: 'Geist-SemiBold',
  },
  doneStreakNumber: {
    fontSize: 110,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    lineHeight: 110,
    letterSpacing: -4,
    color: color.ink,
  },
  doneStreakLabel: {
    marginTop: 6,
    fontSize: 17,
    fontFamily: 'Geist-Medium',
    color: color.ink,
  },
  doneStreakSub: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#5566A0',
  },
  doneVerseQuote: {
    marginTop: 36,
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 20,
    lineHeight: 28,
    color: color.ink,
    textAlign: 'center',
  },
  doneVerseRef: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#5566A0',
    textAlign: 'center',
  },

  /* ─── READ ACTIONS ─── */
  readActions: {
    gap: 12,
    alignItems: 'center',
  },
  ghostBackButton: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBackButtonText: {
    fontSize: 14,
    fontFamily: 'Geist-Medium',
    color: '#5566A0',
  },
});
