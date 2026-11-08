import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { useRecovery } from '@/context/recovery-context';
import { RecoveryCard } from '@/components/recovery-card';
import { Badge } from '@/components/badge';
import { RANKS, RankItem } from '@/constants/ranks';

export default function MilestoneModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rankId?: string }>();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { highestEarnedRank, activeRank, dismissPendingMilestone } = useRecovery();

  // Selected rank (either route param, user preview selection, or user highest rank)
  const initialRank =
    (params.rankId && RANKS.find((r) => r.id === params.rankId)) ||
    highestEarnedRank ||
    activeRank;

  const [selectedRank, setSelectedRank] = useState<RankItem>(initialRank);

  const handleDismiss = () => {
    dismissPendingMilestone();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#070A12' }]}>
      <View style={styles.container}>
        {/* Glow & Badge */}
        <View style={styles.topRow}>
          <Badge label="HERALDIC MILESTONE ATTAINED" variant="gold" />
        </View>

        {/* Heraldic Shield Symbol */}
        <View style={styles.heraldicContainer}>
          <View style={[styles.shieldCircle, { borderColor: theme.gold }]}>
            <Text style={styles.shieldIcon}>
              {selectedRank.armorPiece ? '⚔️' : '🛡️'}
            </Text>
          </View>
          <Text style={[styles.rankDays, { color: theme.gold }]}>
            DAY {selectedRank.day} OVERCOME
          </Text>
          <Text style={styles.rankTitle}>{selectedRank.title}</Text>
        </View>

        {/* Armor Awarded Card */}
        {selectedRank.armorPiece ? (
          <RecoveryCard variant="gold" style={styles.armorCard}>
            <Text style={[styles.armorSubtitle, { color: theme.gold }]}>
              SPIRITUAL ARMOR BESTOWED (EPHESIANS 6)
            </Text>
            <Text style={styles.armorName}>{selectedRank.armorPiece}</Text>
            {selectedRank.scriptureRef && (
              <Text style={styles.scriptureRef}>{selectedRank.scriptureRef}</Text>
            )}
            <Text style={styles.armorDescription}>{selectedRank.description}</Text>
          </RecoveryCard>
        ) : (
          <RecoveryCard variant="gold" style={styles.armorCard}>
            <Text style={[styles.armorSubtitle, { color: theme.gold }]}>
              PROMOTED IN THE LIGHT
            </Text>
            <Text style={styles.armorName}>{selectedRank.title}</Text>
            <Text style={styles.armorDescription}>{selectedRank.description}</Text>
          </RecoveryCard>
        )}

        {/* Biblical Affirmation */}
        <View style={styles.verseBox}>
          <Text style={styles.verseQuote}>
            &ldquo;Put on the full armor of God, so that you can take your stand against the devil&apos;s
            schemes.&rdquo;
          </Text>
          <Text style={styles.verseSource}>Ephesians 6:11</Text>
        </View>

        {/* Milestone Preview Selector (Test Mode) */}
        <View style={styles.previewSection}>
          <Text style={styles.previewCaption}>PREVIEW ALL 13 SACRED PROMOTIONS:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewChipsContainer}>
            {RANKS.map((r) => {
              const isSelected = selectedRank.id === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setSelectedRank(r)}
                  style={[
                    styles.rankChip,
                    {
                      backgroundColor: isSelected ? theme.gold : '#111827',
                      borderColor: isSelected ? theme.gold : '#1E293B',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.rankChipText,
                      { color: isSelected ? '#000000' : '#E2E8F0' },
                    ]}>
                    Day {r.day} · {r.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Dismiss CTA */}
        <TouchableOpacity
          onPress={handleDismiss}
          activeOpacity={0.88}
          style={[styles.dismissBtn, { backgroundColor: theme.gold }]}>
          <Text style={styles.dismissBtnText}>Stand Firm & Continue Onward →</Text>
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
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRow: {
    alignSelf: 'center',
  },
  heraldicContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  shieldCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginBottom: Spacing.two,
  },
  shieldIcon: {
    fontSize: 46,
  },
  rankDays: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  rankTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  armorCard: {
    width: '100%',
    padding: Spacing.three,
    alignItems: 'center',
  },
  armorSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  armorName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  scriptureRef: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 6,
  },
  armorDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  verseBox: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  verseQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
  verseSource: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    marginTop: 2,
  },
  previewSection: {
    width: '100%',
  },
  previewCaption: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#64748B',
    marginBottom: 6,
    textAlign: 'center',
  },
  previewChipsContainer: {
    gap: 6,
    paddingHorizontal: 4,
  },
  rankChip: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rankChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});
