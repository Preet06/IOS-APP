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
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';
import { NotificationService } from '@/services/notification-service';
import { BackupService } from '@/services/backup-service';

const REMINDER_ENABLED_KEY = 'vigil_single_reminder_enabled_v1';

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
    subscriptionStatus,
    restoreFromBackup,
    deleteAccountPermanently,
  } = useRecovery();

  // Sheets
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [newNameInput, setNewNameInput] = useState(userName || '');

  // Single Reminder Toggle
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // iCloud Backup
  const [iCloudEnabled, setICloudEnabled] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (Platform.OS === 'web') {
          const val = typeof localStorage !== 'undefined' ? localStorage.getItem(REMINDER_ENABLED_KEY) : null;
          if (val !== null) setRemindersEnabled(val === 'true');
        } else {
          const val = await SecureStore.getItemAsync(REMINDER_ENABLED_KEY);
          if (val !== null) setRemindersEnabled(val === 'true');
        }
      } catch {
        // Default true
      }
    };
    loadSettings();
    BackupService.isICloudBackupEnabled().then(setICloudEnabled).catch(() => {});
    BackupService.getLastBackupTime().then(setLastBackupTime).catch(() => {});
  }, []);

  const saveReminderSetting = async (val: boolean) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(REMINDER_ENABLED_KEY, String(val));
      } else {
        await SecureStore.setItemAsync(REMINDER_ENABLED_KEY, String(val));
      }
    } catch {
      // Ignore storage error
    }
  };

  const handleToggleReminder = async (val: boolean) => {
    setRemindersEnabled(val);
    await saveReminderSetting(val);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (val) {
      const morningId = await NotificationService.scheduleEarlyMorningReminder(7, 0);
      const eveningId = await NotificationService.scheduleEveningCheckIn(20, 0);
      if (!morningId && !eveningId) {
        Alert.alert('Permission Needed', 'Enable notifications in iPhone Settings.');
        setRemindersEnabled(false);
        await saveReminderSetting(false);
      }
    } else {
      await NotificationService.cancelEarlyMorningReminder();
      await NotificationService.cancelEveningCheckIn();
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

  const handleSaveName = async () => {
    if (newNameInput.trim()) {
      await updateUserName(newNameInput.trim());
      setIsEditNameOpen(false);
    }
  };

  const handleCancelSubAppStore = () => {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  const handleRateUs = () => {
    Alert.alert('Fellowship & Reviews', 'App Store review modal will appear here.');
  };

  const handleHelp = () => {
    Alert.alert('Fellowship & Help', 'Contact: support@vigilrecovery.app');
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

  const formattedStartDate = currentStart
    ? currentStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    : '20 October';

  const formattedRenewalDate = currentStart
    ? currentStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '20 Oct';

  const displayName = userName || 'John';

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Identity Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarRing}>
              <Image
                source={require('@/../assets/images/rank-dummy-icon.jpg')}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.knightTitle}>
                {activeRank.title} {displayName}
              </Text>
              <Text style={styles.joinedSub}>
                On the path since {formattedStartDate}
              </Text>
            </View>
          </View>

          {/* ══════════ SECTION: ACCOUNT ══════════ */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Account</Text>
            <View style={styles.hairlineGroup}>
              {/* Name */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => {
                  setNewNameInput(userName || '');
                  setIsEditNameOpen(true);
                }}
                style={styles.hairlineRow}
              >
                <SymbolView
                  name={{ ios: 'person', android: 'person', web: 'person' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>Name</Text>
                <Text style={styles.rowValue}>{displayName}</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={13}
                  tintColor="#8798CC"
                  weight="semibold"
                />
              </TouchableOpacity>

              {/* Subscription */}
              <TouchableOpacity
                activeOpacity={subscriptionStatus === 'free' ? 0.65 : 1}
                onPress={() => {
                  if (subscriptionStatus === 'free') {
                    router.push('/(onboarding)/paywall');
                  }
                }}
                style={styles.hairlineRow}
              >
                <SymbolView
                  name={{ ios: 'creditcard', android: 'credit_card', web: 'credit_card' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>Subscription</Text>
                <Text style={styles.rowValue}>
                  {subscriptionStatus === 'trial'
                    ? 'Yearly · 7-day trial'
                    : subscriptionStatus === 'active'
                    ? `Yearly · renews ${formattedRenewalDate}`
                    : 'Free · Upgrade'}
                </Text>
                {subscriptionStatus === 'free' ? (
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={13}
                    tintColor="#8798CC"
                    weight="semibold"
                  />
                ) : (
                  <View style={styles.trailingSpacer} />
                )}
              </TouchableOpacity>

              {/* Cancel subscription */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleCancelSubAppStore}
                style={styles.hairlineRow}
              >
                <SymbolView
                  name={{ ios: 'minus.circle', android: 'remove_circle_outline', web: 'remove_circle_outline' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>Cancel subscription</Text>
                <Text style={styles.rowValue}>App Store</Text>
                <SymbolView
                  name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }}
                  size={13}
                  tintColor="#8798CC"
                  weight="semibold"
                />
              </TouchableOpacity>

              {/* Single Reminder Toggle (Cupertino SF Symbol + Native UISwitch) */}
              <View style={styles.hairlineRow}>
                <SymbolView
                  name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>Reminders</Text>
                <Switch
                  value={remindersEnabled}
                  onValueChange={handleToggleReminder}
                  trackColor={{ false: '#C2CEEC', true: '#0A1640' }}
                  ios_backgroundColor="#C2CEEC"
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* ══════════ SECTION: ICLOUD & BACKUP ══════════ */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>iCloud & Backup</Text>
            <View style={styles.hairlineGroup}>
              {/* iCloud Backup Toggle */}
              <View style={styles.hairlineRow}>
                <SymbolView
                  name={{ ios: 'icloud', android: 'cloud_queue', web: 'cloud_queue' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>iCloud Backup</Text>
                <Switch
                  value={iCloudEnabled}
                  onValueChange={handleToggleICloud}
                  trackColor={{ false: '#C2CEEC', true: '#0A1640' }}
                  ios_backgroundColor="#C2CEEC"
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Back Up Now */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => handleBackupNow(false)}
                disabled={isBackingUp || !iCloudEnabled}
                style={[styles.hairlineRow, !iCloudEnabled && { opacity: 0.45 }]}
              >
                <SymbolView
                  name={{ ios: 'icloud.and.arrow.up', android: 'cloud_upload', web: 'cloud_upload' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>
                  {isBackingUp ? 'Backing Up...' : 'Back Up Now'}
                </Text>
                <Text style={styles.rowValue}>
                  {BackupService.formatBackupDisplayDate(lastBackupTime)}
                </Text>
                {isBackingUp ? (
                  <ActivityIndicator size="small" color="#34489A" />
                ) : (
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={13}
                    tintColor="#8798CC"
                    weight="semibold"
                  />
                )}
              </TouchableOpacity>

              {/* Restore from iCloud */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleRestoreFromICloud}
                disabled={isRestoring || !iCloudEnabled}
                style={[styles.hairlineRow, !iCloudEnabled && { opacity: 0.45 }]}
              >
                <SymbolView
                  name={{ ios: 'icloud.and.arrow.down', android: 'cloud_download', web: 'cloud_download' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>
                  {isRestoring ? 'Restoring...' : 'Restore from iCloud'}
                </Text>
                {isRestoring ? (
                  <ActivityIndicator size="small" color="#34489A" />
                ) : (
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={13}
                    tintColor="#8798CC"
                    weight="semibold"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════ SECTION: SUPPORT ══════════ */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Support</Text>
            <View style={styles.hairlineGroup}>
              {/* Rate us */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleRateUs}
                style={styles.hairlineRow}
              >
                <SymbolView
                  name={{ ios: 'star', android: 'star_border', web: 'star_border' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>Rate us</Text>
                <SymbolView
                  name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }}
                  size={13}
                  tintColor="#8798CC"
                  weight="semibold"
                />
              </TouchableOpacity>

              {/* Help */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleHelp}
                style={styles.hairlineRow}
              >
                <SymbolView
                  name={{ ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>Help</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={13}
                  tintColor="#8798CC"
                  weight="semibold"
                />
              </TouchableOpacity>

              {/* About us */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleAboutUs}
                style={styles.hairlineRow}
              >
                <SymbolView
                  name={{ ios: 'info.circle', android: 'info_outline', web: 'info_outline' }}
                  size={20}
                  tintColor="#34489A"
                  weight="regular"
                />
                <Text style={styles.rowLabel}>About us</Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={13}
                  tintColor="#8798CC"
                  weight="semibold"
                />
              </TouchableOpacity>
            </View>

            {/* Delete account & Version Footer */}
            <TouchableOpacity
              activeOpacity={0.7}
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
        <Modal
          visible={isEditNameOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditNameOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoid}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss();
                setIsEditNameOpen(false);
              }}
              style={styles.sheetScrim}
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Your name</Text>
              <Text style={styles.sheetSub}>
                It's how we address you: "{activeRank.title} {newNameInput || displayName}".
              </Text>

              <TextInput
                value={newNameInput}
                onChangeText={setNewNameInput}
                placeholder="First name"
                placeholderTextColor={color.inkTertiary}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
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
          </KeyboardAvoidingView>
        </Modal>

        {/* ══════════ SHEET: DELETE ACCOUNT ══════════ */}
        <Modal
          visible={isDeleteSheetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDeleteSheetOpen(false)}
        >
          <View style={styles.modalKeyboardAvoid}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsDeleteSheetOpen(false)}
              style={styles.sheetScrim}
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Delete your account?</Text>
              <Text style={styles.deleteSheetLead}>
                This permanently deletes your account and everything in it. It can't be undone.
              </Text>

              <View style={styles.deleteHairlineList}>
                <View style={styles.deleteHairlineItem}>
                  <Text style={styles.deleteHairlineText}>Clean time, ranks and Scripture streak</Text>
                </View>
                <View style={styles.deleteHairlineItem}>
                  <Text style={styles.deleteHairlineText}>Your reasons, relapse log and Companion chats</Text>
                </View>
                <View style={styles.deleteHairlineItem}>
                  <Text style={styles.deleteHairlineText}>Your name and profile data</Text>
                </View>
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
        </Modal>
      </SafeAreaView>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    paddingTop: 10,
    paddingBottom: 14,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
    paddingBottom: 28,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 3,
    borderWidth: 1,
    borderColor: '#8798CC',
    backgroundColor: '#F4F7FD',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    resizeMode: 'cover',
  },
  headerTextCol: {
    flex: 1,
    gap: 3,
  },
  knightTitle: {
    fontSize: 22,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: -0.44,
    color: '#0A1640',
  },
  joinedSub: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#5566A0',
  },
  sectionBlock: {
    marginBottom: 26,
  },
  sectionLabel: {
    paddingBottom: 8,
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#5566A0',
  },
  hairlineGroup: {
    borderTopWidth: 1,
    borderTopColor: '#D3DCF2',
  },
  hairlineRow: {
    width: '100%',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#D3DCF2',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Geist',
    color: '#0A1640',
  },
  rowValue: {
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#5566A0',
  },
  trailingSpacer: {
    width: 14,
  },
  deleteLinkButton: {
    alignSelf: 'center',
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  deleteLinkText: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#B4413A',
  },
  versionFooter: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#8798CC',
  },
  modalKeyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,22,64,0.35)',
  },
  sheetContent: {
    backgroundColor: '#F4F7FD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C2CEEC',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#0A1640',
  },
  sheetSub: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Geist',
    lineHeight: 20,
    color: '#5566A0',
  },
  sheetInput: {
    marginTop: 18,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A3B3DE',
    backgroundColor: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Geist',
    color: '#0A1640',
  },
  sheetSaveButton: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0A1640',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveText: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#F4F7FD',
  },
  deleteSheetLead: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: '#34489A',
  },
  deleteHairlineList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#D3DCF2',
  },
  deleteHairlineItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D3DCF2',
  },
  deleteHairlineText: {
    fontSize: 15,
    fontFamily: 'Geist',
    color: '#0A1640',
  },
  deleteAppStoreNote: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Geist',
    lineHeight: 19,
    color: '#5566A0',
  },
  deleteAccountDangerButton: {
    marginTop: 18,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#B4413A',
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
    fontFamily: 'Geist',
    color: '#34489A',
  },
});
