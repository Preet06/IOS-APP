/**
 * Vigil design tokens — extracted from the screen files in /screens.
 * Every value here appears verbatim in those files. If a screen file and this
 * file ever disagree, the screen file wins.
 *
 * Usage (Expo): import { color, font, type, space, radius, gradient } from './vigil-tokens';
 */

export const color = {
  // ── LIGHT THEME (all interaction screens: quiz, home, check-in, help, progress, ranks, profile)
  ink: '#0A1640',            // primary text, primary button fill, active tab, filled option
  inkSecondary: '#34489A',   // secondary text, small labels with emphasis
  inkTertiary: '#5566A0',    // captions, inactive tab, progress "%" label, placeholders
  inkMuted: '#8798CC',       // disabled / future items, side-rank rim
  navyDeep: '#081030',       // pressed state of primary button
  navyRim: '#2C4290',        // focus ring, active medallion rim
  onInk: '#F4F7FD',          // text/icons on ink buttons; also off-white surface
  surface: 'rgba(244,247,253,0.7)',      // option / card fill on the light background
  surfaceTint: 'rgba(227,233,247,0.5)',  // secondary button fill (e.g. "Start today's reading")
  chip: 'rgba(227,233,247,0.8)',         // small pills (streak chip)
  tabBar: 'rgba(227,233,247,0.92)',      // bottom nav background (with 12px blur)
  hairline: '#D3DCF2',       // dividers, tab-bar top border, progress-bar track
  border: '#A3B3DE',         // card / option / button outlines
  borderSoft: '#C2CEEC',     // chip outline, disabled button fill
  pressTint: 'rgba(211,220,242,0.45)',   // row hover/press

  // Gold — ONLY for God's light, things the user has earned, and "today". Never decorative.
  gold: '#C9A24A',
  goldDeep: '#B08A36',       // gold icons / small gold strokes on light bg
  goldSoft: '#D6B05A',       // motes, sparkles
  goldGlow: 'rgba(201,162,74,0.7)',

  // Destructive — ONLY "Delete account". Nowhere else.
  danger: '#B4413A',

  // ── DARK THEME (promotional / story screens: intro film, welcome; later: education slides, pledges, plan reveal)
  night: '#081030',          // dark background base
  nightMid: '#14245C',       // text on ivory button
  nightSky1: '#101C4A',
  nightSky2: '#1A2A66',
  nightSky3: '#1F3A8A',
  horizon: '#34489A',        // hill / horizon band
  lapis: '#3A55A8',          // sword ribbon
  textOnNight: '#E6ECFA',    // headlines on dark
  textOnNight2: '#C9D0E8',   // body on dark
  textOnNight3: '#A9B8E2',   // lead-in words of headlines on dark
  textOnNight4: '#8FA0D0',   // captions on dark, "Skip", "Already have an account?"
  coldRim: '#B8C6EE',        // cold moonlight rims, horizon line
  ivory: '#F6ECD2',          // primary CTA fill on dark; key words; heavenly light
  ivoryHot: '#FFF8E6',       // core of the light / blessed sword
  ivoryHover: '#FFFAEE',
} as const;

export const gradient = {
  /** Light theme page background — top → bottom, 0 / 45 / 82 / 100 % */
  lightPage: ['#F7F9FE', '#EDF1FB', '#E2E9F8', '#D6DFF4'] as const,
  lightPageStops: [0, 0.45, 0.82, 1] as const,
  /** Dark welcome sky (top 300px) */
  nightSky: ['#081030', '#101C4A', '#1A2A66', '#2A4290'] as const,
  /** Gold aura used on Home behind the rank medallion and on the quiz (where the sword's light was) */
  aura: 'radial-gradient(circle, rgba(201,162,74,.16) 0%, rgba(44,66,144,.1) 32%, rgba(135,152,204,.04) 55%, transparent 70%)',
} as const;

export const font = {
  /** UI: all labels, buttons, questions, numbers. Weights 400/500/600/700. */
  ui: 'Geist',
  /** Scripture, prayers, messages, the "Vigil" wordmark on dark, intro film headlines. Regular + Italic (+700 in the film). */
  serif: 'Libre Caslon Text',
  // Expo: @expo-google-fonts/geist and @expo-google-fonts/libre-caslon-text
} as const;

/** Type scale actually used (px, line-height as multiplier). */
export const type = {
  wordmarkDark: { family: 'serif', size: 54, weight: 400, lh: 1.0, tracking: -0.02 },
  filmHeadline: { family: 'serif', size: 28, weight: 400, lh: 1.2, tracking: -0.015 },
  question:     { family: 'ui', size: 27, weight: 600, lh: 1.22, tracking: -0.02 },
  rankName:     { family: 'ui', size: 24, weight: 600, lh: 1.2, tracking: -0.02 },
  body:         { family: 'ui', size: 16, weight: 500, lh: 1.45 },   // options, buttons
  bodyLarge:    { family: 'ui', size: 17, weight: 400, lh: 1.45 },   // film body, help button (700)
  label:        { family: 'ui', size: 15, weight: 500, lh: 1.4 },
  caption:      { family: 'ui', size: 13, weight: 400, lh: 1.4 },
  eyebrow:      { family: 'ui', size: 12, weight: 500, tracking: 0.22, uppercase: true }, // "YOUR HABITS"
  tab:          { family: 'ui', size: 11, weight: 500 },
  scripture:    { family: 'serif', size: 17, weight: 400, lh: 1.6 },
} as const;
// Numbers that change (timers, counts, %) always use tabular figures: fontVariant: ['tabular-nums']

export const space = { screenX: 20, screenXWide: 24, screenXDark: 28, gap: 12, gapTight: 10, section: 28 } as const;

export const radius = {
  button: 18,      // primary/secondary rectangular buttons (60px tall) and quiz options (60px)
  optionCompact: 16, // quiz options when a question has >5 answers (52px tall)
  card: 16,
  sheet: 28,       // bottom sheets (top corners)
  pill: 999,       // ivory CTA on dark, chips
  phoneFrame: 44,
} as const;

export const size = {
  screen: { w: 390, h: 844 },   // design frame = iPhone 14/15 logical size
  buttonH: 60, ctaDarkH: 56, optionH: 60, optionCompactH: 52, tabBarH: 84, touchMin: 44,
} as const;

export const shadow = {
  helpButton: '0 0 0 1px rgba(10,22,64,.2), 0 10px 40px rgba(10,22,64,.16)',
  goldDot: '0 0 10px rgba(201,162,74,.7)',
} as const;

export const motion = {
  /** Default entrance easing used everywhere ("rise"): cubic-bezier(.2,.8,.2,1) */
  easeOut: [0.2, 0.8, 0.2, 1] as const,
  /** Sheets: cubic-bezier(.2,.9,.25,1) */
  easeSheet: [0.2, 0.9, 0.25, 1] as const,
  /** Camera moves: cubic-bezier(.65,0,.25,1) */
  easeCamera: [0.65, 0, 0.25, 1] as const,
  /** Pop / check: cubic-bezier(.3,1.5,.5,1) (overshoot) */
  easePop: [0.3, 1.5, 0.5, 1] as const,
  rise: { from: { opacity: 0, translateY: 10 }, duration: 600 },
  stagger: 130,
} as const;
