import gsap from 'gsap';
import {
  PVP,
  RAID,
  TUNING,
  addStats,
  chapterPuff,
  stageShards,
  type BossKind,
  type Rival,
  type RivalTier,
  clearPetals,
  createBattle,
  createRng,
  isBossStage,
  isGiantStage,
  napReward,
  recommendedLevel,
  requestUltimate,
  rollForage,
  rollSeeds,
  type SeedKind,
  rollLoot,
  setAutoUltimate,
  stageWaves,
  step,
  type BattleEvent,
  type BattleState,
  type IngredientId,
  type Item,
  type NapReward,
  type HeroSpec,
} from '@puff/sim';
import { addForage, mealStats, serveMeals, type ServedMeal } from './meta/picnic';
import { addSeeds } from './meta/garden';
import { BACKGROUND, BOSS_BACKGROUND, heroDef } from './assets';
import { activeTeam, autoEquipEmpty, itemById, heroLevel, loadSave, ownedRoster, teamLevel, teamLuck, writeSave, type SaveData } from './meta/save';
import { heroPower } from './meta/power';
import { addShards } from './meta/album';
import { bump, ensureDaily } from './meta/daily';
import { finishArena, finishRaid, raidState, type ArenaOutcome, type RaidOutcome } from './meta/pvp';
import { stageLabel } from './meta/guide';
import type { BattleScene } from './scene/BattleScene';
import type { Hud } from './ui/hud';

const SPEEDS = [1, 2, 3] as const;
const MAX_TICKS_PER_FRAME = 12; // avoids a catch-up spiral after the tab was hidden
const STAGE_CLEAR_PAUSE = 1.8;
const DEFEAT_PAUSE = 2.2;

export interface GameHooks {
  /** loot from a cleared stage, for the reward popup (`notes`: shards, Dew Drops…) */
  onLoot(items: readonly Item[], forage: readonly IngredientId[], seeds: readonly SeedKind[], notes?: readonly string[]): void;
  /** an Arena fight or a Raid attempt ended: show the result, then go home */
  onArenaEnd(outcome: ArenaOutcome, rival: Rival): void;
  onRaidEnd(outcome: RaidOutcome, boss: BossKind): void;
  /** the save changed (bag contents, stage, petals) */
  onSave(save: SaveData): void;
  /** rewards from time away are waiting to be collected */
  onNap(reward: NapReward): void;
}

/** Drives the fixed-tick simulation and forwards its events to the scene and HUD. */
export class Game {
  private state: BattleState;
  private accumulator = 0;
  private speedIndex = 0;
  private auto = true;
  private transitioning = false;
  private clock = 0;
  private frozenMs = 0;
  private save: SaveData = ensureDaily(loadSave());
  /** quest counters from the current fight, paid into the save when it ends */
  private bonks = 0;
  private ultimates = 0;
  /** Arena: who we're fighting; Raid: the boss and its HP when the attempt began */
  private rival: Rival | null = null;
  private raid: { boss: BossKind; startHp: number; maxHp: number } | null = null;
  /** flowers bonked this battle (they may leave seeds for the garden) */
  private bonked: SeedKind[] = [];
  /** what each puff ate before the current battle */
  private meals: readonly ServedMeal[] = [];

  constructor(
    private readonly scene: BattleScene,
    private readonly hud: Hud,
    private readonly hooks: GameHooks,
  ) {
    // the game opens in the village: build the next stage without feeding anyone yet
    this.state = this.newBattle(this.save.stage, false);
  }

  /** 'hub' = in the village (the battlefield is paused); 'battle' = the story road; 'arena' / 'raid' = side modes. */
  private mode: 'hub' | 'battle' | 'arena' | 'raid' = 'hub';

  get inHub(): boolean {
    return this.mode === 'hub';
  }

  /** Back to the village: the fight pauses, and time spent here counts toward the Nap Bank. */
  enterHub(): void {
    if (this.mode === 'hub') return;
    // walking out of a pillow fight counts as a loss; a raid keeps the damage done so far
    if ((this.mode === 'arena' || this.mode === 'raid') && !this.transitioning) this.endSideMode(false, true);
    this.persist();
    this.mode = 'hub';
  }

  /** Leave the village: pay out any nap, then start the next stage fresh with the current team and meals. */
  deploy(): void {
    // a nap still waiting is collected quietly on the way out, not shown as another pop-up
    this.checkNap(false);
    if (this.save.pendingNap) this.claimNap();
    this.mode = 'battle';
    this.rival = null;
    this.raid = null;
    this.state = this.newBattle(this.save.stage);
    this.begin();
  }

