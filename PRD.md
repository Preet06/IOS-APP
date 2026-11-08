# PRD — Faith-based Porn Recovery App (working name TBD)

**Status:** v0.2 draft · **Owner:** Pratik

---

## 1. Overview
A mobile app (**iOS only**, built with **React Native + Expo**) that helps men quit porn and lust addiction through daily discipline, Scripture, an AI companion and urge support. Progress is framed as a knight's path: ranks are earned with clean time.

### Product rules
- No shame or guilt messaging, especially after a relapse.
- No fake scores. Anything shown comes from the user's real answers or data.
- Action buttons use plain, literal wording (e.g. "I need help now").

---

## 2. User flow (first launch)
1. Intro (skippable)
2. Quiz
3. Plan reveal
4. Paywall
5. Sign up (required)
6. Home

- Returning users open straight to Home.
- The intro is shown only on first install.

---

## 3. Onboarding

### 3.1 Intro
- A short animated intro of about 23 seconds, made up of 5 messages, plays automatically.
- A **Skip** button appears after 2 seconds and jumps to the final message.
- The final message has a **Let's begin** button that opens the Quiz.
- Messages:
  1. You've tried to stop. More than once. / And every time, it pulled you back.
  2. You're not the only one. / Countless men fight this same battle in silence.
  3. That isn't who you are. / It's a cycle. And cycles can be broken.
  4. You don't have to fight this alone anymore. / Find strength in God's Word, one day at a time.
  5. Let's take the first step together. / A few honest questions. Your answers stay private.

### 3.2 Quiz
- Questions TBD.
- Must include: "How many days do you need to be porn-free and back on track?" The answer sets the **journey goal**.
- Must capture the user's **reasons for quitting** ("your why"), which are shown later in Panic.
- Answers are private.

### 3.3 Plan reveal
- Shows a personal plan based on the quiz answers. Details TBD.

### 3.4 Paywall
- Subscription screen. Plans and pricing TBD.
- Behaviour if the user closes without subscribing: TBD.

### 3.5 Sign up
- Required, right after the Paywall.
- Options: **Continue with Apple** and **Continue with Google**.
- Used to store user details, sync progress across devices and handle support queries.

---

## 4. App structure

### Bottom tabs
1. Home
2. Progress
3. Companion
4. Profile

### Other screens
- **Panic:** opened from Home
- **Daily Check-in:** opened from Home
- **Milestone Unlocked:** shown automatically when a rank is reached

---

## 5. Features

### 5.1 Home
- **Clean time:** shown as days, hours and minutes.
- **Journey progress:** e.g. Day 19 of 90.
- **Next milestone:** e.g. "Knight in 11 days".
- **Today's Scripture card:** starts the Daily Check-in and shows the Scripture streak. After completion it shows "Checked in ✓".
- **Panic button:** always visible.

### 5.2 Progress
- Journey completion: Day X of goal, and %
- Clean time: live timer
- Scripture streak
- Panic counter: number of times Panic was used
- Milestones: current rank, next rank and days left. Tapping opens the full list of earned and locked ranks.

### 5.3 Companion
- AI chat for support during urges and general guidance, grounded in Scripture.
- Opened from its tab, or from Panic with context passed in (the user is mid-urge).
- Safety rules (crisis detection and escalation): TBD.

### 5.4 Profile
- Change name
- Cancel subscription: opens App Store subscription management
- Rate us: opens the App Store rating page
- Help
- About us

### 5.5 Panic (urge flow)
A full-screen flow with no navigation; the user exits only by completing it.
1. **Breathe:** 60-second guided breathing.
2. **Your why:** shows the reasons the user gave in onboarding.
3. **Verse and prayer:** one verse for temptation and a short prayer, available as text and audio.
4. **Urge timer:** a 15-minute countdown with three options:
   - Talk to the Companion
   - Do something else (walk, push-ups, cold water, leave the room)
   - Read the verse again
5. **Check-out:** "Did you make it?"
   - **Yes:** logs an urge defeated (panic counter +1) and returns to Home.
   - **No:** opens the relapse log (trigger and time, both optional). Clean time resets, then returns to Home.

