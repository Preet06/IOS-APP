import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Switch,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  G,
  Polygon,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import { useRecovery } from '@/context/recovery-context';
import { VigilBackground } from '@/components/vigil-background';
import { NotificationService } from '@/services/notification-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PostQuizStep =
  | 'calculating'
  | 'result'
  | 'symptoms'
  | 'reminders'
  | 'truth'
  | 'path'
  | 'goals'
  | 'vows-intro'
  | 'vows'
  | 'vows-sworn'
  | 'rate'
  | 'plan';

const REMINDER_ENABLED_KEY = 'vigil_single_reminder_enabled_v1';

const STAR_DOTS = [
  { x: '12%', y: '9%', r: 1.2, o: 0.45 },
  { x: '28%', y: '14%', r: 1.5, o: 0.6 },
  { x: '76%', y: '11%', r: 1.2, o: 0.5 },
  { x: '88%', y: '19%', r: 1.6, o: 0.4 },
  { x: '18%', y: '27%', r: 1.1, o: 0.35 },
  { x: '64%', y: '24%', r: 1.4, o: 0.55 },
  { x: '84%', y: '36%', r: 1.2, o: 0.45 },
  { x: '9%', y: '44%', r: 1.5, o: 0.3 },
  { x: '42%', y: '48%', r: 1.1, o: 0.4 },
  { x: '73%', y: '53%', r: 1.3, o: 0.35 },
  { x: '22%', y: '66%', r: 1.2, o: 0.3 },
  { x: '81%', y: '71%', r: 1.4, o: 0.4 },
];

const SYMPTOM_GROUPS = [
  {
    id: 'faith',
    title: 'FAITH',
    icon: 'cross',
    items: [
      'Feeling far from God',
      'Weighed down by guilt and shame',
      'Praying and reading less',
      'Drifting from church',
      'An emptiness inside',
    ],
  },
  {
    id: 'mind',
    title: 'MIND',
    icon: 'mind',
    items: [
      "Foggy and can't focus",
      'More anxious or down',
      'Low motivation and energy',
      'Mood swings and irritability',
      'Hard to find joy in daily life',
    ],
  },
  {
    id: 'relationships',
    title: 'RELATIONSHIPS & BODY',
    icon: 'heart',
    items: [
      'Pulling away from people I love',
      'Trouble sleeping at night',
      'Drained of physical energy',
    ],
  },
];

interface TruthSlide {
  id: string;
  headline: string;
  subtitle: string;
}

const TRUTH_SLIDES: TruthSlide[] = [
  {
    id: 'brain',
    headline: 'Porn rewires your\nbrain.',
    subtitle: 'Each hit carves the craving deeper.',
  },
  {
    id: 'cycle',
    headline: 'It chains you to a\ncycle.',
    subtitle: 'Temptation. Guilt. Shame. Repeat.',
  },
  {
    id: 'strength',
    headline: 'It breaks your\nstrength.',
    subtitle: 'Energy, focus and desire fade.',
  },
  {
    id: 'god',
    headline: 'It pulls you from\nGod.',
    subtitle: 'Shame makes Him feel far away.',
  },
  {
    id: 'break',
    headline: 'But the chain can\nbreak.',
    subtitle: 'With God, freedom starts today.',
  },
];

// 12 chain links arranged clockwise starting from top (-90 deg)
const CHAIN_ANGLES = [-90, -60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240];
const CYCLE_WORDS = ['TEMPTATION', 'GUILT', 'SHAME', 'REPEAT'];

const PATH_MILESTONES = [
  {
    id: 'page',
    tag: 'TODAY · PAGE',
    title: 'Your vigil begins.',
    active: true,
  },
  {
    id: 'squire',
    tag: 'DAY 7 · SQUIRE',
    title: 'Urges start to lose their grip.',
    active: false,
  },
  {
    id: 'knight',
    tag: 'DAY 30 · KNIGHT',
    title: 'A clearer mind and more energy.',
    active: false,
  },
  {
    id: 'banneret',
    tag: 'DAY 90 · KNIGHT BANNERET',
    title: 'Your brain resets. Desire returns.',
    active: false,
  },
  {
    id: 'overcomer',
    tag: 'DAY 365 · OVERCOMER',
    title: 'Free, and closer to God than ever.',
    active: false,
  },
];

const GOAL_OPTIONS = [
  { id: 'temptation', label: 'Victory over temptation', icon: 'shield' },
  { id: 'faith', label: 'A deeper faith', icon: 'cross' },
  { id: 'prayer', label: 'A real prayer life', icon: 'book' },
  { id: 'thoughts', label: 'Pure thoughts', icon: 'lightbulb' },
  { id: 'control', label: 'Self-control that lasts', icon: 'spark' },
  { id: 'energy', label: 'More energy and drive', icon: 'bolt' },
  { id: 'mood', label: 'A steadier mood', icon: 'smile' },
  { id: 'relationships', label: 'Stronger relationships', icon: 'heart' },
] as const;

type GoalIconType = (typeof GOAL_OPTIONS)[number]['icon'];

interface VowItem {
  eyebrow: string;
  headline: string;
  verse: string;
  reference: string;
  holdLabel: string;
}

const VOW_ITEMS: VowItem[] = [
  {
    eyebrow: 'VOW 1 OF 5',
    headline: 'I will lean on God’s\nstrength, not my own.',
    verse: 'Not by might, nor by power, but by my\nspirit, saith the LORD of hosts.',
    reference: 'ZECHARIAH 4:6',
    holdLabel: 'Hold to make this vow',
  },
  {
    eyebrow: 'VOW 2 OF 5',
    headline: 'I will guard my eyes, my\nmind and my heart.',
    verse: 'I will set no wicked thing before mine eyes.',
    reference: 'PSALM 101:3',
    holdLabel: 'Hold to make this vow',
  },
  {
    eyebrow: 'VOW 3 OF 5',
    headline: 'I will choose self-control,\none day at a time.',
    verse:
      'For God hath not given us the spirit of\nfear; but of power, and of love, and of a\nsound mind.',
    reference: '2 TIMOTHY 1:7',
    holdLabel: 'Hold to make this vow',
  },
  {
    eyebrow: 'VOW 4 OF 5',
    headline: 'I will remember I am\nnever alone.',
    verse:
      'God is faithful, who will not suffer you to\nbe tempted above that ye are able.',
    reference: '1 CORINTHIANS 10:13',
    holdLabel: 'Hold to make this vow',
  },
  {
    eyebrow: 'LAST VOW',
    headline: 'Seal it with a prayer.',
    verse:
      'Lord, I can’t win this in my own strength.\nGuard my eyes, purify my heart, and be\nmy strength when I am weak. I give this\nfight to You.',
    reference: '',
    holdLabel: 'Hold to say Amen',
  },
];

// Starlight motes around the downward-pointing Vows sword (viewBox 0 0 140 230)
const SWORD_SPARKLES = [
  { cx: 81, cy: 40, r: 1.5, minLevel: 0.15 },
  { cx: 61, cy: 112, r: 1.2, minLevel: 0.18 },
  { cx: 78, cy: 92, r: 1.1, minLevel: 0.22 },
  { cx: 63, cy: 138, r: 1.3, minLevel: 0.25 },
  { cx: 82, cy: 16, r: 1.4, minLevel: 0.35 },
  { cx: 76, cy: 76, r: 1.3, minLevel: 0.38 },
  { cx: 60, cy: 128, r: 1.4, minLevel: 0.42 },
  { cx: 64, cy: 146, r: 1.1, minLevel: 0.48 },
  { cx: 77, cy: 162, r: 1.2, minLevel: 0.52 },
  { cx: 80, cy: 84, r: 1.5, minLevel: 0.6 },
  { cx: 62, cy: 118, r: 1.3, minLevel: 0.65 },
  { cx: 79, cy: 148, r: 1.2, minLevel: 0.72 },
];

const REVIEW_CARDS = [
  {
    id: 'r1',
    title: 'Day 41 and still standing',
    timeAgo: '2d ago',
    author: 'Anonymous',
    body: 'Longest I’ve gone since I was 14. The morning reading is the first thing I open now, before anything else. It keeps me honest.',
  },
  {
    id: 'r2',
    title: 'God centered and real',
    timeAgo: '5d ago',
    author: 'Anonymous',
    body: 'Hit the Help button at 1am last night when the urge came out of nowhere. Breathing + Scripture pulled me right back. A real lifeline. Not just another streak counter.',
  },
  {
    id: 'r3',
    title: 'Finally free of the shame',
    timeAgo: '1w ago',
    author: 'Anonymous',
    body: 'Taking my vows and holding the line one day at a time changed everything for my marriage and my walk with God.',
  },
];

// 7 miniature glowing swords along the horizon on Onboarding · 11 · Rate Vigil
const HORIZON_SWORDS = [
  { x: 34, topY: 36, h: 36, o: 0.45 },
  { x: 82, topY: 26, h: 42, o: 0.65 },
  { x: 130, topY: 18, h: 48, o: 0.82 },
  { x: 180, topY: 12, h: 52, o: 1.0 },
  { x: 230, topY: 18, h: 48, o: 0.82 },
  { x: 278, topY: 26, h: 42, o: 0.65 },
  { x: 326, topY: 36, h: 36, o: 0.45 },
];

const ARSENAL_ITEMS = [
  { id: 'orders', label: 'Daily orders', icon: 'book', highlight: false },
  { id: 'help', label: 'Help now', icon: 'shield', highlight: true },
  { id: 'rank', label: 'Rank path', icon: 'trend', highlight: false },
  { id: 'prayer', label: 'Daily prayer', icon: 'cross', highlight: false },
  { id: 'lapse', label: 'Lapse log', icon: 'clock', highlight: false },
  { id: 'progress', label: 'Progress', icon: 'chart', highlight: false },
] as const;

