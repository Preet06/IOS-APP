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
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { RecoveryCard } from '@/components/recovery-card';
import { Badge } from '@/components/badge';

export default function PaywallScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleContinue = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#070A12' }]}>
      <View style={styles.container}>
        {/* Top Close / Skip */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroBox}>
            <View style={[styles.shieldIconWrap, { borderColor: theme.gold }]}>
              <Text style={styles.shieldIcon}>⚔️</Text>
            </View>
            <Text style={styles.heroTitle}>Equip the Full Armor</Text>
            <Text style={styles.heroSubtitle}>
              Walk with thousands of men breaking free from lust, grounded in Christ.
            </Text>
          </View>

          {/* Value Props */}
          <View style={styles.valuePropsList}>
            <View style={styles.propRow}>
              <Text style={styles.propCheck}>✓</Text>
              <Text style={styles.propText}>
                <Text style={styles.propBold}>Unlimited AI Companion</Text> for 24/7 Scripture urge defense
              </Text>
            </View>
            <View style={styles.propRow}>
              <Text style={styles.propCheck}>✓</Text>
              <Text style={styles.propText}>
                <Text style={styles.propBold}>Daily Spoken Audio Prayers</Text> & 90-day reading plan
              </Text>
            </View>
            <View style={styles.propRow}>
              <Text style={styles.propCheck}>✓</Text>
              <Text style={styles.propText}>
                <Text style={styles.propBold}>Emergency Urge Protocol</Text> (Breathe, Why & 15m timer)
              </Text>
            </View>
            <View style={styles.propRow}>
              <Text style={styles.propCheck}>✓</Text>
              <Text style={styles.propText}>
                <Text style={styles.propBold}>All 13 Ephesians 6 Ranks</Text> & milestone achievements
              </Text>
            </View>
          </View>

          {/* Pricing Options */}
          <View style={styles.planSelector}>
            {/* Annual */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedPlan('annual')}>
              <RecoveryCard
                variant={selectedPlan === 'annual' ? 'gold' : 'default'}
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && { borderColor: theme.gold, borderWidth: 2 },
                ]}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planTitle}>Annual Armor Pass</Text>
                    <Text style={styles.planSub}>7-Day Free Trial included</Text>
                  </View>
                  <Badge label="SAVE 58%" variant="gold" />
                </View>
                <View style={styles.planPricingRow}>
                  <Text style={[styles.planPriceLarge, { color: theme.gold }]}>$3.33</Text>
                  <Text style={styles.planPerMonth}>/ month ($39.99/year)</Text>
                </View>
              </RecoveryCard>
            </TouchableOpacity>

            {/* Monthly */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedPlan('monthly')}>
              <RecoveryCard
                variant={selectedPlan === 'monthly' ? 'gold' : 'default'}
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && { borderColor: theme.gold, borderWidth: 2 },
                ]}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planTitle}>Monthly Pass</Text>
                    <Text style={styles.planSub}>Cancel anytime</Text>
                  </View>
                  <Text style={styles.planPriceMonthly}>$7.99 / mo</Text>
                </View>
              </RecoveryCard>
            </TouchableOpacity>
          </View>

          <Text style={styles.trialDisclaimer}>
            Cancel anytime in iOS App Store Settings. No questions asked.
          </Text>
        </ScrollView>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleContinue}
          style={[styles.startTrialBtn, { backgroundColor: theme.gold }]}>
          <Text style={styles.startTrialBtnText}>
            {selectedPlan === 'annual' ? 'Start 7-Day Free Trial →' : 'Continue with Monthly →'}
          </Text>
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
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: '600',
    padding: 6,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.three,
  },
  heroBox: {
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  shieldIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginBottom: Spacing.two,
  },
  shieldIcon: {
    fontSize: 32,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Spacing.three,
    lineHeight: 18,
  },
  valuePropsList: {
    marginVertical: Spacing.two,
    gap: 10,
    paddingHorizontal: 4,
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propCheck: {
    color: '#10B981',
    fontWeight: '900',
    fontSize: 16,
    marginRight: 10,
    lineHeight: 20,
  },
  propText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  propBold: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  planSelector: {
    marginVertical: Spacing.two,
    gap: 8,
  },
  planCard: {
    padding: Spacing.three,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  planSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  planPricingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  planPriceLarge: {
    fontSize: 24,
    fontWeight: '900',
  },
  planPerMonth: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 6,
  },
  planPriceMonthly: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  trialDisclaimer: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  startTrialBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  startTrialBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '800',
  },
});

