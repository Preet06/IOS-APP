import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';

interface RankData {
  id: string;
  name: string;
  days: number;
  armor?: string;
  note: string;
  verse: string;
  ref: string;
}

const ALL_RANKS: RankData[] = [
  {
    id: 'page',
    name: 'Page',
    days: 1,
    note: 'The first station of noble training. Learning humility, obedience, and the disciplines of the watch.',
    verse: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.',
    ref: 'Matthew 5:3',
  },
  {
    id: 'squire',
    name: 'Squire',
    days: 7,
    armor: 'Belt of Truth',
    note: 'From the Old French escuier, shield-bearer. A squire served a knight, kept his armour and horse, and trained every day.',
    verse: 'Stand therefore, having your loins girt about with truth.',
    ref: 'Ephesians 6:14',
  },
  {
    id: 'knight',
    name: 'Knight',
    days: 30,
    armor: 'Breastplate of Righteousness',
    note: 'Consecrated after a night vigil in prayer. Sworn to defend purity, the weak, and the King’s standard.',
    verse: 'And having on the breastplate of righteousness; and your feet shod with the preparation of the gospel of peace.',
    ref: 'Ephesians 6:14–15',
  },
  {
    id: 'banneret',
    name: 'Knight Banneret',
    days: 90,
    armor: 'Shield of Faith',
    note: 'A knight distinguished by valor on the open field, entitled to lead men under his own square banner.',
    verse: 'Above all, taking the shield of faith, wherewith ye shall be able to quench all the fiery darts of the wicked.',
    ref: 'Ephesians 6:16',
  },
  {
    id: 'commander',
    name: 'Commander',
    days: 150,
    armor: 'Helmet of Salvation',
    note: 'Entrusted with the defense of the fortress. Vigilance is no longer an effort, but second nature.',
    verse: 'And take the helmet of salvation, and the sword of the Spirit, which is the word of God.',
    ref: 'Ephesians 6:17',
  },
  {
    id: 'marshal',
    name: 'Marshal',
    days: 200,
    note: 'Master of the host and guardian of discipline. His steadfastness inspires the brotherhood.',
    verse: 'Watch ye, stand fast in the faith, quit you like men, be strong.',
    ref: '1 Corinthians 16:13',
  },
  {
    id: 'seneschal',
    name: 'Seneschal',
    days: 270,
    note: 'Chief steward of the royal house. Purity has been proven through every season and trial.',
    verse: 'He that overcometh shall inherit all things; and I will be his God, and he shall be my son.',
    ref: 'Revelation 21:7',
  },
  {
    id: 'overcomer',
    name: 'Overcomer',
    days: 365,
    note: 'A full year walked in light. The cycle of lust has been shattered by the grace of Jesus Christ.',
    verse: 'Nay, in all these things we are more than conquerors through him that loved us.',
    ref: 'Romans 8:37',
  },
];

