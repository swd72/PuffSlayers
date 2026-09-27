import { Assets, Texture } from 'pixi.js';
import type { BossKind, EnemyKind, HeroClass, HeroSpec, Species } from '@puff/sim';

const ROOT = '/sprites/v2';

export const STAGE_NAME = 'Meadow of Naps';
export const BACKGROUND = `${ROOT}/bg/01-meadow-of-naps.jpg`;
export const BOSS_BACKGROUND = `${ROOT}/bg/01-meadow-of-naps-boss.jpg`;

export type HeroDef = Omit<HeroSpec, 'level'>;

/** Every puff the player owns; six of them fight (see SaveData.team). */
export const ROSTER: readonly HeroDef[] = [
  { id: 'pudding', name: 'Pudding', species: 'hamham', heroClass: 'pillow-guard' },
  { id: 'tofu', name: 'Tofu', species: 'shibu', heroClass: 'carrot-knight' },
  { id: 'usagi', name: 'Usagi', species: 'bunbun', heroClass: 'leaf-archer' },
  { id: 'kinako', name: 'Kinako', species: 'shibu', heroClass: 'bubble-mage' },
  { id: 'momo', name: 'Momo', species: 'bunbun', heroClass: 'mochi-cleric' },
  { id: 'mimi', name: 'Mimi', species: 'hamham', heroClass: 'bell-bard' },
  { id: 'taro', name: 'Taro', species: 'molemo', heroClass: 'root-druid' },
];

/** Most puffs on the field at once. */
export const TEAM_SIZE = 6;
/** The starting six (Taro joins on the bench). */
export const DEFAULT_TEAM: readonly string[] = ROSTER.slice(0, TEAM_SIZE).map((h) => h.id);

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
const STAND_IN = { species: 'hamham', heroClass: 'bell-bard', tint: 0xc9a07a } as const;
const hasOwnArt = (species: Species, heroClass: HeroClass): boolean => `hero/${species}-${heroClass}` in manifest;

export const heroSheet = (species: Species, heroClass: HeroClass): string =>
  hasOwnArt(species, heroClass) ? `hero/${species}-${heroClass}` : `hero/${STAND_IN.species}-${STAND_IN.heroClass}`;
/** CSS class for portraits drawn with stand-in art (a warm filter so it doesn't pass for the real puff). */
export const portraitClass = (species: Species, heroClass: HeroClass): string => (hasOwnArt(species, heroClass) ? '' : 'stand-in');
/** Tint for stand-in art (white when the puff has its own sheets). */
export const heroTint = (species: Species, heroClass: HeroClass): number => (hasOwnArt(species, heroClass) ? 0xffffff : STAND_IN.tint);
export const signatureSheet = (heroClass: HeroClass): string => `sig/${heroClass}`;
/** A new effect sheet if it has been generated, otherwise a similar existing one. */
export const vfxOr = (sheet: string, fallback: string): string => (sheet in manifest ? sheet : fallback);
export const enemySheet = (kind: EnemyKind): string => `enemy/${ENEMY_FILE[kind]}`;
export const bossSheet = (kind: BossKind): string => `boss/${kind}`;
export const frameUrl = (sheet: string, frame: number): string => `${ROOT}/${sheet}-${frame}.png`;
export const portraitUrl = (species: Species, heroClass: HeroClass): string =>
  hasOwnArt(species, heroClass) ? `${ROOT}/portrait/${species}-${heroClass}.png` : `${ROOT}/portrait/${STAND_IN.species}-${STAND_IN.heroClass}.png`;

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
