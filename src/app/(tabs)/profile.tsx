import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';
import { NotificationService } from '@/services/notification-service';
import { BackupService } from '@/services/backup-service';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    userName,
    updateUserName,
    activeRank,
    cleanDays,
    currentStart,
    goalDays,
    scriptureStreak,
    reasons,
    unlockedRankIds,
    panicCount,
    restoreFromBackup,
    deleteAccountPermanently,
  } = useRecovery();

  // Sheets
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [newNameInput, setNewNameInput] = useState(userName || '');

  // Notifications
  const [morningEnabled, setMorningEnabled] = useState(true);
  const [eveningEnabled, setEveningEnabled] = useState(true);

  // iCloud Backup
  const [iCloudEnabled, setICloudEnabled] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    BackupService.isICloudBackupEnabled().then(setICloudEnabled).catch(() => {});
    BackupService.getLastBackupTime().then(setLastBackupTime).catch(() => {});
  }, []);

  const handleSaveName = async () => {
    if (newNameInput.trim()) {
      await updateUserName(newNameInput.trim());
      setIsEditNameOpen(false);
    }
  };

  const handleToggleMorning = async (val: boolean) => {
    setMorningEnabled(val);
    if (val) {
      const id = await NotificationService.scheduleEarlyMorningReminder(7, 0);
      if (!id) {
        Alert.alert('Permission Needed', 'Enable notifications in iPhone Settings.');
        setMorningEnabled(false);
      }
    } else {
      await NotificationService.cancelEarlyMorningReminder();
    }
  };

  const handleToggleEvening = async (val: boolean) => {
    setEveningEnabled(val);
    if (val) {
      const id = await NotificationService.scheduleEveningCheckIn(20, 0);
      if (!id) {
        Alert.alert('Permission Needed', 'Enable notifications in iPhone Settings.');
        setEveningEnabled(false);
      }
    } else {
      await NotificationService.cancelEveningCheckIn();
    }
  };

  const handleTestAlert = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const id = await NotificationService.sendTestNotification();
    if (id) {
      Alert.alert(
        'Vigilance Alert Scheduled',
        'Notification will trigger in 2 seconds.\n\n• If app is open: a drop-down banner popup will slide down from the top.\n• Sound: Ensure your iPhone physical Mute/Silent switch is OFF and volume is up.'
      );
    } else {
      Alert.alert(
        'Permission Needed',
        'Please allow notifications in iPhone Settings > Expo Go > Notifications.'
      );
    }
  };

  const handleToggleICloud = async (val: boolean) => {
    setICloudEnabled(val);
    await BackupService.setICloudBackupEnabled(val);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val && !lastBackupTime) {
      handleBackupNow(true);
    }
  };

  const handleBackupNow = async (silent = false) => {
    try {
      setIsBackingUp(true);
      if (!silent) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const res = await BackupService.performBackup({
        cleanDays,
        currentStart: currentStart ? currentStart.toISOString() : new Date().toISOString(),
        goalDays,
        scriptureStreak,
        userName,
        reasons,
        unlockedRankIds,
        panicCount,
      });
      setLastBackupTime(res.timestamp);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!silent) {
        Alert.alert(
          'iCloud Backup Complete',
          `Your clean time (${cleanDays} days), ${unlockedRankIds.length} armor ranks, and streak are safely secured in your personal iCloud.`
        );
      }
    } catch {
      Alert.alert('Backup Error', 'Could not complete iCloud backup. Please check your connection.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromICloud = async () => {
    try {
      setIsRestoring(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const backup = await BackupService.restoreBackup();
      if (!backup) {
        Alert.alert(
          'No Backup Found',
          'There is no previous iCloud backup found for Vigil on this device.'
        );
        return;
      }

      Alert.alert(
        'Restore from iCloud?',
        `Found backup from ${BackupService.formatBackupDisplayDate(backup.timestamp)}:\n\n• Clean Days: ${backup.cleanDays}\n• Ranks Unlocked: ${backup.unlockedRankIds?.length ?? 1}\n• Streak: ${backup.scriptureStreak} days\n\nWould you like to restore your progress?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'default',
            onPress: async () => {
              await restoreFromBackup(backup);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Restored Successfully', 'Your Vigil data has been restored from your iCloud backup.');
            },
          },
        ]
      );
    } catch {
      Alert.alert('Restore Error', 'Could not restore backup from iCloud.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancelSubAppStore = () => {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  const handleRateUs = () => {
    Alert.alert('Fellowship & Reviews', 'App Store review modal will appear here.');
  };

  const handleAboutUs = () => {
    Alert.alert(
      'About Vigil',
      'Vigil 0.1\n\nMade for men who keep watch. A sacred, dignified companion for walking in purity and overcoming addiction through Christ.'
    );
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountPermanently();
      setIsDeleteSheetOpen(false);
      router.replace('/(onboarding)/intro');
    } catch {
      Alert.alert('Error', 'Could not delete account. Please try again.');
    }
  };

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card (Avatar + Knight Title) */}
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarBorder}>
              <Image
                source={require('@/../assets/images/rank-dummy-icon.jpg')}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.knightDisplayTitle}>
                {activeRank.title} {userName || 'Brother'}
              </Text>
              <Text style={styles.joinedDateSub}>
                On the path for {cleanDays} {cleanDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>

          {/* ══════════ GROUP: ACCOUNT ══════════ */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeader}>Account</Text>
            <View style={styles.groupCard}>
              {/* Name Row */}
              <TouchableOpacity
                onPress={() => {
                  setNewNameInput(userName || '');
                  setIsEditNameOpen(true);
                }}
                style={styles.rowItem}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="8" r="4" />
                  <Path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                </Svg>
                <Text style={styles.rowLabel}>Name</Text>
                <Text style={styles.rowValue}>{userName || 'Not set'}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 6l6 6-6 6" />
                </Svg>
              </TouchableOpacity>

              {/* Subscription Row */}
              <View style={styles.rowItem}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x="3" y="6" width="18" height="13" rx="2" />
                  <Path d="M3 10h18" />
                </Svg>
                <Text style={styles.rowLabel}>Subscription</Text>
                <Text style={styles.rowValue}>Active · Yearly</Text>
              </View>

              {/* Cancel Subscription */}
              <TouchableOpacity
                onPress={handleCancelSubAppStore}
                style={[styles.rowItem, { borderBottomWidth: 0 }]}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="9" />
                  <Path d="M8 12h8" />
                </Svg>
                <Text style={styles.rowLabel}>Cancel subscription</Text>
                <Text style={styles.rowValue}>App Store</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M7 17L17 7M9 7h8v8" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════ GROUP: ICLOUD & BACKUP ══════════ */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeader}>iCloud & Backup</Text>
            <View style={styles.groupCard}>
              {/* iCloud Sync Toggle */}
              <View style={styles.rowItem}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </Svg>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>iCloud Backup</Text>
                  <Text style={styles.rowSub}>Auto-backup ranks & clean time</Text>
                </View>
                <Switch
                  value={iCloudEnabled}
                  onValueChange={handleToggleICloud}
                  trackColor={{ false: color.borderSoft, true: color.ink }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Back Up Now */}
              <TouchableOpacity
                onPress={() => handleBackupNow(false)}
                disabled={isBackingUp || !iCloudEnabled}
                style={[styles.rowItem, !iCloudEnabled && { opacity: 0.5 }]}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M16 16l-4-4-4 4M12 12v9" />
                  <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </Svg>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>
                    {isBackingUp ? 'Backing Up...' : 'Back Up Now'}
                  </Text>
                  <Text style={styles.rowSub}>
                    Last: {BackupService.formatBackupDisplayDate(lastBackupTime)}
                  </Text>
                </View>
                {isBackingUp ? (
                  <ActivityIndicator size="small" color="#34489A" />
                ) : (
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 6l6 6-6 6" />
                  </Svg>
                )}
              </TouchableOpacity>

              {/* Restore from iCloud */}
              <TouchableOpacity
                onPress={handleRestoreFromICloud}
                disabled={isRestoring || !iCloudEnabled}
                style={[
                  styles.rowItem,
                  { borderBottomWidth: 0 },
                  !iCloudEnabled && { opacity: 0.5 },
                ]}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M8 17l4 4 4-4M12 12v9" />
                  <Path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </Svg>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>
                    {isRestoring ? 'Restoring...' : 'Restore from iCloud'}
                  </Text>
                  <Text style={styles.rowSub}>Recover your progress</Text>
                </View>
                {isRestoring ? (
                  <ActivityIndicator size="small" color="#34489A" />
                ) : (
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 6l6 6-6 6" />
                  </Svg>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════ GROUP: VIGILANCE REMINDERS ══════════ */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeader}>Vigilance Reminders</Text>
            <View style={styles.groupCard}>
              {/* 1. Early Morning Watch */}
              <View style={styles.rowItem}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="4" />
                  <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </Svg>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>Morning Watch</Text>
                  <Text style={styles.rowSub}>Early morning Scripture devotional</Text>
                </View>
                <Switch
                  value={morningEnabled}
                  onValueChange={handleToggleMorning}
                  trackColor={{ false: color.borderSoft, true: color.ink }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* 2. Evening Watch (Only if not checked in) */}
              <View style={styles.rowItem}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </Svg>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>Evening Watch</Text>
                  <Text style={styles.rowSub}>Fires only if not checked in today</Text>
                </View>
                <Switch
                  value={eveningEnabled}
                  onValueChange={handleToggleEvening}
                  trackColor={{ false: color.borderSoft, true: color.ink }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* 3. Test 2s Alert Now */}
              <TouchableOpacity
                onPress={handleTestAlert}
                style={[styles.rowItem, { borderBottomWidth: 0 }]}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </Svg>
                <View style={styles.rowTextCol}>
                  <Text style={styles.rowTitle}>Test 2s Alert Now</Text>
                  <Text style={styles.rowSub}>Triggers test notification in 2 seconds</Text>
                </View>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 6l6 6-6 6" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════ GROUP: SUPPORT ══════════ */}
          <View style={styles.groupSection}>
            <Text style={styles.groupHeader}>Support</Text>
            <View style={styles.groupCard}>
              <TouchableOpacity onPress={handleRateUs} style={styles.rowItem}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </Svg>
                <Text style={styles.rowLabel}>Rate us</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M7 17L17 7M9 7h8v8" />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert('Fellowship & Help', 'Contact: support@vigilrecovery.app')}
                style={styles.rowItem}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="9" />
                  <Path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.2h.01" />
                </Svg>
                <Text style={styles.rowLabel}>Help</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 6l6 6-6 6" />
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAboutUs}
                style={[styles.rowItem, { borderBottomWidth: 0 }]}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#34489A" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx="12" cy="12" r="9" />
                  <Path d="M12 11v6M12 7.5h.01" />
                </Svg>
                <Text style={styles.rowLabel}>About us</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 6l6 6-6 6" />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Apple Guideline 5.1.1(v) Delete Account (Red #B4413A) */}
            <TouchableOpacity
              onPress={() => setIsDeleteSheetOpen(true)}
              style={styles.deleteLinkButton}
            >
              <Text style={styles.deleteLinkText}>Delete account</Text>
            </TouchableOpacity>

            <Text style={styles.versionFooter}>
              Vigil 0.1 · Made for men who keep watch
            </Text>
          </View>
        </ScrollView>

        {/* ══════════ SHEET: EDIT NAME ══════════ */}
        {isEditNameOpen && (
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsEditNameOpen(false)}
              style={styles.sheetScrim}
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Your name</Text>
              <Text style={styles.sheetSub}>
                It's how we address you: "{activeRank.title} {newNameInput || 'Brother'}".
              </Text>

              <TextInput
                value={newNameInput}
                onChangeText={setNewNameInput}
                placeholder="First name"
                placeholderTextColor={color.inkTertiary}
                style={styles.sheetInput}
              />

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSaveName}
                style={styles.sheetSaveButton}
              >
                <Text style={styles.sheetSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════ SHEET: DELETE ACCOUNT ══════════ */}
        {isDeleteSheetOpen && (
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsDeleteSheetOpen(false)}
              style={styles.sheetScrim}
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Delete your account?</Text>
              <Text style={styles.sheetSub}>
                This permanently deletes your account and everything in it. It can't be undone.
              </Text>

              <View style={styles.deleteInfoBox}>
                <Text style={styles.deleteInfoRow}>• Clean time, ranks and Scripture streak</Text>
                <Text style={styles.deleteInfoRow}>• Your reasons, relapse log and Companion chats</Text>
                <Text style={styles.deleteInfoRow}>• Your name and email</Text>
              </View>

              <Text style={styles.deleteAppStoreNote}>
                Deleting your account does not cancel your subscription. Cancel it first in the App Store.
              </Text>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleDeleteAccount}
                style={styles.deleteAccountDangerButton}
              >
                <Text style={styles.deleteAccountDangerText}>Delete my account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsDeleteSheetOpen(false)}
                style={styles.keepAccountButton}
              >
                <Text style={styles.keepAccountText}>Keep my account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingTop: 8,
    paddingBottom: 10,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
    borderWidth: 1,
    borderColor: color.inkMuted,
    backgroundColor: '#F4F7FD',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    resizeMode: 'cover',
  },
  headerInfo: {
    gap: 3,
  },
  knightDisplayTitle: {
    fontSize: 22,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: -0.44,
    color: color.ink,
  },
  joinedDateSub: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  groupSection: {
    gap: 8,
  },
  groupHeader: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: color.inkTertiary,
  },
  groupCard: {
    backgroundColor: color.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: color.hairline,
    overflow: 'hidden',
  },
  rowItem: {
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: color.ink,
    lineHeight: 21,
  },
  rowSub: {
    fontSize: 12.5,
    fontFamily: 'Geist',
    color: color.inkTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: 'Geist',
    color: color.ink,
    flex: 1,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  deleteLinkButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  deleteLinkText: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.danger,
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkMuted,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 60,
    justifyContent: 'flex-end',
  },
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,22,64,0.4)',
  },
  sheetContent: {
    backgroundColor: '#F4F7FD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: color.borderSoft,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: color.ink,
  },
  sheetSub: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Geist',
    lineHeight: 20,
    color: color.inkTertiary,
  },
  sheetInput: {
    marginTop: 18,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Geist',
    color: color.ink,
  },
  sheetSaveButton: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.onInk,
  },
  deleteInfoBox: {
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: color.hairline,
    gap: 8,
  },
  deleteInfoRow: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.ink,
  },
  deleteAppStoreNote: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Geist',
    lineHeight: 18,
    color: color.inkTertiary,
  },
  deleteAccountDangerButton: {
    marginTop: 18,
    height: 56,
    borderRadius: 16,
    backgroundColor: color.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountDangerText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  keepAccountButton: {
    marginTop: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepAccountText: {
    fontSize: 15,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
});
