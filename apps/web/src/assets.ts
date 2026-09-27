import { Assets, Texture } from 'pixi.js';
import { PUFFS, STARTER_PUFFS, type BossKind, type EnemyKind, type HeroClass, type HeroSpec, type Species } from '@puff/sim';

const ROOT = '/sprites/v2';

export const STAGE_NAME = 'Meadow of Naps';
export const BACKGROUND = `${ROOT}/bg/01-meadow-of-naps.jpg`;
export const BOSS_BACKGROUND = `${ROOT}/bg/01-meadow-of-naps-boss.jpg`;

export type HeroDef = Omit<HeroSpec, 'level'>;

/** Every puff in the game (the Puff Album); the save's `owned` list says which ones the player has. */
export const ROSTER: readonly HeroDef[] = PUFFS.map(({ id, name, species, heroClass }) => ({ id, name, species, heroClass }));

/** Most puffs on the field at once. */
export const TEAM_SIZE = 6;
/** The starting six (Taro joins on the bench). */
export const DEFAULT_TEAM: readonly string[] = STARTER_PUFFS.slice(0, TEAM_SIZE);

export const heroDef = (id: string): HeroDef | undefined => ROSTER.find((h) => h.id === id);

/** Extracted sheet info written by tools/extract-v2.mjs. */
export interface SheetMeta {
  readonly frames: number;
  readonly width: number;
  readonly height: number;
  /** median content height of the frames: the "body size" used to scale actors */
  readonly refHeight: number;
  /** painted on black: draw with additive blending */
  readonly additive: boolean;
}

let manifest: Record<string, SheetMeta> = {};

/**
 * Stand-in art for a puff whose sheets haven't been generated yet (drawn with a tint so it reads as different).
 * Once `npm run sprites` finds the real sheet, it is used automatically.
 */
const STAND_IN = { species: 'hamham', heroClass: 'bell-bard' } as const;
/** stand-in tint per species, so a borrowed sheet reads as a different puff */
const SPECIES_TINT: Record<Species, number> = { bunbun: 0xfff0f6, hamham: 0xffd9a8, shibu: 0xffc58f, molemo: 0xc9a07a };
const hasOwnArt = (species: Species, heroClass: HeroClass): boolean => `hero/${species}-${heroClass}` in manifest;
/** Borrow a sheet of the same class (so the weapon and moves fit), else the old generic stand-in. */
function standInArt(heroClass: HeroClass): string {
  const same = Object.keys(manifest).find((k) => k.startsWith('hero/') && k.endsWith(`-${heroClass}`) && !k.includes('/bare'));
  return same ? same.slice('hero/'.length) : `${STAND_IN.species}-${STAND_IN.heroClass}`;
}

export const heroSheet = (species: Species, heroClass: HeroClass): string =>
  hasOwnArt(species, heroClass) ? `hero/${species}-${heroClass}` : `hero/${standInArt(heroClass)}`;
/** CSS class for portraits drawn with stand-in art (a filter per species so it doesn't pass for the real puff). */
export const portraitClass = (species: Species, heroClass: HeroClass): string => (hasOwnArt(species, heroClass) ? '' : `stand-in stand-in-${species}`);
/** Tint for stand-in art (white when the puff has its own sheets). */
export const heroTint = (species: Species, heroClass: HeroClass): number => (hasOwnArt(species, heroClass) ? 0xffffff : SPECIES_TINT[species]);
export const signatureSheet = (heroClass: HeroClass): string => `sig/${heroClass}`;
/** A new effect sheet if it has been generated, otherwise a similar existing one. */
export const vfxOr = (sheet: string, fallback: string): string => (sheet in manifest ? sheet : fallback);
export const enemySheet = (kind: EnemyKind): string => `enemy/${ENEMY_FILE[kind]}`;
export const bossSheet = (kind: BossKind): string => `boss/${kind}`;
export const frameUrl = (sheet: string, frame: number): string => `${ROOT}/${sheet}-${frame}.png`;
export const portraitUrl = (species: Species, heroClass: HeroClass): string =>
  `${ROOT}/portrait/${hasOwnArt(species, heroClass) ? `${species}-${heroClass}` : standInArt(heroClass)}.png`;

const ENEMY_FILE: Record<EnemyKind, string> = {
  daisy: 'daisy-dozer',
  tulip: 'tulip-pip',
  sunflower: 'sunflower-spitter',
  lavender: 'lavender-nurse',
  cactus: 'cactus-cuddle',
  'honey-bud': 'honey-bud',
};

export function sheetMeta(sheet: string): SheetMeta {
  const meta = manifest[sheet];
  if (!meta) throw new Error(`Unknown sprite sheet "${sheet}" — run npm run sprites`);
  return meta;
}

export function hasSheet(sheet: string): boolean {
  return sheet in manifest;
}

/** All frames of a sheet as textures (must be preloaded). */
export function frames(sheet: string): Texture[] {
  const { frames: count } = sheetMeta(sheet);
  return Array.from({ length: count }, (_, i) => Texture.from(frameUrl(sheet, i)));
}

/** Loads the manifest, then every frame of every sheet plus the backgrounds. */
export async function loadAssets(): Promise<void> {
  const res = await fetch(`${ROOT}/manifest.json`);
  if (!res.ok) throw new Error(`Sprite manifest missing (${res.status}) — run npm run sprites`);
  manifest = (await res.json()) as Record<string, SheetMeta>;
  const urls = Object.entries(manifest).flatMap(([sheet, meta]) => Array.from({ length: meta.frames }, (_, i) => frameUrl(sheet, i)));
  await Assets.load([BACKGROUND, BOSS_BACKGROUND, ...urls]);
}

/** Class colors from GDD §12.2 */
export const CLASS_COLOR: Record<HeroClass, number> = {
  'pillow-guard': 0x3d8bff,
  'carrot-knight': 0xff6a2b,
  'leaf-archer': 0x3ccb5a,
  'mochi-cleric': 0xffc93c,
  'bubble-mage': 0x5b6cff,
  'bell-bard': 0xff6fb5,
  'root-druid': 0x8fbf3a,
};

export const ULTIMATE_NAME: Record<HeroClass, string> = {
  'pillow-guard': 'Ultimate Roll',
  'carrot-knight': 'Carrot Crescent',
  'leaf-archer': 'Leaf Storm',
  'bubble-mage': 'Bubble Prison',
  'mochi-cleric': 'Mochi Rain',
  'bell-bard': 'Bear Hug Festival',
  'root-druid': 'Root Awakening',
};

export const MELEE: ReadonlySet<HeroClass> = new Set(['pillow-guard', 'carrot-knight']);