export default function PlanRevealScreen() {
  const router = useRouter();
  const { userName, reasons, setReasons } = useRecovery();
  const displayName =
    userName && userName !== 'Brother in Christ' ? userName : 'John';

  const [step, setStep] = useState<PostQuizStep>('calculating');
  const [calcPct, setCalcPct] = useState(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>({});
  const [selectedGoals, setSelectedGoals] = useState<Record<string, boolean>>({});
  const [remindersOn, setRemindersOn] = useState(true);

  // Onboarding · 7 · Truth Slider State
  const [truthIndex, setTruthIndex] = useState(0);
  const truthScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // Slide 2 ("cycle"): Active glowing link index (0..11) orbiting in a circle
  const [activeChainStep, setActiveChainStep] = useState(0);

  // Onboarding · 10 · Vows State
  const [vowIndex, setVowIndex] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHoldingVow, setIsHoldingVow] = useState(false);
  const vowCompletedRef = useRef(false);

  // Onboarding · 12 · Live Plan Timer (starts at 00:07:24 = 444s)
  const [planTimerSecs, setPlanTimerSecs] = useState(444);

  // Reanimated shared values for Truth Slider & Vows animations
  const brainPulse = useSharedValue(0.4);
  const shieldBreak = useSharedValue(0); // 0 = intact, 0.25 = crack flash, 1 = split apart
  const godEclipse = useSharedValue(0);
  const chainBreak = useSharedValue(0);
  const vowSwordPulse = useSharedValue(0);

  // Step 1: Animate Calculating 0% -> 100%
  useEffect(() => {
    if (step !== 'calculating') return;
    const interval = setInterval(() => {
      setCalcPct((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 55);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === 'calculating' && calcPct >= 100) {
      const timer = setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep('result');
      }, 480);
      return () => clearTimeout(timer);
    }
  }, [step, calcPct]);

  // Slide 2: Orbit the light around the 12 chain links continuously
  useEffect(() => {
    if (step !== 'truth') return;
    const orbitTimer = setInterval(() => {
      setActiveChainStep((prev) => (prev + 1) % CHAIN_ANGLES.length);
    }, 240);
    return () => clearInterval(orbitTimer);
  }, [step]);

  // Trigger Reanimated animations for the active slide in Onboarding · 7
  useEffect(() => {
    if (step !== 'truth') return;

    // Slide 1: Neural wave glow pulse
    brainPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Slide 3: Shield starts whole -> cracks -> splits apart -> holds -> resets
    shieldBreak.value = 0;
    shieldBreak.value = withRepeat(
      withSequence(
        // Hold whole shield briefly
        withTiming(0, { duration: 550 }),
        // Crack flash appears down the center
        withTiming(0.3, { duration: 220, easing: Easing.out(Easing.quad) }),
        // Shield halves crack and break apart
        withTiming(1, { duration: 680, easing: Easing.out(Easing.back(1.2)) }),
        // Hold broken state
        withDelay(1400, withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }))
      ),
      -1,
      false
    );

    // Slide 4: Dark eclipse pulsing over cross
    godEclipse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Slide 5: Chains snapping apart & light rays blooming
    chainBreak.value = 0;
    chainBreak.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 750, easing: Easing.out(Easing.back(1.3)) }),
        withDelay(1600, withTiming(0, { duration: 450, easing: Easing.inOut(Easing.quad) }))
      ),
      -1,
      false
    );
  }, [step, truthIndex, brainPulse, shieldBreak, godEclipse, chainBreak]);

  // Animated styles for Slide 1 (Brain)
  const animatedBrainGlowStyle = useAnimatedStyle(() => ({
    opacity: brainPulse.value,
    transform: [{ scale: interpolate(brainPulse.value, [0.35, 1], [0.96, 1.05]) }],
  }));

  // Animated styles for Slide 3 (Shield cracking & breaking apart)
  const animatedLeftShieldStyle = useAnimatedStyle(() => {
    const splitProgress = interpolate(shieldBreak.value, [0, 0.3, 1], [0, 0, 1]);
    return {
      transform: [
        { translateX: interpolate(splitProgress, [0, 1], [10, -8]) },
        { translateY: interpolate(splitProgress, [0, 1], [0, 4]) },
        { rotate: `${interpolate(splitProgress, [0, 1], [0, -8])}deg` },
      ],
    };
  });

  const animatedRightShieldStyle = useAnimatedStyle(() => {
    const splitProgress = interpolate(shieldBreak.value, [0, 0.3, 1], [0, 0, 1]);
    return {
      transform: [
        { translateX: interpolate(splitProgress, [0, 1], [-10, 10]) },
        { translateY: interpolate(splitProgress, [0, 1], [0, 6]) },
        { rotate: `${interpolate(splitProgress, [0, 1], [0, 8.5])}deg` },
      ],
    };
  });

  const animatedCrackFlashStyle = useAnimatedStyle(() => {
    const flashOpacity = interpolate(
      shieldBreak.value,
      [0, 0.15, 0.32, 0.65, 1],
      [0, 0.95, 1, 0.25, 0]
    );
    return {
      opacity: flashOpacity,
    };
  });

  // Animated styles for Slide 4 (Pulls from God)
  const animatedCrossDimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(godEclipse.value, [0, 1], [0.85, 0.32]),
    transform: [{ scale: interpolate(godEclipse.value, [0, 1], [1, 0.92]) }],
  }));

  // Animated styles for Slide 5 (Chains breaking + Light rays)
  const animatedRaysStyle = useAnimatedStyle(() => ({
    opacity: interpolate(chainBreak.value, [0, 0.3, 1], [0.25, 0.7, 1]),
    transform: [{ scaleY: interpolate(chainBreak.value, [0, 1], [0.7, 1.04]) }],
  }));

  const animatedLeftChainStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(chainBreak.value, [0, 1], [12, -8]) },
      { translateY: interpolate(chainBreak.value, [0, 1], [0, 4]) },
      { rotate: `${interpolate(chainBreak.value, [0, 1], [-2, -16])}deg` },
    ],
  }));

  const animatedRightChainStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(chainBreak.value, [0, 1], [-12, 8]) },
      { translateY: interpolate(chainBreak.value, [0, 1], [0, 4]) },
      { rotate: `${interpolate(chainBreak.value, [0, 1], [2, 16])}deg` },
    ],
  }));

  // Onboarding · 10 · Vows: Continuous subtle breathing shimmer on Vows 1..5 & Vows Sworn (static on vows-intro)
  useEffect(() => {
    if (step !== 'vows' && step !== 'vows-sworn') {
      vowSwordPulse.value = 0;
      return;
    }
    vowSwordPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [step, vowSwordPulse]);

  const animatedVowAuraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(vowSwordPulse.value, [0, 1], [0.78, 1]),
    transform: [
      { scale: interpolate(vowSwordPulse.value, [0, 1], [0.96, 1.06]) },
    ],
  }));

  const animatedVowSparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(vowSwordPulse.value, [0, 1], [0.55, 1]),
    transform: [
      { translateY: interpolate(vowSwordPulse.value, [0, 1], [1.5, -2.5]) },
    ],
  }));

  // Onboarding · 10 · Vows: Press-and-hold progression on the shield button
  useEffect(() => {
    if (step !== 'vows') return;

    if (!isHoldingVow) {
      if (!vowCompletedRef.current && holdProgress > 0) {
        const decayTimer = setInterval(() => {
          setHoldProgress((prev) => {
            if (prev <= 0.06) {
              clearInterval(decayTimer);
              return 0;
            }
            return prev - 0.06;
          });
        }, 20);
        return () => clearInterval(decayTimer);
      }
      return;
    }

    const holdTimer = setInterval(() => {
      setHoldProgress((prev) => {
        const next = Math.min(1, prev + 0.032);
        // Subtle haptic ticks at 30%, 60%, 90%
        if (
          (prev < 0.3 && next >= 0.3) ||
          (prev < 0.6 && next >= 0.6) ||
          (prev < 0.9 && next >= 0.9)
        ) {
          Haptics.selectionAsync();
        }
        return next;
      });
    }, 30);

    return () => clearInterval(holdTimer);
  }, [step, isHoldingVow, holdProgress]);

  // Complete current vow when holdProgress reaches 1
  useEffect(() => {
    if (step !== 'vows') return;
    if (holdProgress >= 1 && !vowCompletedRef.current) {
      vowCompletedRef.current = true;
      setIsHoldingVow(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const transitionTimer = setTimeout(() => {
        if (vowIndex < VOW_ITEMS.length - 1) {
          setVowIndex((prev) => prev + 1);
          setHoldProgress(0);
          vowCompletedRef.current = false;
        } else {
          setHoldProgress(0);
          vowCompletedRef.current = false;
          setStep('vows-sworn');
        }
      }, 220);

      return () => clearTimeout(transitionTimer);
    }
  }, [step, holdProgress, vowIndex]);

  const startHoldVow = () => {
    if (vowCompletedRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsHoldingVow(true);
  };

  const stopHoldVow = () => {
    setIsHoldingVow(false);
  };

  // Onboarding · 12 · Live Plan Timer ticking every second
  useEffect(() => {
    if (step !== 'plan') return;
    const timer = setInterval(() => {
      setPlanTimerSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatTimerHms = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const renderArsenalIcon = (icon: string, highlight: boolean) => {
    const strokeColor = highlight ? '#E6ECFA' : '#8FA0D0';
    switch (icon) {
      case 'book':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="5" y="3" width="14" height="18" rx="2.5" />
            <Path d="M9 8h6M9 12h6" />
          </Svg>
        );
      case 'shield':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2L20 5.5V12C20 17 16.5 20.6 12 22.5C7.5 20.6 4 17 4 12V5.5L12 2Z" />
          </Svg>
        );
      case 'trend':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M7 17L17 7M11 7h6v6" />
          </Svg>
        );
      case 'cross':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round">
            <Path d="M12 3v18M7 8h10" />
          </Svg>
        );
      case 'clock':
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 7v5l3 2" />
          </Svg>
        );
      case 'chart':
      default:
        return (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 20V14M12 20V8M18 20V11" />
          </Svg>
        );
    }
  };

  const toggleSymptom = (item: string) => {
    Haptics.selectionAsync();
    setSelectedSymptoms((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const selectedSymptomCount = Object.values(selectedSymptoms).filter(Boolean).length;

  const saveReminderPref = async (enabled: boolean) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(REMINDER_ENABLED_KEY, String(enabled));
        }
      } else {
        await SecureStore.setItemAsync(REMINDER_ENABLED_KEY, String(enabled));
      }
    } catch {
      // Ignore storage error
    }
  };

  const handleTurnOnReminders = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveReminderPref(true);
    await NotificationService.scheduleEarlyMorningReminder(7, 0).catch(() => {});
    await NotificationService.scheduleEveningCheckIn(20, 0).catch(() => {});
    setTruthIndex(0);
    setStep('truth');
  };

  const handleSkipReminders = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveReminderPref(false);
    setTruthIndex(0);
    setStep('truth');
  };

  const handleTruthMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const clamped = Math.max(0, Math.min(TRUTH_SLIDES.length - 1, idx));
    if (clamped !== truthIndex) {
      Haptics.selectionAsync();
      setTruthIndex(clamped);
    }
  };

  const handleNextTruthSlide = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (truthIndex < TRUTH_SLIDES.length - 1) {
      const nextIdx = truthIndex + 1;
      setTruthIndex(nextIdx);
      truthScrollRef.current?.scrollTo({ x: nextIdx * SCREEN_WIDTH, animated: true });
    } else {
      setStep('path');
    }
  };

  const toggleGoal = (label: string) => {
    Haptics.selectionAsync();
    setSelectedGoals((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const selectedGoalList = GOAL_OPTIONS.map((g) => g.label).filter(
    (label) => !!selectedGoals[label]
  );

  const handleFinishGoals = async () => {
    if (selectedGoalList.length === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setReasons(selectedGoalList);
    setVowIndex(0);
    setHoldProgress(0);
    vowCompletedRef.current = false;
    setStep('vows-intro');
  };

  const renderVowsSword = (isIntroStatic: boolean, isSwornComplete = false) => {
    // Effective sword illumination level from 0 (unlit wireframe) to 1 (fully radiant)
    // On vows-intro: 0 (completely static wireframe).
    // On vows (Vow 1..5): starts at vowIndex / 4.2 and brightens smoothly while holding the shield button!
    // On vows-sworn: 1 (100% full celestial radiance).
    const rawLevel = isIntroStatic
      ? 0
      : isSwornComplete
        ? 1
        : Math.min(1, (vowIndex + holdProgress * 1.15) / 4.2);

    // Mid-blade core ignition (starts during Vow 1 hold, prominent in Vow 2)
    const midBladeOpacity = isIntroStatic
      ? 0
      : Math.min(1, Math.max(0.08, rawLevel * 1.65));

    // Upper blade + hilt/pommel ignition (prominent in Vow 3+)
    const hiltAndUpperOpacity = isIntroStatic
      ? 0
      : Math.min(1, Math.max(0, (rawLevel - 0.22) * 1.6));

    // Full blade down to tip + crossguard ignition (prominent in Vow 4 & 5)
    const fullSwordRadiance = isIntroStatic
      ? 0
      : Math.min(1, Math.max(0, (rawLevel - 0.48) * 1.85));

    // Soft outer halo behind the sword
    const haloOpacity = isIntroStatic
      ? 0
      : Math.min(0.62, 0.08 + rawLevel * 0.52);

    const outlineStroke =
      rawLevel > 0.65
        ? '#DCE6FF'
        : rawLevel > 0.3
          ? '#8FA6E8'
          : '#4E65AA';

    return (
      <View style={styles.vowSwordContainer}>
        {/* Animated Soft Radial Aura Behind the Sword (Only on Vows 1..5) */}
        {!isIntroStatic && (
          <Animated.View
            style={[
              styles.vowSwordAura,
              animatedVowAuraStyle,
              {
                opacity: haloOpacity,
                transform: [{ scale: 0.9 + rawLevel * 0.28 }],
              },
            ]}
            pointerEvents="none"
          />
        )}

        <Svg width={140} height={232} viewBox="0 0 140 232">
          <Defs>
            {/* Mid-Blade Core Glow (Vow 2 look) */}
            <SvgLinearGradient id="vowMidBladeGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#8FA6E8" stopOpacity="0" />
              <Stop offset="25%" stopColor="#C5D4F7" stopOpacity="0.65" />
              <Stop offset="48%" stopColor="#FFF8E6" stopOpacity="1" />
              <Stop offset="72%" stopColor="#C5D4F7" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#8FA6E8" stopOpacity="0" />
            </SvgLinearGradient>

            {/* Extended Blade & Hilt Glow (Vow 3 & 4 look) */}
            <SvgLinearGradient id="vowFullBladeGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.95" />
              <Stop offset="45%" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="85%" stopColor="#DCE6FF" stopOpacity="0.92" />
              <Stop offset="100%" stopColor="#FFF8E6" stopOpacity="0.95" />
            </SvgLinearGradient>
          </Defs>

          {/* Base Wireframe Sword (Always present) */}
          {/* Pommel */}
          <Circle
            cx="70"
            cy="15"
            r="6.2"
            fill="rgba(16, 30, 82, 0.55)"
            stroke={outlineStroke}
            strokeWidth={1.3}
          />
          <Circle
            cx="70"
            cy="15"
            r="3.6"
            fill="none"
            stroke={outlineStroke}
            strokeWidth={0.9}
            opacity={0.7}
          />

          {/* Grip */}
          <Path
            d="M67.6 21.5 L72.4 21.5 L72.8 50 L67.2 50 Z"
            fill="rgba(16, 30, 82, 0.55)"
            stroke={outlineStroke}
            strokeWidth={1.3}
          />
          {/* Guard Collar */}
          <Rect
            x="65.5"
            y="49.5"
            width="9"
            height="4.5"
            rx="1.2"
            fill="rgba(22, 40, 100, 0.7)"
            stroke={outlineStroke}
            strokeWidth={1.2}
          />

          {/* Curved Crossguard */}
          <Path
            d="M42 58 Q46 53.5 70 53.5 Q94 53.5 98 58 L96.5 60 Q92 56.5 70 56.5 Q48 56.5 43.5 60 Z"
            fill="rgba(16, 30, 82, 0.6)"
            stroke={outlineStroke}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />

          {/* Main Downward Blade */}
          <Path
            d="M65.2 56.5 L74.8 56.5 L73.4 194 L70 218 L66.6 194 Z"
            fill="rgba(16, 30, 82, 0.45)"
            stroke={outlineStroke}
            strokeWidth={1.35}
            strokeLinejoin="round"
          />

          {/* Center Fuller Line */}
          <Path
            d="M70 57 V206"
            stroke={outlineStroke}
            strokeWidth={1}
            opacity={0.65}
          />

          {/* ── PROGRESSIVE ILLUMINATION LAYERS (VOWS 1..5) ── */}
          {!isIntroStatic && (
            <G>
              {/* Layer 1: Mid-blade luminous core (Ignites during Vow 1 hold -> Vow 2) */}
              <Ellipse
                cx="70"
                cy="118"
                rx={6.5 + rawLevel * 4}
                ry={34 + rawLevel * 26}
                fill="rgba(197, 212, 247, 0.16)"
                opacity={midBladeOpacity}
              />
              <Path
                d="M66.2 72 L73.8 72 L73 172 L67 172 Z"
                fill="url(#vowMidBladeGrad)"
                opacity={midBladeOpacity}
              />
              <Ellipse
                cx="70"
                cy="116"
                rx="3.2"
                ry="16"
                fill="#FFF8E6"
                opacity={midBladeOpacity}
              />

              {/* Layer 2: Hilt, Pommel & Extended Blade Column (Vow 3+) */}
              {hiltAndUpperOpacity > 0 && (
                <G opacity={hiltAndUpperOpacity}>
                  <Ellipse
                    cx="70"
                    cy="34"
                    rx="7.5"
                    ry="20"
                    fill="rgba(255, 248, 230, 0.22)"
                  />
                  <Circle cx="70" cy="15" r="4.5" fill="#F6ECD2" />
                  <Path
                    d="M68.2 21.5 L71.8 21.5 L72 50 L68 50 Z"
                    fill="#FFF8E6"
                  />
                  <Path
                    d="M66 57 L74 57 L73 196 L70 215 L67 196 Z"
                    fill="url(#vowFullBladeGrad)"
                    opacity={0.78}
                  />
                </G>
              )}

              {/* Layer 3: Full Sword Radiance — Crossguard + Tip + Bright Halo (Vow 4 & 5) */}
              {fullSwordRadiance > 0 && (
                <G opacity={fullSwordRadiance}>
                  <Ellipse
                    cx="70"
                    cy="128"
                    rx="13"
                    ry="86"
                    fill="rgba(255, 248, 230, 0.2)"
                  />
                  <Path
                    d="M43 57.8 Q47 54 70 54 Q93 54 97 57.8"
                    stroke="#FFF8E6"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <Path
                    d="M65.6 56.5 L74.4 56.5 L73.3 194 L70 218 L66.7 194 Z"
                    fill="url(#vowFullBladeGrad)"
                    stroke="#FFFFFF"
                    strokeWidth={1.4}
                  />
                  {isSwornComplete && (
                    <G>
                      <Circle
                        cx="70"
                        cy="201"
                        r="8"
                        fill="rgba(246, 236, 210, 0.38)"
                      />
                      <Path
                        d="M70 193 L71.4 199.6 L78 201 L71.4 202.4 L70 209 L68.6 202.4 L62 201 L68.6 199.6 Z"
                        fill="#FFF8E6"
                      />
                    </G>
                  )}
                </G>
              )}
            </G>
          )}
        </Svg>

        {/* Animated Twinkling Starlight Motes Around Sword (Only on Vows 1..5) */}
        {!isIntroStatic && (
          <Animated.View
            style={[StyleSheet.absoluteFill, animatedVowSparkleStyle]}
            pointerEvents="none"
          >
            <Svg width={140} height={232} viewBox="0 0 140 232">
              {SWORD_SPARKLES.map((sp, idx) => {
                const visible = rawLevel >= sp.minLevel;
                if (!visible) return null;
                const moteAlpha = Math.min(
                  0.95,
                  (rawLevel - sp.minLevel) * 3.2 + 0.35
                );
                return (
                  <Circle
                    key={idx}
                    cx={sp.cx}
                    cy={sp.cy}
                    r={sp.r}
                    fill="#F6ECD2"
                    opacity={moteAlpha}
                  />
                );
              })}
            </Svg>
          </Animated.View>
        )}
      </View>
    );
  };

  const renderGoalIcon = (icon: GoalIconType, isPicked: boolean) => {
    const strokeColor = isPicked ? '#F6ECD2' : '#4056A1';
    switch (icon) {
      case 'shield':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2L20 5.5V12C20 17 16.5 20.6 12 22.5C7.5 20.6 4 17 4 12V5.5L12 2Z" />
          </Svg>
        );
      case 'cross':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.9} strokeLinecap="round">
            <Path d="M12 3v18M7 8h10" />
          </Svg>
        );
      case 'book':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Rect x="5" y="3" width="14" height="18" rx="2.5" />
            <Path d="M12 7v7M9.5 9.5h5" />
          </Svg>
        );
      case 'lightbulb':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.8 10.6c.7.6 1.3 1.4 1.5 2.4h4.6c.2-1 .8-1.8 1.5-2.4A6 6 0 0 0 12 3Z" />
          </Svg>
        );
      case 'spark':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.2 2.2M16.2 16.2l2.2 2.2M18.4 5.6l-2.2 2.2M7.8 16.2l-2.2 2.2" />
            <Circle cx="12" cy="12" r="2.8" />
          </Svg>
        );
      case 'bolt':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M13 2L4.5 13.5H11.5L10.5 22L19.5 10.5H12.5L13 2Z" />
          </Svg>
        );
      case 'smile':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="9" />
            <Path d="M9 10h.01M15 10h.01M8.8 14.5c1.1 1.3 5.3 1.3 6.4 0" />
          </Svg>
        );
      case 'heart':
      default:
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20.4 5.2a5 5 0 0 0-7.1 0L12 6.5l-1.3-1.3a5 5 0 0 0-7.1 7.1l1.3 1.3L12 20.7l7.1-7.1 1.3-1.3a5 5 0 0 0 0-7.1z" />
          </Svg>
        );
    }
  };

  const renderTruthIllustration = (slideId: string) => {
    switch (slideId) {
      case 'brain':
        return (
          <View style={styles.illustrationStage}>
            {/* Pulsing Golden Neural Halo */}
            <Animated.View style={[styles.brainGlowBackdrop, animatedBrainGlowStyle]} />

            <Svg width={250} height={230} viewBox="0 0 250 230">
              {/* Outer Brain Silhouette */}
              <Path
                d="M84 156 C56 155 40 135 43 109 C38 89 48 67 68 62 C76 44 100 37 121 44 C139 36 165 42 176 59 C197 64 209 84 205 107 C210 131 194 153 168 156 C154 166 132 166 118 158 C106 164 93 162 84 156 Z"
                fill="rgba(16, 30, 82, 0.55)"
                stroke="#97A9DC"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Sulci / Inner Brain Folds */}
              <Path
                d="M95 52 C100 72 94 88 84 102 M138 48 C134 68 142 86 152 98 M168 72 C156 84 155 104 164 120 M74 84 C88 92 92 112 82 128 M116 115 C118 132 110 145 102 156"
                fill="none"
                stroke="#485FA8"
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              {/* Brain Stem */}
              <Path
                d="M138 161 Q144 185 156 198"
                fill="none"
                stroke="#8FA0D0"
                strokeWidth={1.8}
                strokeLinecap="round"
              />

              {/* Glowing Neural Craving Wave (Outer Soft Halo) */}
              <Path
                d="M66 110 C82 98 98 118 114 114 C130 110 144 86 162 90 C174 92 182 102 188 108"
                fill="none"
                stroke="rgba(255, 248, 230, 0.35)"
                strokeWidth={10}
                strokeLinecap="round"
              />
              {/* Glowing Neural Craving Wave (Core) */}
              <Path
                d="M66 110 C82 98 98 118 114 114 C130 110 144 86 162 90 C174 92 182 102 188 108"
                fill="none"
                stroke="#FFF8E6"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        );

      case 'cycle': {
        // Compute circular glow position for the active chain link
        const activeDeg = CHAIN_ANGLES[activeChainStep];
        const activeRad = (activeDeg * Math.PI) / 180;
        const glowX = 125 + 74 * Math.cos(activeRad);
        const glowY = 115 + 74 * Math.sin(activeRad);
        const currentCycleWord =
          CYCLE_WORDS[Math.floor(activeChainStep / 3) % CYCLE_WORDS.length];

        return (
          <View style={styles.illustrationStage}>
            <Svg width={250} height={230} viewBox="0 0 250 230">
              {/* Underlying subtle ring */}
              <Circle
                cx="125"
                cy="115"
                r="74"
                fill="none"
                stroke="rgba(143, 160, 208, 0.35)"
                strokeWidth={2}
              />

              {/* Orbiting soft spotlight following the active link in a circle */}
              <Circle
                cx={glowX}
                cy={glowY}
                r="34"
                fill="rgba(255, 248, 230, 0.16)"
              />
              <Circle
                cx={glowX}
                cy={glowY}
                r="18"
                fill="rgba(255, 248, 230, 0.24)"
              />

              {/* 12 Interlocking Chain Links with rotating light wave */}
              {CHAIN_ANGLES.map((deg, idx) => {
                const rad = (deg * Math.PI) / 180;
                const cx = 125 + 74 * Math.cos(rad);
                const cy = 115 + 74 * Math.sin(rad);
                const tangentDeg = deg + 90;

                // Distance behind the leading active link (0 = brightest head, 1 = warm trail, 2 = soft trail)
                const diff =
                  (activeChainStep - idx + CHAIN_ANGLES.length) %
                  CHAIN_ANGLES.length;
                const isLead = diff === 0;
                const isTrail1 = diff === 1;
                const isTrail2 = diff === 2;

                const strokeColor = isLead
                  ? '#FFF8E6'
                  : isTrail1
                    ? '#F6ECD2'
                    : isTrail2
                      ? '#C5D4F7'
                      : '#8FA0D0';
                const fillColor = isLead
                  ? 'rgba(255, 248, 230, 0.34)'
                  : isTrail1
                    ? 'rgba(246, 236, 210, 0.2)'
                    : '#0B1642';

                return (
                  <G
                    key={idx}
                    transform={`translate(${cx}, ${cy}) rotate(${tangentDeg})`}
                  >
                    <Rect
                      x={-13}
                      y={-7}
                      width={26}
                      height={14}
                      rx={7}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isLead || isTrail1 ? 2.7 : 2.1}
                    />
                  </G>
                );
              })}
            </Svg>
            <Text style={styles.cycleCenterLabel}>{currentCycleWord}</Text>
          </View>
        );
      }

      case 'strength':
        return (
          <View style={styles.illustrationStage}>
            {/* Left Half of Shield (Animated cracking & splitting left) */}
            <Animated.View
              style={[styles.absoluteIllustrationLayer, animatedLeftShieldStyle]}
              pointerEvents="none"
            >
              <Svg width={250} height={230} viewBox="0 0 250 230">
                <Path
                  d="M125 28 L52 54 V116 C52 162 83 194 121 210 L114 166 L125 142 L112 114 L126 82 L117 56 Z"
                  fill="rgba(22, 40, 100, 0.72)"
                  stroke="#97A9DC"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                <Path
                  d="M120 36 L60 59 V115 C60 155 85 183 116 198"
                  fill="none"
                  stroke="rgba(169, 184, 226, 0.45)"
                  strokeWidth={1.1}
                />
                {/* Left Half of Cross */}
                <Path
                  d="M106 74 V154 M80 104 H116"
                  stroke="#A9B8E2"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>

            {/* Right Half of Shield (Animated cracking & splitting right) */}
            <Animated.View
              style={[styles.absoluteIllustrationLayer, animatedRightShieldStyle]}
              pointerEvents="none"
            >
              <Svg width={250} height={230} viewBox="0 0 250 230">
                <Path
                  d="M125 28 L198 54 V116 C198 162 167 194 129 210 L136 168 L125 140 L138 112 L124 80 L133 54 Z"
                  fill="rgba(22, 40, 100, 0.72)"
                  stroke="#97A9DC"
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                <Path
                  d="M130 36 L190 59 V115 C190 155 165 183 134 198"
                  fill="none"
                  stroke="rgba(169, 184, 226, 0.45)"
                  strokeWidth={1.1}
                />
                {/* Right Half of Cross */}
                <Path
                  d="M142 78 V154 M134 104 H168"
                  stroke="#A9B8E2"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>

            {/* Center Jagged Crack Flash */}
            <Animated.View
              style={[styles.absoluteIllustrationLayer, animatedCrackFlashStyle]}
              pointerEvents="none"
            >
              <Svg width={250} height={230} viewBox="0 0 250 230">
                <Path
                  d="M125 28 L117 56 L126 82 L112 114 L125 142 L114 166 L123 210"
                  fill="none"
                  stroke="#FFF8E6"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </View>
        );

      case 'god':
        return (
          <View style={styles.illustrationStage}>
            <Svg width={250} height={230} viewBox="0 0 250 230">
              <Defs>
                <SvgRadialGradient id="darkVoid" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#03071A" stopOpacity="0.96" />
                  <Stop offset="68%" stopColor="#060E2E" stopOpacity="0.78" />
                  <Stop offset="100%" stopColor="#0D1B4E" stopOpacity="0" />
                </SvgRadialGradient>
              </Defs>
              {/* Dark Shroud / Eclipse Circle */}
              <Circle cx="125" cy="115" r="88" fill="url(#darkVoid)" />
            </Svg>

            <Animated.View
              style={[styles.absoluteIllustrationLayer, animatedCrossDimStyle]}
              pointerEvents="none"
            >
              <Svg width={250} height={230} viewBox="0 0 250 230">
                <Path
                  d="M125 56 V174 M94 88 H156"
                  stroke="#2C428C"
                  strokeWidth={5.5}
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          </View>
        );

      case 'break':
      default:
        return (
          <View style={styles.illustrationStage}>
            {/* Three Radiant Light Beams Bursting Upward */}
            <Animated.View
              style={[styles.absoluteIllustrationLayer, animatedRaysStyle]}
              pointerEvents="none"
            >
              <Svg width={260} height={230} viewBox="0 0 260 230">
                <Defs>
                  <SvgLinearGradient id="rayGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                    <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.78" />
                    <Stop offset="65%" stopColor="#F6ECD2" stopOpacity="0.24" />
                    <Stop offset="100%" stopColor="#F6ECD2" stopOpacity="0" />
                  </SvgLinearGradient>
                </Defs>
                <Polygon
                  points="116,125 46,38 78,24 124,122"
                  fill="url(#rayGrad)"
                />
                <Polygon
                  points="124,122 108,16 152,16 136,122"
                  fill="url(#rayGrad)"
                />
                <Polygon
                  points="136,122 182,24 214,38 144,125"
                  fill="url(#rayGrad)"
                />
              </Svg>
            </Animated.View>

            {/* Left Snapped Chain Pair */}
            <Animated.View
              style={[styles.absoluteIllustrationLayer, animatedLeftChainStyle]}
              pointerEvents="none"
            >
              <Svg width={260} height={230} viewBox="0 0 260 230">
                <G transform="translate(82, 148)">
                  <Rect
                    x={-38}
                    y={-12}
                    width={44}
                    height={24}
                    rx={12}
                    fill="none"
                    stroke="#DCE6FF"
                    strokeWidth={3.6}
                  />
                  <Path
                    d="M22 -11 H8 A12 12 0 0 0 -4 1 A12 12 0 0 0 8 13 H24"
                    fill="none"
                    stroke="#DCE6FF"
                    strokeWidth={3.6}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>
            </Animated.View>

            {/* Right Snapped Chain Pair */}
            <Animated.View
              style={[styles.absoluteIllustrationLayer, animatedRightChainStyle]}
              pointerEvents="none"
            >
              <Svg width={260} height={230} viewBox="0 0 260 230">
                <G transform="translate(178, 148)">
                  <Rect
                    x={-6}
                    y={-12}
                    width={44}
                    height={24}
                    rx={12}
                    fill="none"
                    stroke="#DCE6FF"
                    strokeWidth={3.6}
                  />
                  <Path
                    d="M-22 -11 H-8 A12 12 0 0 1 4 1 A12 12 0 0 1 -8 13 H-24"
                    fill="none"
                    stroke="#DCE6FF"
                    strokeWidth={3.6}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>
            </Animated.View>
          </View>
        );
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 3 (POST-QUIZ 1): CALCULATING (100% + Sword)
  // ════════════════════════════════════════════════════════════════════
  if (step === 'calculating') {
    const calcSubText =
      calcPct < 38
        ? 'Understanding your habits...'
        : calcPct < 78
          ? 'Learning relapse triggers...'
          : 'Preparing your results...';

    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#142668', '#0A143A']}
          locations={[0, 0.45, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.calcSafeArea}>
          <View style={styles.calcTopBlock}>
            <View style={styles.calcNumberRow}>
              <Text style={styles.calcBigNumber}>{calcPct}</Text>
              <Text style={styles.calcPercentSymbol}>%</Text>
            </View>

            {/* Progress Track with Glowing Tip */}
            <View style={styles.calcBarTrack}>
              <View style={[styles.calcBarFill, { width: `${calcPct}%` }]}>
                <View style={styles.calcBarGlowTip} />
              </View>
            </View>

            <Text style={styles.calcTitle}>Calculating</Text>
            <Text style={styles.calcSubtitle}>{calcSubText}</Text>
          </View>

          {/* Vertical Sword Illustration at Bottom */}
          <View style={styles.swordWrap} pointerEvents="none">
            <Svg width={140} height={350} viewBox="-70 -295 140 330">
              <Defs>
                <SvgLinearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor="#5C73B8" />
                  <Stop offset="46%" stopColor="#C5D4F7" />
                  <Stop offset="53%" stopColor="#FFFFFF" />
                  <Stop offset="100%" stopColor="#394E94" />
                </SvgLinearGradient>
                <SvgLinearGradient id="ridgeGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                  <Stop offset="55%" stopColor="#C5D4F7" stopOpacity="0.6" />
                  <Stop offset="100%" stopColor="#5C73B8" stopOpacity="0" />
                </SvgLinearGradient>
              </Defs>

              {/* Soft Aura Behind Sword */}
              <Ellipse cx="0" cy="-120" rx="34" ry="145" fill="rgba(120, 150, 225, 0.11)" />

              {/* Blade */}
              <Path
                d="M-6 -212 L6 -212 L4.6 0 L0 24 L-4.6 0 Z"
                fill="url(#bladeGrad)"
              />
              {/* Blade Center Ridge */}
              <Rect x="-0.9" y="-210" width="1.8" height="218" fill="url(#ridgeGrad)" />

              {/* Crossguard */}
              <Path
                d="M-31 -215 L31 -215 Q35 -214 38 -208 L36.5 -207 Q34 -210.5 30 -211 L-30 -211 Q-34 -210.5 -36.5 -207 L-38 -208 Q-35 -214 -31 -215 Z"
                fill="#7D93D4"
                stroke="#C5D4F7"
                strokeWidth="0.7"
              />
              {/* Guard Collar */}
              <Rect x="-7" y="-220" width="14" height="8" rx="2" fill="#5168AD" stroke="#A9B8E2" strokeWidth="0.6" />

              {/* Grip */}
              <Path d="M-4.2 -219 L4.2 -219 L3.6 -268 L-3.6 -268 Z" fill="#2A3D7E" stroke="#7D93D4" strokeWidth="0.6" />

              {/* Pommel */}
              <Ellipse cx="0" cy="-275" rx="7.2" ry="6.5" fill="#7D93D4" stroke="#DCE6FF" strokeWidth="0.8" />
              <Circle cx="0" cy="-282.5" r="2.2" fill="#DCE6FF" />
            </Svg>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 4 (POST-QUIZ 2): YOUR RESULT
  // ════════════════════════════════════════════════════════════════════
  if (step === 'result') {
    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#132462', '#0A143A']}
          locations={[0, 0.45, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.resultSafeArea}>
          <View style={styles.resultContent}>
            <Text style={styles.resultEyebrow}>YOUR RESULT</Text>
            <Text style={styles.resultHeadline}>
              {displayName}, you’re{'\n'}struggling{'\n'}more than most.
            </Text>

            {/* Bar 1: You (58%) */}
            <View style={styles.barGroup}>
              <View style={styles.barHeaderRow}>
                <Text style={styles.barYouLabel}>You</Text>
                <Text style={styles.barYouNumber}>
                  58<Text style={styles.barYouPct}>%</Text>
                </Text>
              </View>
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={['#8DA4E4', '#E6EEFF']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.barYouFill, { width: '58%' }]}
                />
              </View>
            </View>

            {/* Bar 2: Most men (14%) */}
            <View style={[styles.barGroup, { marginTop: 22 }]}>
              <View style={styles.barHeaderRow}>
                <Text style={styles.barAvgLabel}>Most men</Text>
                <Text style={styles.barAvgNumber}>
                  14<Text style={styles.barAvgPct}>%</Text>
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barAvgFill, { width: '14%' }]} />
              </View>
            </View>

            {/* Dependence Callout Box */}
            <View style={styles.dependenceCard}>
              <Svg width={24} height={26} viewBox="0 0 24 26" fill="none">
                <Path
                  d="M12 2L21 5.5V12.5C21 18.2 17.1 22.4 12 24.5C6.9 22.4 3 18.2 3 12.5V5.5L12 2Z"
                  stroke="#8FA0D0"
                  strokeWidth={1.6}
                />
                <Path
                  d="M12 8.5V14.5M12 18H12.01"
                  stroke="#F6ECD2"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.dependenceText}>
                Your answers show a{' '}
                <Text style={styles.dependenceHighlight}>
                  strong dependence on porn.*
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.resultFooter}>
            <Text style={styles.disclaimerText}>
              * Based on your answers. Not a medical diagnosis.
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep('symptoms');
              }}
              style={styles.creamButton}
            >
              <Text style={styles.creamButtonText}>See your symptoms</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 5 (POST-QUIZ 3): SYMPTOMS
  // ════════════════════════════════════════════════════════════════════
  if (step === 'symptoms') {
    return (
      <VigilBackground>
        <SafeAreaView style={styles.lightSafeArea}>
          {/* Top Back Button */}
          <View style={styles.lightTopBar}>
            <TouchableOpacity
              onPress={() => setStep('result')}
              style={styles.lightBackBtn}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M15 5l-7 7 7 7" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.symptomsScroll}
            contentContainerStyle={styles.symptomsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lightHeadline}>Which of these are you feeling?</Text>
            <Text style={styles.lightSubtitle}>
              Pick all that apply. Knowing the damage helps us fight it at the root.
            </Text>

            {SYMPTOM_GROUPS.map((group) => (
              <View key={group.id} style={styles.symptomGroup}>
                <View style={styles.symptomGroupHeader}>
                  {group.icon === 'cross' && (
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#5566A0" strokeWidth={2} strokeLinecap="round">
                      <Path d="M12 3v18M7 8h10" />
                    </Svg>
                  )}
                  {group.icon === 'mind' && (
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#5566A0" strokeWidth={2} strokeLinecap="round">
                      <Circle cx="12" cy="12" r="9" />
                      <Path d="M9 10h.01M15 10h.01M9.5 15.5c1.2-1 3.8-1 5 0" />
                    </Svg>
                  )}
                  {group.icon === 'heart' && (
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#5566A0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
                    </Svg>
                  )}
                  <Text style={styles.symptomGroupTitle}>{group.title}</Text>
                </View>

                <View style={styles.symptomItemsList}>
                  {group.items.map((item) => {
                    const isPicked = !!selectedSymptoms[item];
                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        onPress={() => toggleSymptom(item)}
                        style={[
                          styles.symptomCard,
                          isPicked && styles.symptomCardSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.symptomCardText,
                            isPicked && styles.symptomCardTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                        <View
                          style={[
                            styles.symptomCheckbox,
                            isPicked && styles.symptomCheckboxSelected,
                          ]}
                        >
                          {isPicked && (
                            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#0A1640" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M5 12.5l4.5 4.5L19 7.5" />
                            </Svg>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.symptomsBottomBar}>
            <TouchableOpacity
              activeOpacity={0.88}
              disabled={selectedSymptomCount === 0}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep('reminders');
              }}
              style={[
                styles.navyPillButton,
                selectedSymptomCount === 0 && styles.navyPillButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.navyPillButtonText,
                  selectedSymptomCount === 0 && styles.navyPillButtonTextDisabled,
                ]}
              >
                {selectedSymptomCount === 0 ? 'Select what applies' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </VigilBackground>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 6 (POST-QUIZ 4): REMINDERS
  // ════════════════════════════════════════════════════════════════════
  if (step === 'reminders') {
    return (
      <VigilBackground>
        <SafeAreaView style={styles.lightSafeArea}>
          <View style={styles.remindersContainer}>
            {/* Top Notification Stack Preview */}
            <View style={styles.notifStackArea}>
              <View style={styles.notifWarmGlow} />

              {/* Back Stacked Layer 2 */}
              <View style={styles.notifStackBack2} />
              {/* Back Stacked Layer 1 */}
              <View style={styles.notifStackBack1} />

              {/* Front Notification Card */}
              <View style={styles.notifFrontCard}>
                <View style={styles.notifAppIcon}>
                  <Svg width={20} height={22} viewBox="0 0 26 30" fill="none">
                    <Path
                      d="M13 2L23 5.8V14C23 20.5 18.4 25.2 13 28C7.6 25.2 3 20.5 3 14V5.8L13 2Z"
                      stroke="#F4F7FD"
                      strokeWidth={1.7}
                    />
                    <Path
                      d="M13 8V21M9 12.5H17"
                      stroke="#F6ECD2"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <View style={styles.notifTextCol}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={styles.notifTitle}>Your orders for today</Text>
                    <Text style={styles.notifTime}>now</Text>
                  </View>
                  <Text style={styles.notifBody}>
                    “Be strong in the Lord, and in the power of his might.” Ephesians 6:10
                  </Text>
                </View>
              </View>
            </View>

            {/* Center Copy + Reminder Card */}
            <View style={styles.remindersCenterBlock}>
              <Text style={styles.remindersHeadline}>We’ll keep watch with you</Text>
              <Text style={styles.remindersSub}>
                A short reminder each morning, and a word when you need it most.
              </Text>

              <View style={styles.reminderToggleCard}>
                <View style={styles.reminderBellCircle}>
                  <SymbolView
                    name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }}
                    size={20}
                    tintColor="#34489A"
                    weight="regular"
                  />
                </View>
                <View style={styles.reminderToggleTextCol}>
                  <Text style={styles.reminderToggleTitle}>Reminders</Text>
                  <Text style={styles.reminderToggleSub}>Reading and prayer</Text>
                </View>
                <Switch
                  value={remindersOn}
                  onValueChange={(val) => {
                    Haptics.selectionAsync();
                    setRemindersOn(val);
                  }}
                  trackColor={{ false: '#C2CEEC', true: '#0A1640' }}
                  ios_backgroundColor="#C2CEEC"
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Bottom Actions */}
            <View style={styles.remindersFooter}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleTurnOnReminders}
                style={styles.navyPillButton}
              >
                <Text style={styles.navyPillButtonText}>Turn on reminders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleSkipReminders}
                style={styles.notNowButton}
              >
                <Text style={styles.notNowText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </VigilBackground>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 8 (POST-QUIZ 6): YOUR PATH (TIMELINE OF 5 MILESTONES)
  // ════════════════════════════════════════════════════════════════════
  if (step === 'path') {
    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#132462', '#0A143A']}
          locations={[0, 0.42, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.pathSafeArea}>
          <View style={styles.pathTopContent}>
            <Text style={styles.resultEyebrow}>YOUR PATH</Text>
            <Text style={styles.pathHeadline}>
              What changes as you{'\n'}hold the line
            </Text>

            {/* Vertical Timeline */}
            <View style={styles.timelineContainer}>
              {/* Continuous Vertical Line Connecting Shield Icons */}
              <View style={styles.timelineVerticalLine} />

              {PATH_MILESTONES.map((milestone) => (
                <View key={milestone.id} style={styles.timelineRow}>
                  <View style={styles.timelineIconWrap}>
                    {milestone.active && <View style={styles.activeShieldAura} />}
                    <Svg width={32} height={34} viewBox="0 0 32 34" fill="none">
                      <Path
                        d="M16 3L27 7.2V16.2C27 23.2 22.1 28.4 16 31C9.9 28.4 5 23.2 5 16.2V7.2L16 3Z"
                        fill={milestone.active ? '#F6ECD2' : '#0B1642'}
                        stroke={milestone.active ? '#FFF8E6' : '#5E74B6'}
                        strokeWidth={1.6}
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M16 10V23M11.5 14.5H20.5"
                        stroke={milestone.active ? '#0A1640' : '#7B90CE'}
                        strokeWidth={1.9}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>

                  <View style={styles.timelineTextCol}>
                    <Text
                      style={[
                        styles.timelineTag,
                        milestone.active && styles.timelineTagActive,
                      ]}
                    >
                      {milestone.tag}
                    </Text>
                    <Text style={styles.timelineTitle}>{milestone.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.pathFooter}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep('goals');
              }}
              style={styles.creamButton}
            >
              <Text style={styles.creamButtonText}>I’m ready</Text>
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A1640"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 9 (POST-QUIZ 7): GOALS (FEEDS INTO "YOUR WHY")
  // ════════════════════════════════════════════════════════════════════
  if (step === 'goals') {
    return (
      <VigilBackground>
        <SafeAreaView style={styles.lightSafeArea}>
          {/* Top Back Button */}
          <View style={styles.lightTopBar}>
            <TouchableOpacity
              onPress={() => setStep('path')}
              style={styles.lightBackBtn}
            >
              <Svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A1640"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M15 5l-7 7 7 7" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.symptomsScroll}
            contentContainerStyle={styles.goalsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lightHeadline}>What are you fighting for?</Text>
            <Text style={styles.lightSubtitle}>
              Pick your goals. We’ll remind you of them when it gets hard.
            </Text>

            <View style={styles.goalsList}>
              {GOAL_OPTIONS.map((goal) => {
                const isPicked = !!selectedGoals[goal.label];
                return (
                  <TouchableOpacity
                    key={goal.id}
                    activeOpacity={0.85}
                    onPress={() => toggleGoal(goal.label)}
                    style={[
                      styles.goalCard,
                      isPicked && styles.symptomCardSelected,
                    ]}
                  >
                    <View style={styles.goalLeftRow}>
                      <View
                        style={[
                          styles.goalIconCircle,
                          isPicked && styles.goalIconCircleSelected,
                        ]}
                      >
                        {renderGoalIcon(goal.icon, isPicked)}
                      </View>
                      <Text
                        style={[
                          styles.symptomCardText,
                          isPicked && styles.symptomCardTextSelected,
                        ]}
                      >
                        {goal.label}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.symptomCheckbox,
                        isPicked && styles.symptomCheckboxSelected,
                      ]}
                    >
                      {isPicked && (
                        <Svg
                          width={12}
                          height={12}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#0A1640"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <Path d="M5 12.5l4.5 4.5L19 7.5" />
                        </Svg>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.symptomsBottomBar}>
            <TouchableOpacity
              activeOpacity={0.88}
              disabled={selectedGoalList.length === 0}
              onPress={handleFinishGoals}
              style={[
                styles.navyPillButton,
                selectedGoalList.length === 0 && styles.navyPillButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.navyPillButtonText,
                  selectedGoalList.length === 0 &&
                    styles.navyPillButtonTextDisabled,
                ]}
              >
                {selectedGoalList.length === 0
                  ? 'Pick at least one goal'
                  : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </VigilBackground>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 10A (POST-QUIZ 8): THE VOWS — INTRO (STATIC SWORD)
  // ════════════════════════════════════════════════════════════════════
  if (step === 'vows-intro') {
    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#132462', '#0A143A']}
          locations={[0, 0.45, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.vowsIntroSafeArea}>
          <View style={styles.vowsIntroCenter}>
            {renderVowsSword(true)}

            <View style={styles.vowsIntroCopyBlock}>
              <Text style={styles.vowEyebrow}>YOUR VOWS</Text>
              <Text style={styles.vowsIntroHeadline}>
                Tonight, {displayName},{'\n'}you take your vows.
              </Text>
              <Text style={styles.vowsIntroSubtitle}>
                Four vows and a prayer, made before{'\n'}God.
              </Text>
            </View>
          </View>

          <View style={styles.vowsIntroFooter}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVowIndex(0);
                setHoldProgress(0);
                vowCompletedRef.current = false;
                setStep('vows');
              }}
              style={styles.creamButton}
            >
              <Text style={styles.creamButtonText}>Take my vows</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 10B (POST-QUIZ 9): THE VOWS — 1 TO 5 (PRESS & HOLD SHIELD)
  // ════════════════════════════════════════════════════════════════════
  if (step === 'vows') {
    const currentVow = VOW_ITEMS[vowIndex] ?? VOW_ITEMS[0];
    const ringRadius = 39;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringStrokeDashoffset = ringCircumference * (1 - holdProgress);

    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#132462', '#0A143A']}
          locations={[0, 0.45, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.vowsActiveSafeArea}>
          {/* Top 5-Segment Progress Bar */}
          <View style={styles.vowsProgressRow}>
            {VOW_ITEMS.map((_, idx) => {
              const isDone = idx < vowIndex;
              const isCurrent = idx === vowIndex;
              return (
                <View key={idx} style={styles.vowSegmentTrack}>
                  <View
                    style={[
                      styles.vowSegmentFill,
                      {
                        width: isDone
                          ? '100%'
                          : isCurrent
                            ? `${Math.round(holdProgress * 100)}%`
                            : '0%',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Center Sword + Vow Text + Scripture */}
          <View style={styles.vowsActiveCenter}>
            {renderVowsSword(false)}

            <View style={styles.vowTextBlock}>
              <Text style={styles.vowEyebrow}>{currentVow.eyebrow}</Text>
              <Text style={styles.vowHeadline}>{currentVow.headline}</Text>
              <Text style={styles.vowVerseText}>{currentVow.verse}</Text>
              {Boolean(currentVow.reference) && (
                <Text style={styles.vowVerseRef}>{currentVow.reference}</Text>
              )}
            </View>
          </View>

          {/* Bottom Hold-to-Vow Shield Ring Button */}
          <View style={styles.vowHoldFooter}>
            <Pressable
              onPressIn={startHoldVow}
              onPressOut={stopHoldVow}
              style={({ pressed }) => [
                styles.vowHoldCircleWrap,
                pressed && styles.vowHoldCirclePressed,
              ]}
            >
              {/* Soft Glow Behind Shield Button While Holding */}
              {holdProgress > 0 && (
                <View
                  style={[
                    styles.vowHoldButtonAura,
                    { opacity: 0.15 + holdProgress * 0.45 },
                  ]}
                />
              )}

              <Svg width={86} height={86} viewBox="0 0 86 86">
                {/* Base Circle Track */}
                <Circle
                  cx="43"
                  cy="43"
                  r={ringRadius}
                  fill="rgba(20, 36, 92, 0.42)"
                  stroke="rgba(143, 160, 208, 0.32)"
                  strokeWidth={1.6}
                />

                {/* Animated Progress Ring Coloring Up Clockwise */}
                {holdProgress > 0 && (
                  <Circle
                    cx="43"
                    cy="43"
                    r={ringRadius}
                    fill="none"
                    stroke="#F6ECD2"
                    strokeWidth={2.8}
                    strokeLinecap="round"
                    strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                    strokeDashoffset={ringStrokeDashoffset}
                    transform="rotate(-90 43 43)"
                  />
                )}
              </Svg>

              {/* Center Shield + Cross Icon */}
              <View style={styles.vowHoldShieldIcon} pointerEvents="none">
                <Svg width={24} height={26} viewBox="0 0 26 28" fill="none">
                  <Path
                    d="M13 2.5L22.5 6.2V13.8C22.5 19.8 18.2 24.1 13 26.5C7.8 24.1 3.5 19.8 3.5 13.8V6.2L13 2.5Z"
                    fill={
                      holdProgress > 0.15
                        ? `rgba(246, 236, 210, ${(holdProgress * 0.28).toFixed(2)})`
                        : 'none'
                    }
                    stroke={holdProgress > 0.1 ? '#F6ECD2' : '#9EB0E0'}
                    strokeWidth={1.7}
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M13 8.5V19.5M9.2 12.5H16.8"
                    stroke={holdProgress > 0.1 ? '#FFF8E6' : '#9EB0E0'}
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            </Pressable>

            <Text style={styles.vowHoldCaption}>{currentVow.holdLabel}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 10C (POST-QUIZ 10): VOWS SWORN ("God heard you, John.")
  // ════════════════════════════════════════════════════════════════════
  if (step === 'vows-sworn') {
    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#14286E', '#0A143A']}
          locations={[0, 0.45, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Volumetric Celestial Light Rays Shining Down From Top Center */}
        <Animated.View
          style={[StyleSheet.absoluteFill, animatedVowAuraStyle]}
          pointerEvents="none"
        >
          <Svg
            width={SCREEN_WIDTH}
            height={520}
            viewBox={`0 0 ${SCREEN_WIDTH} 520`}
          >
            <Defs>
              <SvgLinearGradient id="heavenRayCenter" x1="0.5" y1="0" x2="0.5" y2="1">
                <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.28" />
                <Stop offset="55%" stopColor="#DCE6FF" stopOpacity="0.11" />
                <Stop offset="100%" stopColor="#0D1B4E" stopOpacity="0" />
              </SvgLinearGradient>
              <SvgLinearGradient id="heavenRaySide" x1="0.5" y1="0" x2="0.5" y2="1">
                <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="0.18" />
                <Stop offset="50%" stopColor="#C5D4F7" stopOpacity="0.07" />
                <Stop offset="100%" stopColor="#0D1B4E" stopOpacity="0" />
              </SvgLinearGradient>
            </Defs>

            {/* Left Angled Beam */}
            <Polygon
              points={`${SCREEN_WIDTH * 0.44},0 ${SCREEN_WIDTH * 0.52},0 ${SCREEN_WIDTH * 0.24},430 ${SCREEN_WIDTH * 0.04},390`}
              fill="url(#heavenRaySide)"
            />
            {/* Center Vertical Beam */}
            <Polygon
              points={`${SCREEN_WIDTH * 0.45},0 ${SCREEN_WIDTH * 0.55},0 ${SCREEN_WIDTH * 0.66},470 ${SCREEN_WIDTH * 0.34},470`}
              fill="url(#heavenRayCenter)"
            />
            {/* Right Angled Beam */}
            <Polygon
              points={`${SCREEN_WIDTH * 0.48},0 ${SCREEN_WIDTH * 0.56},0 ${SCREEN_WIDTH * 0.96},390 ${SCREEN_WIDTH * 0.76},430`}
              fill="url(#heavenRaySide)"
            />
          </Svg>
        </Animated.View>

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.vowsIntroSafeArea}>
          <View style={styles.vowsSwornCenter}>
            <View style={styles.vowsSwornSwordScale}>
              {renderVowsSword(false, true)}
            </View>

            <View style={styles.vowsSwornCopyBlock}>
              <Text style={styles.vowsSwornEyebrow}>VOWS SWORN</Text>
              <Text style={styles.vowsIntroHeadline}>
                God heard you, {displayName}.
              </Text>
              <Text style={styles.vowsIntroSubtitle}>
                He stands with you from tonight.
              </Text>
            </View>
          </View>

          <View style={styles.vowsIntroFooter}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep('rate');
              }}
              style={styles.creamButton}
            >
              <Text style={styles.creamButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 11 (POST-QUIZ 11): RATE VIGIL
  // ════════════════════════════════════════════════════════════════════
  if (step === 'rate') {
    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#132462', '#070E2C']}
          locations={[0, 0.45, 0.78, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.rateSafeArea}>
          {/* Top 5 Glowing Stars + Headline */}
          <View style={styles.rateTopBlock}>
            <View style={styles.rateStarsRow}>
              {[0, 1, 2, 3, 4].map((idx) => (
                <View key={idx} style={styles.rateStarWrap}>
                  <View style={styles.rateStarGlow} />
                  <Svg width={30} height={30} viewBox="0 0 24 24" fill="#F6ECD2">
                    <Path d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9L12 2.2z" />
                  </Svg>
                </View>
              ))}
            </View>

            <Text style={styles.rateHeadline}>
              Help another man{'\n'}find his way out
            </Text>
            <Text style={styles.rateSubtitle}>
              Your rating helps Vigil reach men fighting{'\n'}this alone.
            </Text>
          </View>

          {/* Horizontal Scrollable Review Cards */}
          <View style={styles.rateReviewsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rateReviewsScroll}
            >
              {REVIEW_CARDS.map((card) => (
                <View key={card.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeaderRow}>
                    <Text style={styles.reviewTitle} numberOfLines={1}>
                      {card.title}
                    </Text>
                    <Text style={styles.reviewTimeAgo}>{card.timeAgo}</Text>
                  </View>

                  <View style={styles.reviewMetaRow}>
                    <Text style={styles.reviewFiveStars}>★★★★★</Text>
                    <Text style={styles.reviewAuthor}>{card.author}</Text>
                  </View>

                  <Text style={styles.reviewBody}>{card.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Bottom Horizon with 7 Miniature Glowing Swords + CTA */}
          <View style={styles.rateBottomSection}>
            <View style={styles.horizonSwordsContainer} pointerEvents="none">
              <Svg width={360} height={86} viewBox="0 0 360 86">
                {HORIZON_SWORDS.map((sw, idx) => (
                  <G key={idx} opacity={sw.o}>
                    <Ellipse
                      cx={sw.x}
                      cy={sw.topY + sw.h * 0.5}
                      rx={5.5}
                      ry={sw.h * 0.52}
                      fill="rgba(220, 230, 255, 0.24)"
                    />
                    {/* Pommel + Grip + Crossguard + Blade */}
                    <Circle cx={sw.x} cy={sw.topY} r={1.8} fill="#FFF8E6" />
                    <Path
                      d={`M${sw.x} ${sw.topY + 2} V${sw.topY + sw.h}`}
                      stroke="#FFF8E6"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                    <Path
                      d={`M${sw.x - 6} ${sw.topY + 9} H${sw.x + 6}`}
                      stroke="#DCE6FF"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                    />
                  </G>
                ))}
                {/* Dark Curved Horizon Hill */}
                <Path
                  d="M-20 86 Q180 56 380 86 Z"
                  fill="#060C24"
                />
              </Svg>
            </View>

            <View style={styles.rateFooter}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setStep('plan');
                }}
                style={styles.creamButton}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="#0A1640">
                  <Path d="M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3.2 1.2-6.5-4.8-4.6 6.6-.9L12 2.2z" />
                </Svg>
                <Text style={styles.creamButtonText}>Rate Vigil</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep('plan');
                }}
                style={styles.maybeLaterBtn}
              >
                <Text style={styles.maybeLaterText}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 12 (POST-QUIZ 12): PLAN REVEAL ("John, your plan is ready")
  // ════════════════════════════════════════════════════════════════════
  if (step === 'plan') {
    const activeGoals =
      selectedGoalList.length > 0
        ? selectedGoalList
        : reasons && reasons.length > 0
          ? reasons
          : [
              'Victory over temptation',
              'A deeper faith',
              'More energy and drive',
            ];

    return (
      <View style={styles.darkRoot}>
        <LinearGradient
          colors={['#081030', '#0D1B4E', '#132462', '#081030']}
          locations={[0, 0.4, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Subtle Starry Sky */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STAR_DOTS.map((star, idx) => (
            <View
              key={idx}
              style={{
                position: 'absolute',
                left: star.x as any,
                top: star.y as any,
                width: star.r * 2,
                height: star.r * 2,
                borderRadius: star.r,
                backgroundColor: '#E6ECFA',
                opacity: star.o,
              }}
            />
          ))}
        </View>

        <SafeAreaView style={styles.planSafeArea}>
          <ScrollView
            style={styles.planScroll}
            contentContainerStyle={styles.planScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.planTopHeadline}>
              {displayName}, your plan{'\n'}is ready
            </Text>

            {/* Main Clean-For & Knight-By Card */}
            <View style={styles.planMainCard}>
              <View style={styles.planCleanHeaderRow}>
                <Text style={styles.planCardEyebrow}>CLEAN FOR</Text>
                <View style={styles.planLiveTimerPill}>
                  <View style={styles.planLiveDot} />
                  <Text style={styles.planLiveTimerText}>
                    {formatTimerHms(planTimerSecs)}
                  </Text>
                </View>
              </View>

              <Text style={styles.planZeroDaysText}>0 days</Text>

              <View style={styles.planCardDivider} />

              <Text style={styles.planCardEyebrow}>YOU’LL BE A KNIGHT BY</Text>
              <Text style={styles.planTargetDateText}>Dec 7, 2026</Text>

              <View style={styles.planStartedRow}>
                <Text style={styles.planStartedText}>
                  Started Nov 8, 11:37 AM
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Haptics.selectionAsync()}
                  style={styles.planEditPill}
                >
                  <Text style={styles.planEditPillText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section: A new chapter starts today */}
            <Text style={styles.planSectionHeadline}>
              A new chapter starts today
            </Text>

            <View style={styles.planGoalsChipsWrap}>
              {activeGoals.map((goal) => (
                <View key={goal} style={styles.planGoalChip}>
                  <Text style={styles.planGoalChipText}>{goal}</Text>
                </View>
              ))}
            </View>

            {/* Section: YOUR ARSENAL (3x2 Grid) */}
            <Text style={styles.planArsenalEyebrow}>YOUR ARSENAL</Text>

            <View style={styles.planArsenalGrid}>
              {ARSENAL_ITEMS.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.planArsenalTile,
                    item.highlight && styles.planArsenalTileHighlight,
                  ]}
                >
                  {renderArsenalIcon(item.icon, item.highlight)}
                  <Text
                    style={[
                      styles.planArsenalLabel,
                      item.highlight && styles.planArsenalLabelHighlight,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Sticky Footer */}
          <View style={styles.planStickyFooter}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(onboarding)/paywall');
              }}
              style={styles.creamButton}
            >
              <Text style={styles.creamButtonText}>Start my vigil</Text>
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A1640"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M5 12h14M13 6l6 6-6 6" />
              </Svg>
            </TouchableOpacity>

            <View style={styles.planCancelRow}>
              <Svg
                width={13}
                height={13}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8FA0D0"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M5 12.5l4.5 4.5L19 7.5" />
              </Svg>
              <Text style={styles.planCancelText}>Cancel anytime</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // SCREEN 7 (POST-QUIZ 5): THE TRUTH ABOUT PORN (5-SLIDE CAROUSEL)
  // ════════════════════════════════════════════════════════════════════
  const isBreakSlide = truthIndex === TRUTH_SLIDES.length - 1;

  return (
    <View style={styles.darkRoot}>
      <LinearGradient
        colors={
          isBreakSlide
            ? ['#122666', '#1B3588', '#2242A0', '#162C74']
            : ['#081030', '#0C1846', '#11225E', '#091236']
        }
        locations={[0, 0.45, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle Starry Sky */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STAR_DOTS.map((star, idx) => (
          <View
            key={idx}
            style={{
              position: 'absolute',
              left: star.x as any,
              top: star.y as any,
              width: star.r * 2,
              height: star.r * 2,
              borderRadius: star.r,
              backgroundColor: '#E6ECFA',
              opacity: star.o,
            }}
          />
        ))}
      </View>

      <SafeAreaView style={styles.truthSafeArea}>
        {/* Top Slide Counter (1 / 5 ... 5 / 5) */}
        <View style={styles.truthTopCounterRow}>
          <Text style={styles.truthCounterText}>
            {truthIndex + 1} / {TRUTH_SLIDES.length}
          </Text>
        </View>

        {/* Horizontal Paging Carousel */}
        <ScrollView
          ref={truthScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleTruthMomentumEnd}
          scrollEventThrottle={16}
          style={styles.truthPager}
        >
          {TRUTH_SLIDES.map((slide) => (
            <View key={slide.id} style={styles.truthSlidePage}>
              <View style={styles.truthIllustrationBox}>
                {renderTruthIllustration(slide.id)}
              </View>

              <View style={styles.truthCopyBox}>
                <Text style={styles.truthHeadline}>{slide.headline}</Text>
                <Text style={styles.truthSubtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Pagination Dots + CTA Button */}
        <View style={styles.truthFooter}>
          <View style={styles.truthDotsRow}>
            {TRUTH_SLIDES.map((s, idx) => {
              const isActive = idx === truthIndex;
              return (
                <View
                  key={s.id}
                  style={[
                    styles.truthDot,
                    isActive && styles.truthDotActive,
                  ]}
                />
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleNextTruthSlide}
            style={styles.creamButton}
          >
            <Text style={styles.creamButtonText}>
              {isBreakSlide ? 'Show me the way' : 'Next'}
            </Text>
            <Svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A1640"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M5 12h14M13 6l6 6-6 6" />
            </Svg>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  darkRoot: {
    flex: 1,
    backgroundColor: '#081030',
  },
  calcSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTopBlock: {
    marginTop: 96,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  calcNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calcBigNumber: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 72,
    color: '#E6ECFA',
    fontVariant: ['tabular-nums'],
  },
  calcPercentSymbol: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 32,
    color: '#8FA0D0',
    marginLeft: 2,
  },
  calcBarTrack: {
    marginTop: 18,
    width: 196,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(143, 160, 208, 0.25)',
  },
  calcBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F6ECD2',
    justifyContent: 'center',
  },
  calcBarGlowTip: {
    position: 'absolute',
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF8E6',
    shadowColor: '#FFF8E6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
  },
  calcTitle: {
    marginTop: 22,
    fontSize: 18,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#E6ECFA',
  },
  calcSubtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#8FA0D0',
  },
  swordWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -10,
  },
  resultSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  resultContent: {
    marginTop: 64,
  },
  resultEyebrow: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    letterSpacing: 1.8,
    color: '#8FA0D0',
  },
  resultHeadline: {
    marginTop: 12,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 34,
    lineHeight: 42,
    color: '#E6ECFA',
    letterSpacing: -0.4,
  },
  barGroup: {
    marginTop: 34,
  },
  barHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barYouLabel: {
    fontSize: 15,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#E6ECFA',
  },
  barYouNumber: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 38,
    color: '#E6ECFA',
  },
  barYouPct: {
    fontSize: 24,
    color: '#A9B8E2',
  },
  barTrack: {
    width: '100%',
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(143, 160, 208, 0.16)',
    overflow: 'hidden',
  },
  barYouFill: {
    height: '100%',
    borderRadius: 7,
  },
  barAvgLabel: {
    fontSize: 14,
    fontFamily: 'Geist',
    color: '#8FA0D0',
  },
  barAvgNumber: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 26,
    color: '#8FA0D0',
  },
  barAvgPct: {
    fontSize: 18,
    color: '#8FA0D0',
  },
  barAvgFill: {
    height: '100%',
    borderRadius: 7,
    backgroundColor: 'rgba(143, 160, 208, 0.42)',
  },
  dependenceCard: {
    marginTop: 34,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(143, 160, 208, 0.28)',
    backgroundColor: 'rgba(20, 36, 92, 0.45)',
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dependenceText: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 22,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#E6ECFA',
  },
  dependenceHighlight: {
    color: '#F6ECD2',
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
  },
  resultFooter: {
    gap: 14,
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#6F80B8',
  },
  creamButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFE2BF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  creamButtonText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  lightSafeArea: {
    flex: 1,
  },
  lightTopBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
    height: 44,
    justifyContent: 'center',
  },
  lightBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomsScroll: {
    flex: 1,
  },
  symptomsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  lightHeadline: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#0A1640',
  },
  lightSubtitle: {
    marginTop: 8,
    fontSize: 14.5,
    lineHeight: 20,
    fontFamily: 'Geist',
    color: '#5566A0',
  },
  symptomGroup: {
    marginTop: 22,
  },
  symptomGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  symptomGroupTitle: {
    fontSize: 11.5,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.4,
    color: '#5566A0',
  },
  symptomItemsList: {
    gap: 10,
  },
  symptomCard: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2CEEC',
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symptomCardSelected: {
    borderColor: '#0A1640',
    backgroundColor: '#0A1640',
  },
  symptomCardText: {
    fontSize: 15.5,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#0A1640',
  },
  symptomCardTextSelected: {
    color: '#F4F7FD',
  },
  symptomCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#A3B3DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomCheckboxSelected: {
    borderColor: '#F6ECD2',
    backgroundColor: '#F6ECD2',
  },
  symptomsBottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  navyPillButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A1640',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navyPillButtonDisabled: {
    backgroundColor: '#C2CEEC',
  },
  navyPillButtonText: {
    fontSize: 16,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#F4F7FD',
  },
  navyPillButtonTextDisabled: {
    color: '#5566A0',
  },
  remindersContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 32,
    paddingBottom: 16,
  },
  notifStackArea: {
    alignItems: 'center',
    marginTop: 16,
  },
  notifWarmGlow: {
    position: 'absolute',
    top: 10,
    width: 260,
    height: 150,
    borderRadius: 130,
    backgroundColor: 'rgba(214, 176, 90, 0.22)',
  },
  notifStackBack2: {
    position: 'absolute',
    bottom: -22,
    width: '82%',
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: '#D3DCF2',
  },
  notifStackBack1: {
    position: 'absolute',
    bottom: -11,
    width: '90%',
    height: 66,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderWidth: 1,
    borderColor: '#D3DCF2',
  },
  notifFrontCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#D3DCF2',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#0A1640',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  notifAppIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0A1640',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifTextCol: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 14.5,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  notifTime: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#8798CC',
  },
  notifBody: {
    marginTop: 3,
    fontSize: 13.5,
    lineHeight: 18.5,
    fontFamily: 'Geist',
    color: '#34489A',
  },
  remindersCenterBlock: {
    alignItems: 'center',
  },
  remindersHeadline: {
    fontSize: 25,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#0A1640',
    textAlign: 'center',
  },
  remindersSub: {
    marginTop: 8,
    fontSize: 14.5,
    lineHeight: 20,
    fontFamily: 'Geist',
    color: '#5566A0',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  reminderToggleCard: {
    marginTop: 28,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C2CEEC',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reminderBellCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E3E9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderToggleTextCol: {
    flex: 1,
  },
  reminderToggleTitle: {
    fontSize: 15.5,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#0A1640',
  },
  reminderToggleSub: {
    marginTop: 1,
    fontSize: 13,
    fontFamily: 'Geist',
    color: '#5566A0',
  },
  remindersFooter: {
    gap: 8,
  },
  notNowButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowText: {
    fontSize: 15,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#34489A',
  },
  truthSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  truthTopCounterRow: {
    paddingTop: 14,
    alignItems: 'center',
  },
  truthCounterText: {
    fontSize: 13,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    letterSpacing: 2,
    color: '#8FA0D0',
  },
  truthPager: {
    flex: 1,
  },
  truthSlidePage: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  truthIllustrationBox: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationStage: {
    width: 260,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteIllustrationLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainGlowBackdrop: {
    position: 'absolute',
    width: 170,
    height: 110,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 248, 230, 0.16)',
  },
  cycleCenterLabel: {
    position: 'absolute',
    fontSize: 11.5,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: 2.2,
    color: '#E6ECFA',
  },
  truthCopyBox: {
    marginTop: 24,
    alignItems: 'center',
  },
  truthHeadline: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 33,
    lineHeight: 41,
    color: '#E6ECFA',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  truthSubtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Geist',
    color: '#8FA0D0',
    textAlign: 'center',
  },
  truthFooter: {
    paddingHorizontal: 24,
    gap: 24,
  },
  truthDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  truthDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(143, 160, 208, 0.35)',
  },
  truthDotActive: {
    width: 22,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F6ECD2',
  },
  pathSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  pathTopContent: {
    marginTop: 52,
  },
  pathHeadline: {
    marginTop: 12,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 33,
    lineHeight: 41,
    color: '#E6ECFA',
    letterSpacing: -0.4,
  },
  timelineContainer: {
    marginTop: 34,
    position: 'relative',
    gap: 28,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 16,
    top: 18,
    bottom: 18,
    width: 1.5,
    backgroundColor: 'rgba(143, 160, 208, 0.28)',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timelineIconWrap: {
    width: 34,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeShieldAura: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(246, 236, 210, 0.22)',
  },
  timelineTextCol: {
    flex: 1,
    gap: 3,
  },
  timelineTag: {
    fontSize: 11.5,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#8FA0D0',
  },
  timelineTagActive: {
    color: '#F6ECD2',
  },
  timelineTitle: {
    fontSize: 16.5,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#E6ECFA',
    letterSpacing: -0.2,
  },
  pathFooter: {
    marginTop: 16,
  },
  goalsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  goalsList: {
    marginTop: 22,
    gap: 10,
  },
  goalCard: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2CEEC',
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E3E9F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconCircleSelected: {
    backgroundColor: 'rgba(246, 236, 210, 0.16)',
  },
  vowSwordContainer: {
    width: 140,
    height: 232,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vowSwordAura: {
    position: 'absolute',
    width: 96,
    height: 196,
    borderRadius: 48,
    backgroundColor: 'rgba(246, 236, 210, 0.22)',
  },
  vowsIntroSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  vowsIntroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  vowsIntroCopyBlock: {
    marginTop: 28,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vowEyebrow: {
    fontSize: 11.5,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    letterSpacing: 2,
    color: '#8FA0D0',
    textAlign: 'center',
  },
  vowsIntroHeadline: {
    marginTop: 12,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 33,
    lineHeight: 41,
    color: '#E6ECFA',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  vowsIntroSubtitle: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Geist',
    color: '#8FA0D0',
    textAlign: 'center',
  },
  vowsIntroFooter: {
    paddingTop: 12,
  },
  vowsActiveSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  vowsProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  vowSegmentTrack: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(143, 160, 208, 0.24)',
    overflow: 'hidden',
  },
  vowSegmentFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F6ECD2',
  },
  vowsActiveCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  vowTextBlock: {
    marginTop: 20,
    alignItems: 'center',
  },
  vowHeadline: {
    marginTop: 12,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 28,
    lineHeight: 36,
    color: '#E6ECFA',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  vowVerseText: {
    marginTop: 18,
    fontFamily: 'LibreCaslonText_400Regular_Italic',
    fontSize: 16,
    lineHeight: 23,
    color: '#C5D4F7',
    textAlign: 'center',
  },
  vowVerseRef: {
    marginTop: 12,
    fontSize: 11,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.8,
    color: '#8FA0D0',
    textAlign: 'center',
  },
  vowHoldFooter: {
    alignItems: 'center',
    gap: 12,
  },
  vowHoldCircleWrap: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vowHoldCirclePressed: {
    transform: [{ scale: 0.96 }],
  },
  vowHoldButtonAura: {
    position: 'absolute',
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: 'rgba(246, 236, 210, 0.28)',
  },
  vowHoldShieldIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vowHoldCaption: {
    fontSize: 13.5,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#8FA0D0',
  },
  vowsSwornCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  vowsSwornSwordScale: {
    transform: [{ scale: 1.18 }],
  },
  vowsSwornCopyBlock: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  vowsSwornEyebrow: {
    fontSize: 11.5,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    letterSpacing: 2,
    color: '#F6ECD2',
    textAlign: 'center',
  },
  rateSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  rateTopBlock: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  rateStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  rateStarWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateStarGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(246, 236, 210, 0.22)',
  },
  rateHeadline: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 32,
    lineHeight: 40,
    color: '#E6ECFA',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  rateSubtitle: {
    marginTop: 12,
    fontSize: 14.5,
    lineHeight: 21,
    fontFamily: 'Geist',
    color: '#8FA0D0',
    textAlign: 'center',
  },
  rateReviewsSection: {
    marginTop: 12,
  },
  rateReviewsScroll: {
    paddingHorizontal: 24,
    gap: 14,
  },
  reviewCard: {
    width: 288,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#04081C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 4,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Geist-Bold',
    fontWeight: '700',
    color: '#0A1640',
  },
  reviewTimeAgo: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#8798CC',
  },
  reviewMetaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewFiveStars: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#E59A23',
  },
  reviewAuthor: {
    fontSize: 12,
    fontFamily: 'Geist',
    color: '#8798CC',
  },
  reviewBody: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 19.5,
    fontFamily: 'Geist',
    color: '#2B3B70',
  },
  rateBottomSection: {
    alignItems: 'center',
  },
  horizonSwordsContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  rateFooter: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 8,
  },
  maybeLaterBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maybeLaterText: {
    fontSize: 14.5,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#8FA0D0',
  },
  planSafeArea: {
    flex: 1,
  },
  planScroll: {
    flex: 1,
  },
  planScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 32,
    paddingBottom: 28,
  },
  planTopHeadline: {
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 32,
    lineHeight: 40,
    color: '#E6ECFA',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  planMainCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(143, 160, 208, 0.28)',
    backgroundColor: 'rgba(18, 34, 88, 0.52)',
    padding: 20,
  },
  planCleanHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardEyebrow: {
    fontSize: 11,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#8FA0D0',
  },
  planLiveTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 16, 48, 0.72)',
  },
  planLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F6ECD2',
  },
  planLiveTimerText: {
    fontSize: 12,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#E6ECFA',
    fontVariant: ['tabular-nums'],
  },
  planZeroDaysText: {
    marginTop: 4,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 38,
    color: '#E6ECFA',
  },
  planCardDivider: {
    marginVertical: 16,
    height: 1,
    backgroundColor: 'rgba(143, 160, 208, 0.18)',
  },
  planTargetDateText: {
    marginTop: 6,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 28,
    color: '#F6ECD2',
  },
  planStartedRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planStartedText: {
    fontSize: 12.5,
    fontFamily: 'Geist',
    color: '#8FA0D0',
  },
  planEditPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(143, 160, 208, 0.35)',
    backgroundColor: 'rgba(12, 24, 68, 0.6)',
  },
  planEditPillText: {
    fontSize: 12.5,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#E6ECFA',
  },
  planSectionHeadline: {
    marginTop: 28,
    fontFamily: 'LibreCaslonText_400Regular',
    fontSize: 23,
    color: '#E6ECFA',
    textAlign: 'center',
  },
  planGoalsChipsWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  planGoalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(143, 160, 208, 0.32)',
    backgroundColor: 'rgba(20, 36, 92, 0.55)',
  },
  planGoalChipText: {
    fontSize: 13,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    color: '#E6ECFA',
  },
  planArsenalEyebrow: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 11,
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
    letterSpacing: 1.8,
    color: '#8FA0D0',
    textAlign: 'center',
  },
  planArsenalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  planArsenalTile: {
    width: '31.5%',
    height: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(143, 160, 208, 0.22)',
    backgroundColor: 'rgba(18, 34, 88, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  planArsenalTileHighlight: {
    borderColor: 'rgba(197, 212, 247, 0.42)',
    backgroundColor: 'rgba(28, 50, 120, 0.65)',
  },
  planArsenalLabel: {
    fontSize: 12,
    fontFamily: 'Geist-Medium',
    fontWeight: '500',
    color: '#8FA0D0',
    textAlign: 'center',
  },
  planArsenalLabelHighlight: {
    color: '#E6ECFA',
    fontFamily: 'Geist-SemiBold',
    fontWeight: '600',
  },
  planStickyFooter: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  planCancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  planCancelText: {
    fontSize: 12.5,
    fontFamily: 'Geist',
    color: '#8FA0D0',
  },
});
