-- ====================================================================
-- SUPABASE MIGRATION: Faith-based Porn Recovery App
-- Includes: User tables, Recovery tables, Content tables, RLS Policies,
--           Automatic Profile creation trigger, and Seed data.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE subscription_status_type AS ENUM ('free', 'trial', 'active', 'expired', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE panic_outcome_type AS ENUM ('made_it', 'relapsed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES / USERS TABLE
-- Mirrors auth.users and stores application-level profile details
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Brother in Christ',
  subscription_status subscription_status_type DEFAULT 'free',
  timezone TEXT DEFAULT 'UTC',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. JOURNEYS TABLE
-- Tracks the user's ongoing recovery run, goal days, and current start
CREATE TABLE IF NOT EXISTS public.journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_days INTEGER DEFAULT 90 NOT NULL,
  current_start TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_journey UNIQUE (user_id)
);

-- 5. REASONS TABLE ("Your Why")
-- Private reasons declared during onboarding and shown during urge panic
CREATE TABLE IF NOT EXISTS public.reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. RELAPSES TABLE (Zero Guilt)
-- Logs timestamp, optional trigger & note. Resets journey current_start.
CREATE TABLE IF NOT EXISTS public.relapses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  trigger TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. CHECK-INS TABLE
-- Completed daily scripture readings (1 per day drives consecutive streak)
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  passage_id TEXT,
  completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_daily_checkin UNIQUE (user_id, date)
);

-- 8. PANIC SESSIONS TABLE
-- Logs urge flow completions & outcomes
CREATE TABLE IF NOT EXISTS public.panic_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ended_at TIMESTAMPTZ,
  outcome panic_outcome_type NOT NULL,
  used_companion BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. RANK UNLOCKS TABLE
-- Permanent record of ranks attained (ranks never drop even after relapse)
CREATE TABLE IF NOT EXISTS public.rank_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_rank_unlock UNIQUE (user_id, rank_id)
);

-- 10. CONTENT: RANKS (Static reference)
CREATE TABLE IF NOT EXISTS public.ranks (
  id TEXT PRIMARY KEY,
  day_threshold INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  armor_piece TEXT,
  scripture_ref TEXT,
  description TEXT NOT NULL
);

-- 11. CONTENT: PASSAGES (Daily Check-in Readings)
CREATE TABLE IF NOT EXISTS public.passages (
  id TEXT PRIMARY KEY,
  day_number INTEGER NOT NULL,
  verse_ref TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  reflection_text TEXT NOT NULL,
  prayer_text TEXT NOT NULL,
  audio_url TEXT
);

-- 12. CONTENT: PANIC VERSES (Emergency Urge Truths)
CREATE TABLE IF NOT EXISTS public.panic_verses (
  id TEXT PRIMARY KEY,
  verse_ref TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  prayer_text TEXT NOT NULL,
  audio_url TEXT
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relapses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panic_verses ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Journeys: Users manage their own journey
CREATE POLICY "Users can read own journey"
  ON public.journeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey"
  ON public.journeys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey"
  ON public.journeys FOR UPDATE
  USING (auth.uid() = user_id);

-- Reasons: Users manage their own reasons
CREATE POLICY "Users can manage own reasons"
  ON public.reasons FOR ALL
  USING (auth.uid() = user_id);

-- Relapses: Users manage their own relapse records
CREATE POLICY "Users can manage own relapses"
  ON public.relapses FOR ALL
  USING (auth.uid() = user_id);

-- Check-ins: Users manage their own check-ins
CREATE POLICY "Users can manage own check-ins"
  ON public.check_ins FOR ALL
  USING (auth.uid() = user_id);

-- Panic Sessions: Users manage their own urge sessions
CREATE POLICY "Users can manage own panic sessions"
  ON public.panic_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Rank Unlocks: Users read and insert their own unlocked ranks
CREATE POLICY "Users can manage own rank unlocks"
  ON public.rank_unlocks FOR ALL
  USING (auth.uid() = user_id);

-- Content tables: Read-only for all authenticated & anon users
CREATE POLICY "Anyone can read ranks"
  ON public.ranks FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can read passages"
  ON public.passages FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can read panic verses"
  ON public.panic_verses FOR SELECT
  TO authenticated, anon
  USING (true);

-- ====================================================================
-- AUTOMATIC PROFILE & JOURNEY INITIALIZATION TRIGGER
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, subscription_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Brother in Christ'),
    'free'
  );

  INSERT INTO public.journeys (user_id, goal_days, current_start)
  VALUES (NEW.id, 90, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists then attach
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- SEED DATA: 13 RANKS (PRD §7 - Ephesians 6 Armour of God)
-- ====================================================================

INSERT INTO public.ranks (id, day_threshold, title, armor_piece, scripture_ref, description)
VALUES
  ('initiate', 1, 'Initiate', NULL, NULL, 'The journey begins. You have stood up and chosen the narrow path.'),
  ('page', 3, 'Page', NULL, NULL, 'First trials overcome. Humility and vigilance take root.'),
  ('squire', 7, 'Squire', 'Belt of Truth', 'Ephesians 6:14', 'Stand firm then, with the belt of truth buckled around your waist.'),
  ('man-at-arms', 14, 'Man-at-Arms', 'Breastplate of Righteousness', 'Ephesians 6:14', 'With the breastplate of righteousness in place, protecting your heart.'),
  ('knight', 30, 'Knight', 'Shoes of Peace', 'Ephesians 6:15', 'Feet fitted with the readiness that comes from the gospel of peace.'),
  ('sworn-knight', 50, 'Sworn Knight', 'Shield of Faith', 'Ephesians 6:16', 'Take up the shield of faith, with which you can extinguish all flaming arrows.'),
  ('knight-of-watch', 75, 'Knight of the Watch', 'Helmet of Salvation', 'Ephesians 6:17', 'Take the helmet of salvation, guarding your mind in Christ.'),
  ('paladin', 90, 'Paladin', 'Sword of the Spirit', 'Ephesians 6:17', 'Take the sword of the Spirit, which is the living word of God.'),
  ('champion', 120, 'Champion', NULL, NULL, 'Steadfast in the fires of discipline. A light to those who waver.'),
  ('guardian', 150, 'Guardian', NULL, NULL, 'Protector of the fortress of your mind and heart.'),
  ('warden', 200, 'Warden', NULL, NULL, 'The desires of old have lost their dominion.'),
  ('commander', 270, 'Commander', NULL, NULL, 'Tested in the valley and crowned on the heights.'),
  ('overcomer', 365, 'Overcomer', NULL, 'Romans 8:37', 'A full year walked in light. More than a conqueror through Him who loved us.')
ON CONFLICT (id) DO NOTHING;

-- Initial Seed Panic Verses
INSERT INTO public.panic_verses (id, verse_ref, verse_text, prayer_text)
VALUES
  (
    'pv-1',
    'James 4:7–8',
    'Submit yourselves, then, to God. Resist the devil, and he will flee from you. Come near to God and he will come near to you.',
    'Lord Jesus, an urge is pressing upon my flesh. I submit to You. Strengthen my heart and cause the enemy to flee.'
  ),
  (
    'pv-2',
    '1 Corinthians 10:13',
    'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear.',
    'Father, thank You that this urge is not greater than Your grace. Provide the way out right now as I turn to You.'
  )
ON CONFLICT (id) DO NOTHING;

