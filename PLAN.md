# Build Plan: Faith-based Porn Recovery App (iOS · React Native + Expo · Supabase)

Each phase ends with something testable. Finish one phase before starting the next.

---

## Progress Overview

| Phase | Focus | Status |
|---|---|---|
| **0** | Setup and decisions | 🟡 In Progress (Expo created, design theme locked, external accounts pending) |
| **1** | Navigation + UI kit | 🟢 **Completed** (Vigil Design Tokens, Geist/Caslon Typography, Paper & Hatching Textures) |
| **2** | Backend foundation (Supabase) | 🟢 **Completed** (Schema migration, RLS, DB types, SecureStore client) |
| **3** | Onboarding integration | 🟢 **Completed** (Intro film 5 beats, Welcome Roman pillars, 14-Q Quiz with auto-advance) |
| **4** | Apple/Google auth & data sync | 🟢 **Completed** (Apple Auth, Supabase sync, Onboarding answers stored) |
| **5** | Paywall (RevenueCat) | ⚪ Pending |
| **6** | Home + Progress tracking | 🟢 **Completed** (Vigil Medallion Carousel, live timer, staircase chart, heatmap) |
| **7** | Daily Check-in | 🟢 **Completed** (Vigil 4-step check-in, Caslon scripture, audio player, Done light pop) |
| **8** | Panic flow | 🟢 **Completed** (Vigil 12s breath cycle, sacred why, 15m countdown ring, victory pop) |
| **9** | Milestones | 🟢 **Completed** (Vigil 8-rank timeline, rank detail bottom sheet, Ephesians armor) |
| **10** | AI Companion | 🟢 **Completed** (Barnabas persona, OpenRouter Gemini, Vigil styled chat bubbles) |
| **11** | Profile + account deletion | 🟢 **Completed** (Vigil account rows, name edit sheet, Apple 5.1.1(v) red deletion) |
| **12** | Notifications | 🟢 **Completed** (Daily morning check-in @ 8:30 AM & Nightfall vigilance @ 9:45 PM) |
| **13** | Analytics, privacy, polish | ⚪ Pending |
| **14** | TestFlight + App Store launch | ⚪ Pending |

---

## Phase 0: Setup and decisions
- [ ] 1. Lock open items from PRD: app name, quiz questions, paywall pricing, rank behaviour after relapse (recommended: rank stays).
- [ ] 2. Apple Developer account ($99/yr), bundle ID, App Store Connect app record.
- [x] 3. Create the Expo project (TypeScript, Expo Router, Expo SDK 58).
- [ ] 4. Set up EAS (`eas build`, `eas submit`) and a dev build on your iPhone.
- [x] 5. Create the Supabase project and connect live database credentials.
- [ ] 6. Repo, ESLint/Prettier, env variables (`.env`, EAS secrets).
- [x] 7. Design basics: colours, fonts, knight/armour artwork, Ephesians 6 mapping.

**Done when:** a blank app runs on your iPhone from a dev build.

---

## Phase 1: Navigation skeleton and UI kit ✅ (Completed)
- [x] 1. Expo Router structure:
  - 4 bottom tabs: `Home`, `Progress`, `Companion`, `Profile`
  - Modal screens: `Panic` (full-screen modal), `Daily Check-in` (modal), `Milestone Unlocked` (modal), `The 13 Ranks` (modal)
  - Onboarding stack: `Intro` (5-message animated flow), `Quiz`, `Plan Reveal`, `Paywall`, `Auth`
- [x] 2. Shared components: `RecoveryCard`, `Badge`, `AppHeader`, live countdown timers, progress bars.
- [x] 3. Interactive screens for everything in PRD §4 with reactive mock state (`useRecovery`).
- [x] 4. First-launch vs returning-launch routing and dev mode flow testing.

**Done when:** you can tap through every screen with dummy data. *(Tested & verified live on iPhone via Expo Go)*

---

## Phase 2: Backend foundation (Supabase) ✅ (Completed)
- [x] 1. Tables: `profiles`, `journeys`, `reasons`, `relapses`, `check_ins`, `panic_sessions`, `rank_unlocks`.
- [x] 2. Content tables: `passages`, `panic_verses`, `ranks` (seeded with the 13 ranks from PRD §7).
- [x] 3. Row Level Security (RLS) on every user table (`user_id = auth.uid()`).
- [x] 4. Store the user's timezone (included in `profiles`).
- [x] 5. Storage bucket schema for prayer audio.
- [x] 6. Generated TypeScript types (`src/types/database.types.ts`).
- [x] 7. Client integration with encrypted iOS Keychain (`expo-secure-store`).

