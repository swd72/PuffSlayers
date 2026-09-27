import { BOSS_MINION, TUNING, ULTIMATE_COOLDOWN_MS, ULTIMATE_DAMAGE, ULTIMATE_RADIUS } from './data';
import { clampToArena, distance, distanceToSegment, face, moveAway, moveToward, place, type WorkUnit } from './movement';
import type { Rng } from './rng';
import { bonkPetals } from './progression';
import { createEnemy } from './units';
import type { BattleEvent, Hazard, HeroClass, Point, StatusKind, Unit } from './types';

const DT_SEC = TUNING.tickMs / 1000;
const STATUS_MS: Record<StatusKind, number> = {
  bubble: TUNING.bubbleStunMs,
  sleepy: TUNING.relic.lullabyStunMs,
  sticky: TUNING.sticky.ms,
  rooted: TUNING.root.basicMs,
};
export const isAlive = (u: Unit): boolean => u.hp > 0;

/** One simulation tick's working set: mutable copies of the units plus what happened. */
export class TickContext {
  readonly events: BattleEvent[] = [];
  /** hero whose ultimate cut-in started this tick (one at a time) */
  castStarted: string | null = null;
  readonly spawned: WorkUnit[] = [];
  readonly newHazards: Hazard[] = [];

  constructor(
    readonly units: WorkUnit[],
    readonly rng: Rng,
    readonly stage: number,
    private serial: number,
  ) {}

  get nextSerial(): number {
    return this.serial;
  }

  opponents(unit: Unit): WorkUnit[] {
    return this.units.filter((u) => u.side !== unit.side && isAlive(u));
  }

  allies(unit: Unit): WorkUnit[] {
    return this.units.filter((u) => u.side === unit.side && isAlive(u));
  }

  nearest(from: Point, candidates: readonly WorkUnit[]): WorkUnit | undefined {
    let best: WorkUnit | undefined;
    let bestD = Infinity;
    for (const c of candidates) {
      const d = distance(from, c);
      if (d < bestD) {
        best = c;
        bestD = d;
      }
    }
    return best;
  }

  /** Enemies near a living Pillow Guard must hit it first (taunt); everyone else picks the nearest foe. */
  pickTarget(unit: Unit): WorkUnit | undefined {
    const foes = this.opponents(unit);
    const taunt = foes.find((u) => u.heroClass === 'pillow-guard' && distance(unit, u) <= TUNING.tauntRadius);
    return taunt ?? this.nearest(unit, foes);
  }

  woundedAlly(unit: Unit): WorkUnit | undefined {
    return this.allies(unit)
      .filter((u) => u.hp / u.stats.maxHp < TUNING.healThreshold)
      .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
  }

  /** Higher level hits harder and takes less: this is what makes under-levelled fights drag on. */
  private levelFactor(source: Unit, target: Unit): number {
    const { min, max } = TUNING.levelGapClamp;
    return Math.min(max, Math.max(min, 1 + (source.level - target.level) * TUNING.levelGapPerLevel));
  }

  damage(source: WorkUnit, target: WorkUnit, multiplier: number, ultimate: boolean): void {
    if (!ultimate && this.rng.next() < target.stats.dodge) {
      this.events.push({ type: 'dodge', source: source.id, target: target.id });
      return;
    }
    const crit = this.rng.next() < source.stats.crit;
    const spread = 1 + (this.rng.next() * 2 - 1) * TUNING.damageSpread;
    const buff = source.buffMs > 0 ? TUNING.bardBuffAtk : 1;
    const mitigation = 100 / (100 + target.stats.def);
    const raw = source.stats.atk * buff * multiplier * spread * mitigation * this.levelFactor(source, target) * (crit ? TUNING.critMultiplier : 1);
    const amount = Math.max(1, Math.round(raw));
    target.hp = Math.max(0, target.hp - amount);
    if (target.heroClass) target.energy = Math.min(100, target.energy + TUNING.energyPerHit);
    this.events.push({ type: 'damage', source: source.id, target: target.id, amount, crit, ultimate });
    if (target.hp > 0) return;
    if (target.reviveLeft > 0) {
      // Grandma's Knitted Scarf
      target.reviveLeft -= 1;
      target.hp = Math.round(target.stats.maxHp * TUNING.relic.scarfReviveHp);
      this.events.push({ type: 'revive', target: target.id, hp: target.hp });
      return;
    }
    target.moving = false;
    target.stunMs = 0;
    this.events.push(
      target.side === 'enemy'
        ? { type: 'bonk', target: target.id, petals: bonkPetals(this.stage, target.isBoss) }
        : { type: 'faint', target: target.id },
    );
  }

