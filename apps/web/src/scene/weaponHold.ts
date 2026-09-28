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
  'leaf-archer': { x: 0.29, y: 0.53 }, // wooden bow grip, to the left of the string
  'bubble-mage': { x: 0.3, y: 0.78 },
  'mochi-cleric': { x: 0.3, y: 0.8 },
  'bell-bard': { x: 0.5, y: 0.12 }, // bell handle on top
  'root-druid': { x: 0.3, y: 0.82 },
};

const P = (x: number, y: number, rot: number, size: number, behind?: boolean): HoldPose => ({ x, y, rot, size, ...(behind ? { behind } : {}) });

/**
 * Paw positions measured on the extracted bare sheets, relative to the bottom-centred canvas.
 * Pose frames: 0 idle 1 run 2 wind-up 3 release 4 cast 5 hurt; signature frames 0–3.
 * Tofu keeps its existing table; the six other classes use their own visible gripping paws.
 */
const standard = (size: number): Record<PoseSet, readonly HoldPose[]> => ({
  pose: [P(0.28, 0.42, 0, size), P(0.26, 0.4, 12, size), P(-0.05, 0.62, -60, size), P(0.34, 0.45, 55, size), P(0.2, 0.7, -20, size), P(0.3, 0.35, 30, size)],
  sig: [P(0.25, 0.6, -30, size), P(0.2, 0.65, -50, size), P(0.3, 0.5, 20, size), P(0.32, 0.4, 70, size)],
  cheek: [P(0.3, 0.42, 0, size), P(0.3, 0.42, 0, size)],
});

export const WEAPON_POSE: Record<HeroClass, Record<PoseSet, readonly HoldPose[]>> = {
  'pillow-guard': {
    pose: [P(-0.17, 0.35, -15, 0.7), P(-0.18, 0.34, -5, 0.7), P(0.44, 0.41, 10, 0.7), P(0.49, 0.47, 20, 0.7), P(-0.05, 0.22, 25, 0.7), P(-0.16, 0.4, -25, 0.7)],
    sig: [P(-0.27, 0.34, -10, 0.7), P(0.13, 0.27, -10, 0.7), P(0.22, 0.22, 35, 0.7), P(0.47, 0.52, -20, 0.7)],
    cheek: standard(0.7).cheek,
  },
  'carrot-knight': standard(0.85),
  'leaf-archer': {
    pose: [P(0.25, 0.27, -22, 0.7), P(0.24, 0.27, -10, 0.7), P(0.29, 0.35, -22, 0.7), P(0.27, 0.34, -22, 0.7), P(0.32, 0.51, -58, 0.7), P(0.32, 0.37, 25, 0.7)],
    sig: [P(0.34, 0.32, -22, 0.7), P(0.33, 0.38, -22, 0.7), P(0.34, 0.37, -22, 0.7), P(0.35, 0.56, -55, 0.7)],
    cheek: standard(0.7).cheek,
  },
  'bubble-mage': {
    pose: [P(0.36, 0.43, -25, 0.7), P(0.39, 0.4, -10, 0.7), P(-0.3, 0.57, -55, 0.7), P(0.4, 0.44, 45, 0.7), P(0.34, 0.68, -30, 0.7), P(0.3, 0.55, 20, 0.7)],
    sig: [P(0.39, 0.63, -50, 0.7), P(0.38, 0.62, 30, 0.7), P(0.39, 0.63, -35, 0.7), P(0.36, 0.42, 40, 0.7)],
    cheek: standard(0.7).cheek,
  },
  'mochi-cleric': {
    pose: [P(0.3, 0.34, -35, 0.75), P(0.3, 0.29, -20, 0.75), P(0.31, 0.58, -35, 0.75), P(0.28, 0.31, 45, 0.75), P(0.32, 0.54, -45, 0.75), P(0.3, 0.38, 10, 0.75)],
    sig: [P(0.31, 0.55, -35, 0.75), P(0.28, 0.44, 45, 0.75), P(0.15, 0.28, -30, 0.75), P(0.29, 0.52, -35, 0.75)],
    cheek: standard(0.75).cheek,
  },
  'bell-bard': {
    pose: [P(-0.16, 0.54, 25, 0.45), P(-0.23, 0.48, 30, 0.45), P(-0.16, 0.84, 60, 0.45), P(0.27, 0.52, -50, 0.45), P(-0.18, 0.81, 55, 0.45), P(-0.22, 0.6, 50, 0.45)],
    sig: [P(0.42, 0.72, -30, 0.45), P(0.36, 0.51, -30, 0.45), P(0.4, 0.75, -45, 0.45), P(0.39, 0.76, -40, 0.45)],
    cheek: standard(0.45).cheek,
  },
  'root-druid': {
    pose: [P(0.39, 0.43, -15, 0.95), P(0.44, 0.38, 0, 0.95), P(-0.21, 0.84, -65, 0.95), P(0.45, 0.29, 65, 0.95), P(0.32, 0.8, -15, 0.95), P(0.33, 0.6, 20, 0.95)],
    sig: [P(0.39, 0.8, -15, 0.95), P(0.37, 0.32, 20, 0.95), P(0.47, 0.57, -15, 0.95), P(0.4, 0.49, -15, 0.95)],
    cheek: standard(0.95).cheek,
  },
};

export const weaponSheet = (heroClass: HeroClass): string => `item/weapon-${heroClass}`;
export const bareSheet = (sheet: string): string => sheet.replace(/^(hero|sig)\//, '$1-bare/');