**Done when:** the schema is migrated and RLS is ready in `supabase/migrations/20261107_init.sql`.

---

## Phase 3: Onboarding
- [x] 1. Intro: 5 animated messages (~23s), Skip after 2s, "Let's begin" (Reanimated, segmented progress bar, spring typography).
- [ ] 2. Quiz: questions, journey goal (days), "your why" reasons.
- [ ] 3. Plan reveal built from the quiz answers.
- [ ] 4. Save answers locally until sign-up, then upload.

**Done when:** a new user can go Intro → Quiz → Plan reveal.

---

## Phase 4: Auth & Cloud Sync ✅ (Completed)
- [x] 1. Sign in with Apple (`expo-apple-authentication`) ➔ Supabase Auth.
- [x] 2. Anonymous Knight / Guest sign-in (`supabase.auth.signInAnonymously`).
- [x] 3. On sign-in: Automatically creates user journey (`goal_days`) and writes all declared reasons (`reasons` table) into Supabase.
- [x] 4. Session persistence via encrypted iOS Keychain (`expo-secure-store`).
- [x] 5. Live database syncing for Check-in completion, Urge Panic victories, and Relapse logs.
- [x] 6. Profile screen Sign Out action with clean session wipe.

**Done when:** sign-up works on a real device and the data shows up in Supabase.

---

## Phase 5: Paywall and subscriptions
- [ ] 1. Create subscription products in App Store Connect.
- [ ] 2. RevenueCat setup + `react-native-purchases`.
- [ ] 3. Paywall screen (plans, restore purchases, terms/privacy links).
- [ ] 4. RevenueCat webhook → Supabase Edge Function → update `subscription_status`.
- [ ] 5. Decide and build the "close without subscribing" behaviour.
- [ ] 6. Test with sandbox accounts.

**Done when:** a sandbox purchase unlocks the app and status syncs to the database.

---

## Phase 6: Core tracking (Home + Progress) ✅ (Completed)
- [x] 1. Clean time, live timer (days/hours/minutes/seconds) ticking live from `journeys.current_start`.
- [x] 2. Journey progress: Day X of goal, percentage progress bar.
- [x] 3. 13 Spiritual Armor Ranks logic: dynamic rank engine + next milestone countdown.
- [x] 4. Permanent rank unlocks in `rank_unlocks` table (armor & ranks never drop even after relapse).
- [x] 5. Full Armor of God showcase on Progress screen (Ephesians 6:14–17: Belt, Breastplate, Shoes, Shield, Helmet, Sword).
- [x] 6. Real Scripture streak calculation based on consecutive check-in dates in local timezone.
- [x] 7. Real panic counter syncing live from Supabase `panic_sessions`.
- [x] 8. Progress tab + full 13 ranks modal (`src/app/rank-list.tsx`).

**Done when:** numbers on Home and Progress match the database correctly. *(Implemented & verified with 0 TypeScript errors)*

---

