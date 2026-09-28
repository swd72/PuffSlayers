import type { Container } from 'pixi.js';
import type { SfxName } from '../audio/sfx';
import type { ActorView } from './actor';
import type { ScreenFilters, ScreenRect } from './anime';

/** What skill choreography may touch in the scene. */
export interface SceneApi {
  /** under the units (ground decals, magic circles) */
  readonly ground: Container;
  /** units and anything that depth-sorts with them */
  readonly field: Container;
  /** above the units */
  readonly fx: Container;
  /** screen space, above everything */
  readonly overlay: Container;
  readonly filters: ScreenFilters;
  /** the visible screen, in world coordinates */
  readonly screen: ScreenRect;
  actor(id: string): ActorView | undefined;
  /** every standing unit on one side */
  team(side: 'hero' | 'enemy'): ActorView[];
  dim(seconds: number): void;
  shake(strength: number): void;
  hitstop(ms: number): void;
  sound(name: SfxName): void;
}
