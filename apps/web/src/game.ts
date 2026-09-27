import gsap from 'gsap';
import {
  TUNING,
  addStats,
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
  gardenBonus,
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
} from '@puff/sim';
import { addForage, mealStats, serveMeals, type ServedMeal } from './meta/picnic';
import { addSeeds } from './meta/garden';
import { BACKGROUND, BOSS_BACKGROUND, ROSTER, frameUrl, heroSheet } from './assets';
import { activeTeam, autoEquipEmpty, itemById, heroGear, heroLevel, loadSave, teamLevel, teamLuck, writeSave, type SaveData } from './meta/save';
import type { BattleScene } from './scene/BattleScene';
import type { Hud } from './ui/hud';

const SPEEDS = [1, 2, 3] as const;
const MAX_TICKS_PER_FRAME = 12; // avoids a catch-up spiral after the tab was hidden
const STAGE_CLEAR_PAUSE = 1.8;
const DEFEAT_PAUSE = 2.2;

export interface GameHooks {
  /** loot from a cleared stage, for the reward popup */
  onLoot(items: readonly Item[], forage: readonly IngredientId[], seeds: readonly SeedKind[]): void;
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
  private save: SaveData = loadSave();
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

  /** 'hub' = in the village (the battlefield is paused); 'battle' = fighting. */
  private mode: 'hub' | 'battle' = 'hub';

  get inHub(): boolean {
    return this.mode === 'hub';
  }

  /** Back to the village: the fight pauses, and time spent here counts toward the Nap Bank. */
  enterHub(): void {
    if (this.mode === 'hub') return;
    this.persist();
    this.mode = 'hub';
  }

  /** Leave the village: pay out any nap, then start the next stage fresh with the current team and meals. */
  deploy(): void {
    this.checkNap();
    this.mode = 'battle';
    this.state = this.newBattle(this.save.stage);
    this.accumulator = 0;
    this.transitioning = false;
    this.scene.reset();
    this.start();
    this.persist();
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
    if (this.mode === 'battle') this.save = { ...this.save, lastSeen: Date.now() };
    writeSave(this.save);
  }

  /** Turns time since the game was last on screen into Nap Bank rewards, waiting to be collected. */
  checkNap(now = Date.now()): void {
    if (!this.save.pendingNap) {
      let n = this.save.nextId;
      const reward = napReward(createRng(now >>> 0), {
        stage: this.save.stage,
        elapsedMs: now - this.save.lastSeen,
        classes: ROSTER.map((h) => h.heroClass),
        luck: teamLuck(this.save),
        nextId: () => `i${n++}`,
      });
      if (reward.ms > 0) this.save = { ...this.save, pendingNap: reward, nextId: n };
    }
    this.persist();
    if (this.save.pendingNap) this.hooks.onNap(this.save.pendingNap);
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
    this.updateSave(autoEquipEmpty(withLoot, nap.items));
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
    this.save = { ...this.save, petals: this.save.petals + amount };
  }

  /** Shows the cut-in banner for exactly as long as the battle is frozen for the cast. */
  onUltimateCast(heroId: string, heroClass: Parameters<Hud['ultimate']>[0], castMs: number): void {
    const hero = this.state.units.find((u) => u.id === heroId);
    const portrait = hero?.species ? frameUrl(hero.skin ? `skin/${hero.skin}` : heroSheet(hero.species, heroClass), 0) : '';
    this.hud.ultimate(heroClass, this.clock, portrait, castMs / this.speed);
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
        if (e.type !== 'bonk') continue;
        const u = before.units.find((x) => x.id === e.target) ?? this.state.units.find((x) => x.id === e.target);
        const kind = u?.bossKind ?? u?.enemyKind;
        if (kind) this.bonked.push(kind);
      }
      events.push(...result.events);
    }
    // positions change every tick even when nothing is hit, so always sync
    this.scene.sync(this.state);
    if (events.length === 0) return;
    if (events.some((e) => e.type === 'ultimate')) this.hud.endUltimate();
    this.scene.handle(events);
    this.render();
    this.checkEnd();
  }

  private newBattle(stage: number, serve = true): BattleState {
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
    const garden = gardenBonus(this.save.blooms);
    const heroes = activeTeam(this.save).map((h) => {
      const skin = this.save.skins[h.id];
      const gear = heroGear(this.save, h.id);
      // gear + this stage's meal + the garden's permanent blooms
      const stats = addStats(addStats(gear.stats, mealStats(this.meals, h.id)), garden);
      const weapon = itemById(this.save, this.save.equipped[h.id]?.weapon);
      return {
        ...h,
        level: heroLevel(this.save, h.id),
        gear: { ...gear, stats },
        ...(skin ? { skin } : {}),
        ...(weapon ? { weaponTier: weapon.tier } : {}),
      };
    });
    return createBattle({ stage, heroes, waves: stageWaves(stage), autoUltimate: this.auto }, Date.now() >>> 0);
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
      classes: ROSTER.map((h) => h.heroClass),
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

  private checkEnd(): void {
    if (this.state.phase === 'fighting') return;
    const won = this.state.phase === 'victory';
    const stage = this.state.config.stage;
    // every flower helped may leave a seed, win or lose
    const seeds = rollSeeds(createRng((Date.now() ^ 0x27d4eb2d) >>> 0), this.bonked);
    this.bonked = [];
    this.save = addSeeds(this.save, seeds);
    if (won) {
      const items = this.grantLoot(stage);
      this.save = { ...this.save, stage: stage + 1, petals: this.save.petals + clearPetals(stage) };
      this.hooks.onLoot(items.items, items.forage, seeds);
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
      if (this.mode === 'hub') return;
      this.state = this.newBattle(this.save.stage);
      this.accumulator = 0;
      this.scene.reset();
      this.start();
      this.transitioning = false;
    });
  }

  private render(): void {
    this.hud.render(this.state, { petals: this.save.petals, auto: this.auto, speed: this.speed, teamLevel: teamLevel(this.save) });
  }
}