  /** Pillow Fight Arena: the current team against a rival team (no meals, no loot — rank and Honor). */
  startArena(rival: Rival): void {
    this.mode = 'arena';
    this.rival = rival;
    this.raid = null;
    this.meals = [];
    this.state = createBattle(
      { stage: this.save.stage, heroes: this.teamSpecs(), rivals: rival.heroes, waves: [[]], autoUltimate: this.auto, puffHpScale: PVP.hpScale },
      Date.now() >>> 0,
    );
    this.begin();
  }

  /** Weekly Raid: a timed attempt on the giant boss; its HP pool carries over between attempts. */
  startRaid(boss: BossKind, stage: number): void {
    this.mode = 'raid';
    this.rival = null;
    const left = 1 - raidState(this.save).dealt;
    this.state = this.newBattle(stage, true, [[{ boss, giant: true, hpMult: RAID.hpMult, hpLeft: Math.max(0.001, left) }]]);
    const unit = this.state.units.find((u) => u.isBoss);
    this.raid = { boss, startHp: unit?.hp ?? 0, maxHp: unit?.stats.maxHp ?? 1 };
    this.begin();
  }

  private begin(): void {
    this.accumulator = 0;
    this.transitioning = false;
    this.bonks = 0;
    this.ultimates = 0;
    this.scene.reset();
    this.start();
    this.persist();
  }

  get currentMode(): 'hub' | 'battle' | 'arena' | 'raid' {
    return this.mode;
  }

  get speed(): number {
    return SPEEDS[this.speedIndex] ?? 1;
  }

  get currentSave(): SaveData {
    return this.save;
  }

  /** Bag / skin changes from the UI; gear takes effect from the next battle. */
  updateSave(save: SaveData): void {
    this.save = save;
    this.persist();
    this.hooks.onSave(this.save);
    this.render();
  }

  /** Writes the save and stamps the nap clock (call while the game is on screen). */
  persist(): void {
    // in the village the nap clock keeps running (not stamped), so browsing menus still earns nap rewards
    this.save = ensureDaily(this.save);
    if (this.mode !== 'hub') this.save = { ...this.save, lastSeen: Date.now() };
    writeSave(this.save);
  }

  /** Turns time since the game was last on screen into Nap Bank rewards, waiting to be collected. */
  checkNap(show = true, now = Date.now()): void {
    if (!this.save.pendingNap) {
      let n = this.save.nextId;
      const reward = napReward(createRng(now >>> 0), {
        stage: this.save.stage,
        elapsedMs: now - this.save.lastSeen,
        classes: ownedRoster(this.save).map((h) => h.heroClass),
        luck: teamLuck(this.save),
        nextId: () => `i${n++}`,
      });
      if (reward.ms > 0) this.save = { ...this.save, pendingNap: reward, nextId: n };
    }
    this.persist();
    if (show && this.save.pendingNap) this.hooks.onNap(this.save.pendingNap);
  }

  /** One tap collects everything from the nap; new items fill empty slots. */
  claimNap(): void {
    const nap = this.save.pendingNap;
    if (!nap) return;
    const withLoot: SaveData = {
      ...this.save,
      petals: this.save.petals + nap.petals,
      stardust: this.save.stardust + nap.stardust,
      items: [...this.save.items, ...nap.items],
      pendingNap: null,
    };
    this.updateSave(bump(autoEquipEmpty(withLoot, nap.items), 'nap'));
  }

  start(): void {
    this.scene.setBackground(isBossStage(this.state.config.stage) ? BOSS_BACKGROUND : BACKGROUND);
    this.scene.sync(this.state);
    this.hud.buildPortraits(this.state, this.save.skins);
    this.render();
    // reactions pop up once the puffs have landed
    if (this.meals.length) gsap.delayedCall(0.8, () => this.scene.showMeals(this.meals));
  }

  toggleAuto(): void {
    this.auto = !this.auto;
    this.state = setAutoUltimate(this.state, this.auto);
    this.render();
  }

  cycleSpeed(): void {
    this.speedIndex = (this.speedIndex + 1) % SPEEDS.length;
    gsap.globalTimeline.timeScale(this.speed);
    this.render();
  }

  castUltimate(heroId: string): void {
    this.state = requestUltimate(this.state, heroId);
  }

  addPetals(amount: number): void {
    // pillow fights are for Honor: bonked rivals drop no Petals
    if (this.mode === 'arena') return;
    this.save = { ...this.save, petals: this.save.petals + amount };
  }

  /** Shows the cut-in banner for exactly as long as the battle is frozen for the cast. */
  /** The cast itself plays in the scene (camera push-in); the HUD only counts ultimate chains. */
  onUltimateCast(): void {
    this.hud.ultimate(this.clock);
  }

  /** Anime hit-stop: the simulation pauses for a beat when a big hit lands. */
  freeze(ms: number): void {
    this.frozenMs = Math.max(this.frozenMs, ms);
  }

