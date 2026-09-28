// Support ultimates (heal / buff): long, rhythmic combos that land on allies several times.
import { CLASS_COLOR } from '../assets';
import type { ActorView } from './actor';
import { glowFlare, lightPillar, magicCircle, risingMotes, screenFlash, sparks } from './anime';
import type { SceneApi } from './api';
import { addHit, alive, at, hop, type ImpactTimes } from './choreo';
import { decal, playFx } from './fx';
import { PROJECTILES, launch } from './projectiles';
import { halo, musicNotes, petalStorm, spiritBear } from './signature';

/** A pillar of light lifts the cleric, a halo opens in the sky, and three waves of glowing mochi fall on every ally. */
export function mochiRain(api: SceneApi, cleric: ActorView, allies: ActorView[]): ImpactTimes {
  const color = CLASS_COLOR['mochi-cleric'];
  const hits: ImpactTimes = new Map();
  cleric.pose('sig', 3, 1.6);
  lightPillar(api.fx, cleric.root.x, cleric.root.y, 0xfff0b0, 60, 360, 1.4);
  magicCircle(api.ground, cleric.root.x, cleric.root.y, 55, color, 1.5);
  hop(cleric, 30, 0.4);
  const sky = { x: api.screen.x + api.screen.width / 2, y: 330 };
  playFx(api.fx, 'vfx/holy-sky-ring', sky.x, sky.y, { size: 220, byWidth: true, anchor: 'center', frameTime: 0.4, fade: 0.4, zIndex: 0 });
  api.sound('ult-mochi-cleric');
  screenFlash(api.overlay, api.screen, 0xfff0b0, 0.2);

  const waves = [0.25, 0.75, 1.25];
  waves.forEach((start, w) => {
    const last = w === waves.length - 1;
    allies.forEach((a, i) => {
      const wait = start + i * 0.05;
      addHit(hits, a.unit.id, wait + PROJECTILES.mochiRain.minDuration + 0.05);
      at(wait, [a], () => {
        const to = { x: a.root.x, y: a.root.y - a.height * 0.3 };
        launch(api.fx, PROJECTILES.mochiRain, to, to, () => {
          if (!alive(a)) return;
          playFx(api.fx, 'vfx/mochi-splat', to.x, to.y, { size: last ? 70 : 50, anchor: 'center', frameTime: 0.07 });
          if (last) {
            playFx(api.fx, 'vfx/heal-pillar', a.root.x, a.root.y + 6, { size: 130, frameTime: 0.1 });
            // signature: a pillar of light and a halo on every ally
            lightPillar(api.fx, a.root.x, a.root.y, 0xfff0b0, 44, 300, 0.7);
            halo(api, a, color);
          }
          else risingMotes(api.fx, a.root.x, a.root.y, 0xfff0b0, 5);
        });
      });
    });
  });
  at(1.2, [], () => petalStorm(api, 1.4));
  at(1.65, [], () => {
    glowFlare(api.fx, sky.x, sky.y + 200, 0xfff0b0, 260, 0.5, 0.6);
    api.shake(5);
  });
  return hits;
}

/** A giant golden bell drops and rings three times; each ring sends a sound wave out and makes every ally glow. */
export function bearHugFestival(api: SceneApi, bard: ActorView, allies: ActorView[]): ImpactTimes {
  const color = CLASS_COLOR['bell-bard'];
  const hits: ImpactTimes = new Map();
  bard.pose('sig', 0, 1.6);
  playFx(api.fx, 'vfx/bard-giant-bell', bard.root.x, bard.root.y + 8, { size: 150, frameTime: 0.28 });
  magicCircle(api.ground, bard.root.x, bard.root.y, 70, color, 1.6);

  const rings = [0.3, 0.8, 1.3];
  // signature: a giant spirit bear rises behind the team and hugs everyone on the last ring
  const team = allies.length ? allies : [bard];
  const mid = { x: team.reduce((s, a) => s + a.root.x, 0) / team.length, y: team.reduce((s, a) => s + a.root.y, 0) / team.length };
  spiritBear(api, mid, color, rings[2]! + 0.1);
  rings.forEach((when, r) => {
    const last = r === rings.length - 1;
    at(when, [bard], () => {
      bard.pose('sig', r % 2 === 0 ? 1 : 2, 0.3);
      hop(bard, 26, 0.25);
      playFx(api.ground, 'vfx/bard-soundwave', bard.root.x, bard.root.y, { size: 200 + r * 60, byWidth: true, anchor: 'center', frameTime: 0.08 });
      sparks(api.fx, bard.root.x, bard.root.y - 40, 0xffe07a, 12 + r * 4, 150);
      api.filters.shockwave(bard.root.x, bard.root.y - 20, 12 + r * 4);
      api.shake(3 + r * 2);
      if (last) {
        api.sound('ult-bell-bard');
        screenFlash(api.overlay, api.screen, 0xffe9a8, 0.25);
      } else {
        api.sound('buff');
      }
    });
    for (const a of allies) {
      addHit(hits, a.unit.id, when + 0.1);
      at(when + 0.1, [a], () => {
        glowFlare(api.fx, a.root.x, a.root.y - a.height * 0.4, color, 70 + r * 20, 0.4);
        if (last) decal(api.ground, 'vfx/bard-aura', a.root.x, a.root.y, { width: 95, hold: 1.2 });
        risingMotes(api.fx, a.root.x, a.root.y, color, 4);
        musicNotes(api, a, color);
      });
    }
  });
  return hits;
}