export default function RankListScreen() {
  const router = useRouter();
  const { cleanDays, userName } = useRecovery();

  const [selectedRank, setSelectedRank] = useState<RankData | null>(null);

  // Active rank
  const activeRankIndex = Math.max(
    0,
    ALL_RANKS.reduce((acc, r, i) => (cleanDays >= r.days ? i : acc), 0)
  );
  const currentRank = ALL_RANKS[activeRankIndex];
  const nextRank = ALL_RANKS[activeRankIndex + 1] || null;
  const daysToGo = nextRank ? Math.max(0, nextRank.days - cleanDays) : 0;
  const earnedCount = ALL_RANKS.filter((r) => cleanDays >= r.days).length;

  return (
    <VigilBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Painting */}
          <View style={styles.heroWrapper}>
            <Image
              source={require('@/../assets/images/rank-dummy.jpg')}
              style={styles.heroImage}
            />
            <LinearGradient
              colors={['rgba(244,247,253,.3)', 'rgba(244,247,253,.85)', '#F7F9FE']}
              style={styles.heroGradient}
            />

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 6l-6 6 6 6" />
              </Svg>
            </TouchableOpacity>

            {/* Title Over Hero */}
            <View style={styles.heroTitleGroup}>
              <Text style={styles.heroEyebrow}>Your rank, {userName || 'Brother'}</Text>
              <Text style={styles.heroRankTitle}>{currentRank.name}</Text>
              <Text style={styles.heroRankSub}>
                {cleanDays >= currentRank.days ? 'Earned and held in light' : `Day ${currentRank.days} requirement`}
              </Text>
            </View>
          </View>

          {/* Historical Description */}
          <View style={styles.historySection}>
            <Text style={styles.historyText}>{currentRank.note}</Text>
          </View>

          {/* Next Knighthood Progress Card */}
          {nextRank && (
            <View style={styles.nextCard}>
              <View style={styles.nextAvatar}>
                <Image
                  source={require('@/../assets/images/rank-dummy-icon.jpg')}
                  style={styles.nextImage}
                />
              </View>
              <View style={styles.nextInfo}>
                <View style={styles.nextHeader}>
                  <Text style={styles.nextTitle}>Next: {nextRank.name}</Text>
                  <Text style={styles.nextDays}>{daysToGo} days to go</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(
                            8,
                            ((cleanDays - currentRank.days) / (nextRank.days - currentRank.days)) * 100
                          )
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Your Path Header */}
          <View style={styles.pathHeaderRow}>
            <Text style={styles.pathTitle}>Your path</Text>
            <Text style={styles.pathCount}>{earnedCount} of {ALL_RANKS.length} earned</Text>
          </View>

          {/* Connected Timeline of 8 Ranks */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineVerticalLine} />

            {ALL_RANKS.map((r) => {
              const isEarned = cleanDays >= r.days;
              const isCurrent = r.id === currentRank.id;

              return (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedRank(r)}
                  style={styles.rankRow}
                >
                  <View style={[styles.rankAvatar, isEarned && styles.rankAvatarEarned]}>
                    <Image
                      source={require('@/../assets/images/rank-dummy-icon.jpg')}
                      style={[styles.rankThumb, !isEarned && styles.rankThumbLocked]}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.rankRowName, isCurrent && styles.rankRowNameCurrent]}>
                      {r.name}
                    </Text>
                    <Text style={styles.rankRowSub}>
                      {isEarned ? `Day ${r.days} achieved` : `Unlocks in ${r.days - cleanDays} days`}
                    </Text>
                  </View>

                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8798CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 6l6 6-6 6" />
                  </Svg>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ══════════ RANK DETAIL BOTTOM SHEET ══════════ */}
        {selectedRank && (
          <View style={styles.sheetOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setSelectedRank(null)}
              style={styles.sheetScrim}
            />
            <View style={styles.sheetBody}>
              <View style={styles.sheetImageWrap}>
                <Image
                  source={require('@/../assets/images/rank-dummy.jpg')}
                  style={styles.sheetArtImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(244,247,253,0.85)', '#F4F7FD']}
                  style={styles.sheetArtGradient}
                />
                <TouchableOpacity
                  onPress={() => setSelectedRank(null)}
                  style={styles.sheetCloseBtn}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={2.4} strokeLinecap="round">
                    <Path d="M6 6l12 12M18 6L6 18" />
                  </Svg>
                </TouchableOpacity>
              </View>

              <View style={styles.sheetTextWrap}>
                <Text style={styles.sheetRankStatus}>
                  {cleanDays >= selectedRank.days ? 'Earned rank' : `Unlocks at Day ${selectedRank.days}`}
                </Text>
                <Text style={styles.sheetRankTitle}>{selectedRank.name}</Text>
                {selectedRank.armor && (
                  <Text style={styles.sheetArmorPill}>⚔️ {selectedRank.armor}</Text>
                )}

                <Text style={styles.sheetRankNote}>{selectedRank.note}</Text>

                <View style={styles.sheetScriptureBox}>
                  <Text style={styles.sheetVerseText}>"{selectedRank.verse}"</Text>
                  <Text style={styles.sheetVerseRef}>{selectedRank.ref}</Text>
                </View>
              </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    height: 320,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244,247,253,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleGroup: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  heroEyebrow: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
  heroRankTitle: {
    fontSize: 42,
    fontFamily: 'LibreCaslonText',
    fontWeight: '400',
    color: color.ink,
    marginTop: 2,
  },
  heroRankSub: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.inkTertiary,
    marginTop: 4,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  historyText: {
    fontSize: 16,
    fontFamily: 'Geist',
    lineHeight: 24,
    color: color.inkSecondary,
  },
  nextCard: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nextAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.borderSoft,
  },
  nextImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nextInfo: {
    flex: 1,
    gap: 8,
  },
  nextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextTitle: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  nextDays: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.inkSecondary,
  },
  progressBarTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: color.hairline,
  },
  progressBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: color.ink,
  },
  pathHeaderRow: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  pathTitle: {
    fontSize: 17,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  pathCount: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  timelineContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
    position: 'relative',
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 42,
    top: 24,
    bottom: 24,
    width: 2,
    backgroundColor: color.hairline,
  },
  rankRow: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.hairline,
    backgroundColor: '#F4F7FD',
  },
  rankAvatarEarned: {
    borderColor: color.navyRim,
  },
  rankThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rankThumbLocked: {
    opacity: 0.35,
    tintColor: '#5566A0',
  },
  rankRowName: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  rankRowNameCurrent: {
    color: color.ink,
    fontSize: 17,
  },
  rankRowSub: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 60,
    justifyContent: 'flex-end',
  },
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,22,64,0.5)',
  },
  sheetBody: {
    height: 560,
    backgroundColor: '#F4F7FD',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetImageWrap: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  sheetArtImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sheetArtGradient: {
    ...StyleSheet.absoluteFill,
  },
  sheetCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244,247,253,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTextWrap: {
    padding: 24,
    gap: 8,
  },
  sheetRankStatus: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
  sheetRankTitle: {
    fontSize: 34,
    fontFamily: 'LibreCaslonText',
    color: color.ink,
  },
  sheetArmorPill: {
    fontSize: 14,
    fontFamily: 'Geist-SemiBold',
    color: color.goldDeep,
    marginTop: -2,
  },
  sheetRankNote: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: 'Geist',
    lineHeight: 22,
    color: color.inkSecondary,
  },
  sheetScriptureBox: {
    marginTop: 14,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: color.border,
  },
  sheetVerseText: {
    fontFamily: 'LibreCaslonText-Italic',
    fontSize: 15,
    lineHeight: 22,
    color: color.ink,
  },
  sheetVerseRef: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
});
