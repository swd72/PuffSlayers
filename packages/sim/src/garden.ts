// World-Waking Garden (GDD §0.5): a bonked flower sometimes leaves a seed; planted at home it grows
// in real time (even while away), and every bloom picked adds to small permanent team buffs.
// Pure: time comes in as a number (ms), so tests and the server can replay it.
import type { StatBlock } from './gear';
import type { Rng } from './rng';
import type { BossKind, EnemyKind } from './types';

export type SeedKind = EnemyKind | BossKind;

export interface SeedInfo {
  readonly rare: boolean;
  /** real-time ms from planting to bloom */
  readonly growMs: number;
  /** team buff for every BLOOMS_PER_STEP blooms picked */
  readonly perStep: StatBlock;
  /** Petals when picked */
  readonly petals: number;
}

const MIN = 60_000;

export const SEEDS: Record<SeedKind, SeedInfo> = {
  daisy: { rare: false, growMs: 10 * MIN, perStep: { hpPct: 0.01 }, petals: 30 },
  tulip: { rare: false, growMs: 12 * MIN, perStep: { atkPct: 0.01 }, petals: 30 },
  sunflower: { rare: false, growMs: 15 * MIN, perStep: { crit: 0.004 }, petals: 40 },
  lavender: { rare: false, growMs: 15 * MIN, perStep: { charge: 0.01 }, petals: 40 },
  cactus: { rare: false, growMs: 20 * MIN, perStep: { defPct: 0.012 }, petals: 50 },
  'honey-bud': { rare: false, growMs: 20 * MIN, perStep: { haste: 0.006 }, petals: 50 },
  'queen-rafflesia': { rare: true, growMs: 60 * MIN, perStep: { atkPct: 0.02, hpPct: 0.02 }, petals: 300 },
  'sunflower-colossus': { rare: true, growMs: 60 * MIN, perStep: { defPct: 0.025, hpPct: 0.02 }, petals: 300 },
  'lotus-moon-sage': { rare: true, growMs: 60 * MIN, perStep: { charge: 0.025, luck: 0.05 }, petals: 300 },
};
export const SEED_KINDS = Object.keys(SEEDS) as SeedKind[];

export const GARDEN = {
  startPlots: 6,
  /** chance a bonked flower leaves a seed; bosses always do */
  seedChance: 0.2,
  /** blooms per permanent buff step (rare seeds count every bloom) */
  bloomsPerStep: 5,
  /** max steps per flower, so the garden can't break balance */
  maxSteps: 10,
  /** watering skips this share of the current stage's remaining time; once per stage */
  waterSkip: 0.35,
  /** growth shown in these steps: seed → sprout → bud → bloom */
  stages: 4,
  /** blooms needed for 100% world-waking in chapter 1 */
  restoreGoal: 60,
} as const;

export interface Plot {
  readonly seed: SeedKind;
  readonly plantedAt: number;
  /** ms taken off by watering */
  readonly boostMs: number;
  /** growth stage (0..2) that was last watered, -1 = never */
  readonly wateredStage: number;
}

/** 0..1 growth of a plot at `now`. */
export function growth(plot: Plot, now: number): number {
  const total = SEEDS[plot.seed].growMs;
  return Math.max(0, Math.min(1, (now - plot.plantedAt + plot.boostMs) / total));
}

/** 0 seed, 1 sprout, 2 bud, 3 bloom. */
export function growthStage(plot: Plot, now: number): number {
  const g = growth(plot, now);
  return g >= 1 ? GARDEN.stages - 1 : Math.min(GARDEN.stages - 2, Math.floor(g * (GARDEN.stages - 1)));
}

export const isBloomed = (plot: Plot, now: number): boolean => growth(plot, now) >= 1;

export const msLeft = (plot: Plot, now: number): number => Math.max(0, SEEDS[plot.seed].growMs - (now - plot.plantedAt + plot.boostMs));

export const plant = (seed: SeedKind, now: number): Plot => ({ seed, plantedAt: now, boostMs: 0, wateredStage: -1 });

export const canWater = (plot: Plot, now: number): boolean => !isBloomed(plot, now) && plot.wateredStage < growthStage(plot, now);

/** Watering: skip part of the time left, once per growth stage. */
export function water(plot: Plot, now: number): Plot {
  if (!canWater(plot, now)) return plot;
  const skip = Math.round(msLeft(plot, now) * GARDEN.waterSkip);
  const next = { ...plot, boostMs: plot.boostMs + skip };
  // mark the stage it is in *after* the boost, so a jump into the next stage can't be watered again at once
  return { ...next, wateredStage: growthStage(next, now) };
}

/** Permanent team stats from the blooms picked so far. */
export function gardenBonus(blooms: Readonly<Partial<Record<SeedKind, number>>>): StatBlock {
  const out: Record<string, number> = {};
  for (const kind of SEED_KINDS) {
    const info = SEEDS[kind];
    const steps = Math.min(GARDEN.maxSteps, Math.floor((blooms[kind] ?? 0) / (info.rare ? 1 : GARDEN.bloomsPerStep)));
    if (!steps) continue;
    for (const [k, v] of Object.entries(info.perStep)) out[k] = Math.round(((out[k] ?? 0) + (v ?? 0) * steps) * 10000) / 10000;
  }
  return out as StatBlock;
}

/** Share of the chapter brought back to life (0..1). */
export function restoration(blooms: Readonly<Partial<Record<SeedKind, number>>>): number {
  const total = SEED_KINDS.reduce((s, k) => s + (blooms[k] ?? 0), 0);
  return Math.min(1, total / GARDEN.restoreGoal);
}

/** Seeds left behind by the flowers bonked in a battle. */
export function rollSeeds(rng: Rng, bonked: readonly SeedKind[]): SeedKind[] {
  return bonked.filter((kind) => SEEDS[kind].rare || rng.next() < GARDEN.seedChance);
}