  tick(deltaMs: number): void {
    if (this.mode === 'hub') return;
    this.clock += deltaMs * this.speed;
    if (this.transitioning) return;
    if (this.frozenMs > 0) {
      this.frozenMs -= deltaMs;
      return;
    }
    this.accumulator = Math.min(this.accumulator + deltaMs * this.speed, TUNING.tickMs * MAX_TICKS_PER_FRAME);
    const events: BattleEvent[] = [];
    while (this.accumulator >= TUNING.tickMs && this.state.phase === 'fighting') {
      this.accumulator -= TUNING.tickMs;
      const before = this.state;
      const result = step(this.state);
      this.state = result.state;
      // look the bonked flower up before the step: the wave that it finished may already be gone
      for (const e of result.events) {
        if (e.type === 'ultimate' && this.state.units.find((u) => u.id === e.source)?.side === 'hero') this.ultimates++;
        if (e.type !== 'bonk') continue;
        this.bonks++;
        const u = before.units.find((x) => x.id === e.target) ?? this.state.units.find((x) => x.id === e.target);
        const kind = u?.bossKind ?? u?.enemyKind;
        if (kind) this.bonked.push(kind);
      }
      events.push(...result.events);
    }
    // positions change every tick even when nothing is hit, so always sync
    this.scene.sync(this.state);
    const limit = this.timeLimit();
    if (limit && this.state.phase === 'fighting' && this.state.time >= limit) {
      this.scene.handle(events);
      this.render();
      return this.endSideMode(true);
    }
    if (events.length === 0) return this.renderClock();
    this.scene.handle(events);
    this.render();
    this.checkEnd();
  }

  /** Arena / Raid fights are timed. */
  private timeLimit(): number {
    return this.mode === 'arena' ? PVP.timeLimitMs : this.mode === 'raid' ? RAID.timeLimitMs : 0;
  }

  /** Refreshes the countdown in the HUD about once a second. */
  private lastClockSec = -1;
  private renderClock(): void {
    const limit = this.timeLimit();
    if (!limit) return;
    const sec = Math.ceil((limit - this.state.time) / 1000);
    if (sec !== this.lastClockSec) {
      this.lastClockSec = sec;
      this.render();
    }
  }

  /** The team that fights, with levels, gear, album stars, garden and fishdex bonuses (+ this stage's meal). */
  private teamSpecs(): HeroSpec[] {
    return activeTeam(this.save).map((h) => {
      const skin = this.save.skins[h.id];
      const power = heroPower(this.save, h.id);
      const weapon = itemById(this.save, this.save.equipped[h.id]?.weapon);
      return {
        ...h,
        level: heroLevel(this.save, h.id),
        gear: { ...power, stats: addStats(power.stats, mealStats(this.meals, h.id)) },
        ...(skin ? { skin } : {}),
        ...(weapon ? { weaponTier: weapon.tier } : {}),
      };
    });
  }

  private newBattle(stage: number, serve = true, waves = stageWaves(stage)): BattleState {
    if (serve) {
      const served = serveMeals(this.save);
      this.save = served.save;
      this.meals = served.meals;
      // plain write: persist() would stamp the nap clock before checkNap() gets to read it
      writeSave(this.save);
    } else {
      this.meals = [];
    }
    this.bonked = [];
    return createBattle({ stage, heroes: this.teamSpecs(), waves, autoUltimate: this.auto }, Date.now() >>> 0);
  }

  /** Luck from gear plus this stage's meals (sunflower seeds!). */
  private stageLuck(): number {
    return teamLuck(this.save) + this.meals.reduce((sum, m) => sum + (m.effect.stats.luck ?? 0), 0);
  }

  /** Rolls stage-clear loot into the bag and fills empty slots with it; forage goes to the pantry. */
  private grantLoot(stage: number): { items: readonly Item[]; forage: readonly IngredientId[] } {
    let n = this.save.nextId;
    const loot = rollLoot(createRng(Date.now() >>> 0), stage, {
      // weapons drop for the whole roster, so bench puffs gear up too
      classes: ownedRoster(this.save).map((h) => h.heroClass),
      boss: isBossStage(stage),
      giant: isGiantStage(stage),
      luck: this.stageLuck(),
      relicPity: this.save.relicPity,
      nextId: () => `i${n++}`,
    });
    const withItems: SaveData = { ...this.save, items: [...this.save.items, ...loot.items], relicPity: loot.relicPity, nextId: n };
    const forage = rollForage(createRng((Date.now() ^ 0x5bd1e995) >>> 0), { boss: isBossStage(stage), luck: this.stageLuck() });
    this.save = addForage(autoEquipEmpty(withItems, loot.items), forage);
    return { items: loot.items, forage };
  }

  /** Pays the fight's quest counters into the save. */
  private payCounters(): void {
    this.save = bump(bump(this.save, 'bonk', this.bonks), 'ultimate', this.ultimates);
    this.bonks = 0;
    this.ultimates = 0;
  }