### 5.6 Daily Check-in
Finishing the reading is the check-in. Opening the app does not count.
1. Today's Scripture (one passage)
2. Reflection (a short explanation for today)
3. Prayer (text and audio)
4. Done: marks today as checked in, adds +1 to the Scripture streak and returns to Home

### 5.7 Milestone Unlocked
- Triggered when clean time reaches a rank threshold.
- Shows the new rank, the armour piece earned (if any) and a short verse.
- Returns to the previous screen when dismissed.

---

## 6. Metrics

| | Clean time | Scripture streak |
|---|---|---|
| Counts | Time since the quit date or last relapse | Consecutive days the check-in was completed |
| Increases | Automatically | Only when the reading is finished |
| Resets on | Relapse | A missed day |
| Drives | Journey, ranks, milestones | Daily habit |

- **Journey %** = clean days ÷ goal days.
- **Panic counter** = the number of Panic sessions that ended with "Yes, I made it".

---

## 7. Ranks (milestones)
Ranks are tied to clean time. Armour pieces follow Ephesians 6:14–17.

| Day | Rank | Earns |
|---|---|---|
| 1 | Initiate | — |
| 3 | Page | — |
| 7 | Squire | Belt of Truth |
| 14 | Man-at-Arms | Breastplate of Righteousness |
| 30 | Knight | Shoes of Peace |
| 50 | Sworn Knight | Shield of Faith |
| 75 | Knight of the Watch | Helmet of Salvation |
| 90 | Paladin | Sword of the Spirit |
| 120 | Champion | — |
| 150 | Guardian | — |
| 200 | Warden | — |
| 270 | Commander | — |
| 365 | Overcomer | — |

- The first time a rank is shown, include what it means (e.g. "Knight · 30 days clean").
- **Open:** after a relapse, does the rank stay or drop? (Recommendation: it stays.)

---

## 8. Navigation

| From | Action | To |
|---|---|---|
| First launch | Open app | Intro, then Quiz |
| Onboarding | Finish | Paywall |
| Paywall | Subscribe / close | Sign up |
| Sign up | Apple / Google | Home |
| Returning launch | Open app | Home |
| Any tab | Tap tab | Home / Progress / Companion / Profile |
| Home | Scripture card | Daily Check-in, then Home |
| Home | Panic | Panic flow |
| Panic | Talk to Companion | Companion |
| Panic | "Yes, I made it" | Home (panic counter +1) |
| Panic | "No" | Relapse log, then Home (clean time resets) |
| Progress | Milestones | Full rank list |
| Anywhere | Rank threshold reached | Milestone Unlocked, then back |
| Profile | Change name / Help / About | Respective screen |
| Profile | Cancel subscription / Rate us | App Store |

---

## 9. Suggested data model
- **User:** id, name, auth provider, created_at, subscription status
- **Journey:** user_id, goal_days, current_start (quit date or last relapse)
- **Reason:** user_id, text (from onboarding)
- **Relapse:** user_id, timestamp, trigger (optional), note (optional)
- **CheckIn:** user_id, date, passage_id, completed_at
- **PanicSession:** user_id, started_at, ended_at, outcome (made_it / relapsed), used_companion
- **RankUnlock:** user_id, rank_id, unlocked_at
- **Content:** passages (verse, reflection, prayer, audio), panic verses and prayers

Derived values:
- clean time = now − current_start
- streak = consecutive check-in dates
- rank = the highest threshold ≤ clean days

---

## 10. Tech stack
- **App:** React Native + Expo (iOS only).
- **Backend: Supabase**
  - Postgres database with per-user access rules (Row Level Security)
  - Apple and Google sign-in
  - File storage for prayer audio
  - Server (Edge) functions for the AI Companion proxy and the RevenueCat webhook
- **Subscriptions: RevenueCat** (StoreKit, paywall, receipt checks)
- **AI Companion:** OpenAI or Gemini, called only through a Supabase server function (the API key never ships in the app).
- **Why not Firebase:** it would also work, but the data is relational (events, streaks), so Postgres is the better fit.

---

## 11. Open items
- App name
- Quiz questions and plan reveal
- Paywall plans, pricing and close behaviour
- Companion AI: model, tone, safety rules
- Rank behaviour after a relapse
- Push notifications (reminders, high-risk hours)
- Analytics events
