// Arena and Raid on the save (local editions: rivals are generated, the raid boss pool lives in this browser).
import {
  PVP,
  RAID,
  arenaResult,
  arenaRivals,
  chapterPuff,
  createRng,
  raidBoss,
  raidMilestonesReached,
  raidStage,
  stagePetals,
  weekIndex,
  type BossKind,
  type Rival,
  type RivalTier,
} from '@puff/sim';
import { addShards } from './album';
import { bump, today, tzOffset } from './daily';
import { teamLevel, type SaveData } from './save';

// ---------- arena ----------

/** Tickets roll over at local midnight. */
export function arenaState(save: SaveData, now = Date.now()): SaveData['arena'] {
  const day = today(now);
  return save.arena.day === day ? save.arena : { ...save.arena, day, used: 0 };
}

export const arenaTicketsLeft = (save: SaveData): number => PVP.ticketsPerDay - arenaState(save).used;

export const currentRivals = (save: SaveData): Rival[] => arenaRivals(createRng(save.arena.seed), { level: teamLevel(save), stage: save.stage });

export interface ArenaOutcome {
  readonly save: SaveData;
  readonly won: boolean;
  readonly delta: number;
  readonly honor: number;
  readonly dew: number;
}

/** Spends a ticket and records the result; a fresh trio of rivals comes up. */
export function finishArena(save: SaveData, tier: RivalTier, won: boolean): ArenaOutcome {
  const state = arenaState(save);
  const r = arenaResult(tier, won, state.points);
  const dew = won ? (tier === 'tough' ? 20 : 10) : 0;
  const arena = {
    ...state,
    used: state.used + 1,
    points: r.points,
    honor: state.honor + r.honor,
    wins: state.wins + (won ? 1 : 0),
    losses: state.losses + (won ? 0 : 1),
    seed: (state.seed * 1664525 + 1013904223) >>> 0,
  };
  return { save: bump({ ...save, arena, dew: save.dew + dew }, 'arena'), won, delta: r.delta, honor: r.honor, dew };
}

// ---------- raid ----------

export const thisWeek = (now = Date.now()): number => weekIndex(now, tzOffset());

/** New week: a new boss with a full pool. New day: fresh tickets. */
export function raidState(save: SaveData, now = Date.now()): SaveData['raid'] {
  const week = thisWeek(now);
  const day = today(now);
  let r = save.raid;
  if (r.week !== week) r = { week, dealt: 0, day, used: 0, claimed: 0 };
  if (r.day !== day) r = { ...r, day, used: 0 };
  return r;
}

export const raidTicketsLeft = (save: SaveData): number => RAID.ticketsPerDay - raidState(save).used;
export const currentRaidBoss = (): BossKind => raidBoss(thisWeek());
export const currentRaidStage = (save: SaveData): number => raidStage(save.stage);

export interface RaidOutcome {
  readonly save: SaveData;
  /** share of the pool this attempt took off */
  readonly share: number;
  /** milestone chests opened by this attempt */
  readonly chests: readonly { dew: number; dust: number; shards: number; petals: number }[];
}

/** Adds an attempt's damage (as a share of the pool) and pays any milestone chests it crossed. */
export function finishRaid(save: SaveData, share: number): RaidOutcome {
  const state = raidState(save);
  const dealt = Math.min(1, state.dealt + Math.max(0, share));
  const reached = raidMilestonesReached(dealt);
  const chests: { dew: number; dust: number; shards: number; petals: number }[] = [];
  let next: SaveData = save;
  const puff = chapterPuff(save.stage);
  for (let i = state.claimed; i < reached; i++) {
    const chest = { dew: RAID.milestoneDew[i] ?? 0, dust: RAID.milestoneDust[i] ?? 0, shards: RAID.milestoneShards[i] ?? 0, petals: stagePetals(Math.max(1, save.stage - 1)) * (i + 1) };
    chests.push(chest);
    next = addShards({ ...next, dew: next.dew + chest.dew, stardust: next.stardust + chest.dust, petals: next.petals + chest.petals }, puff, chest.shards);
  }
  next = bump({ ...next, raid: { ...state, dealt, used: state.used + 1, claimed: Math.max(state.claimed, reached) } }, 'raid');
  return { save: next, share: dealt - state.dealt, chests };
}
