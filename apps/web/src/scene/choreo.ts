// Building blocks for long ultimate choreography: timed calls, dashes with afterimages, hops, and the hit list.
import gsap from 'gsap';
import { Container, Sprite } from 'pixi.js';
import type { ActorView } from './actor';
import { afterimages } from './anime';
import type { SceneApi } from './api';

/** Per target: the moments (seconds after the skill fires) its hits land. The last one is the finisher. */
export type ImpactTimes = Map<string, number[]>;

export const alive = (...actors: readonly ActorView[]): boolean => actors.every((a) => !a.root.destroyed);

/**
 * Runs a step of a combo later — only if every actor it touches still exists
 * (a combo can outlive its targets, or the whole scene when the last hit clears the stage).
 */
export const at = (seconds: number, actors: readonly ActorView[], fn: () => void): void =>
  void gsap.delayedCall(seconds, () => {
    if (alive(...actors)) fn();
  });

export function addHit(hits: ImpactTimes, id: string, when: number): void {
  const list = hits.get(id) ?? [];
  list.push(when);
  list.sort((a, b) => a - b);
  hits.set(id, list);
}

/** Every target is hit at each of these moments. */
export function hitAll(targets: readonly ActorView[], times: readonly number[]): ImpactTimes {
  return new Map(targets.map((t) => [t.unit.id, [...times]]));
}

/** A still copy of the actor's current frame, for dash afterimages. */
function ghostOf(actor: ActorView): () => Container {
  return () => {
    const c = new Container();
    const s = new Sprite(actor.sprite.texture);
    s.anchor.set(0.5, 1);
    s.scale.set(actor.sprite.scale.x * actor.root.scale.x, actor.sprite.scale.y * actor.root.scale.y);
    c.addChild(s);
    return c;
  };
}

/** Quick dash to a point, leaving a trail of silhouettes. */
export function dash(api: SceneApi, actor: ActorView, to: { x: number; y: number }, seconds: number, tint: number): void {
  const from = { x: actor.root.x, y: actor.root.y };
  afterimages(api.field, ghostOf(actor), from, to, tint);
  gsap.to(actor.root, { x: to.x, y: to.y, duration: seconds, ease: 'power3.out' });
}

/** Jump in place (or along a line): the body rises and falls while root travels. */
export function hop(actor: ActorView, height: number, seconds: number, spins = 0): void {
  gsap
    .timeline()
    .to(actor.body, { y: -height, duration: seconds * 0.5, ease: 'power2.out' })
    .to(actor.body, { y: 0, duration: seconds * 0.5, ease: 'power3.in' });
  if (spins) gsap.fromTo(actor.body, { rotation: 0 }, { rotation: spins * Math.PI * 2 * (actor.unit.facing < 0 ? -1 : 1), duration: seconds, ease: 'power1.inOut', onComplete: () => void (actor.body.rotation = 0) });
}

/** Takes control of an actor for a scripted move, and hands it back to the sim (gliding home) at `endAt`. */
export function script(actor: ActorView, endAt: number): void {
  actor.scripted = true;
  at(endAt, [actor], () => {
    gsap.to(actor.root, {
      x: actor.unit.x,
      y: actor.unit.y,
      duration: 0.25,
      ease: 'power2.inOut',
      onComplete: () => void (actor.scripted = false),
    });
  });
}

/** Targets nearest first (so dash combos go outward from the caster). */
export const nearestFirst = (from: ActorView, targets: readonly ActorView[]): ActorView[] =>
  [...targets].sort((a, b) => Math.hypot(a.root.x - from.root.x, a.root.y - from.root.y) - Math.hypot(b.root.x - from.root.x, b.root.y - from.root.y));
