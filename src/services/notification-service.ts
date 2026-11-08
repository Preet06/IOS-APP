import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure default notification handler so alerts show popup banner and play sound even when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export class NotificationService {
  /**
   * Request push/local notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * 1. Early Morning Watch Reminder (Dawn Scripture)
   * Scheduled in the user's local device timezone (default 7:00 AM)
   */
  static async scheduleEarlyMorningReminder(hour = 7, minute = 0): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    await this.cancelEarlyMorningReminder();

    return Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Morning Watch',
        body: 'Stand firm in the light, brother. Put on your armor and begin today’s Scripture reading.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type: 'early_morning' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  /**
   * 2. Evening Watch Reminder (Fires only if user has not checked in today)
   * Scheduled in the user's local device timezone (default 8:00 PM / 20:00)
   */
  static async scheduleEveningCheckIn(hour = 20, minute = 0): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    await this.cancelEveningCheckIn();

    return Notifications.scheduleNotificationAsync({
      content: {
        title: '🛡️ Evening Watch',
        body: 'You haven’t checked in for today’s Scripture yet. Guard your peace before the night hours.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type: 'evening_check_in' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  /**
   * Send an immediate test notification (2-second delay) so user can verify banner & sound
   */
  static async sendTestNotification(): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    return Notifications.scheduleNotificationAsync({
      content: {
        title: '⚔️ The Knight’s Path',
        body: 'Notifications active! "Put on the full armor of God." (Ephesians 6:11)',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type: 'test' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  }

  /**
   * Cancel Early Morning reminder
   */
  static async cancelEarlyMorningReminder(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'early_morning' || notif.content.data?.type === 'check_in') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  }

  /**
   * Cancel Evening Check-in reminder (called when user completes reading)
   */
  static async cancelEveningCheckIn(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'evening_check_in') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  }

  /**
   * Cancel all notifications
   */
  static async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Check if notifications are currently enabled
   */
  static async isEnabled(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }
}
