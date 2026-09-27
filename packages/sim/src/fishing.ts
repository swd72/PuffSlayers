// Puff Pond (GDD §8): cast → wait for a real bite → reel with the tension bar. What bites depends on how
// well the cast landed and the player's real clock (some fish only come out by day or by night).
// Bench puffs can also fish on their own for common fish (auto-fish). Fish Scales buy things at the pond shop.
import type { StatBlock } from './gear';
import type { Rng } from './rng';

export type FishRarity = 'common' | 'uncommon' | 'rare' | 'legend';
export type FishTime = 'any' | 'day' | 'night';

export interface FishInfo {
  readonly id: string;
  readonly rarity: FishRarity;
  readonly time: FishTime;
  /** size range in cm */
  readonly size: readonly [number, number];
  /** Fish Scales when caught */
  readonly scales: number;
}

export const FISH: readonly FishInfo[] = [
  { id: 'bread-carp', rarity: 'common', time: 'any', size: [12, 30], scales: 1 },
  { id: 'bubble-guppy', rarity: 'common', time: 'any', size: [4, 9], scales: 1 },
  { id: 'pebble-loach', rarity: 'common', time: 'day', size: [8, 16], scales: 2 },
  { id: 'moon-minnow', rarity: 'common', time: 'night', size: [5, 11], scales: 2 },
  { id: 'pudding-puffer', rarity: 'uncommon', time: 'any', size: [10, 22], scales: 4 },
  { id: 'petal-betta', rarity: 'uncommon', time: 'day', size: [6, 12], scales: 4 },
  { id: 'lantern-catfish', rarity: 'uncommon', time: 'night', size: [25, 60], scales: 5 },
  { id: 'mochi-ray', rarity: 'rare', time: 'any', size: [30, 80], scales: 12 },
  { id: 'sakura-koi', rarity: 'rare', time: 'day', size: [40, 90], scales: 14 },
  { id: 'star-jelly', rarity: 'rare', time: 'night', size: [15, 40], scales: 14 },
  { id: 'golden-koi', rarity: 'legend', time: 'any', size: [60, 120], scales: 40 },
  { id: 'rainbow-whale', rarity: 'legend', time: 'night', size: [90, 200], scales: 50 },
];

export const FISHING = {
  /** base bite weights per rarity */
  weights: { common: 70, uncommon: 22, rare: 7, legend: 1 } as Record<FishRarity, number>,
  /** a cast in the golden zone (quality ≥ this) makes rarer fish much likelier */
  goldenCast: 0.85,
  /** multiplier on rare/legend weights at quality 1 */
  castBoost: 4,
  /** day is 06:00–17:59 on the player's clock */
  dayFrom: 6,
  nightFrom: 18,
  /** reel: how strong each rarity pulls (zone speed) and how narrow the green zone is (0..1 of the bar) */
  reel: {
    common: { speed: 0.35, zone: 0.34, needMs: 6000 },
    uncommon: { speed: 0.5, zone: 0.28, needMs: 8000 },
    rare: { speed: 0.7, zone: 0.22, needMs: 10000 },
    legend: { speed: 0.95, zone: 0.18, needMs: 12000 },
  } as Record<FishRarity, { speed: number; zone: number; needMs: number }>,
  /** auto-fish: each bench puff at the pond brings back one common fish this often */
  autoEveryMs: 30 * 60_000,
  autoCapMs: 12 * 60 * 60_000,
  /** odds of a leaf/fake nibble before the real bite */
  fakeBiteChance: 0.45,
} as const;

export const fishInfo = (id: string): FishInfo | undefined => FISH.find((f) => f.id === id);
export const isDay = (hour: number): boolean => hour >= FISHING.dayFrom && hour < FISHING.nightFrom;
const fitsTime = (f: FishInfo, hour: number): boolean => f.time === 'any' || (f.time === 'day') === isDay(hour);

/** What bites: `quality` 0..1 is how close to the golden zone the cast landed. */
export function rollFish(rng: Rng, opts: { quality: number; hour: number }): { fish: FishInfo; size: number } {
  const q = Math.max(0, Math.min(1, opts.quality));
  const boost = q >= FISHING.goldenCast ? FISHING.castBoost : 1 + (FISHING.castBoost - 1) * q * 0.4;
  const pool = FISH.filter((f) => fitsTime(f, opts.hour));
  const weight = (f: FishInfo): number => {
    const per = pool.filter((x) => x.rarity === f.rarity).length;
    const w = FISHING.weights[f.rarity] / per;
    return f.rarity === 'rare' || f.rarity === 'legend' ? w * boost : f.rarity === 'uncommon' ? w * (1 + (boost - 1) * 0.5) : w;
  };
  const total = pool.reduce((s, f) => s + weight(f), 0);
  let r = rng.next() * total;
  let fish = pool[0]!;
  for (const f of pool) {
    r -= weight(f);
    if (r <= 0) {
      fish = f;
      break;
    }
  }
  const [lo, hi] = fish.size;
  const size = Math.round((lo + (hi - lo) * rng.next()) * 10) / 10;
  return { fish, size };
}

/** Fish brought back by bench puffs sitting at the pond (common fish only; rare ones need a real cast). */
export function autoFish(rng: Rng, opts: { anglers: number; elapsedMs: number; hour: number }): string[] {
  const ms = Math.min(Math.max(0, Number.isFinite(opts.elapsedMs) ? opts.elapsedMs : 0), FISHING.autoCapMs);
  const count = Math.floor(ms / FISHING.autoEveryMs) * Math.max(0, opts.anglers);
  const pool = FISH.filter((f) => f.rarity === 'common' && fitsTime(f, opts.hour));
  return Array.from({ length: count }, () => (pool[Math.floor(rng.next() * pool.length)] ?? pool[0]!).id);
}

/** Fishdex: a record of every fish caught. */
export type FishLog = Readonly<Record<string, { readonly count: number; readonly best: number }>>;

export function logCatch(log: FishLog, id: string, size: number): FishLog {
  const was = log[id];
  return { ...log, [id]: { count: (was?.count ?? 0) + 1, best: Math.max(was?.best ?? 0, size) } };
}

/** Fishdex milestones: permanent account-wide buffs for discovering more kinds of fish. */
export const FISHDEX_STEPS: readonly { readonly kinds: number; readonly bonus: StatBlock }[] = [
  { kinds: 3, bonus: { hpPct: 0.01 } },
  { kinds: 6, bonus: { atkPct: 0.01 } },
  { kinds: 9, bonus: { crit: 0.01, luck: 0.05 } },
  { kinds: FISH.length, bonus: { hpPct: 0.02, atkPct: 0.02 } },
];

export function fishdexBonus(log: FishLog): StatBlock {
  const kinds = Object.keys(log).filter((id) => fishInfo(id)).length;
  const out: Partial<Record<keyof StatBlock, number>> = {};
  for (const step of FISHDEX_STEPS) {
    if (kinds < step.kinds) continue;
    for (const [k, v] of Object.entries(step.bonus) as [keyof StatBlock, number][]) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}
