import type { BossKind, EnemyKind, EnemySpec } from './types';

const ROTATION: readonly EnemyKind[] = ['daisy', 'tulip', 'sunflower', 'honey-bud', 'lavender', 'cactus'];
const BOSSES: readonly BossKind[] = ['queen-rafflesia', 'sunflower-colossus', 'lotus-moon-sage'];

/** Every 10th stage is a giant boss stage (it also counts as a boss stage). */
export const isGiantStage = (stage: number): boolean => stage % 10 === 0;
export const isBossStage = (stage: number): boolean => stage % 5 === 0;

export const bossForStage = (stage: number): BossKind => BOSSES[(Math.floor(stage / 5) - 1) % BOSSES.length] ?? 'queen-rafflesia';

/**
 * Normal stages: three growing waves (5 → 6 → 7 flowers).
 * Every 5th stage the last wave is a boss; every 10th stage is a short warm-up then a giant boss.
 */
export function stageWaves(stage: number): EnemySpec[][] {
  const pick = (offset: number): EnemyKind => ROTATION[(stage + offset) % ROTATION.length] ?? 'daisy';
  const wave = (size: number, shift: number): EnemySpec[] => Array.from({ length: size }, (_, i) => ({ kind: pick(shift + (i % 3)) }));
  if (isGiantStage(stage)) return [wave(5, 0), [{ boss: bossForStage(stage), giant: true }, { kind: pick(0) }, { kind: pick(1) }]];
  const last: EnemySpec[] = isBossStage(stage) ? [{ boss: bossForStage(stage) }, { kind: pick(0) }, { kind: pick(1) }] : wave(7, 2);
  return [wave(5, 0), wave(6, 1), last];
}
