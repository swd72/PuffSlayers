import type { GearBonus, RelicId } from './gear';

export type Species = 'bunbun' | 'hamham' | 'shibu';
export type HeroClass = 'pillow-guard' | 'carrot-knight' | 'leaf-archer' | 'bubble-mage' | 'mochi-cleric' | 'bell-bard';
export type EnemyKind = 'daisy' | 'tulip' | 'sunflower' | 'lavender' | 'cactus' | 'honey-bud';
export type BossKind = 'queen-rafflesia' | 'sunflower-colossus' | 'lotus-moon-sage';
export type Side = 'hero' | 'enemy';
export type StatusKind = 'bubble' | 'sticky' | 'sleepy';

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Stats {
  readonly maxHp: number;
  readonly atk: number;
  readonly def: number;
  /** milliseconds between basic attacks */
  readonly attackInterval: number;
  /** 0..1 */
  readonly crit: number;
  /** 0..1 */
  readonly dodge: number;
  /** attack reach in world px */
  readonly range: number;
  /** world px per second */
  readonly moveSpeed: number;
}

export interface Unit {
  readonly id: string;
  readonly side: Side;
  readonly name: string;
  readonly level: number;
  readonly species?: Species;
  readonly heroClass?: HeroClass;
  readonly enemyKind?: EnemyKind;
  readonly bossKind?: BossKind;
  readonly isBoss: boolean;
  /** giant boss of a 10th stage: bigger, tougher, enrages at half HP */
  readonly isGiant: boolean;
  readonly enraged: boolean;
  readonly stats: Stats;
  readonly hp: number;
  /** 0..100 ultimate charge; fills over the class cooldown, ready at 100 */
  readonly energy: number;
  /** ms until the next basic attack */
  readonly cooldown: number;
  /** ms left on the Bell Bard attack buff */
  readonly buffMs: number;
  /** trapped in a bubble: cannot move or act */
  readonly stunMs: number;
  /** stuck in honey: moves and attacks slower */
  readonly slowMs: number;
  /** species / boss skill timer (Hamham Cheek Cannon, boss summon) */
  readonly skillMs: number;
  /** boss ground-slam timer */
  readonly slamMs: number;
  /** equipped named relics (special effects) */
  readonly relics: readonly RelicId[];
  /** ultimate charge speed multiplier (gear) */
  readonly chargeRate: number;
  /** Grandma's Knitted Scarf: get back up once per battle */
  readonly reviveLeft: number;
  /** cosmetic outfit id, if any */
  readonly skin?: string;
  readonly x: number;
  readonly y: number;
  /** 1 = facing right, -1 = facing left */
  readonly facing: 1 | -1;
  readonly moving: boolean;
  /** where a hero regroups between waves */
  readonly home: Point;
}

export interface HeroSpec {
  readonly id: string;
  readonly name: string;
  readonly species: Species;
  readonly heroClass: HeroClass;
  readonly level: number;
  /** summed stats + relics of equipped items */
  readonly gear?: GearBonus;
  readonly skin?: string;
}

export type EnemySpec = { readonly kind: EnemyKind } | { readonly boss: BossKind; readonly giant?: boolean };

export interface BattleConfig {
  readonly stage: number;
  readonly heroes: readonly HeroSpec[];
  readonly waves: readonly (readonly EnemySpec[])[];
  readonly autoUltimate: boolean;
}

/** A telegraphed boss attack: the circle shows first, damage lands when the timer runs out. */
export interface Hazard {
  readonly id: string;
  readonly source: string;
  readonly at: Point;
  readonly radius: number;
  readonly remainingMs: number;
}

export type BattleEvent =
  | { readonly type: 'attack'; readonly source: string; readonly target: string }
  | { readonly type: 'damage'; readonly source: string; readonly target: string; readonly amount: number; readonly crit: boolean; readonly ultimate: boolean }
  | { readonly type: 'dodge'; readonly source: string; readonly target: string }
  | { readonly type: 'heal'; readonly source: string; readonly target: string; readonly amount: number }
  | {
      readonly type: 'ultimate';
      readonly source: string;
      readonly heroClass: HeroClass;
      readonly targets: readonly string[];
      /** where the caster started (leap / roll start) */
      readonly from: Point;
      /** where the skill lands (target area, or the caster's end point) */
      readonly at: Point;
    }
  /** the cut-in starts: the whole battle holds still until the ultimate fires */
  | { readonly type: 'ultimateCast'; readonly source: string; readonly heroClass: HeroClass; readonly castMs: number }
  /** Hamham species skill: seeds spat from the cheeks at several foes */
  | { readonly type: 'cheekCannon'; readonly source: string; readonly targets: readonly string[] }
  | { readonly type: 'status'; readonly target: string; readonly status: StatusKind; readonly ms: number }
  | { readonly type: 'summon'; readonly source: string; readonly spawned: readonly string[] }
  /** a giant boss drops below half HP and goes berserk */
  | { readonly type: 'enrage'; readonly source: string }
  | { readonly type: 'telegraph'; readonly id: string; readonly source: string; readonly at: Point; readonly radius: number; readonly delayMs: number }
  | { readonly type: 'slam'; readonly id: string; readonly source: string; readonly at: Point; readonly radius: number }
  | { readonly type: 'buff'; readonly source: string; readonly target: string }
  | { readonly type: 'bonk'; readonly target: string; readonly petals: number }
  | { readonly type: 'faint'; readonly target: string }
  /** a knitted scarf pulls a fainting hero back up */
  | { readonly type: 'revive'; readonly target: string; readonly hp: number }
  | { readonly type: 'wave'; readonly wave: number; readonly enemies: readonly string[] }
  | { readonly type: 'victory'; readonly stage: number }
  | { readonly type: 'defeat'; readonly stage: number };

export type BattlePhase = 'fighting' | 'victory' | 'defeat';

export interface BattleState {
  readonly config: BattleConfig;
  readonly time: number;
  readonly rngState: number;
  readonly wave: number;
  readonly units: readonly Unit[];
  readonly phase: BattlePhase;
  /** queued manual ultimates, fired on the next tick */
  readonly pendingUltimates: readonly string[];
  /** an ultimate cut-in in progress; the battle is frozen while it plays */
  readonly casting: { readonly heroId: string; readonly remainingMs: number } | null;
  readonly hazards: readonly Hazard[];
  /** counter for ids of units summoned mid-wave */
  readonly serial: number;
}

export interface StepResult {
  readonly state: BattleState;
  readonly events: readonly BattleEvent[];
}
