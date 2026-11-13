import { Platform, NativeModules, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { supabase } from '@/lib/supabase';

// App Store Connect Product IDs
export const PRODUCT_IDS = {
  YEARLY: 'vigil_yearly_4999',
  MONTHLY: 'vigil_monthly_999',
} as const;

export const ENTITLEMENT_ID = 'vigil_pro';
export const MOCK_SUBSCRIPTION_KEY = 'vigil_mock_subscription_status_v1';

export const LEGAL_URLS = {
  TERMS: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  PRIVACY: 'https://vigilrecovery.app/privacy',
  MANAGE_SUBSCRIPTIONS: 'https://apps.apple.com/account/subscriptions',
} as const;

export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired' | 'canceled';

export interface PlanDetails {
  id: 'yearly' | 'monthly';
  title: string;
  subtitle: string;
  priceString: string;
  subPriceString: string;
  badge?: string;
  rcPackage?: PurchasesPackage;
}

let isInitialized = false;

/**
 * Returns true only when running inside an EAS development build or standalone build
 * where the native RNPurchases StoreKit bridge is compiled into the binary.
 */
function isNativeStoreKitAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  // Expo Go (StoreClient) cannot run third-party native StoreKit code
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return false;
  if (!NativeModules?.RNPurchases) return false;
  return true;
}

