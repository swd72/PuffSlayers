import { describe, expect, it } from 'vitest';
import {
  ALBUM,
  CAPSULE,
  FISH,
  PUFFS,
  PVP,
  RAID,
  arenaResult,
  arenaRivals,
  autoFish,
  bumpQuest,
  canClaimBonus,
  canClaimQuest,
  chapterPuff,
  claimableCount,
  createBattle,
  createRng,
  dailyQuests,
  dayIndex,
  fishdexBonus,
  freshPity,
  isDay,
  logCatch,
  openCapsules,
  puffBonus,
  raidBoss,
  raidMilestonesReached,
  rankOf,
  rollDaily,
  rollFish,
  simulate,
  stageShards,
  stageWaves,
  starUpCost,
  weekIndex,
  QUESTS,
} from '../src';

describe('Puff Capsule', () => {
  it('guarantees a ★4+ every 10 pulls and a ★5+ within 60', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { pulls } = openCapsules(createRng(seed), freshPity(), 120);
      for (let i = 0; i + CAPSULE.pity4 <= pulls.length; i++) {
        expect(pulls.slice(i, i + CAPSULE.pity4).some((p) => p.rarity >= 4)).toBe(true);
      }
      for (let i = 0; i + CAPSULE.pity5 <= pulls.length; i++) {
        expect(pulls.slice(i, i + CAPSULE.pity5).some((p) => p.rarity >= 5)).toBe(true);
      }
    }
  });

  it('keeps the pity counters and spark across calls, and replays from a seed', () => {
    const a = openCapsules(createRng(7), freshPity(), 10);
    const b = openCapsules(createRng(7), freshPity(), 10);
    expect(a).toEqual(b);
    expect(a.pity.spark).toBe(10);
    const more = openCapsules(createRng(8), a.pity, 5);
    expect(more.pity.spark).toBe(15);
  });

  it('rolls close to the posted rates', () => {
    const { pulls } = openCapsules(createRng(99), { since4: -1e9, since5: -1e9, spark: 0 }, 20000);
    const share = (r: number) => pulls.filter((p) => p.rarity === r).length / pulls.length;
    expect(share(3)).toBeCloseTo(CAPSULE.rates[3] / 100, 1);
    expect(share(4)).toBeCloseTo(CAPSULE.rates[4] / 100, 1);
    expect(pulls.every((p) => PUFFS.find((x) => x.id === p.puff)?.rarity === p.rarity)).toBe(true);
  });

  it('stars and rarity add strength; chapters feature a puff; bosses give more shards', () => {
    expect(puffBonus(3, 0)).toEqual({ hpPct: 0, atkPct: 0 });
    expect(puffBonus(6, 5).atkPct).toBeCloseTo(ALBUM.rarityBonus[6] + 0.3);
    expect(starUpCost(0)).toBe(10);
    expect(starUpCost(5)).toBeUndefined();
    expect(chapterPuff(1)).toBe('latte');
    expect(chapterPuff(11)).toBe('senbei');
    expect(stageShards(10)).toBeGreaterThan(stageShards(5));
    expect(stageShards(5)).toBeGreaterThan(stageShards(4));
  });
});

describe('daily quests', () => {
  it('offers the core quests plus a seeded pick of unlocked ones', () => {
    const q = dailyQuests(100, ['fish', 'garden', 'capsule', 'arena']);
    expect(q).toHaveLength(5);
    expect(q.slice(0, 2)).toEqual(['clear', 'bonk']);
    expect(dailyQuests(100, ['fish', 'garden', 'capsule', 'arena'])).toEqual(q);
    expect(dailyQuests(5, [])).toEqual(['clear', 'bonk']);
  });

  it('counts progress up to the target and pays once', () => {
    let d = rollDaily(null, 10, ['garden', 'levelup', 'nap']);
    expect(rollDaily(d, 10, [])).toBe(d);
    expect(rollDaily(d, 11, []).day).toBe(11);
    d = bumpQuest(d, 'bonk', 1000);
    expect(d.progress.bonk).toBe(QUESTS.bonk.target);
    expect(bumpQuest(d, 'fish')).toBe(d);
    expect(canClaimQuest(d, 'bonk')).toBe(true);
    expect(claimableCount(d)).toBe(1);
    d = { ...d, claimed: [...d.quests] };
    expect(canClaimQuest(d, 'bonk')).toBe(false);
    expect(canClaimBonus(d)).toBe(true);
  });

  it('uses the local calendar', () => {
    const t = Date.UTC(2026, 8, 27, 20, 0); // 03:00 next day in Bangkok
    expect(dayIndex(t, -420)).toBe(dayIndex(t, 0) + 1);
    expect(weekIndex(t + 7 * 86_400_000)).toBe(weekIndex(t) + 1);
  });
});

