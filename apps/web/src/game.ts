import gsap from 'gsap';
import {
  TUNING,
  createBattle,
  createRng,
  isBossStage,
  isGiantStage,
  requestUltimate,
  rollLoot,
  setAutoUltimate,
  stageWaves,
  step,
  type BattleEvent,
  type BattleState,
  type Item,
} from '@puff/sim';
import { BACKGROUND, BOSS_BACKGROUND, TEAM, frameUrl, heroSheet } from './assets';
import { autoEquipEmpty, heroGear, loadSave, teamLuck, writeSave, type SaveData } from './meta/save';
import type { BattleScene } from './scene/BattleScene';
import type { Hud } from './ui/hud';

const SPEEDS = [1, 2, 3] as const;
const MAX_TICKS_PER_FRAME = 12; // avoids a catch-up spiral after the tab was hidden
const STAGE_CLEAR_PAUSE = 1.8;
const DEFEAT_PAUSE = 2.2;
/** idle progression stand-in: the team gains levels for each stage cleared */
const LEVELS_PER_CLEAR = 2;

export interface GameHooks {
  /** loot from a cleared stage, for the reward popup */
  onLoot(items: readonly Item[]): void;
  /** the save changed (bag contents, stage, petals) */
  onSave(save: SaveData): void;
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

  constructor(
    private readonly scene: BattleScene,
    private readonly hud: Hud,
    private readonly hooks: GameHooks,
  ) {
    this.state = this.newBattle(this.save.stage);
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
    writeSave(save);
    this.hooks.onSave(save);
  }

  start(): void {
    this.scene.setBackground(isBossStage(this.state.config.stage) ? BOSS_BACKGROUND : BACKGROUND);
    this.scene.sync(this.state);
    this.hud.buildPortraits(this.state, this.save.skins);
    this.render();
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
      const result = step(this.state);
      this.state = result.state;
      events.push(...result.events);
    }
    // positions change every tick even when nothing is hit, so always sync
    this.scene.sync(this.state);
    if (events.length === 0) return;
    this.scene.handle(events);
    this.render();
    this.checkEnd();
  }

  private newBattle(stage: number): BattleState {
    const heroes = TEAM.map((h) => {
      const skin = this.save.skins[h.id];
      return { ...h, level: this.save.teamLevel, gear: heroGear(this.save, h.id), ...(skin ? { skin } : {}) };
    });
    return createBattle({ stage, heroes, waves: stageWaves(stage), autoUltimate: this.auto }, Date.now() >>> 0);
  }

  /** Rolls stage-clear loot into the bag and fills empty slots with it. */
  private grantLoot(stage: number): readonly Item[] {
    let n = this.save.nextId;
    const loot = rollLoot(createRng(Date.now() >>> 0), stage, {
      classes: TEAM.map((h) => h.heroClass),
      boss: isBossStage(stage),
      giant: isGiantStage(stage),
      luck: teamLuck(this.save),
      relicPity: this.save.relicPity,
      nextId: () => `i${n++}`,
    });
    const withItems: SaveData = { ...this.save, items: [...this.save.items, ...loot.items], relicPity: loot.relicPity, nextId: n };
    this.save = autoEquipEmpty(withItems, loot.items);
    return loot.items;
  }

  private checkEnd(): void {
    if (this.state.phase === 'fighting') return;
    const won = this.state.phase === 'victory';
    const stage = this.state.config.stage;
    if (won) {
      const items = this.grantLoot(stage);
      this.save = { ...this.save, stage: stage + 1, teamLevel: this.save.teamLevel + LEVELS_PER_CLEAR };
      this.hooks.onLoot(items);
    }
    writeSave(this.save);
    this.hooks.onSave(this.save);
    this.transitioning = true;
    this.hud.banner(won ? 'STAGE CLEAR!' : 'ทีมงีบหลับ… ลองใหม่', 1500);
    gsap.delayedCall(won ? STAGE_CLEAR_PAUSE : DEFEAT_PAUSE, () => {
      this.state = this.newBattle(this.save.stage);
      this.accumulator = 0;
      this.scene.reset();
      this.start();
      this.transitioning = false;
    });
  }

  private render(): void {
    this.hud.render(this.state, { petals: this.save.petals, auto: this.auto, speed: this.speed, teamLevel: this.save.teamLevel });
  }
}