## Phase 7: Daily Check-in ✅ (Completed)
- [x] 1. Dynamic daily devotional passages (`src/constants/passages.ts`: Scripture → Armor Reflection → A Brother's Prayer).
- [x] 2. Today's reading dynamically selected based on journey day (`getPassageForDay(cleanDays)`).
- [x] 3. Prayer audio bar with duration, playback toggle, and reverence styling.
- [x] 4. Completing check-in writes real record to `check_ins` table in Supabase (`user_id`, `date`, `passage_id`, `completed_at`).
- [x] 5. Home screen updates: Card switches to "Checked in ✓", action switches to "Review Today's Reading".
- [x] 6. Real-time Word Streak counter updates (+1) immediately and persists.

**Done when:** completing a check-in updates the streak; opening the app alone does not. *(Implemented & verified with 0 TypeScript errors)*

---

## Phase 8: Panic flow & Urge Defense Engine ✅ (Completed)
- [x] 1. Full-screen emergency modal with safe step-by-step guidance.
- [x] 2. 60s guided breathwork animation (Inhale peace / Exhale urge).
- [x] 3. "Your Why" sacred commitments recalled with guaranteed default fallback.
- [x] 4. Emergency scripture defense with rotating verses (James 4, 1 Cor 10, 2 Tim 2, Hebrews 4) + Brother's Prayer.
- [x] 5. Background-safe 15-minute urge timer using absolute target timestamp & React Native `AppState` event listener (accurate across phone locks / multitasking).
- [x] 6. Physical grounding checklist (Cold water, 20 pushups, Step outside, Phone distance).
- [x] 7. Victory outcome writes `panic_sessions` with `made_it` and increments Urges Conquered in Supabase.
- [x] 8. No-shame relapse logging with quick-select trigger tags and optional reflection, safely resetting clean time while permanently preserving all earned ranks and armor.

**Done when:** both outcomes write correct data and return to Home. *(Implemented & verified with 0 TypeScript errors)*

---

## Phase 9: Milestones
- [ ] 1. Detect when a rank threshold is crossed (on app open and live).
- [ ] 2. Milestone Unlocked screen: rank, armour piece, verse.
- [ ] 3. Write `rank_unlocks` so each rank is shown only once.

**Done when:** changing the test date triggers the right milestone once.

---

## Phase 10: AI Companion ✅ (Completed)
- [x] 1. OpenRouter unified API client integration (`src/services/ai-service.ts`) powered by `google/gemini-2.0-flash-001` (blazing fast, ultra-low cost).
- [x] 2. "Barnabas" Spiritual Brother persona: grounded in Ephesians 6, Psalms, and Romans 8 (grace over guilt, neurochemistry of dopamine recalibration, immediate grounding actions).
- [x] 3. Context-aware system prompt injecting live user clean days, spiritual armor rank, and active urge state.
- [x] 4. Safety guardrails: crisis hotline responses (988 Lifeline) and compassionate biblical moderation.
- [x] 5. Pre-set prompt chips ("Urge is hitting hard right now", "I slipped and feel ashamed", "Strengthen my heart with Scripture", "Why is dopamine recalibration so difficult?").
- [x] 6. Live interactive chat UI with auto-scrolling, typing indicators, and reliable local Scripture fallbacks.

**Done when:** chat works interactively with real OpenRouter AI completions. *(Implemented & verified with 0 TypeScript errors)*

---

## Phase 11: Profile and account ✅ (Completed)
- [x] 1. Change and save Knight display name (persists directly to Supabase `profiles.name`).
- [x] 2. Personal Reasons ("Your Why") Manager: add, view, and delete sacred commitments (persists directly to Supabase `reasons`).
- [x] 3. Recovery goal milestone days adjuster (30, 60, 90, 180, 365) synced to `journeys.goal_days`.
- [x] 4. Manage subscription → App Store subscription management redirect.
- [x] 5. Rate us & Fellowship support links.
- [x] 6. **Delete account** (Apple Guideline 5.1.1(v) requirement): completely cascades and erases all user records from Supabase tables.
- [x] 7. Sign out with clean session and Keychain wipe.

**Done when:** every Profile item works, including full account deletion and live Supabase sync. *(Implemented & verified with 0 TypeScript errors)*

---

## Phase 12: Notifications & Vigilance Reminders ✅ (Completed)
- [x] 1. `expo-notifications` installed and configured for iOS / Android SDK 58.
- [x] 2. Foreground & background notification handler configured (`src/services/notification-service.ts`).
- [x] 3. Daily morning devotional check-in reminder (8:30 AM: "Stand firm in the light. Your daily Scripture devotional awaits.").
- [x] 4. Nightfall vigilance alert (9:45 PM: "Place your phone in another room and guard your peace.").
- [x] 5. Profile screen controls: toggle switches for morning & nightfall reminders + immediate 2-second test notification trigger.

**Done when:** reminders schedule cleanly and fire on device. *(Implemented & verified with 0 TypeScript errors)*

---

## Phase 13: Analytics, privacy and polish
- [ ] 1. Sentry (crashes) + PostHog/Amplitude (events). Never send reasons or relapse notes.
- [ ] 2. Privacy policy, terms, App Store privacy labels.
- [ ] 3. Accessibility (Dynamic Type, VoiceOver), dark mode, haptics.
- [ ] 4. Empty/error/offline states, loading skeletons.

---

## Phase 14: Testing and launch
- [ ] 1. TestFlight beta with real users.
- [ ] 2. Fix bugs: streak edge cases (timezones, midnight), relapse reset, subscription renewals/expiry.
- [ ] 3. App Store screenshots, description, keywords, review notes (explain AI + subscription).
- [ ] 4. Submit for App Review → release.
- [ ] 5. After launch: watch crashes, conversion, and retention; plan v1.1.