export const SubscriptionService = {
  /**
   * Initializes RevenueCat with the configured Apple API key.
   * In Expo Go or mock mode, initializes the safe simulation bridge.
   */
  async initialize(appUserId?: string): Promise<void> {
    if (isInitialized) return;

    const apiKey =
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || ''
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || '';

    if (isNativeStoreKitAvailable() && apiKey) {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }
        await Purchases.configure({
          apiKey,
          appUserID: appUserId || undefined,
        });
        isInitialized = true;
        console.log('[SubscriptionService] RevenueCat native StoreKit initialized.');
        return;
      } catch (err) {
        console.warn('[SubscriptionService] Failed to initialize RevenueCat native SDK:', err);
      }
    }

    // Fallback simulated StoreKit mode for Expo Go
    isInitialized = true;
    console.log('[SubscriptionService] Initialized in Simulated StoreKit mode (Expo Go / Dev).');
  },

  /**
   * Fetches current offerings from RevenueCat or returns the canonical Vigil plans.
   */
  async getPlans(): Promise<{ yearly: PlanDetails; monthly: PlanDetails }> {
    const defaultPlans: { yearly: PlanDetails; monthly: PlanDetails } = {
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
    };

    if (isNativeStoreKitAvailable()) {
      try {
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.current;

        if (currentOffering) {
          if (currentOffering.annual) {
            defaultPlans.yearly.priceString = currentOffering.annual.product.priceString;
            defaultPlans.yearly.rcPackage = currentOffering.annual;
          }
          if (currentOffering.monthly) {
            defaultPlans.monthly.priceString = currentOffering.monthly.product.priceString;
            defaultPlans.monthly.rcPackage = currentOffering.monthly;
          }
        }
      } catch (err) {
        console.warn('[SubscriptionService] Error fetching RevenueCat offerings:', err);
      }
    }

    return defaultPlans;
  },

  /**
   * Purchases the selected subscription plan.
   * Triggers Apple StoreKit sheet in dev build, or simulates purchase in Expo Go.
   */
  async purchasePlan(
    planType: 'yearly' | 'monthly',
    userId?: string
  ): Promise<{ success: boolean; isSubscribed: boolean; error?: string }> {
    await this.initialize(userId);

    const newStatus: SubscriptionStatus = planType === 'yearly' ? 'trial' : 'active';

    if (isNativeStoreKitAvailable()) {
      try {
        const offerings = await Purchases.getOfferings();
        const pkg =
          planType === 'yearly'
            ? offerings.current?.annual
            : offerings.current?.monthly;

        if (!pkg) {
          throw new Error('No package found in current RevenueCat offering for ' + planType);
        }

        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const hasAccess = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);

        if (hasAccess && userId) {
          await this.syncStatusToSupabase(userId, newStatus);
        }

        return { success: hasAccess, isSubscribed: hasAccess };
      } catch (err: any) {
        if (err.userCancelled) {
          return { success: false, isSubscribed: false, error: 'User cancelled' };
        }
        return { success: false, isSubscribed: false, error: err.message || 'Purchase failed' };
      }
    }

    // ── Simulated StoreKit Mode for Expo Go ──
    await new Promise((resolve) => setTimeout(resolve, 800)); // Haptic delay feel
    await this.setLocalMockStatus(newStatus);

    if (userId) {
      await this.syncStatusToSupabase(userId, newStatus);
    }

    return { success: true, isSubscribed: true };
  },

  /**
   * Restores existing purchases for the user.
   */
  async restorePurchases(
    userId?: string
  ): Promise<{ success: boolean; isSubscribed: boolean; message: string }> {
    await this.initialize(userId);

    if (isNativeStoreKitAvailable()) {
      try {
        const customerInfo: CustomerInfo = await Purchases.restorePurchases();
        const hasAccess = Boolean(customerInfo.entitlements.active[ENTITLEMENT_ID]);

        if (hasAccess) {
          if (userId) {
            await this.syncStatusToSupabase(userId, 'active');
          }
          return {
            success: true,
            isSubscribed: true,
            message: 'Your Vigil subscription has been restored.',
          };
        }

        return {
          success: false,
          isSubscribed: false,
          message: 'No active subscription was found on this Apple ID.',
        };
      } catch (err: any) {
        return {
          success: false,
          isSubscribed: false,
          message: err.message || 'Could not restore purchases from App Store.',
        };
      }
    }

    // Simulated Restore for Expo Go
    const saved = await this.getLocalMockStatus();
    if (saved === 'active' || saved === 'trial') {
      return {
        success: true,
        isSubscribed: true,
        message: 'Your Vigil subscription has been restored.',
      };
    }

    return {
      success: false,
      isSubscribed: false,
      message: 'No prior purchases found to restore.',
    };
  },

  /**
   * Syncs the latest subscription status directly to Supabase public.profiles table.
   */
  async syncStatusToSupabase(
    userId: string,
    status: SubscriptionStatus
  ): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ subscription_status: status })
        .eq('id', userId);
    } catch (e) {
      console.warn('[SubscriptionService] Could not sync subscription to Supabase:', e);
    }
  },

  /**
   * Reads the simulated subscription status stored in SecureStore.
   */
  async getLocalMockStatus(): Promise<SubscriptionStatus> {
    try {
      if (Platform.OS === 'web') {
        const val = typeof localStorage !== 'undefined' ? localStorage.getItem(MOCK_SUBSCRIPTION_KEY) : null;
        return (val as SubscriptionStatus) || 'free';
      }
      const val = await SecureStore.getItemAsync(MOCK_SUBSCRIPTION_KEY);
      return (val as SubscriptionStatus) || 'free';
    } catch {
      return 'free';
    }
  },

  /**
   * Saves the simulated subscription status into SecureStore.
   */
  async setLocalMockStatus(status: SubscriptionStatus): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(MOCK_SUBSCRIPTION_KEY, status);
        return;
      }
      await SecureStore.setItemAsync(MOCK_SUBSCRIPTION_KEY, status);
    } catch {
      // Ignore
    }
  },

  /**
   * Opens the Apple Standard EULA (Terms of Use).
   */
  async openTerms(): Promise<void> {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await WebBrowser.openBrowserAsync(LEGAL_URLS.TERMS);
      } else {
        await Linking.openURL(LEGAL_URLS.TERMS);
      }
    } catch {
      await Linking.openURL(LEGAL_URLS.TERMS);
    }
  },

  /**
   * Opens the Privacy Policy URL.
   */
  async openPrivacy(): Promise<void> {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await WebBrowser.openBrowserAsync(LEGAL_URLS.PRIVACY);
      } else {
        await Linking.openURL(LEGAL_URLS.PRIVACY);
      }
    } catch {
      await Linking.openURL(LEGAL_URLS.PRIVACY);
    }
  },
};