  /** Arena / Raid end (all bonked, team napping, or the clock ran out): record it and show the result. */
  private endSideMode(timeUp: boolean, silent = false): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.payCounters();
    const units = this.state.units;
    if (this.mode === 'arena' && this.rival) {
      const share = (side: 'hero' | 'enemy') => {
        const team = units.filter((u) => u.side === side);
        return team.reduce((s, u) => s + u.hp / u.stats.maxHp, 0) / Math.max(1, team.length);
      };
      const won = !silent && (this.state.phase === 'victory' || (timeUp && this.state.phase === 'fighting' && share('hero') > share('enemy')));
      const outcome = finishArena(this.save, this.rival.tier as RivalTier, won);
      this.save = outcome.save;
      const rival = this.rival;
      if (!silent) this.hud.banner(won ? 'ชนะ!' : timeUp ? 'หมดเวลา…' : 'แพ้… ไว้ลองใหม่', 1500);
      if (!silent) gsap.delayedCall(1.6, () => this.hooks.onArenaEnd(outcome, rival));
    } else if (this.mode === 'raid' && this.raid) {
      const boss = units.find((u) => u.isBoss);
      const hpNow = boss ? boss.hp : 0;
      const share = Math.max(0, this.raid.startHp - hpNow) / Math.max(1, this.raid.maxHp);
      const outcome = finishRaid(this.save, share);
      this.save = outcome.save;
      const kind = this.raid.boss;
      if (!silent) this.hud.banner(hpNow <= 0 ? 'บอสหายงอนแล้ว!' : 'หมดเวลา!', 1500);
      if (!silent) gsap.delayedCall(1.6, () => this.hooks.onRaidEnd(outcome, kind));
    }
    this.persist();
    this.hooks.onSave(this.save);
  }

  private checkEnd(): void {
    if (this.state.phase === 'fighting') return;
    if (this.mode === 'arena' || this.mode === 'raid') return this.endSideMode(false);
    this.payCounters();
    const won = this.state.phase === 'victory';
    const stage = this.state.config.stage;
    // every flower helped may leave a seed, win or lose
    const seeds = rollSeeds(createRng((Date.now() ^ 0x27d4eb2d) >>> 0), this.bonked);
    this.bonked = [];
    this.save = addSeeds(this.save, seeds);
    if (won) {
      const items = this.grantLoot(stage);
      // the farm path to new puffs: shards of the chapter's featured puff (bosses give more), first boss clears pay Dew
      const puff = chapterPuff(stage);
      const shards = stageShards(stage);
      const dew = isGiantStage(stage) ? 150 : isBossStage(stage) ? 50 : 0;
      this.save = bump(addShards({ ...this.save, stage: stage + 1, petals: this.save.petals + clearPetals(stage), dew: this.save.dew + dew }, puff, shards), 'clear');
      const notes = [`ชิ้นส่วน ${heroDef(puff)?.name ?? puff} +${shards}`, ...(dew ? [`Dew Drop +${dew}`] : [])];
      this.hooks.onLoot(items.items, items.forage, seeds, notes);
    } else if (seeds.length) {
      this.hooks.onLoot([], [], seeds);
    }
    this.persist();
    this.hooks.onSave(this.save);
    this.transitioning = true;
    const underLevel = teamLevel(this.save) < recommendedLevel(stage);
    this.hud.banner(won ? 'STAGE CLEAR!' : underLevel ? 'ทีมงีบหลับ… อัปเลเวลในกระเป๋านะ' : 'ทีมงีบหลับ… ลองใหม่', won ? 1500 : 2000);
    gsap.delayedCall(won ? STAGE_CLEAR_PAUSE : DEFEAT_PAUSE, () => {
      // went back to the village during the pause: the next stage starts from the deploy screen
      if (this.mode !== 'battle') return;
      this.state = this.newBattle(this.save.stage);
      this.accumulator = 0;
      this.scene.reset();
      this.start();
      this.transitioning = false;
    });
  }

  private render(): void {
    const limit = this.timeLimit();
    const left = Math.max(0, Math.ceil((limit - this.state.time) / 1000));
    const mode =
      this.mode === 'arena' && this.rival
        ? { name: 'Pillow Fight Arena', title: `VS ${this.rival.name}`, sub: `เหลือเวลา ${left} วิ · คู่แข่ง Lv.${this.rival.level}`, alert: left <= 10 }
        : this.mode === 'raid'
          ? { name: 'Weekly Raid', title: 'รังบอสยักษ์', sub: `เหลือเวลา ${left} วิ — ตีให้แรงที่สุด!`, alert: left <= 10 }
          : undefined;
    this.hud.render(this.state, { petals: this.save.petals, auto: this.auto, speed: this.speed, teamLevel: teamLevel(this.save), ...(mode ? { mode } : {}) });
  }
}
