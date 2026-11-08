import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  getRankForDays,
  getNextRank,
  RankItem,
  RANKS,
  EPHESIANS_ARMOR,
  ArmorPiece,
} from '@/constants/ranks';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/services/auth-service';
import { VigilBackupData } from '@/services/backup-service';
import { NotificationService } from '@/services/notification-service';

export interface RecoveryState {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean;
  cleanDays: number;
  cleanHours: number;
  cleanMinutes: number;
  cleanSeconds: number;
  goalDays: number;
  scriptureStreak: number;
  panicCount: number;
  isCheckedInToday: boolean;
  userName: string;
  reasons: string[];
  isSubscribed: boolean;
  activeRank: RankItem;
  highestEarnedRank: RankItem;
  unlockedRankIds: string[];
  unlockedArmor: (ArmorPiece & { isUnlocked: boolean })[];
  nextRankInfo: { nextRank: RankItem | null; daysRemaining: number };
  progressPercent: number;
  pendingMilestone: RankItem | null;
  currentStart: Date;
  // Actions
  completeCheckIn: (passageId?: string) => Promise<void>;
  recordPanicVictory: () => Promise<void>;
  recordRelapse: (trigger?: string, note?: string) => Promise<void>;
  dismissPendingMilestone: () => void;
  setSimulatedCleanDays: (days: number) => void;
  setGoalDays: (days: number) => void;
  setReasons: (reasons: string[]) => void;
  setUserName: (name: string) => void;
  updateUserName: (name: string) => Promise<void>;
  updateGoalDays: (days: number) => Promise<void>;
  addUserReason: (reason: string) => Promise<void>;
  deleteUserReason: (index: number) => Promise<void>;
  deleteAccountPermanently: () => Promise<void>;
  signOut: () => Promise<void>;
  toggleCheckInForTesting: () => void;
  resetDemoData: () => void;
  refreshUserData: () => Promise<void>;
  restoreFromBackup: (backup: VigilBackupData) => Promise<void>;
}

export const DEFAULT_REASONS = [
  'Walk in purity and honor God with my body',
  'Protect and honor my current or future marriage',
  'Reclaim mental clarity, dignity, and real confidence',
];

function calculateCheckInStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;

  const dateSet = new Set(dates);
  const now = new Date();

  const toLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = toLocalDateString(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  let checkDate = new Date(now);
  let streak = 0;

  if (dateSet.has(todayStr)) {
    while (dateSet.has(toLocalDateString(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  if (dateSet.has(yesterdayStr)) {
    checkDate = yesterday;
    while (dateSet.has(toLocalDateString(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  return 0;
}

const RecoveryContext = createContext<RecoveryState | undefined>(undefined);

export function RecoveryProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Recovery Metrics (initialized to clean 0 for real tracking)
  const [currentStart, setCurrentStart] = useState<Date>(new Date());
  const [cleanDays, setCleanDays] = useState(0);
  const [cleanHours, setCleanHours] = useState(0);
  const [cleanMinutes, setCleanMinutes] = useState(0);
  const [cleanSeconds, setCleanSeconds] = useState(0);
  const [goalDays, setGoalDays] = useState(90);
  const [scriptureStreak, setScriptureStreak] = useState(0);
  const [panicCount, setPanicCount] = useState(0);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [userName, setUserName] = useState('Brother in Christ');
  const [reasons, setReasons] = useState<string[]>(DEFAULT_REASONS);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [unlockedRankIds, setUnlockedRankIds] = useState<string[]>(['initiate']);
  const [pendingMilestone, setPendingMilestone] = useState<RankItem | null>(null);

  // Calculate clean time from currentStart timestamp (days, hours, minutes, seconds)
  const calculateCleanTime = (start: Date) => {
    const diffMs = Math.max(0, Date.now() - start.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;
    setCleanDays(days);
    setCleanHours(hours);
    setCleanMinutes(minutes);
    setCleanSeconds(seconds);
  };

  // Live timer tick every second for real-time countdown
  useEffect(() => {
    calculateCleanTime(currentStart);
    const timer = setInterval(() => {
      calculateCleanTime(currentStart);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStart]);

  // Load user data from Supabase
  const loadUserDataFromSupabase = async (activeUser: User) => {
    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (profile) {
        if (profile.name) setUserName(profile.name);
        setIsSubscribed(profile.subscription_status === 'active' || profile.subscription_status === 'trial');
      }

      // 2. Fetch Journey
      const { data: journey } = await supabase
        .from('journeys')
        .select('*')
        .eq('user_id', activeUser.id)
        .maybeSingle();

      let userCleanDays = 0;
      if (journey) {
        if (journey.goal_days) setGoalDays(journey.goal_days);
        if (journey.current_start) {
          const start = new Date(journey.current_start);
          setCurrentStart(start);
          calculateCleanTime(start);
          const diffMs = Math.max(0, Date.now() - start.getTime());
          userCleanDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }
      }

      // 3. Fetch Reasons
      const { data: userReasons } = await supabase
        .from('reasons')
        .select('text')
        .eq('user_id', activeUser.id)
        .order('display_order', { ascending: true });

      if (userReasons && userReasons.length > 0) {
        setReasons(userReasons.map((r) => r.text));
      }

      // 4. Fetch Check-ins & Compute Real Streak
      const { data: checkInRows } = await supabase
        .from('check_ins')
        .select('date')
        .eq('user_id', activeUser.id)
        .order('date', { ascending: false });

      if (checkInRows && checkInRows.length > 0) {
        const dates = checkInRows.map((c) => c.date);
        const streak = calculateCheckInStreak(dates);
        setScriptureStreak(streak);

        const todayStr = new Date().toISOString().split('T')[0];
        setIsCheckedInToday(dates.includes(todayStr));
      } else {
        setScriptureStreak(0);
        setIsCheckedInToday(false);
      }

      // 5. Fetch Panic Sessions count
      const { count: urgesConquered } = await supabase
        .from('panic_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', activeUser.id)
        .eq('outcome', 'made_it');

      if (typeof urgesConquered === 'number') {
        setPanicCount(urgesConquered);
      }

      // 6. Fetch Rank Unlocks & Auto-Unlock Qualified Ranks
      const { data: rankUnlocks } = await supabase
        .from('rank_unlocks')
        .select('rank_id')
        .eq('user_id', activeUser.id);

      const unlockedSet = new Set<string>(rankUnlocks?.map((r) => r.rank_id) || ['initiate']);

      // Auto-unlock ranks for which user qualifies
      const newlyEarned = RANKS.filter(
        (r) => userCleanDays >= r.day && !unlockedSet.has(r.id)
      );

      if (newlyEarned.length > 0) {
        for (const r of newlyEarned) {
          unlockedSet.add(r.id);
          await supabase.from('rank_unlocks').upsert(
            { user_id: activeUser.id, rank_id: r.id },
            { onConflict: 'user_id,rank_id' }
          );
        }
      }

      setUnlockedRankIds(Array.from(unlockedSet));
    } catch (err) {
      console.warn('Error loading Supabase user data:', err);
    }
  };

  // Listen to Supabase auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        loadUserDataFromSupabase(currentSession.user);
      }
      setIsLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await loadUserDataFromSupabase(newSession.user);
        }
        setIsLoadingAuth(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const activeRank = getRankForDays(cleanDays);

  const highestEarnedRank = useMemo(() => {
    let highest = RANKS[0];
    for (const rank of RANKS) {
      if (unlockedRankIds.includes(rank.id) || cleanDays >= rank.day) {
        highest = rank;
      }
    }
    return highest;
  }, [unlockedRankIds, cleanDays]);

  const unlockedArmor = useMemo(() => {
    return EPHESIANS_ARMOR.map((piece) => ({
      ...piece,
      isUnlocked: unlockedRankIds.includes(piece.rankId) || cleanDays >= piece.dayThreshold,
    }));
  }, [unlockedRankIds, cleanDays]);

  const nextRankInfo = getNextRank(cleanDays);
  const progressPercent = Math.min(100, Math.round((cleanDays / Math.max(1, goalDays)) * 100));

  const completeCheckIn = async (passageId?: string) => {
    if (!isCheckedInToday) {
      setIsCheckedInToday(true);
      setScriptureStreak((prev) => prev + 1);

      // Cancel evening reminder since user checked in today
      NotificationService.cancelEveningCheckIn().catch(() => {});

      if (user) {
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('check_ins').upsert(
          {
            user_id: user.id,
            date: todayStr,
            passage_id: passageId || null,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' }
        );
      }
    }
  };

  const recordPanicVictory = async () => {
    setPanicCount((prev) => prev + 1);

    if (user) {
      await supabase.from('panic_sessions').insert({
        user_id: user.id,
        outcome: 'made_it',
        started_at: new Date(Date.now() - 15 * 60000).toISOString(),
        ended_at: new Date().toISOString(),
      });
    }
  };

  const recordRelapse = async (trigger?: string, note?: string) => {
    const now = new Date();
    setCurrentStart(now);
    calculateCleanTime(now);

    if (user) {
      // 1. Log relapse record
      await supabase.from('relapses').insert({
        user_id: user.id,
        timestamp: now.toISOString(),
        trigger: trigger || null,
        note: note || null,
      });

      // 2. Log session outcome
      await supabase.from('panic_sessions').insert({
        user_id: user.id,
        outcome: 'relapsed',
        started_at: now.toISOString(),
        ended_at: now.toISOString(),
      });

      // 3. Reset current_start in journeys table
      await supabase
        .from('journeys')
        .update({ current_start: now.toISOString() })
        .eq('user_id', user.id);
    }
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
    setSession(null);
  };

  const updateUserName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    if (user) {
      await supabase.from('profiles').update({ name: trimmed }).eq('id', user.id);
    }
  };

  const updateGoalDays = async (days: number) => {
    setGoalDays(days);
    if (user) {
      await supabase.from('journeys').update({ goal_days: days }).eq('user_id', user.id);
    }
  };

  const addUserReason = async (reasonText: string) => {
    const trimmed = reasonText.trim();
    if (!trimmed) return;
    const updated = [...reasons, trimmed];
    setReasons(updated);
    if (user) {
      await supabase.from('reasons').insert({
        user_id: user.id,
        text: trimmed,
        display_order: updated.length - 1,
      });
    }
  };

  const deleteUserReason = async (index: number) => {
    const reasonToDelete = reasons[index];
    const updated = reasons.filter((_, idx) => idx !== index);
    setReasons(updated.length > 0 ? updated : DEFAULT_REASONS);
    if (user && reasonToDelete) {
      await supabase
        .from('reasons')
        .delete()
        .eq('user_id', user.id)
        .eq('text', reasonToDelete);
    }
  };

  const deleteAccountPermanently = async () => {
    if (user) {
      await supabase.from('reasons').delete().eq('user_id', user.id);
      await supabase.from('check_ins').delete().eq('user_id', user.id);
      await supabase.from('panic_sessions').delete().eq('user_id', user.id);
      await supabase.from('relapses').delete().eq('user_id', user.id);
      await supabase.from('rank_unlocks').delete().eq('user_id', user.id);
      await supabase.from('journeys').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
    }
    await AuthService.signOut();
    setUser(null);
    setSession(null);
    setCleanDays(0);
    setCleanHours(0);
    setCleanMinutes(0);
    setCleanSeconds(0);
    setScriptureStreak(0);
    setPanicCount(0);
    setIsCheckedInToday(false);
  };

  const toggleCheckInForTesting = () => {
    setIsCheckedInToday((prev) => !prev);
  };

  const dismissPendingMilestone = () => {
    setPendingMilestone(null);
  };

  const setSimulatedCleanDays = async (days: number) => {
    const simStart = new Date(Date.now() - days * 86400000 - 5 * 60000);
    setCurrentStart(simStart);
    calculateCleanTime(simStart);

    const newlyEarned = RANKS.filter(
      (r) => days >= r.day && !unlockedRankIds.includes(r.id)
    );

    if (newlyEarned.length > 0) {
      const highestNew = newlyEarned[newlyEarned.length - 1];
      setPendingMilestone(highestNew);
      const updatedIds = [...unlockedRankIds, ...newlyEarned.map((r) => r.id)];
      setUnlockedRankIds(updatedIds);

      if (user) {
        for (const nr of newlyEarned) {
          await supabase.from('rank_unlocks').upsert(
            { user_id: user.id, rank_id: nr.id },
            { onConflict: 'user_id,rank_id' }
          );
        }
      }
    }
  };

  const resetDemoData = () => {
    const defaultStart = new Date(Date.now() - 18 * 86400000 - 6 * 3600000 - 42 * 60000);
    setCurrentStart(defaultStart);
    calculateCleanTime(defaultStart);
    setGoalDays(90);
    setScriptureStreak(7);
    setPanicCount(3);
    setIsCheckedInToday(false);
    setReasons(DEFAULT_REASONS);
    setUnlockedRankIds(['initiate', 'page', 'squire', 'man-at-arms']);
  };

  const restoreFromBackup = async (backup: VigilBackupData) => {
    try {
      if (backup.userName) setUserName(backup.userName);
      if (backup.goalDays) setGoalDays(backup.goalDays);
      if (backup.scriptureStreak !== undefined) setScriptureStreak(backup.scriptureStreak);
      if (backup.panicCount !== undefined) setPanicCount(backup.panicCount);
      if (backup.reasons && Array.isArray(backup.reasons)) setReasons(backup.reasons);
      if (backup.unlockedRankIds && Array.isArray(backup.unlockedRankIds)) {
        setUnlockedRankIds(backup.unlockedRankIds);
      }
      if (backup.currentStart) {
        const parsedStart = new Date(backup.currentStart);
        if (!isNaN(parsedStart.getTime())) {
          setCurrentStart(parsedStart);
          calculateCleanTime(parsedStart);
        }
      }
    } catch (e) {
      console.warn('Error applying restored backup data:', e);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await loadUserDataFromSupabase(user);
    }
  };

  return (
    <RecoveryContext.Provider
      value={{
        user,
        session,
        isLoadingAuth,
        currentStart,
        cleanDays,
        cleanHours,
        cleanMinutes,
        cleanSeconds,
        goalDays,
        scriptureStreak,
        panicCount,
        isCheckedInToday,
        userName,
        reasons,
        isSubscribed,
        activeRank,
        highestEarnedRank,
        unlockedRankIds,
        unlockedArmor,
        nextRankInfo,
        progressPercent,
        pendingMilestone,
        completeCheckIn,
        recordPanicVictory,
        recordRelapse,
        dismissPendingMilestone,
        setSimulatedCleanDays,
        setGoalDays,
        setReasons,
        setUserName,
        updateUserName,
        updateGoalDays,
        addUserReason,
        deleteUserReason,
        deleteAccountPermanently,
        signOut,
        toggleCheckInForTesting,
        resetDemoData,
        refreshUserData,
        restoreFromBackup,
      }}>
      {children}
    </RecoveryContext.Provider>
  );
}

export function useRecovery() {
  const context = useContext(RecoveryContext);
  if (!context) {
    throw new Error('useRecovery must be used within a RecoveryProvider');
  }
  return context;
}

