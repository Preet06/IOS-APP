import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DevotionalPassage, getPassageForDay } from '@/constants/passages';
import { supabase } from '@/lib/supabase';

const GETHOLYBIBLE_BASE_URL = 'https://getholybible.com';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/auto';
const VOTD_CACHE_KEY = 'vigil_daily_votd_cache_v3';

export interface GetHolyBibleVerse {
  book: number;
  chapter: number;
  verse: number;
  ref?: string;
  text: string;
}

export interface GetHolyBibleVotdResponse {
  day: string; // YYYY-MM-DD
  today: boolean;
  ref: string; // e.g. "1 Peter 3:15"
  verse: GetHolyBibleVerse;
  translation: string; // "kjv"
  url: string;
  image?: string;
  prev?: string | null;
  next?: string | null;
}

interface GeneratedDevotionalParts {
  reflectionHeadline: string;
  reflectionText: string;
  reflectionSubText: string;
  prayerText: string;
}

interface CachedDailyPassage {
  dateKey: string; // YYYY-MM-DD
  passage: DevotionalPassage;
}

// In-memory lock so concurrent callers on the same device share one request
let inflightTodayPromise: Promise<DevotionalPassage> | null = null;
let inflightDateKey: string | null = null;

function getLocalDateKey(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayOfYearNumber(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

async function readLocalCache(): Promise<CachedDailyPassage | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? typeof localStorage !== 'undefined'
          ? localStorage.getItem(VOTD_CACHE_KEY)
          : null
        : await SecureStore.getItemAsync(VOTD_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedDailyPassage;
  } catch {
    return null;
  }
}

async function writeLocalCache(entry: CachedDailyPassage): Promise<void> {
  try {
    const serialized = JSON.stringify(entry);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VOTD_CACHE_KEY, serialized);
      }
    } else {
      await SecureStore.setItemAsync(VOTD_CACHE_KEY, serialized);
    }
  } catch {
    // Ignore local storage write errors
  }
}

/**
 * Serializes the 3 reflection parts into a single human-readable `reflection_text`
 * column for `public.passages` (`Headline\n\nParagraph 1\n\nParagraph 2`).
 */
function serializeReflectionColumn(parts: {
  reflectionHeadline: string;
  reflectionText: string;
  reflectionSubText: string;
}): string {
  return [
    parts.reflectionHeadline.trim() || 'Stand.',
    parts.reflectionText.trim(),
    parts.reflectionSubText.trim(),
  ].join('\n\n');
}

/**
 * Parses a `public.passages.reflection_text` column back into
 * `reflectionHeadline`, `reflectionText`, and `reflectionSubText`.
 */
function parseReflectionColumn(rawReflection: string): {
  reflectionHeadline: string;
  reflectionText: string;
  reflectionSubText: string;
} {
  const blocks = rawReflection
    .split('\n\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (blocks.length >= 3) {
    return {
      reflectionHeadline: blocks[0],
      reflectionText: blocks[1],
      reflectionSubText: blocks.slice(2).join('\n\n'),
    };
  }

  if (blocks.length === 2) {
    return {
      reflectionHeadline: 'Stand.',
      reflectionText: blocks[0],
      reflectionSubText: blocks[1],
    };
  }

  return {
    reflectionHeadline: 'Stand.',
    reflectionText: rawReflection.trim(),
    reflectionSubText:
      'The pull you feel today is real. But it isn’t you, and it isn’t stronger than the One you belong to. Hold your ground for this one day.',
  };
}

/**
 * Layer 2A: Reads the shared daily passage for `votd-YYYY-MM-DD` from Supabase `public.passages`.
 */
async function fetchSharedPassageFromSupabase(
  passageId: string
): Promise<DevotionalPassage | null> {
  try {
    const { data, error } = await supabase
      .from('passages')
      .select('*')
      .eq('id', passageId)
      .maybeSingle();

    if (error || !data) return null;

    const parsedRefl = parseReflectionColumn(data.reflection_text || '');
    return {
      id: data.id,
      dayNumber: data.day_number,
      verseRef: data.verse_ref,
      scriptureText: data.scripture_text,
      reflectionHeadline: parsedRefl.reflectionHeadline,
      reflectionText: parsedRefl.reflectionText,
      reflectionSubText: parsedRefl.reflectionSubText,
      prayerText: data.prayer_text,
      audioDuration: '1:20',
    };
  } catch {
    return null;
  }
}

/**
 * Layer 2B: Saves the newly generated daily passage to Supabase `public.passages`
 * using `upsert` with `ignoreDuplicates: true` so if two users open the app at the
 * exact same moment at midnight, the first write wins and all users read the same row.
 */
