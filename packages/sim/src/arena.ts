// Pillow Fight Arena (GDD §10.1), local edition: three rival teams to pick from (easy / fair / tough),
// five free fights a day, rank points and Honor. Rivals are generated puff teams for now; the same
// deterministic battle will later run on the server against real players' defense teams.
// Raid (GDD §9 Weekly Raid), local edition: one giant boss per week with a huge shared HP pool; every
// attempt is a timed fight and the damage adds up toward milestone chests.
import { PUFFS, type PuffInfo } from './puffs';
import type { Rng } from './rng';
import type { BossKind, HeroSpec } from './types';

export type RivalTier = 'easy' | 'fair' | 'tough';

export const PVP = {
  ticketsPerDay: 5,
  /** fight clock; when it runs out, the side with more HP left (by share) wins */
  timeLimitMs: 90_000,
  /** puffs are sturdier in pillow fights, so ultimates get their turn */
  hpScale: 3,
  levelGap: { easy: -3, fair: 0, tough: 3 } as Record<RivalTier, number>,
  teamSize: { easy: 4, fair: 5, tough: 6 } as Record<RivalTier, number>,
  win: { easy: 15, fair: 25, tough: 40 } as Record<RivalTier, number>,
  loss: 8,
  honorWin: { easy: 10, fair: 15, tough: 25 } as Record<RivalTier, number>,
  honorLoss: 3,
} as const;

export const RANKS: readonly { readonly id: string; readonly name: string; readonly from: number }[] = [
  { id: 'cotton', name: 'Cotton', from: 0 },
  { id: 'wool', name: 'Wool', from: 200 },
  { id: 'silk', name: 'Silk', from: 500 },
  { id: 'cashmere', name: 'Cashmere', from: 900 },
  { id: 'cloud', name: 'Cloud', from: 1400 },
  { id: 'legend', name: 'Legend Puff', from: 2000 },
];

export function rankOf(points: number): { rank: (typeof RANKS)[number]; next?: (typeof RANKS)[number] } {
  let i = 0;
  while (i + 1 < RANKS.length && points >= RANKS[i + 1]!.from) i++;
  return { rank: RANKS[i]!, ...(RANKS[i + 1] ? { next: RANKS[i + 1] } : {}) };
}

const RIVAL_NAMES = ['ชมรมหมอนนุ่ม', 'แก๊งแก้มป่อง', 'ทีมหางม้วน', 'บ้านหูตั้ง', 'ก๊วนขนมปังปิ้ง', 'สมาคมงีบกลางวัน', 'ทีมโมจิยืด', 'พี่น้องจมูกดาว', 'ชมรมกระดิ่งเงิน', 'ทีมแครอทกรอบ'];

export interface Rival {
  readonly tier: RivalTier;
  readonly name: string;
  readonly level: number;
  readonly heroes: readonly HeroSpec[];
}

/** Three rivals around the player's team level; the same seed gives the same three. */
export function arenaRivals(rng: Rng, opts: { level: number; stage: number }): Rival[] {
  const tiers: RivalTier[] = ['easy', 'fair', 'tough'];
  const names = [...RIVAL_NAMES];
  return tiers.map((tier) => {
    const name = names.splice(Math.floor(rng.next() * names.length), 1)[0] ?? 'ทีมพัฟ';
    const level = Math.max(1, opts.level + PVP.levelGap[tier]);
    const pool: PuffInfo[] = [...PUFFS];
    const picks: PuffInfo[] = [];
    // one guard up front so rivals fight like a real team
    const guards = pool.filter((p) => p.heroClass === 'pillow-guard');
    const guard = guards[Math.floor(rng.next() * guards.length)]!;
    picks.push(guard);
    pool.splice(pool.indexOf(guard), 1);
    while (picks.length < PVP.teamSize[tier]) {
      const p = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
      if (!p) break;
      // no two of the same class: keeps formations readable
      if (picks.some((x) => x.heroClass === p.heroClass)) continue;
      picks.push(p);
    }
    // rivals' gear grows with the stage like the player's does
    const gearPct = 0.04 + opts.stage * 0.012;
    const heroes: HeroSpec[] = picks.map((p) => ({
      id: `r-${p.id}`,
      name: p.name,
      species: p.species,
      heroClass: p.heroClass,
      level,
      gear: { stats: { hpPct: gearPct, atkPct: gearPct, defPct: gearPct * 0.5 }, relics: [] },
    }));
    return { tier, name, level, heroes };
  });
}

/** Rank points and Honor for a finished fight. */
export function arenaResult(tier: RivalTier, won: boolean, points: number): { points: number; delta: number; honor: number } {
  const delta = won ? PVP.win[tier] : -Math.min(points, PVP.loss);
  return { points: points + delta, delta, honor: won ? PVP.honorWin[tier] : PVP.honorLoss };
}

// ---------- Raid ----------

const RAID_BOSSES: readonly BossKind[] = ['queen-rafflesia', 'sunflower-colossus', 'lotus-moon-sage'];

export const RAID = {
  ticketsPerDay: 3,
  timeLimitMs: 60_000,
  /** the raid boss has this many times a giant's HP, shared across the week's attempts */
  hpMult: 12,
  /** chests at these shares of the pool */
  milestones: [0.1, 0.25, 0.5, 0.75, 1] as const,
  /** Dew Drops per chest (the last chest is the big one) */
  milestoneDew: [30, 50, 80, 100, 200] as const,
  milestoneDust: [20, 40, 60, 100, 200] as const,
  /** shards of the week's featured puff in the last two chests */
  milestoneShards: [0, 0, 5, 10, 20] as const,
} as const;

export const raidBoss = (week: number): BossKind => RAID_BOSSES[((week % RAID_BOSSES.length) + RAID_BOSSES.length) % RAID_BOSSES.length]!;

/** The raid boss matches the current stage; its huge HP pool is what takes a week of attempts. */
export const raidStage = (stage: number): number => Math.max(3, stage);

/** Chests reached by this share of damage. */
export const raidMilestonesReached = (share: number): number => RAID.milestones.filter((m) => share >= m - 1e-9).length;
