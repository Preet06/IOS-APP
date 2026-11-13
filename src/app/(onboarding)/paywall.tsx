import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { useRecovery } from '@/context/recovery-context';
import {
  SubscriptionService,
  PlanDetails,
} from '@/services/subscription-service';

const STAR_DOTS = [
  { x: '12%', y: '8%', r: 1.2, o: 0.45 },
  { x: '28%', y: '14%', r: 1.5, o: 0.6 },
  { x: '76%', y: '11%', r: 1.2, o: 0.5 },
  { x: '88%', y: '19%', r: 1.6, o: 0.4 },
  { x: '18%', y: '27%', r: 1.1, o: 0.35 },
  { x: '64%', y: '24%', r: 1.4, o: 0.55 },
  { x: '84%', y: '36%', r: 1.2, o: 0.45 },
  { x: '9%', y: '44%', r: 1.5, o: 0.3 },
  { x: '73%', y: '53%', r: 1.3, o: 0.35 },
  { x: '22%', y: '66%', r: 1.2, o: 0.3 },
];

const PAYWALL_BENEFITS = [
  'Daily Scripture and prayer',
  'Help the moment temptation hits',
  'Your path from Page to Knight',
  'Private. No account needed.',
];

export default function PaywallScreen() {
  const router = useRouter();
  const {
    userName,
    purchaseSubscription,
    restoreSubscription,
    setSubscriptionStatusState,
  } = useRecovery();
  const displayName =
    userName && userName !== 'Brother in Christ' ? userName : 'John';

  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [plans, setPlans] = useState<{ yearly: PlanDetails; monthly: PlanDetails }>({
    yearly: {
      id: 'yearly',
      title: 'Yearly',
      subtitle: '7 days free',
      priceString: '$49.99',
      subPriceString: 'per year · $0.96/wk',
      badge: 'SAVE 58%',
    },
    monthly: {
      id: 'monthly',
      title: 'Monthly',
      subtitle: 'No free trial',
      priceString: '$9.99',
      subPriceString: 'per month',
    },
  });

  useEffect(() => {
    SubscriptionService.getPlans().then(setPlans).catch(() => {});
  }, []);

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await purchaseSubscription(selectedPlan);

      if (res.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)/home');
      } else if (res.error && res.error !== 'User cancelled') {
        Alert.alert('Subscription', res.error);
      }
    } catch (e: any) {
      Alert.alert('Subscription Error', e?.message || 'Unable to process purchase.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setSubscriptionStatusState('free');
    router.replace('/(tabs)/home');
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await restoreSubscription();

      if (res.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored', res.message, [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]);
      } else {
        Alert.alert('Restore Purchases', res.message);
      }
    } catch {
      Alert.alert('Restore Purchases', 'Could not restore purchases from App Store.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenTerms = async () => {
    await SubscriptionService.openTerms();
  };

  const handleOpenPrivacy = async () => {
    await SubscriptionService.openPrivacy();
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#081030', '#0D1B4E', '#132462', '#081030']}
        locations={[0, 0.42, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Starry Sky */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STAR_DOTS.map((star, idx) => (
          <View
            key={idx}
            style={{
              position: 'absolute',
              left: star.x as any,
              top: star.y as any,
              width: star.r * 2,
              height: star.r * 2,
              borderRadius: star.r,
              backgroundColor: '#E6ECFA',
              opacity: star.o,
            }}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Top-Right Close Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
            disabled={isPurchasing || isRestoring}
          >
            <Svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6F80B8"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Main Paywall Content */}
        <View style={styles.content}>
          {/* Hero Radiant Sword Illustration */}
          <View style={styles.swordHeroWrap}>
            <View style={styles.swordHeroAura} />
            <Svg width={120} height={168} viewBox="0 0 140 218">
              <Defs>
                <SvgLinearGradient id="pwBladeGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                  <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.95" />
                  <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="1" />
                  <Stop offset="85%" stopColor="#DCE6FF" stopOpacity="0.92" />
                  <Stop offset="100%" stopColor="#FFF8E6" stopOpacity="0.95" />
                </SvgLinearGradient>
              </Defs>

              {/* Soft Blade Glow */}
              <Ellipse
                cx="70"
                cy="118"
                rx="13"
                ry="80"
                fill="rgba(255, 248, 230, 0.22)"
              />

              {/* Pommel */}
              <Circle
                cx="70"
                cy="14"
                r="5.6"
                fill="#F6ECD2"
                stroke="#FFFFFF"
                strokeWidth={1.2}
              />

              {/* Grip */}
              <Path
                d="M67.8 20 L72.2 20 L72.5 46 L67.5 46 Z"
                fill="#FFF8E6"
                stroke="#DCE6FF"
                strokeWidth={1.1}
              />

              {/* Collar */}
              <Rect
                x="65.8"
                y="45.5"
                width="8.4"
                height="4"
                rx="1"
                fill="#DCE6FF"
              />

              {/* Curved Crossguard */}
              <Path
                d="M44 53.5 Q48 49.5 70 49.5 Q92 49.5 96 53.5"
                fill="none"
                stroke="#FFF8E6"
                strokeWidth={2.4}
                strokeLinecap="round"
              />

              {/* Radiant Downward Blade */}
              <Path
                d="M65.8 52 L74.2 52 L73.2 184 L70 208 L66.8 184 Z"
                fill="url(#pwBladeGrad)"
                stroke="#FFFFFF"
                strokeWidth={1.3}
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>
            Your vigil starts now,{'\n'}
            {displayName}
          </Text>

          {/* 4 Checkmark Benefit Rows */}
          <View style={styles.benefitsList}>
            {PAYWALL_BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F6ECD2"
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <Path d="M5 12.5l4.5 4.5L19 7.5" />
                </Svg>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Plan Selector Cards */}
          <View style={styles.plansWrap}>
            {/* Yearly Card */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedPlan('yearly');
              }}
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
            >
              {/* Floating SAVE 58% Badge */}
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{plans.yearly.badge || 'SAVE 58%'}</Text>
              </View>

              <View style={styles.planLeftRow}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPlan === 'yearly' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
                </View>
                <View>
                  <Text style={styles.planTitle}>{plans.yearly.title}</Text>
                  <Text style={styles.planSub}>{plans.yearly.subtitle}</Text>
                </View>
              </View>

              <View style={styles.planRightCol}>
                <Text style={styles.planPrice}>{plans.yearly.priceString}</Text>
                <Text style={styles.planSubPrice}>{plans.yearly.subPriceString}</Text>
              </View>
            </TouchableOpacity>

            {/* Monthly Card */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedPlan('monthly');
              }}
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
            >
              <View style={styles.planLeftRow}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedPlan === 'monthly' && styles.radioOuterSelected,
                  ]}
                >
                  {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                </View>
                <View>
                  <Text style={styles.planTitle}>{plans.monthly.title}</Text>
                  <Text style={styles.planSub}>{plans.monthly.subtitle}</Text>
                </View>
              </View>

              <View style={styles.planRightCol}>
                <Text style={styles.planPrice}>{plans.monthly.priceString}</Text>
                <Text style={styles.planSubPrice}>{plans.monthly.subPriceString}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom CTA & Links */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring}
            style={[styles.creamButton, isPurchasing && { opacity: 0.85 }]}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#0A1640" />
            ) : (
              <Text style={styles.creamButtonText}>
                {selectedPlan === 'yearly'
                  ? 'Start my 7 free days'
                  : 'Start my vigil'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.billingNote}>
            {selectedPlan === 'yearly'
              ? `Free for 7 days, then ${plans.yearly.priceString} a year. Cancel anytime in Settings.`
              : `${plans.monthly.priceString} a month. Cancel anytime in Settings.`}
          </Text>

          <View style={styles.legalLinksRow}>
            <TouchableOpacity
              onPress={handleRestore}
              disabled={isPurchasing || isRestoring}
            >
              <Text style={styles.legalLinkText}>
                {isRestoring ? 'Restoring...' : 'Restore purchase'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={handleOpenTerms}>
              <Text style={styles.legalLinkText}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={handleOpenPrivacy}>
              <Text style={styles.legalLinkText}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#081030',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
  },
  topBar: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  swordHeroWrap: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swordHeroAura: {
    position: 'absolute',
    width: 110,
    height: 140,
    borderRadius: 55,
    backgroundColor: 'rgba(220, 230, 255, 0.16)',
  },
  headline: {
    marginTop: 8,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 31,
    lineHeight: 39,
    color: '#E6ECFA',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  benefitsList: {
    marginTop: 20,
    alignSelf: 'stretch',
    paddingHorizontal: 14,
    gap: 11,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14.5,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#E6ECFA',
  },
  plansWrap: {
    marginTop: 24,
    alignSelf: 'stretch',
    gap: 12,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(143, 160, 208, 0.28)',
    backgroundColor: 'rgba(16, 30, 82, 0.45)',
    paddingHorizontal: 18,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardSelected: {
    borderColor: '#F6ECD2',
    borderWidth: 1.5,
    backgroundColor: 'rgba(24, 44, 108, 0.65)',
  },
  saveBadge: {
    position: 'absolute',
    top: -11,
    right: 16,
    backgroundColor: '#F6ECD2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  saveBadgeText: {
    fontSize: 10,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#0A1640',
  },
  planLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(143, 160, 208, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#F6ECD2',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F6ECD2',
  },
  planTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#E6ECFA',
  },
  planSub: {
    marginTop: 2,
    fontSize: 12.5,
    fontFamily: 'Geist',
    color: '#8FA0D0',
  },
  planRightCol: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 17,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#E6ECFA',
  },
  planSubPrice: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#8FA0D0',
  },
  footer: {
    gap: 10,
  },
  creamButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFE2BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creamButtonText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  billingNote: {
    fontSize: 11.5,
    fontFamily: 'Geist',
    color: '#8FA0D0',
    textAlign: 'center',
  },
  legalLinksRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  legalLinkText: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#8FA0D0',
  },
  legalDot: {
    fontSize: 12,
    color: '#5E74B6',
  },
});