  heal(source: WorkUnit, target: WorkUnit, amount: number): void {
    const healed = Math.min(Math.round(amount), target.stats.maxHp - target.hp);
    if (healed <= 0) return;
    target.hp += healed;
    this.events.push({ type: 'heal', source: source.id, target: target.id, amount: healed });
  }

  private applyStatus(target: WorkUnit, status: StatusKind, msOverride?: number): void {
    // Molemo passive (Earthy Paws): honey can't slow digging paws
    if (status === 'sticky' && target.species === 'molemo') return;
    const ms = msOverride ?? STATUS_MS[status];
    if (status === 'sticky') target.slowMs = ms;
    else if (status === 'rooted') {
      target.rootMs = Math.max(target.rootMs, ms);
      target.moving = false;
    } else {
      target.stunMs = ms;
      target.moving = false;
    }
    this.events.push({ type: 'status', target: target.id, status, ms });
  }

  /** Move into range, kite if ranged and crowded, use skills, attack when the cooldown is up. */
  act(unit: WorkUnit, autoUltimate: boolean, pending: Set<string>): void {
    if (unit.stunMs > 0) {
      unit.stunMs = Math.max(0, unit.stunMs - TUNING.tickMs);
      unit.moving = false;
      return;
    }
    const slow = unit.slowMs > 0 ? TUNING.sticky.slow : 1;
    unit.slowMs = Math.max(0, unit.slowMs - TUNING.tickMs);
    const rooted = unit.rootMs > 0;
    unit.rootMs = Math.max(0, unit.rootMs - TUNING.tickMs);
    // enraged giants swing faster
    unit.cooldown = Math.max(0, unit.cooldown - TUNING.tickMs * slow * (unit.enraged ? TUNING.giant.enragedHaste : 1));
    unit.buffMs = Math.max(0, unit.buffMs - TUNING.tickMs);
    if (unit.heroClass) unit.energy = Math.min(100, unit.energy + (TUNING.tickMs / ULTIMATE_COOLDOWN_MS[unit.heroClass]) * 100 * unit.chargeRate);

    const target = this.pickTarget(unit);
    if (!target) {
      unit.moving = unit.side === 'hero' && !rooted && moveToward(unit, unit.home, 4, DT_SEC, slow);
      return;
    }
    // Arena rivals always fire their ultimates on their own
    if (unit.heroClass && unit.energy >= 100 && !this.castStarted && (autoUltimate || unit.side === 'enemy' || pending.has(unit.id))) {
      pending.delete(unit.id);
      this.startCast(unit, unit.heroClass);
      return;
    }
    if (unit.isBoss && this.bossSkills(unit)) return;
    if (unit.species === 'hamham' && this.cheekCannon(unit)) return;

    const d = distance(unit, target);
    const ranged = unit.stats.range > 80;
    if (rooted) {
      // held in place: only turn to face, and hit if the foe is already in reach
      unit.moving = false;
      face(unit, target);
    } else if (d > unit.stats.range) unit.moving = moveToward(unit, target, unit.stats.range * 0.9, DT_SEC, slow);
    else if (ranged && !unit.isBoss && d < unit.stats.range * TUNING.kiteRatio) unit.moving = moveAway(unit, target, DT_SEC, slow);
    else {
      unit.moving = false;
      face(unit, target);
    }
    if (unit.cooldown > 0) return;
    this.basicAction(unit, target);
  }

  private basicAction(unit: WorkUnit, target: WorkUnit): void {
    const isHealer = unit.heroClass === 'mochi-cleric' || unit.enemyKind === 'lavender';
    const wounded = isHealer ? this.woundedAlly(unit) : undefined;
    if (wounded) {
      unit.cooldown = unit.stats.attackInterval;
      this.heal(unit, wounded, unit.stats.atk * 2.2);
    } else if (distance(unit, target) <= unit.stats.range + 4) {
      unit.cooldown = unit.stats.attackInterval;
      this.events.push({ type: 'attack', source: unit.id, target: target.id });
      this.damage(unit, target, 1, false);
      if (unit.enemyKind === 'honey-bud' && isAlive(target)) this.applyStatus(target, 'sticky');
      if (unit.heroClass === 'root-druid' && isAlive(target) && this.rng.next() < TUNING.root.basicChance) this.applyStatus(target, 'rooted');
    } else {
      return;
    }
    if (unit.heroClass) unit.energy = Math.min(100, unit.energy + TUNING.energyPerAttack);
  }

