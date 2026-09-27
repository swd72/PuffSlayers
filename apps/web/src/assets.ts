import { Assets, Texture } from 'pixi.js';
import type { BossKind, EnemyKind, HeroClass, HeroSpec, Species } from '@puff/sim';

const ROOT = '/sprites/v2';

export const STAGE_NAME = 'Meadow of Naps';
export const BACKGROUND = `${ROOT}/bg/01-meadow-of-naps.jpg`;
export const BOSS_BACKGROUND = `${ROOT}/bg/01-meadow-of-naps-boss.jpg`;

export const TEAM: Omit<HeroSpec, 'level'>[] = [
  { id: 'pudding', name: 'Pudding', species: 'hamham', heroClass: 'pillow-guard' },
  { id: 'tofu', name: 'Tofu', species: 'shibu', heroClass: 'carrot-knight' },
  { id: 'usagi', name: 'Usagi', species: 'bunbun', heroClass: 'leaf-archer' },
  { id: 'kinako', name: 'Kinako', species: 'shibu', heroClass: 'bubble-mage' },
  { id: 'momo', name: 'Momo', species: 'bunbun', heroClass: 'mochi-cleric' },
  { id: 'mimi', name: 'Mimi', species: 'hamham', heroClass: 'bell-bard' },
];

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

export const heroSheet = (species: Species, heroClass: HeroClass): string => `hero/${species}-${heroClass}`;
export const signatureSheet = (heroClass: HeroClass): string => `sig/${heroClass}`;
export const enemySheet = (kind: EnemyKind): string => `enemy/${ENEMY_FILE[kind]}`;
export const bossSheet = (kind: BossKind): string => `boss/${kind}`;
export const frameUrl = (sheet: string, frame: number): string => `${ROOT}/${sheet}-${frame}.png`;
export const portraitUrl = (species: Species, heroClass: HeroClass): string => `${ROOT}/portrait/${species}-${heroClass}.png`;

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
};

export const ULTIMATE_NAME: Record<HeroClass, string> = {
  'pillow-guard': 'Ultimate Roll',
  'carrot-knight': 'Carrot Crescent',
  'leaf-archer': 'Leaf Storm',
  'bubble-mage': 'Bubble Prison',
  'mochi-cleric': 'Mochi Rain',
  'bell-bard': 'Bear Hug Festival',
};

export const MELEE: ReadonlySet<HeroClass> = new Set(['pillow-guard', 'carrot-knight']);
