import React, { useState } from 'react';
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
import Svg, { Path, Rect } from 'react-native-svg';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';

interface QuizQuestion {
  tag: string;
  q: string;
  sub?: string;
  options?: string[];
  isName?: boolean;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    tag: 'YOUR HABITS',
    q: 'How often do you usually look at porn or explicit content?',
    options: ['More than once a day', 'Once a day', 'A few times a week', 'Less than once a week'],
  },
  {
    tag: 'YOUR HABITS',
    q: 'How old were you when you first saw porn?',
    options: ['Under 13', '13 to 16', '17 to 24', 'Over 24'],
  },
  {
    tag: 'YOUR HABITS',
    q: 'Have you found yourself watching more over time?',
    options: ['Yes', 'No'],
  },
  {
    tag: 'ABOUT YOU',
    q: 'How old are you now?',
    options: ['Under 18', '18 to 24', '25 to 34', '35 to 44', '45 or over'],
  },
  {
    tag: 'YOUR HABITS',
    q: 'Is it hard to feel aroused without porn?',
    options: ['Yes, often', 'Yes, sometimes', 'Not really', 'Never'],
  },
  {
    tag: 'YOUR HABITS',
    q: "Do you turn to porn when you're stressed, low or bored?",
    options: ['Yes, often', 'Yes, sometimes', 'Rarely', 'Never'],
  },
  {
    tag: 'ABOUT YOU',
    q: 'What is your gender?',
    options: ['Male', 'Female', 'Prefer not to say'],
  },
  {
    tag: 'YOUR FAITH',
    q: 'Is sin something you struggle with often?',
    options: ['Yes, always', 'Yes, sometimes', 'Not really', 'Never'],
  },
  {
    tag: 'YOUR FAITH',
    q: 'How would you describe your faith right now?',
    options: ['Very weak', 'Fairly weak', 'Fairly strong', 'Very strong'],
  },
  {
    tag: 'YOUR FAITH',
    q: 'Which church tradition are you part of?',
    options: ['Catholic', 'Baptist', 'Non-denominational', 'Pentecostal', 'Methodist', 'Orthodox', 'Other'],
  },
  {
    tag: 'YOUR FAITH',
    q: 'How hard is it for you to resist lust and temptation?',
    options: ['Very hard', 'Fairly hard', 'Fairly easy', 'Very easy'],
  },
  {
    tag: 'YOUR FAITH',
    q: 'In those moments, do you find yourself turning away from God?',
    options: ['Yes, I do', 'Yes, a few times', "No, but I've thought about it", 'Never'],
  },
  {
    tag: 'ALMOST DONE',
    q: 'How did you hear about Vigil?',
    options: ['Instagram', 'TikTok', 'Facebook', 'Pinterest', 'Google', 'Friends or family', 'Somewhere else'],
  },
  {
    tag: 'LAST ONE',
    q: 'What should we call you?',
    sub: 'Your first name becomes part of your title.',
    isName: true,
  },
];

export default function QuizScreen() {
  const router = useRouter();
  const { setUserName } = useRecovery();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [nameInput, setNameInput] = useState('');

  const currentQ = QUIZ_QUESTIONS[currentIndex];
  const totalQuestions = QUIZ_QUESTIONS.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handlePickOption = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));

    // Auto-advance after 380ms per design handoff
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 380);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleFinish = () => {
    const trimmed = nameInput.trim() || 'Brother';
    setUserName(trimmed);
    router.push('/(onboarding)/plan-reveal');
  };

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar: Back Chevron + Progress Bar + Tabular % */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 5l-7 7 7 7" />
              </Svg>
            </TouchableOpacity>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <Text style={styles.percentText}>{progressPercent}%</Text>
          </View>

          {/* Question Body */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.eyebrow}>{currentQ.tag}</Text>
            <Text style={styles.questionText}>{currentQ.q}</Text>
            {currentQ.sub && <Text style={styles.questionSub}>{currentQ.sub}</Text>}

            {/* Multiple Choice Options */}
            {!currentQ.isName && currentQ.options && (
              <View style={styles.optionsList}>
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentIndex] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.88}
                      onPress={() => handlePickOption(opt)}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                        currentQ.options!.length > 5 && styles.optionCardCompact,
                      ]}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt}
                      </Text>

                      {/* Disc Radio Indicator */}
                      <View style={[styles.radioDisc, isSelected && styles.radioDiscSelected]}>
                        {isSelected && (
                          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M5 12.5l4.5 4.5L19 7.5" />
                          </Svg>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Name Input Step (Q14) */}
            {currentQ.isName && (
              <View style={styles.nameStepContainer}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="First name"
                  placeholderTextColor={color.inkTertiary}
                  autoCapitalize="words"
                  autoFocus
                  style={styles.nameTextInput}
                />

                <View style={styles.titlePreviewRow}>
                  <Text style={styles.titlePreviewLabel}>Your title will read </Text>
                  <Text style={styles.titlePreviewBold}>Page {nameInput.trim() || 'Brother'}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleFinish}
                  disabled={!nameInput.trim()}
                  style={[
                    styles.finishButton,
                    !nameInput.trim() && styles.finishButtonDisabled,
                  ]}
                >
                  <Text style={styles.finishButtonText}>Finish</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Privacy Footer */}
          <View style={styles.privacyFooter}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#5566A0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Rect x="5" y="11" width="14" height="10" rx="2" />
              <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </Svg>
            <Text style={styles.privacyText}>Private. Only you see your answers.</Text>
          </View>
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
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.hairline,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: color.ink,
  },
  percentText: {
    width: 44,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: color.inkSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 36,
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    letterSpacing: 2,
    color: color.inkTertiary,
  },
  questionText: {
    marginTop: 12,
    fontSize: 27,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: -0.5,
    color: color.ink,
  },
  questionSub: {
    marginTop: 10,
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: color.inkSecondary,
  },
  optionsList: {
    marginTop: 28,
    gap: 10,
  },
  optionCard: {
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionCardCompact: {
    height: 52,
    borderRadius: 16,
  },
  optionCardSelected: {
    backgroundColor: color.ink,
    borderColor: color.ink,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: color.ink,
    flex: 1,
  },
  optionTextSelected: {
    color: color.onInk,
  },
  radioDisc: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDiscSelected: {
    backgroundColor: color.onInk,
    borderColor: color.onInk,
  },
  nameStepContainer: {
    marginTop: 32,
    gap: 16,
  },
  nameTextInput: {
    height: 60,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: 'rgba(244,247,253,0.85)',
    fontSize: 18,
    fontFamily: 'Geist-Medium',
    color: color.ink,
  },
  titlePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titlePreviewLabel: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  titlePreviewBold: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  finishButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 999,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonDisabled: {
    backgroundColor: color.borderSoft,
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.onInk,
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
  },
  privacyText: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
});
