export interface DevotionalPassage {
  id: string;
  dayNumber: number;
  verseRef: string;
  scriptureText: string;
  reflectionHeadline?: string;
  reflectionText: string;
  reflectionSubText?: string;
  prayerText: string;
  audioDuration?: string;
}

export const DEVOTIONAL_PASSAGES: DevotionalPassage[] = [
  {
    id: 'passage-1',
    dayNumber: 1,
    verseRef: 'Matthew 7:13–14',
    scriptureText:
      'Enter through the narrow gate. For wide is the gate and broad is the road that leads to destruction, and many enter through it. But small is the gate and narrow the road that leads to life, and only a few find it.',
    reflectionText:
      'Today you have chosen the road that few travel. The culture promises that indulgence is freedom, but it is a prison. Walking in purity requires entering through the narrow gate. Take heart; Christ walks this narrow road with you every single step.',
    prayerText:
      'Lord Jesus, I stand at the threshold of freedom today. Deliver me from the easy illusions of this world. Anchor my steps upon Your narrow path, and grant me vigilance for the day ahead. Amen.',
    audioDuration: '1:32',
  },
  {
    id: 'passage-2',
    dayNumber: 2,
    verseRef: 'Colossians 3:1–3',
    scriptureText:
      'Since, then, you have been raised with Christ, set your hearts on things above, where Christ is, seated at the right hand of God. Set your minds on things above, not on earthly things. For you died, and your life is now hidden with Christ in God.',
    reflectionText:
      'You do not fight lust by constantly obsessing over what to avoid; you overcome it by setting your gaze upon a higher love. Your true life and identity are not defined by past shame, but are securely hidden in God.',
    prayerText:
      'Father in heaven, lift my eyes today above cheap dopamine and passing pleasure. Fill the empty spaces of my heart with Your Holy Spirit. Guard my imagination in Christ Jesus. Amen.',
    audioDuration: '1:45',
  },
  {
    id: 'passage-3',
    dayNumber: 3,
    verseRef: '1 Corinthians 10:13',
    scriptureText:
      'No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear. But when you are tempted, he will also provide a way out so that you can endure it.',
    reflectionText:
      'The enemy whispers that your urge is irresistible and unique to you. That is a lie. Thousands of brothers fight this exact battle right now, and God has already built the escape hatch into every temptation. Your only job is to take the way out.',
    prayerText:
      'Sovereign Lord, when the urge rises today, give me clear eyes to see the way out You have promised. I declare Your faithfulness over my weakness. In Jesus\' name, Amen.',
    audioDuration: '1:38',
  },
  {
    id: 'passage-4',
    dayNumber: 4,
    verseRef: 'Psalm 51:10–12',
    scriptureText:
      'Create in me a pure heart, O God, and renew a steadfast spirit within me. Do not cast me from your presence or take your Holy Spirit from me. Restore to me the joy of your salvation and grant me a willing spirit, to sustain me.',
    reflectionText:
      'Purity is not just willpower; it is heart surgery performed by God. David wrote this after his deepest moral failure. God does not discard broken men—He cleanses them and renews a steadfast spirit within them.',
    prayerText:
      'God of mercy, create in me a pure heart today. Wash away residual guilt. Restore the deep joy of my salvation so that sin loses its false charm. Amen.',
    audioDuration: '1:50',
  },
  {
    id: 'passage-5',
    dayNumber: 5,
    verseRef: '1 Corinthians 6:18–20',
    scriptureText:
      'Flee from sexual immorality. All other sins a person commits are outside the body, but whoever sins sexually sins against their own body. Do you not know that your bodies are temples of the Holy Spirit... You are not your own; you were bought at a price. Therefore honor God with your bodies.',
    reflectionText:
      'Scripture doesn\'t tell us to negotiate with sexual temptation—it says to flee. Joseph fled from Potiphar\'s wife, leaving his cloak behind. Run to safety, because your body is a holy temple bought with the precious blood of Christ.',
    prayerText:
      'Lord, remind me today whose I am. My eyes, my hands, and my thoughts belong to You. When temptation appears on a screen or in my mind, give me the wisdom to turn away immediately. Amen.',
    audioDuration: '1:42',
  },
  {
    id: 'passage-6',
    dayNumber: 6,
    verseRef: 'Ephesians 6:14 & John 8:32',
    scriptureText:
      'Stand firm then, with the belt of truth buckled around your waist... Then you will know the truth, and the truth will set you free.',
    reflectionText:
      'Roman soldiers secured all their armor to their belt. If the belt broke, the armor fell off. Every urge begins with a lie: "Just once won\'t hurt", "Nobody will know", "You need this to relax". Defeat the lie with truth: Sin always extracts more than it offers.',
    prayerText:
      'Jesus, You are the Truth. Buckle Your Word tightly around my mind today. Expose every deceptive narrative the enemy attempts to plant in my thoughts. Amen.',
    audioDuration: '1:35',
  },
  {
    id: 'passage-7',
    dayNumber: 7,
    verseRef: 'Psalm 119:9–11',
    scriptureText:
      'How can a young person stay on the path of purity? By living according to your word. I seek you with all my heart; do not let me stray from your commands. I have hidden your word in my heart that I might not sin against you.',
    reflectionText:
      'One full week conquered in the light! You have received the Belt of Truth. The foundation of recovery is cementing the Word in your heart so that when temptation speaks, God\'s Word speaks louder.',
    prayerText:
      'Father, thank You for bringing me through 7 days of purity. This milestone belongs to Your grace. Continue the work You have begun, and keep my heart steadfast in Your truth. Amen.',
    audioDuration: '1:48',
  },
  {
    id: 'passage-8',
    dayNumber: 8,
    verseRef: '2 Corinthians 10:4–5',
    scriptureText:
      'The weapons we fight with are not the weapons of the world. On the contrary, they have divine power to demolish strongholds... and we take captive every thought to make it obedient to Christ.',
    reflectionText:
      'The battlefield is between your ears. You cannot stop every stray image from appearing, but you can refuse to give it lodging. Arrest the rogue thought at the gate, handcuff it, and submit it to the lordship of Christ.',
    prayerText:
      'Holy Spirit, place a guard over the door of my mind today. Demolish every idol of fantasy before it takes root. I submit my thoughts to the obedience of Christ. Amen.',
    audioDuration: '1:40',
  },
  {
    id: 'passage-9',
    dayNumber: 9,
    verseRef: '1 John 1:7',
    scriptureText:
      'But if we walk in the light, as he is in the light, we have fellowship with one another, and the blood of Jesus, his Son, purifies us from all sin.',
    reflectionText:
      'Pornography thrives in darkness, isolation, and shame. Purity thrives in light, honesty, and brotherhood. When you bring your struggles into the light of God\'s presence, darkness loses its power to hold you.',
    prayerText:
      'Lord Jesus, I choose to walk openly in Your light today. Shine upon every hidden corner of my heart. Thank You that Your blood purifies me continually. Amen.',
    audioDuration: '1:33',
  },
  {
    id: 'passage-10',
    dayNumber: 10,
    verseRef: 'Romans 12:1–2',
    scriptureText:
      'Therefore, I urge you, brothers and sisters, in view of God\'s mercy, to offer your bodies as a living sacrifice, holy and pleasing to God—this is your true and proper worship. Do not conform to the pattern of this world, but be transformed by the renewing of your mind.',
    reflectionText:
      'True worship is not just singing on Sunday—it is offering your eyes, your phone, and your desires on a Tuesday afternoon as a living sacrifice to God. Let your mind be renewed rather than conformed.',
    prayerText:
      'Father, I offer my body as a living sacrifice to You today. Renew my brain, recalibrate my dopamine pathways, and give me the mind of Christ. Amen.',
    audioDuration: '1:52',
  },
  {
    id: 'passage-11',
    dayNumber: 11,
    verseRef: 'Job 31:1 & Matthew 6:22–23',
    scriptureText:
      'I made a covenant with my eyes not to look lustfully at a young woman... The eye is the lamp of the body. If your eyes are healthy, your whole body will be full of light.',
    reflectionText:
      'Like Job, make a holy covenant with your eyes today. What enters the eye gate enters the soul. Practice the "bounce": the moment an immodest or triggering image enters your vision, bounce your eyes elsewhere immediately.',
    prayerText:
      'Lord, seal my eyes today with the covenant of Job. Give me the holy reflex to bounce my gaze from triggers and focus on things that bring light to my soul. Amen.',
    audioDuration: '1:37',
  },
  {
    id: 'passage-12',
    dayNumber: 12,
    verseRef: '1 John 2:15–17',
    scriptureText:
      'Do not love the world or anything in the world. If anyone loves the world, love for the Father is not in them. For everything in the world—the lust of the flesh, the lust of the eyes, and the pride of life—comes not from the Father but from the world.',
    reflectionText:
      'The digital world wants to monetize your attention and enslave your soul. But the pixels and passing thrills of lust will fade into dust. What you are building right now in purity will last into eternity.',
    prayerText:
      'Lord, deliver me from the hollow glamour of this dying world. Anchor my heart in the eternal kingdom where true life and holy love dwell. Amen.',
    audioDuration: '1:44',
  },
  {
    id: 'passage-13',
    dayNumber: 13,
    verseRef: 'Matthew 26:41',
    scriptureText:
      'Watch and pray so that you will not fall into temptation. The spirit is willing, but the flesh is weak.',
    reflectionText:
      'Jesus spoke these words in Gethsemane on the eve of His greatest trial. Vigilance is not paranoia; it is wisdom. Know your weak hours—late night, times of stress, fatigue, loneliness (H.A.L.T.). Watch and pray before the ambush occurs.',
    prayerText:
      'Lord Jesus, my spirit is willing, but my flesh is fragile. Keep me alert to the subtle patterns of vulnerability today. Sustain me through Your intercession. Amen.',
    audioDuration: '1:36',
  },
  {
    id: 'passage-14',
    dayNumber: 14,
    verseRef: 'Ephesians 6:14 & Proverbs 4:23',
    scriptureText:
      'Above all else, guard your heart, for everything you do flows from it... Stand firm then, with the breastplate of righteousness in place.',
    reflectionText:
      'Two weeks clean! You have reached Man-at-Arms. The breastplate covers the heart, lungs, and vital organs. Righteousness is your protective armor: not self-righteous pride, but the imputed righteousness of Jesus Christ that shields you from the enemy\'s accusations.',
    prayerText:
      'Lord, I put on the breastplate of righteousness today. Protect my heart from emotional vulnerability and condemnation. Thank You for 14 days of freedom in Your light. Amen.',
    audioDuration: '1:55',
  },
];

/**
 * Returns today's passage based on clean day count (1-indexed)
 */
export function getPassageForDay(cleanDays: number): DevotionalPassage {
  const dayIndex = Math.max(0, cleanDays) % DEVOTIONAL_PASSAGES.length;
  return DEVOTIONAL_PASSAGES[dayIndex];
}