  /** Hamham species skill: spit a fan of seeds at the nearest foes in range. */
  private cheekCannon(unit: WorkUnit): boolean {
    unit.skillMs = Math.max(0, unit.skillMs - TUNING.tickMs);
    if (unit.skillMs > 0) return false;
    const seeds = unit.relics.includes('bottomless-cheek-pouch') ? TUNING.relic.pouchSeeds : TUNING.cheek.seeds;
    const foes = this.opponents(unit)
      .filter((f) => distance(unit, f) <= TUNING.cheek.range)
      .sort((a, b) => distance(unit, a) - distance(unit, b))
      .slice(0, seeds);
    const first = foes[0];
    if (!first) return false;
    unit.skillMs = TUNING.cheek.everyMs;
    unit.moving = false;
    face(unit, first);
    this.events.push({ type: 'cheekCannon', source: unit.id, targets: foes.map((f) => f.id) });
    for (const f of foes) this.damage(unit, f, TUNING.cheek.damage, false);
    return true;
  }

  /** Boss: summon minions and telegraph ground slams on the biggest group of heroes. */
  private bossSkills(boss: WorkUnit): boolean {
    const cfg = TUNING.boss;
    if (boss.isGiant && !boss.enraged && boss.hp <= boss.stats.maxHp * TUNING.giant.enrageAt) {
      boss.enraged = true;
      boss.slamMs = 0;
      this.events.push({ type: 'enrage', source: boss.id });
      return true;
    }
    const haste = boss.enraged ? TUNING.giant.enragedHaste : 1;
    boss.skillMs = Math.max(0, boss.skillMs - TUNING.tickMs * haste);
    boss.slamMs = Math.max(0, boss.slamMs - TUNING.tickMs * haste);
    if (boss.skillMs === 0 && boss.bossKind) {
      boss.skillMs = cfg.summonEveryMs;
      const ids: string[] = [];
      const count = boss.enraged ? TUNING.giant.enragedSummons : cfg.summonCount;
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * (0.15 + (0.7 * i) / Math.max(1, count - 1)) + (this.rng.next() - 0.5) * 0.3;
        const at = clampToArena({ x: boss.x + Math.cos(angle) * 80, y: boss.y + Math.sin(angle) * 55 });
        const minion = createEnemy({ kind: BOSS_MINION[boss.bossKind] }, `s${this.serial++}`, this.stage, at);
        this.spawned.push({ ...minion });
        ids.push(minion.id);
      }
      this.events.push({ type: 'summon', source: boss.id, spawned: ids });
      return true;
    }
    const heroes = this.opponents(boss);
    if (boss.slamMs === 0 && heroes.length) {
      boss.slamMs = cfg.slamEveryMs;
      // aim at the heroes standing with the most friends around them (enraged giants slam several spots)
      const crowd = (h: Unit) => heroes.filter((o) => distance(o, h) <= cfg.slamRadius).length;
      const count = boss.enraged ? TUNING.giant.enragedSlams : 1;
      const picks: Unit[] = [];
      for (const h of [...heroes].sort((a, b) => crowd(b) - crowd(a))) {
        if (picks.length >= count) break;
        if (picks.every((p) => distance(p, h) > cfg.slamRadius)) picks.push(h);
      }
      for (const focus of picks) {
        const hazard: Hazard = { id: `h${this.serial++}`, source: boss.id, at: { x: focus.x, y: focus.y }, radius: cfg.slamRadius, remainingMs: cfg.telegraphMs };
        this.newHazards.push(hazard);
        this.events.push({ type: 'telegraph', id: hazard.id, source: boss.id, at: hazard.at, radius: hazard.radius, delayMs: hazard.remainingMs });
      }
      return picks.length > 0;
    }
    return false;
  }

  /** A telegraphed slam lands: heroes still inside the circle get hit hard. */
  resolveHazard(hazard: Hazard): void {
    const boss = this.units.find((u) => u.id === hazard.source);
    this.events.push({ type: 'slam', id: hazard.id, source: hazard.source, at: hazard.at, radius: hazard.radius });
    if (!boss || !isAlive(boss)) return;
    for (const hero of this.opponents(boss)) {
      if (distance(hero, hazard.at) <= hazard.radius) this.damage(boss, hero, TUNING.boss.slamDamage, true);
    }
  }

  /** Begins the cut-in; the skill itself fires when the cast timer runs out. */
  startCast(hero: WorkUnit, heroClass: HeroClass): void {
    hero.energy = 0;
    hero.moving = false;
    this.castStarted = hero.id;
    this.events.push({ type: 'ultimateCast', source: hero.id, heroClass, castMs: TUNING.castMs });
  }

  ultimate(hero: WorkUnit, target: WorkUnit): void {
    const heroClass = hero.heroClass;
    if (!heroClass) return;
    hero.moving = false;
    const from: Point = { x: hero.x, y: hero.y };
    const support = heroClass === 'mochi-cleric' || heroClass === 'bell-bard';
    let at: Point = support ? from : { x: target.x, y: target.y };
    let targets: WorkUnit[];

    if (heroClass === 'pillow-guard') {
      // roll in a straight line through the enemy group
      const d = distance(from, target) || 1;
      const end = clampToArena({ x: from.x + ((target.x - from.x) / d) * TUNING.roll.length, y: from.y + ((target.y - from.y) / d) * TUNING.roll.length });
      targets = this.opponents(hero).filter((u) => distanceToSegment(u, from, end) <= ULTIMATE_RADIUS['pillow-guard']);
      place(hero, end);
      at = end;
      for (const t of targets) {
        const away = distance(t, end) || 1;
        place(t, { x: t.x + ((t.x - end.x) / away) * TUNING.roll.knockback, y: t.y + ((t.y - end.y) / away) * TUNING.roll.knockback });
      }
    } else if (heroClass === 'carrot-knight') {
      // leap onto the target
      const side = hero.x <= target.x ? -1 : 1;
      place(hero, { x: target.x + side * 30, y: target.y });
      targets = this.opponents(hero).filter((u) => distance(u, at) <= ULTIMATE_RADIUS[heroClass]);
    } else if (support) {
      targets = this.allies(hero);
    } else {
      targets = this.opponents(hero).filter((u) => distance(u, at) <= ULTIMATE_RADIUS[heroClass]);
    }
    face(hero, target);
    this.events.push({ type: 'ultimate', source: hero.id, heroClass, targets: targets.map((t) => t.id), from, at });

    for (const t of targets) {
      if (heroClass === 'mochi-cleric') this.heal(hero, t, t.stats.maxHp * TUNING.clericUltHeal);
      else if (heroClass === 'bell-bard') {
        t.buffMs = TUNING.bardBuffMs;
        this.events.push({ type: 'buff', source: hero.id, target: t.id });
      } else if (isAlive(t)) {
        const excalibur = heroClass === 'carrot-knight' && hero.relics.includes('carrot-excalibur') ? TUNING.relic.excaliburDamage : 1;
        this.damage(hero, t, ULTIMATE_DAMAGE[heroClass] * excalibur, true);
        if (heroClass === 'bubble-mage' && isAlive(t)) this.applyStatus(t, 'bubble');
        if (heroClass === 'root-druid' && isAlive(t)) this.applyStatus(t, 'rooted', TUNING.root.ultimateMs);
      }
    }
    if (heroClass === 'bell-bard' && hero.relics.includes('moonlit-lullaby-bell')) {
      // Moonlit Lullaby Bell: nearby foes nod off
      for (const foe of this.opponents(hero)) {
        if (!foe.isBoss && distance(foe, hero) <= TUNING.relic.lullabyRadius) this.applyStatus(foe, 'sleepy');
      }
    }
  }

  /** Sunflower Crown: the team recovers a little whenever a new wave arrives. */
  crownWaveHeal(): void {
    const holder = this.units.find((u) => u.side === 'hero' && isAlive(u) && u.relics.includes('sunflower-crown'));
    if (!holder) return;
    for (const ally of this.allies(holder)) this.heal(holder, ally, ally.stats.maxHp * TUNING.relic.crownWaveHeal);
  }
}