async function saveSharedPassageToSupabase(
  passage: DevotionalPassage
): Promise<DevotionalPassage> {
  try {
    const reflectionColumn = serializeReflectionColumn({
      reflectionHeadline: passage.reflectionHeadline || 'Stand.',
      reflectionText: passage.reflectionText,
      reflectionSubText:
        passage.reflectionSubText ||
        'The pull you feel today is real. But it isn’t you, and it isn’t stronger than the One you belong to. Hold your ground for this one day.',
    });

    await supabase.from('passages').upsert(
      {
        id: passage.id,
        day_number: passage.dayNumber,
        verse_ref: passage.verseRef,
        scripture_text: passage.scriptureText,
        reflection_text: reflectionColumn,
        prayer_text: passage.prayerText,
        audio_url: null,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    // Re-read the canonical row from Supabase so even if a concurrent user won the race,
    // both users receive the exact same row.
    const canonical = await fetchSharedPassageFromSupabase(passage.id);
    if (canonical) {
      return canonical;
    }
  } catch {
    // Ignore if offline or RLS restricts anonymous writes
  }

  return passage;
}

/**
 * Deterministic, verse-specific fallback generator when offline or if AI is unavailable.
 */
function buildVerseAwareFallbackParts(
  ref: string,
  verseText: string,
  daySeed: number
): GeneratedDevotionalParts {
  const base = getPassageForDay(daySeed);
  const firstClause =
    verseText
      .split(/[:.;,]/)[0]
      ?.trim()
      .replace(/^["“]|["”]$/g, '') || ref;

  return {
    reflectionHeadline: 'Stand.',
    reflectionText: `In ${ref}, Scripture commands us: “${firstClause}.” Freedom from lust is not won by white-knuckling through urges alone—it is won when Christ occupies the throne of your heart before temptation even knocks.`,
    reflectionSubText:
      'The pull you feel today is real, but it is not stronger than the One you belong to. Anchor your mind in this verse and hold your ground for this one day.',
    prayerText: `Lord God, write the truth of ${ref} deep upon my heart today. Sanctify my thoughts, guard my eyes from every false counterfeit, and give me the quiet strength to stand firm in Your grace. ${base.prayerText.split('.').slice(-2).join('.').trim() || 'In Jesus’ name, Amen.'}`,
  };
}

/**
 * Layer 3: Called ONLY ONCE per day globally (when Supabase has no row yet for today).
 * Generates the daily Explanation and Prayer for today's GetHolyBible verse.
 */
async function generateDevotionalPartsForVerse(
  ref: string,
  verseText: string,
  daySeed: number
): Promise<GeneratedDevotionalParts> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  const model = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return buildVerseAwareFallbackParts(ref, verseText, daySeed);
  }

  const prompt = `You are writing today's daily devotional for "Vigil", a Christian men's recovery app for overcoming pornography and lust (themed around a knight keeping watch).
Today's Scripture from the King James Bible is:
Reference: ${ref}
Text: "${verseText}"

Write a JSON object with these exact 4 string fields tailored specifically to this verse:
1. "reflectionHeadline": A short, punchy 1 to 3 word imperative title ending with a period (e.g. "Stand.", "Guard your heart.", "Hold the line.").
2. "reflectionText": Paragraph 1 (2-3 sentences, ~45 words) explaining what ${ref} means for a man fighting for purity, self-control, and freedom from lust today.
3. "reflectionSubText": Paragraph 2 (2 sentences, ~30 words) giving practical, brotherly encouragement to hold his ground for this one day.
4. "prayerText": A reverent, first-person prayer (3 sentences, ~45 words) directly praying the words and promise of ${ref} back to God, ending with "Amen." (Do not wrap prayerText in quotation marks).

Respond ONLY with valid JSON.`;

  try {
    const callOpenRouter = (targetModel: string) =>
      fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://vigil.recovery',
          'X-Title': 'Vigil Daily Orders',
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 350,
          temperature: 0.6,
        }),
      });

    let response = await callOpenRouter(model);
    if (!response.ok && model !== DEFAULT_MODEL) {
      response = await callOpenRouter(DEFAULT_MODEL);
    }

    if (!response.ok) {
      return buildVerseAwareFallbackParts(ref, verseText, daySeed);
    }

    const data = await response.json();
    const rawContent: string = data.choices?.[0]?.message?.content?.trim() || '';
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return buildVerseAwareFallbackParts(ref, verseText, daySeed);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedDevotionalParts>;
    if (parsed.reflectionText && parsed.prayerText) {
      return {
        reflectionHeadline: parsed.reflectionHeadline?.trim() || 'Stand.',
        reflectionText: parsed.reflectionText.trim(),
        reflectionSubText:
          parsed.reflectionSubText?.trim() ||
          'The pull you feel today is real. But it isn’t you, and it isn’t stronger than the One you belong to. Hold your ground for this one day.',
        prayerText: parsed.prayerText.trim().replace(/^["“]|["”]$/g, ''),
      };
    }
  } catch {
    // Fall back to deterministic verse-aware generator
  }

  return buildVerseAwareFallbackParts(ref, verseText, daySeed);
}

