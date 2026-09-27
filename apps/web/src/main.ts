import { Application } from 'pixi.js';
import gsap from 'gsap';
import { loadAssets } from './assets';
import { Game } from './game';
import { BattleScene, fitView } from './scene/BattleScene';
import { Hud } from './ui/hud';
import { InventoryPanel } from './ui/inventory';
import { Sfx } from './audio/sfx';
import './style.css';

async function boot(): Promise<void> {
  const appEl = document.querySelector<HTMLElement>('#app');
  const stageEl = document.querySelector<HTMLElement>('#stage');
  const hudEl = document.querySelector<HTMLElement>('#hud');
  const loading = document.querySelector<HTMLElement>('#loading');
  if (!appEl || !stageEl || !hudEl) throw new Error('Missing #app, #stage or #hud element');

  // the canvas is stretched to #app with CSS; render at enough pixels to stay crisp
  const measure = () => {
    const view = fitView(appEl.clientWidth, appEl.clientHeight);
    const resolution = Math.min(2.5, (window.devicePixelRatio || 1) * (appEl.clientWidth / view.width));
    return { ...view, resolution: Math.max(1, resolution) };
  };
  const initial = measure();

  const app = new Application();
  await app.init({
    width: initial.width,
    height: initial.height,
    background: '#8fd18a',
    antialias: true,
    resolution: initial.resolution,
    autoDensity: false,
  });
  stageEl.appendChild(app.canvas);

  await Promise.all([loadAssets(), document.fonts.load('40px "Lilita One"').catch(() => undefined)]);

  const sfx = new Sfx();
  // sound files are optional; the game starts even if none exist yet
  void sfx.preload();
  // audio may only start after a user gesture; resume on every tap in case the OS suspended it
  const unlockAudio = () => sfx.unlock();
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  let game: Game | undefined;
  const scene = new BattleScene(app.stage, {
    onUltimateCast: (heroId, heroClass, castMs) => game?.onUltimateCast(heroId, heroClass, castMs),
    onPetals: (amount) => game?.addPetals(amount),
    onHitstop: (ms) => game?.freeze(ms),
    onBanner: (text) => hud.banner(text, 1700),
  }, sfx);
  const hud = new Hud(hudEl, sfx.muted, {
    onToggleMute: () => {
      const muted = sfx.toggleMute();
      sfx.play('click');
      return muted;
    },
    onClick: () => sfx.play('click'),
    onToggleAuto: () => game?.toggleAuto(),
    onCycleSpeed: () => game?.cycleSpeed(),
    onPortrait: (heroId) => game?.castUltimate(heroId),
    onOpenBag: () => bag.open(),
  });
  const bag = new InventoryPanel(hudEl.parentElement ?? hudEl, {
    getSave: () => game!.currentSave,
    setSave: (save) => game?.updateSave(save),
    onClick: () => sfx.play('click'),
  });
  scene.resize(initial.width, initial.height);
  new ResizeObserver(() => {
    const next = measure();
    app.renderer.resize(next.width, next.height, next.resolution);
    scene.resize(next.width, next.height);
  }).observe(appEl);
  game = new Game(scene, hud, {
    onLoot: (items) => hud.showLoot(items),
    onSave: () => undefined,
  });
  game.start();
  if (import.meta.env.DEV) {
    // dev-only handle for inspecting/pumping frames from the console
    (window as unknown as { __puff: unknown }).__puff = { app, game, gsap, sfx };
  }
  loading?.remove();

  app.ticker.add((ticker) => {
    game?.tick(ticker.deltaMS);
    scene.update((ticker.deltaMS / 1000) * (game?.speed ?? 1));
  });
}

boot().catch((error: unknown) => {
  const loading = document.querySelector<HTMLElement>('#loading');
  if (loading) loading.textContent = 'โหลดเกมไม่สำเร็จ ลองรีเฟรชอีกครั้ง';
  console.error('[PuffSlayers] boot failed', error);
});
