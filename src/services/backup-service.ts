import * as SecureStore from 'expo-secure-store';

export interface VigilBackupData {
  version: number;
  timestamp: string; // ISO string
  cleanDays: number;
  currentStart: string; // ISO string
  goalDays: number;
  scriptureStreak: number;
  userName: string;
  reasons: string[];
  unlockedRankIds: string[];
  panicCount: number;
}

const STORAGE_KEY_ICLOUD_ENABLED = 'vigil_icloud_backup_enabled';
const STORAGE_KEY_BACKUP_PAYLOAD = 'vigil_icloud_backup_payload';
const STORAGE_KEY_LAST_BACKUP_TIME = 'vigil_icloud_last_backup_time';

// In-memory fallback if SecureStore is unavailable
let memICloudEnabled = true;
let memLastBackupTime: string | null = null;
let memBackupPayload: string | null = null;

export class BackupService {
  /**
   * Check if iCloud Backup is enabled
   */
  static async isICloudBackupEnabled(): Promise<boolean> {
    try {
      const isAvail = await SecureStore.isAvailableAsync();
      if (!isAvail) return memICloudEnabled;

      const val = await SecureStore.getItemAsync(STORAGE_KEY_ICLOUD_ENABLED);
      if (val === null) return true; // Default to ON for seamless iOS experience
      return val === 'true';
    } catch {
      return memICloudEnabled;
    }
  }

  /**
   * Set iCloud Backup toggle
   */
  static async setICloudBackupEnabled(enabled: boolean): Promise<void> {
    memICloudEnabled = enabled;
    try {
      const isAvail = await SecureStore.isAvailableAsync();
      if (isAvail) {
        await SecureStore.setItemAsync(
          STORAGE_KEY_ICLOUD_ENABLED,
          enabled ? 'true' : 'false'
        );
      }
    } catch (e) {
      console.warn('Could not persist iCloud backup preference:', e);
    }
  }

  /**
   * Get timestamp of last successful backup
   */
  static async getLastBackupTime(): Promise<string | null> {
    try {
      const isAvail = await SecureStore.isAvailableAsync();
      if (!isAvail) return memLastBackupTime;

      return await SecureStore.getItemAsync(STORAGE_KEY_LAST_BACKUP_TIME);
    } catch {
      return memLastBackupTime;
    }
  }

  /**
   * Perform backup to iCloud storage
   */
  static async performBackup(
    data: Omit<VigilBackupData, 'version' | 'timestamp'>
  ): Promise<{ success: boolean; timestamp: string }> {
    const timestamp = new Date().toISOString();
    const payload: VigilBackupData = {
      ...data,
      version: 1,
      timestamp,
    };

    const serialized = JSON.stringify(payload);
    memBackupPayload = serialized;
    memLastBackupTime = timestamp;

    try {
      const isAvail = await SecureStore.isAvailableAsync();
      if (isAvail) {
        await SecureStore.setItemAsync(STORAGE_KEY_BACKUP_PAYLOAD, serialized);
        await SecureStore.setItemAsync(STORAGE_KEY_LAST_BACKUP_TIME, timestamp);
      }
    } catch (e) {
      console.warn('Failed writing backup snapshot:', e);
    }

    return { success: true, timestamp };
  }

  /**
   * Restore backup from iCloud storage
   */
  static async restoreBackup(): Promise<VigilBackupData | null> {
    try {
      let raw: string | null = null;
      const isAvail = await SecureStore.isAvailableAsync();
      if (isAvail) {
        raw = await SecureStore.getItemAsync(STORAGE_KEY_BACKUP_PAYLOAD);
      }

      if (!raw) {
        raw = memBackupPayload;
      }

      if (!raw) return null;
      const parsed = JSON.parse(raw) as VigilBackupData;
      return parsed;
    } catch (e) {
      console.warn('Failed restoring backup:', e);
      return null;
    }
  }

  /**
   * Helper to format backup timestamp for display
   */
  static formatBackupDisplayDate(isoString: string | null): string {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const timeStr = date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });

      if (isToday) {
        return `Today at ${timeStr}`;
      }

      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    } catch {
      return 'Recently';
    }
  }
}
