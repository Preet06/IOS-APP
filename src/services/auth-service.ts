import { supabase } from '@/lib/supabase';

export interface OnboardingPayload {
  goalDays: number;
  reasons: string[];
}

export class AuthService {
  /**
   * Anonymous / Guest sign-in (creates an authenticated Supabase user)
   * Instant access without email or passwords.
   */
  static async signInAsGuest(onboarding?: OnboardingPayload) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw error;
    }

    if (data.user?.id && onboarding) {
      await this.syncOnboarding(data.user.id, onboarding);
    }

    return data;
  }

  /**
   * Syncs onboarding goal days and reasons into Supabase tables
   */
  static async syncOnboarding(userId: string, onboarding: OnboardingPayload) {
    try {
      // 1. Update Journey with goal days
      await supabase
        .from('journeys')
        .upsert(
          {
            user_id: userId,
            goal_days: onboarding.goalDays,
            current_start: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      // 2. Insert User Reasons
      if (onboarding.reasons && onboarding.reasons.length > 0) {
        const rows = onboarding.reasons.map((reason, index) => ({
          user_id: userId,
          text: reason,
          display_order: index,
        }));

        await supabase.from('reasons').insert(rows);
      }
    } catch (err) {
      console.warn('Failed to sync onboarding data to Supabase:', err);
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    return supabase.auth.signOut();
  }

  /**
   * Get current session
   */
  static async getSession() {
    return supabase.auth.getSession();
  }
}