async function resolveTodayPassageInternal(
  todayKey: string,
  cleanDays: number
): Promise<DevotionalPassage> {
  const sharedPassageId = `votd-${todayKey}`;
  const dayOfYear = getDayOfYearNumber();

  // ── LAYER 1: Device Local Cache (SecureStore) ──
  const localCached = await readLocalCache();
  if (
    localCached &&
    localCached.dateKey === todayKey &&
    localCached.passage?.scriptureText
  ) {
    return localCached.passage;
  }

  // ── LAYER 2: Global Shared Cache in Supabase (`public.passages`) ──
  // If any user has already opened the app today, this row exists in Supabase
  // and is returned immediately without calling GetHolyBible or OpenRouter.
  const sharedFromDb = await fetchSharedPassageFromSupabase(sharedPassageId);
  if (sharedFromDb && sharedFromDb.scriptureText) {
    await writeLocalCache({ dateKey: todayKey, passage: sharedFromDb });
    return sharedFromDb;
  }

  // ── LAYER 3: First Request of the Day Globally ──
  // Fetch today's verse from GetHolyBible (`/votd/{YYYY-MM-DD}?format=json`),
  // generate the Explanation & Prayer once, and save to Supabase for all other users.
  try {
    let response = await fetch(
      `${GETHOLYBIBLE_BASE_URL}/votd/${todayKey}?format=json`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) {
      response = await fetch(`${GETHOLYBIBLE_BASE_URL}/votd?format=json`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    }

    if (!response.ok) {
      throw new Error(`GetHolyBible API status ${response.status}`);
    }

    const data = (await response.json()) as GetHolyBibleVotdResponse;
    if (data && data.ref && data.verse?.text) {
      const cleanRef = data.ref.trim();
      const cleanText = data.verse.text.trim();
      const parts = await generateDevotionalPartsForVerse(
        cleanRef,
        cleanText,
        dayOfYear
      );

      const generatedPassage: DevotionalPassage = {
        id: sharedPassageId,
        dayNumber: dayOfYear,
        verseRef: cleanRef,
        scriptureText: cleanText,
        reflectionHeadline: parts.reflectionHeadline,
        reflectionText: parts.reflectionText,
        reflectionSubText: parts.reflectionSubText,
        prayerText: parts.prayerText,
        audioDuration: '1:20',
      };

      // Persist to Supabase `public.passages` so every subsequent user gets this exact row
      const canonicalPassage = await saveSharedPassageToSupabase(generatedPassage);
      await writeLocalCache({ dateKey: todayKey, passage: canonicalPassage });
      return canonicalPassage;
    }
  } catch {
    // Offline fallback
  }

  return getPassageForDay(cleanDays);
}

export const ScriptureService = {
  /**
   * Returns today's global Daily Scripture, Explanation, and Prayer.
   * Shared across all users via Supabase `public.passages` (`id = 'votd-YYYY-MM-DD'`).
   */
  async getTodayPassage(cleanDays: number): Promise<DevotionalPassage> {
    const todayKey = getLocalDateKey();

    if (inflightTodayPromise && inflightDateKey === todayKey) {
      return inflightTodayPromise;
    }

    inflightDateKey = todayKey;
    inflightTodayPromise = resolveTodayPassageInternal(todayKey, cleanDays).finally(
      () => {
        inflightTodayPromise = null;
      }
    );

    return inflightTodayPromise;
  },

  /**
   * Fetches a specific passage by free-form reference (e.g., "Ephesians 6:10-13")
   * from https://getholybible.com/passage?ref=...&format=json
   */
  async fetchPassageByRef(
    reference: string
  ): Promise<{ ref: string; text: string } | null> {
    try {
      const url = `${GETHOLYBIBLE_BASE_URL}/passage?ref=${encodeURIComponent(reference)}&format=json`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) return null;
      const data = await response.json();

      if (Array.isArray(data?.verses) && data.verses.length > 0) {
        const combinedText = data.verses
          .map((v: { text?: string }) => (v.text || '').trim())
          .filter(Boolean)
          .join(' ');
        return {
          ref: data.ref || reference,
          text: combinedText,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};
