// Held weapons: puffs drawn with empty paws ("bare" sheets) get the equipped weapon's icon placed in their hand,
// frame by frame. Weapon icons are drawn diagonally (handle bottom-left, tip top-right), so each class has a grip
// point on the icon and each pose frame says where the paw is, how the weapon tilts and whether it goes behind.
// Tune live in dev: window.__puff.weaponPose['carrot-knight'].pose[2] = { ... }.
import type { HeroClass } from '@puff/sim';
import type { PoseSet } from './actor';

export interface HoldPose {
  /** paw position as a share of the frame (x from the centre, facing right; y up from the feet), 0..1 of body height */
  readonly x: number;
  readonly y: number;
  /** weapon tilt in degrees (0 = as drawn on the icon) */
  readonly rot: number;
  /** weapon length as a share of the body height */
  readonly size: number;
  /** drawn behind the body (e.g. a bow on the back while running) */
  readonly behind?: boolean;
}

/** Where on the icon (0..1) the paw grips it. */
export const GRIP: Record<HeroClass, { x: number; y: number }> = {
  'pillow-guard': { x: 0.5, y: 0.5 }, // shield: strapped at its centre
  'carrot-knight': { x: 0.22, y: 0.8 }, // hilt
  'leaf-archer': { x: 0.5, y: 0.5 }, // bow grip in the middle
  'bubble-mage': { x: 0.3, y: 0.78 },
  'mochi-cleric': { x: 0.3, y: 0.8 },
  'bell-bard': { x: 0.5, y: 0.12 }, // bell handle on top
  'root-druid': { x: 0.3, y: 0.82 },
};

const P = (x: number, y: number, rot: number, size: number, behind?: boolean): HoldPose => ({ x, y, rot, size, ...(behind ? { behind } : {}) });

/**
 * Starting guesses per class (pose frames: 0 idle 1 run 2 wind-up 3 release 4 cast 5 hurt; sig 0–3).
 * To be tuned against the real bare sheets once they're generated.
 */
const standard = (size: number): Record<PoseSet, readonly HoldPose[]> => ({
  pose: [P(0.28, 0.42, 0, size), P(0.26, 0.4, 12, size), P(-0.05, 0.62, -60, size), P(0.34, 0.45, 55, size), P(0.2, 0.7, -20, size), P(0.3, 0.35, 30, size)],
  sig: [P(0.25, 0.6, -30, size), P(0.2, 0.65, -50, size), P(0.3, 0.5, 20, size), P(0.32, 0.4, 70, size)],
  cheek: [P(0.3, 0.42, 0, size), P(0.3, 0.42, 0, size)],
});

export const WEAPON_POSE: Record<HeroClass, Record<PoseSet, readonly HoldPose[]>> = {
  'pillow-guard': standard(0.55),
  'carrot-knight': standard(0.85),
  'leaf-archer': standard(0.8),
  'bubble-mage': standard(0.7),
  'mochi-cleric': standard(0.8),
  'bell-bard': standard(0.45),
  'root-druid': standard(0.95),
};

export const weaponSheet = (heroClass: HeroClass): string => `item/weapon-${heroClass}`;
export const bareSheet = (sheet: string): string => sheet.replace(/^(hero|sig)\//, '$1-bare/');