describe('Puff Pond', () => {
  it('only catches fish that are out at that hour', () => {
    const rng = createRng(3);
    for (let i = 0; i < 300; i++) {
      const night = rollFish(rng, { quality: 0.5, hour: 23 }).fish;
      expect(night.time).not.toBe('day');
      const day = rollFish(rng, { quality: 0.5, hour: 10 }).fish;
      expect(day.time).not.toBe('night');
    }
    expect(isDay(6)).toBe(true);
    expect(isDay(18)).toBe(false);
  });

  it('a golden cast makes rare fish likelier', () => {
    const rareShare = (quality: number) => {
      const rng = createRng(11);
      let n = 0;
      for (let i = 0; i < 4000; i++) {
        const r = rollFish(rng, { quality, hour: 12 }).fish.rarity;
        if (r === 'rare' || r === 'legend') n++;
      }
      return n / 4000;
    };
    expect(rareShare(1)).toBeGreaterThan(rareShare(0) * 2.5);
  });

  it('auto-fish brings back common fish over time, capped', () => {
    expect(autoFish(createRng(1), { anglers: 2, elapsedMs: 60 * 60_000, hour: 12 })).toHaveLength(4);
    expect(autoFish(createRng(1), { anglers: 1, elapsedMs: 100 * 3600_000, hour: 12 })).toHaveLength(24);
    expect(autoFish(createRng(1), { anglers: 1, elapsedMs: NaN, hour: 12 })).toHaveLength(0);
    const ids = autoFish(createRng(2), { anglers: 3, elapsedMs: 5 * 3600_000, hour: 2 });
    expect(ids.every((id) => FISH.find((f) => f.id === id)?.rarity === 'common')).toBe(true);
  });

  it('the fishdex keeps counts and best size, and pays milestones', () => {
    let log = logCatch({}, 'bread-carp', 12);
    log = logCatch(log, 'bread-carp', 20);
    expect(log['bread-carp']).toEqual({ count: 2, best: 20 });
    expect(fishdexBonus(log)).toEqual({});
    log = logCatch(logCatch(log, 'mochi-ray', 40), 'star-jelly', 20);
    expect(fishdexBonus(log).hpPct).toBeCloseTo(0.01);
  });
});

describe('Arena', () => {
  it('builds three rivals around the player level', () => {
    const rivals = arenaRivals(createRng(5), { level: 20, stage: 7 });
    expect(rivals.map((r) => r.tier)).toEqual(['easy', 'fair', 'tough']);
    expect(rivals.map((r) => r.level)).toEqual([17, 20, 23]);
    for (const r of rivals) {
      expect(r.heroes).toHaveLength(PVP.teamSize[r.tier]);
      expect(new Set(r.heroes.map((h) => h.heroClass)).size).toBe(r.heroes.length);
      expect(r.heroes[0]?.heroClass).toBe('pillow-guard');
    }
  });

  it('fights puff vs puff to a finish, the same every time', () => {
    const rival = arenaRivals(createRng(1), { level: 10, stage: 2 })[1]!;
    const heroes = PUFFS.slice(0, 6).map((p) => ({ id: p.id, name: p.name, species: p.species, heroClass: p.heroClass, level: 10 }));
    const config = { stage: 1, heroes, rivals: rival.heroes, waves: [[]], autoUltimate: false, puffHpScale: PVP.hpScale } as const;
    const a = simulate(createBattle(config, 42));
    const b = simulate(createBattle(config, 42));
    expect(a.state.phase).not.toBe('fighting');
    const loser = a.state.phase === 'victory' ? 'enemy' : 'hero';
    expect(a.state.units.filter((u) => u.side === loser).every((u) => u.hp === 0)).toBe(true);
    // rivals line up on the far side, facing the player's team
    const r = createBattle(config, 1).units.find((u) => u.id.startsWith('r-'))!;
    expect(r.side).toBe('enemy');
    expect(r.facing).toBe(-1);
    expect(r.stats.maxHp).toBeGreaterThan(2000);
    expect(b.events.length).toBe(a.events.length);
    // rivals cast their own ultimates even with auto off
    expect(a.events.some((e) => e.type === 'ultimateCast' && e.source.startsWith('r-'))).toBe(true);
  });

  it('pays points and honor, never below zero, and ranks up', () => {
    expect(arenaResult('tough', true, 0)).toEqual({ points: 40, delta: 40, honor: 25 });
    expect(arenaResult('easy', false, 3)).toEqual({ points: 0, delta: -3, honor: 3 });
    expect(rankOf(0).rank.name).toBe('Cotton');
    expect(rankOf(520).rank.name).toBe('Silk');
    expect(rankOf(5000).next).toBeUndefined();
  });
});

describe('Raid', () => {
  it('rotates the boss weekly and counts milestone chests', () => {
    expect(raidBoss(0)).not.toBe(raidBoss(1));
    expect(raidBoss(3)).toBe(raidBoss(0));
    expect(raidBoss(-1)).toBe(raidBoss(2));
    expect(raidMilestonesReached(0.09)).toBe(0);
    expect(raidMilestonesReached(0.5)).toBe(3);
    expect(raidMilestonesReached(1)).toBe(RAID.milestones.length);
  });

  it('a raid boss carries its big shared HP pool between attempts', () => {
    const heroes = [{ id: 'a', name: 'A', species: 'shibu', heroClass: 'carrot-knight', level: 10 }] as const;
    const boss = { boss: 'queen-rafflesia', giant: true, hpMult: RAID.hpMult } as const;
    const full = createBattle({ stage: 5, heroes, waves: [[boss]], autoUltimate: true }, 1).units.find((u) => u.isBoss)!;
    const half = createBattle({ stage: 5, heroes, waves: [[{ ...boss, hpLeft: 0.5 }]], autoUltimate: true }, 1).units.find((u) => u.isBoss)!;
    const normal = createBattle({ stage: 5, heroes, waves: [[{ boss: 'queen-rafflesia', giant: true }]], autoUltimate: true }, 1).units.find((u) => u.isBoss)!;
    expect(full.stats.maxHp).toBeCloseTo(normal.stats.maxHp * RAID.hpMult, -2);
    expect(stageWaves(10)).toHaveLength(2);
    expect(half.hp).toBe(Math.round(full.stats.maxHp / 2));
  });
});
