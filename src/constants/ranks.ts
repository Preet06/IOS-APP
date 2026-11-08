export interface RankItem {
  id: string;
  day: number;
  title: string;
  armorPiece?: string;
  scriptureRef?: string;
  description: string;
}

export const RANKS: RankItem[] = [
  {
    id: 'initiate',
    day: 1,
    title: 'Initiate',
    description: 'The journey begins. You have stood up and chosen the narrow path.',
  },
  {
    id: 'page',
    day: 3,
    title: 'Page',
    description: 'First trials overcome. Humility and vigilance take root.',
  },
  {
    id: 'squire',
    day: 7,
    title: 'Squire',
    armorPiece: 'Belt of Truth',
    scriptureRef: 'Ephesians 6:14',
    description: 'Stand firm then, with the belt of truth buckled around your waist.',
  },
  {
    id: 'man-at-arms',
    day: 14,
    title: 'Man-at-Arms',
    armorPiece: 'Breastplate of Righteousness',
    scriptureRef: 'Ephesians 6:14',
    description: 'With the breastplate of righteousness in place, protecting your heart.',
  },
  {
    id: 'knight',
    day: 30,
    title: 'Knight',
    armorPiece: 'Shoes of Peace',
    scriptureRef: 'Ephesians 6:15',
    description: 'Feet fitted with the readiness that comes from the gospel of peace.',
  },
  {
    id: 'sworn-knight',
    day: 50,
    title: 'Sworn Knight',
    armorPiece: 'Shield of Faith',
    scriptureRef: 'Ephesians 6:16',
    description: 'Take up the shield of faith, with which you can extinguish all flaming arrows.',
  },
  {
    id: 'knight-of-watch',
    day: 75,
    title: 'Knight of the Watch',
    armorPiece: 'Helmet of Salvation',
    scriptureRef: 'Ephesians 6:17',
    description: 'Take the helmet of salvation, guarding your mind in Christ.',
  },
  {
    id: 'paladin',
    day: 90,
    title: 'Paladin',
    armorPiece: 'Sword of the Spirit',
    scriptureRef: 'Ephesians 6:17',
    description: 'Take the sword of the Spirit, which is the living word of God.',
  },
  {
    id: 'champion',
    day: 120,
    title: 'Champion',
    description: 'Steadfast in the fires of discipline. A light to those who waver.',
  },
  {
    id: 'guardian',
    day: 150,
    title: 'Guardian',
    description: 'Protector of the fortress of your mind and heart.',
  },
  {
    id: 'warden',
    day: 200,
    title: 'Warden',
    description: 'The desires of old have lost their dominion.',
  },
  {
    id: 'commander',
    day: 270,
    title: 'Commander',
    description: 'Tested in the valley and crowned on the heights.',
  },
  {
    id: 'overcomer',
    day: 365,
    title: 'Overcomer',
    description: 'A full year walked in light. More than a conqueror through Him.',
  },
];

export function getRankForDays(cleanDays: number): RankItem {
  let activeRank = RANKS[0];
  for (const rank of RANKS) {
    if (cleanDays >= rank.day) {
      activeRank = rank;
    } else {
      break;
    }
  }
  return activeRank;
}

export function getNextRank(cleanDays: number): { nextRank: RankItem | null; daysRemaining: number } {
  for (const rank of RANKS) {
    if (rank.day > cleanDays) {
      return {
        nextRank: rank,
        daysRemaining: rank.day - cleanDays,
      };
    }
  }
  return { nextRank: null, daysRemaining: 0 };
}

export interface ArmorPiece {
  id: string;
  name: string;
  rankId: string;
  rankTitle: string;
  dayThreshold: number;
  scriptureRef: string;
  description: string;
  glyph: string;
}

export const EPHESIANS_ARMOR: ArmorPiece[] = [
  {
    id: 'belt-of-truth',
    name: 'Belt of Truth',
    rankId: 'squire',
    rankTitle: 'Squire',
    dayThreshold: 7,
    scriptureRef: 'Ephesians 6:14',
    description: 'Stand firm then, with the belt of truth buckled around your waist.',
    glyph: '🎗️',
  },
  {
    id: 'breastplate-of-righteousness',
    name: 'Breastplate of Righteousness',
    rankId: 'man-at-arms',
    rankTitle: 'Man-at-Arms',
    dayThreshold: 14,
    scriptureRef: 'Ephesians 6:14',
    description: 'With the breastplate of righteousness in place, guarding your heart.',
    glyph: '🛡️',
  },
  {
    id: 'shoes-of-peace',
    name: 'Shoes of Peace',
    rankId: 'knight',
    rankTitle: 'Knight',
    dayThreshold: 30,
    scriptureRef: 'Ephesians 6:15',
    description: 'Feet fitted with the readiness that comes from the gospel of peace.',
    glyph: '👞',
  },
  {
    id: 'shield-of-faith',
    name: 'Shield of Faith',
    rankId: 'sworn-knight',
    rankTitle: 'Sworn Knight',
    dayThreshold: 50,
    scriptureRef: 'Ephesians 6:16',
    description: 'Take up the shield of faith, with which you extinguish all flaming arrows.',
    glyph: '🛡️',
  },
  {
    id: 'helmet-of-salvation',
    name: 'Helmet of Salvation',
    rankId: 'knight-of-watch',
    rankTitle: 'Knight of the Watch',
    dayThreshold: 75,
    scriptureRef: 'Ephesians 6:17',
    description: 'Take the helmet of salvation, guarding your mind in Christ.',
    glyph: '🪖',
  },
  {
    id: 'sword-of-spirit',
    name: 'Sword of the Spirit',
    rankId: 'paladin',
    rankTitle: 'Paladin',
    dayThreshold: 90,
    scriptureRef: 'Ephesians 6:17',
    description: 'Take the sword of the Spirit, which is the living word of God.',
    glyph: '⚔️',
  },
];


