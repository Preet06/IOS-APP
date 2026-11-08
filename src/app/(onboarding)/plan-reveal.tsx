import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useRecovery } from '@/context/recovery-context';
import { RecoveryCard } from '@/components/recovery-card';
import { Badge } from '@/components/badge';

export default function PlanRevealScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { goalDays, reasons } = useRecovery();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#070A12' }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Badge label="PLAN CREATED" variant="gold" />
          <Text style={styles.title}>Your Path of Freedom</Text>
          <Text style={styles.subtitle}>
            Based on your answers, here is your daily protocol for overcoming lust:
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Pillar 1: Goal */}
          <RecoveryCard variant="gold" style={styles.planCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.pillarIcon}>🎯</Text>
              <View>
                <Text style={[styles.pillarLabel, { color: theme.gold }]}>PILLAR 1</Text>
                <Text style={styles.pillarTitle}>{goalDays}-Day Dopamine & Soul Reset</Text>
              </View>
            </View>
            <Text style={styles.pillarDesc}>
              Neuroscience confirms that neuroplastic rewiring requires consecutive days free from
              hyper-stimuli. By Day {goalDays}, prefrontal cortex control is restored.
            </Text>
          </RecoveryCard>

          {/* Pillar 2: Daily Check-in */}
          <RecoveryCard style={styles.planCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.pillarIcon}>📖</Text>
              <View>
                <Text style={[styles.pillarLabel, { color: theme.accent }]}>PILLAR 2</Text>
                <Text style={styles.pillarTitle}>Daily Scripture & Audio Consecration</Text>
              </View>
            </View>
            <Text style={styles.pillarDesc}>
              Daily Scripture readings, focused reflections, and audio prayers that fill your mind
              before the day’s battles arrive.
            </Text>
          </RecoveryCard>

          {/* Pillar 3: Active Urge Defense */}
          <RecoveryCard variant="panic" style={styles.planCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.pillarIcon}>🛡️</Text>
              <View>
                <Text style={[styles.pillarLabel, { color: theme.panic }]}>PILLAR 3</Text>
                <Text style={styles.pillarTitle}>Urge Defense Armed With Your Why</Text>
              </View>
            </View>
            <Text style={styles.pillarDesc}>
              When temptation strikes, tap &ldquo;I Need Help Now&rdquo;. Your {reasons.length} core
              reasons, 60s breathing, and Scripture-grounded AI companion will intervene.
            </Text>
          </RecoveryCard>

          {/* Pillar 4: Ephesians 6 Armor */}
          <RecoveryCard variant="gold" style={styles.planCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.pillarIcon}>⚔️</Text>
              <View>
                <Text style={[styles.pillarLabel, { color: theme.gold }]}>PILLAR 4</Text>
                <Text style={styles.pillarTitle}>13 Spiritual Ranks & Armor Pieces</Text>
              </View>
            </View>
            <Text style={styles.pillarDesc}>
              Unlock the Belt of Truth (Day 7), Breastplate of Righteousness (Day 14), Shield of
              Faith (Day 50), and Sword of the Spirit (Day 90). Ranks are permanently preserved.
            </Text>
          </RecoveryCard>
        </ScrollView>

        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/paywall')}
          style={[styles.continueBtn, { backgroundColor: theme.gold }]}>
          <Text style={styles.continueBtnText}>Begin My Walk in Freedom →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  header: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.4,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.four,
    gap: 8,
  },
  planCard: {
    padding: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pillarIcon: {
    fontSize: 26,
    marginRight: Spacing.two,
  },
  pillarLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  pillarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  pillarDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
    marginTop: 4,
  },
  continueBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});

