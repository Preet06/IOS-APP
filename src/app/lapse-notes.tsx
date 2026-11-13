import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color } from '@/theme/tokens';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';

export default function LapseNotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lapses, cleanDays } = useRecovery();

  const triggerBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of lapses) {
      for (const t of l.triggers) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    const maxCount = Object.values(counts).reduce((acc, v) => Math.max(acc, v), 0);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        widthPercent: Math.round((count / Math.max(maxCount, 2)) * 100),
      }));
  }, [lapses]);

  return (
    <VigilBackground>
      <View style={styles.root}>
        {/* Top Header */}
        <View style={[styles.topHeader, { paddingTop: Math.max(48, insets.top + 8) }]}>
          <TouchableOpacity
            accessibilityLabel="Back to Progress"
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 6l-6 6 6 6" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lapse notes</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(40, insets.bottom + 24) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            What you wrote when you fell. Read it before the next fight.
          </Text>

          {/* Trigger Breakdown Bar Chart */}
          {triggerBreakdown.length > 0 && (
            <View style={styles.triggerSection}>
              <Text style={styles.sectionEyebrow}>What led to them</Text>
              <View style={styles.triggerBarsGroup}>
                {triggerBreakdown.map((item) => (
                  <View key={item.label} style={styles.triggerRow}>
                    <Text style={styles.triggerLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${item.widthPercent}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.triggerCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Lapse Notes List */}
          <View style={styles.notesList}>
            {lapses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No lapse notes yet</Text>
                <Text style={styles.emptySub}>
                  Whenever you log a slip from Progress, Daily Reading, or Help Now, your triggers and notes will appear here.
                </Text>
              </View>
            ) : (
              lapses.map((lapse, idx) => {
                const roseCaption =
                  idx === 0
                    ? `Rose the same day · ${cleanDays} ${cleanDays === 1 ? 'day' : 'days'} held since`
                    : `Rose the same day · held ${lapses[idx - 1].heldDays} ${lapses[idx - 1].heldDays === 1 ? 'day' : 'days'} after`;

                return (
                  <View key={lapse.id || idx} style={styles.noteCard}>
                    <View style={styles.noteHeaderRow}>
                      <Text style={styles.noteDate}>{lapse.dateFormatted}</Text>
                      <Text style={styles.noteHeld}>
                        after {lapse.heldDays} {lapse.heldDays === 1 ? 'day' : 'days'}
                      </Text>
                    </View>

                    <View style={styles.tagsRow}>
                      {lapse.triggers.map((tag, tIdx) => (
                        <View key={`${tag}-${tIdx}`} style={styles.tagBadge}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.quoteBlock}>
                      <Text style={styles.quoteText}>
                        {lapse.note
                          ? lapse.note
                          : 'No note written — rose again to keep watch.'}
                      </Text>
                    </View>

                    <Text style={styles.roseCaptionText}>{roseCaption}</Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </VigilBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
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
    paddingTop: 6,
  },
  subtitle: {
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 25,
    color: color.inkSecondary,
    marginBottom: 18,
  },
  triggerSection: {
    paddingTop: 18,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  sectionEyebrow: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: color.inkTertiary,
  },
  triggerBarsGroup: {
    marginTop: 12,
    gap: 10,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerLabel: {
    width: 92,
    fontSize: 14,
    fontFamily: 'Geist',
    color: color.ink,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.hairline,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: color.inkSecondary,
  },
  triggerCount: {
    width: 22,
    fontSize: 13,
    fontFamily: 'Geist',
    textAlign: 'right',
    color: color.inkSecondary,
  },
  notesList: {
    borderTopWidth: 1,
    borderTopColor: color.hairline,
  },
  noteCard: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: color.hairline,
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  noteDate: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: color.ink,
  },
  noteHeld: {
    fontSize: 13,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  tagsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: color.hairline,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    color: color.inkSecondary,
  },
  quoteBlock: {
    marginTop: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: color.border,
  },
  quoteText: {
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 25,
    color: color.ink,
  },
  roseCaptionText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Geist',
    color: color.inkTertiary,
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    color: color.ink,
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Geist',
    lineHeight: 20,
    color: color.inkTertiary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

