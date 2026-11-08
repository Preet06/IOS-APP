import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { color } from '@/theme/tokens';

const MESSAGES = [
  {
    lead: "You've tried to stop.",
    bold: "More than once.",
    sub1: "And every time,",
    sub2: "it pulled you back.",
  },
  {
    lead: "You're not",
    bold: "the only one.",
    sub1: "Countless men fight this",
    sub2: "same battle in silence.",
  },
  {
    lead: "That isn't",
    bold: "who you are.",
    sub1: "It's a cycle.",
    sub2: "And cycles can be broken.",
  },
  {
    lead: "You don't have to fight",
    bold: "this alone anymore.",
    sub1: "Find strength in God's Word,",
    sub2: "one day at a time.",
  },
  {
    lead: "Let's take the first step",
    bold: "together.",
    sub1: "A few honest questions.",
    sub2: "Your answers stay private.",
  },
];

const WELCOME_GIFTS = [
  { n: 'I', title: 'Break free from porn', desc: 'Win back your mind, energy and peace.' },
  { n: 'II', title: 'Grow strong in faith', desc: 'Five minutes of Scripture and prayer each day.' },
  { n: 'III', title: 'Never fight it alone', desc: 'A brother walking beside you.' },
  { n: 'IV', title: 'Rise in rank', desc: 'Earn armor pieces as days pass in light.' },
];

export default function IntroScreen() {
  const router = useRouter();

  // Mode: 'film' | 'welcome'
  const [mode, setMode] = useState<'film' | 'welcome'>('film');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Skip appears after 2 seconds per PRD
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(skipTimer);
  }, []);

  // Step transition timer (~4.5s per message)
  useEffect(() => {
    if (mode === 'film' && currentIndex < MESSAGES.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 4500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, mode]);

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex(MESSAGES.length - 1);
  };

  const currentMsg = MESSAGES[currentIndex];

  return (
    <View style={styles.darkBackground}>
      {/* Sky Gradient */}
      <LinearGradient
        colors={['#081030', '#101C4A', '#1A2A66', '#2A4290']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {mode === 'film' ? (
          /* ══════════ INTRO FILM ══════════ */
          <View style={styles.container}>
            {/* Top Bar with Skip */}
            <View style={styles.topBar}>
              <View style={{ flex: 1 }} />
              {showSkip && currentIndex < MESSAGES.length - 1 && (
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sword Silhouette & Cold Moonlight Glow */}
            <View style={styles.swordVisualContainer}>
              <View style={styles.moonlightHalo} />
              <Svg width={120} height={260} viewBox="0 0 100 260">
                <Path
                  d="M50 0 L54 0 L53 180 L50 205 L47 180 L46 0 Z"
                  fill="#FFF8E6"
                  opacity={0.85}
                />
                <Path
                  d="M30 180 L70 180 L68 184 L32 184 Z"
                  fill="#F6ECD2"
                />
                <Rect x="48" y="184" width="4" height="40" fill="#F6ECD2" />
                <Circle cx="50" cy="230" r="8" fill="#F6ECD2" />
              </Svg>
            </View>

            {/* Subtitle Text Band */}
            <View style={styles.textBand}>
              <Text style={styles.msgHeadline}>
                {currentMsg.lead} <Text style={{ color: color.ivory }}>{currentMsg.bold}</Text>
              </Text>
              <Text style={styles.msgSub}>
                {currentMsg.sub1} {currentMsg.sub2}
              </Text>
            </View>

            {/* Let's Begin CTA (On Final Beat) */}
            <View style={styles.bottomCtaRow}>
              {currentIndex === MESSAGES.length - 1 ? (
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setMode('welcome')}
                  style={styles.ivoryCtaPill}
                >
                  <Text style={styles.ivoryCtaText}>Let's begin</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ height: 56 }} />
              )}
            </View>
          </View>
        ) : (
          /* ══════════ WELCOME SCREEN ══════════ */
          <View style={styles.container}>
            <View style={styles.welcomeHero}>
              <Text style={styles.vigilWordmark}>Vigil</Text>
              <View style={styles.ivoryDivider} />

              <View style={styles.giftsList}>
                {WELCOME_GIFTS.map((g) => (
                  <View key={g.n} style={styles.giftRow}>
                    <Text style={styles.giftNum}>{g.n}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.giftTitle}>{g.title}</Text>
                      <Text style={styles.giftDesc}>{g.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.welcomeActions}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push('/(onboarding)/quiz')}
                style={styles.ivoryCtaPill}
              >
                <Text style={styles.ivoryCtaText}>Begin the vigil →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  darkBackground: {
    flex: 1,
    backgroundColor: '#081030',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#8FA0D0',
  },
  swordVisualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    position: 'relative',
  },
  moonlightHalo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(246,236,210,0.12)',
  },
  textBand: {
    alignItems: 'center',
    textAlign: 'center',
    paddingHorizontal: 10,
    gap: 12,
  },
  msgHeadline: {
    fontFamily: 'LibreCaslonText',
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: '#A9B8E2',
    textAlign: 'center',
  },
  msgSub: {
    fontSize: 17,
    fontFamily: 'Geist',
    lineHeight: 25,
    color: '#C9D0E8',
    textAlign: 'center',
  },
  bottomCtaRow: {
    paddingBottom: 16,
  },
  ivoryCtaPill: {
    height: 56,
    borderRadius: 999,
    backgroundColor: color.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ivoryCtaText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#14245C',
  },
  welcomeHero: {
    paddingTop: 40,
    alignItems: 'center',
  },
  vigilWordmark: {
    fontSize: 54,
    fontFamily: 'LibreCaslonText',
    color: '#E6ECFA',
    letterSpacing: -1,
  },
  ivoryDivider: {
    width: 44,
    height: 1,
    backgroundColor: color.ivory,
    marginVertical: 18,
    opacity: 0.8,
  },
  giftsList: {
    marginTop: 20,
    width: '100%',
    gap: 18,
  },
  giftRow: {
    flexDirection: 'row',
    gap: 16,
  },
  giftNum: {
    width: 24,
    fontFamily: 'LibreCaslonText',
    fontSize: 16,
    color: color.ivory,
  },
  giftTitle: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#E6ECFA',
  },
  giftDesc: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: 'Geist',
    lineHeight: 18,
    color: '#A9B8E2',
  },
  welcomeActions: {
    gap: 14,
    paddingBottom: 16,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#8FA0D0',
  },
  signInUnderline: {
    color: '#E6ECFA',
    fontFamily: 'Geist-Medium',
    textDecorationLine: 'underline',
  },
});
