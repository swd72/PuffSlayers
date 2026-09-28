import { Application } from 'pixi.js';
import gsap from 'gsap';
import { loadAssets } from './assets';
import { Game } from './game';
import { BattleScene, fitView } from './scene/BattleScene';
import { Hud } from './ui/hud';
import { InventoryPanel } from './ui/inventory';
import { NapPanel } from './ui/nap';
import { HubScreen } from './ui/hub';
import { PrepPanel } from './ui/prep';
import { GardenPanel } from './ui/garden';
import { AlbumPanel } from './ui/album';
import { BoardPanel } from './ui/board';
import { PondPanel } from './ui/pond';
import { ArenaPanel } from './ui/arena';
import { RaidPanel } from './ui/raid';
import { StoryOverlay } from './ui/story';
import { ResultOverlay } from './ui/result';
import { SidePanels } from './ui/side';
import type { GoalAction } from './meta/guide';
import type { Feature } from './meta/unlocks';
import { freePullReady } from './meta/album';
import { WEAPON_POSE } from './scene/weaponHold';
import { Sfx } from './audio/sfx';
import { keepScreenAwake } from './screenAwake';
import './style.css';
import './ui/workshop.css';
import './ui/hub.css';
import './ui/garden.css';
import './ui/village.css';

/** how often the nap clock is stamped while the game is on screen */
const HEARTBEAT_MS = 20000;

async function boot(): Promise<void> {
  const appEl = document.querySelector<HTMLElement>('#app');
  const stageEl = document.querySelector<HTMLElement>('#stage');
  const hudEl = document.querySelector<HTMLElement>('#hud');
  const loading = document.querySelector<HTMLElement>('#loading');
  if (!appEl || !stageEl || !hudEl) throw new Error('Missing #app, #stage or #hud element');

  // the canvas is stretched to #app with CSS; render at enough pixels to stay crisp
  const measure = () => {
    const view = fitView(appEl.clientWidth, appEl.clientHeight);
    // phones: 2× is plenty sharp and keeps GPU memory low (a lost WebGL context turns the game black)
    const maxRes = window.matchMedia('(pointer: coarse)').matches ? 2 : 2.5;
    const resolution = Math.min(maxRes, (window.devicePixelRatio || 1) * (appEl.clientWidth / view.width));
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
  keepScreenAwake();

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
    onUltimateCast: () => game?.onUltimateCast(),
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
    // in battle, the top-left button goes home to the village
    onOpenBag: () => goHome(),
  });
  /** the bag was opened from the deploy screen: closing it goes back there */
  let bagReturnsToPrep = false;
  const bag = new InventoryPanel(hudEl.parentElement ?? hudEl, {
    getSave: () => game!.currentSave,
    setSave: (save) => game?.updateSave(save),
    onClick: () => sfx.play('click'),
    onClose: () => {
      if (!bagReturnsToPrep) return;
      bagReturnsToPrep = false;
      prep.open();
    },
  });
  const hub = new HubScreen(appEl, {
    getSave: () => game!.currentSave,
    onAdventure: () => only(prep).open(),
    onOpenBag: () => only(bag).open(),
    onOpenTeam: () => only(prep).open(),
    onBuilding: (id) => openBuilding(id),
    onGoal: (action) => onGoal(action),
    onStory: () => (closeAll(), story.open()),
    onClick: () => sfx.play('click'),
  });
  const refreshAll = () => {
    hub.refresh();
    side.render();
  };
  const sheetDeps = {
    getSave: () => game!.currentSave,
    setSave: (save: Parameters<NonNullable<typeof game>['updateSave']>[0]) => game?.updateSave(save),
    onClick: () => sfx.play('click'),
    onClose: () => refreshAll(),
  };
  const garden = new GardenPanel(appEl, sheetDeps);
  const album = new AlbumPanel(appEl, sheetDeps);
  const board = new BoardPanel(appEl, sheetDeps);
  const pond = new PondPanel(appEl, sheetDeps);
  const arena = new ArenaPanel(appEl, {
    ...sheetDeps,
    onFight: (rival) => {
      hub.hide();
      game?.startArena(rival);
    },
  });
  const raid = new RaidPanel(appEl, {
    ...sheetDeps,
    onRaid: (boss, stage) => {
      hub.hide();
      game?.startRaid(boss, stage);
    },
  });
  const story = new StoryOverlay(appEl, () => sfx.play('click'));
  const result = new ResultOverlay(appEl, () => sfx.play('click'));
  // one window at a time: opening a panel closes whatever else is open, so they never pile up
  const panels = (): { visible: boolean; close(): void }[] => [garden, album, board, pond, arena, raid, prep, bag];
  const closeAll = (keep?: object) => {
    bagReturnsToPrep = false;
    for (const p of panels()) if (p !== keep && p.visible) p.close();
  };
  const only = <T extends object>(panel: T): T => {
    closeAll(panel);
    return panel;
  };
  const openBuilding = (id: Feature) => {
    if (id === 'garden') only(garden).open();
    else if (id === 'album') only(album).openOn('album');
    else if (id === 'board') only(board).open();
    else if (id === 'pond') only(pond).open();
    else if (id === 'arena') only(arena).open();
    else if (id === 'raid') only(raid).open();
  };
  const onGoal = (action: GoalAction) => {
    if (!hub.visible) goHome();
    switch (action) {
      case 'adventure':
        return only(prep).open();
      case 'bag':
        return only(bag).open();
      case 'nap':
        closeAll();
        return game?.checkNap();
      case 'album':
        return only(album).openOn(game && freePullReady(game.currentSave) ? 'capsule' : 'album');
      default:
        return openBuilding(action);
    }
  };
  const side = new SidePanels(document.querySelector<HTMLElement>('#side-left')!, document.querySelector<HTMLElement>('#side-right')!, {
    getSave: () => game!.currentSave,
    onGoal: (action) => onGoal(action),
    onClick: () => sfx.play('click'),
  });
  const prep = new PrepPanel(appEl, {
    getSave: () => game!.currentSave,
    setSave: (save) => game?.updateSave(save),
    onStart: () => {
      hub.hide();
      game?.deploy();
    },
    onBack: () => hub.refresh(),
    onEditHero: (heroId) => {
      // the bag replaces the deploy screen for a moment, and hands back to it when closed
      only(bag).open(heroId);
      bagReturnsToPrep = true;
    },
    onClick: () => sfx.play('click'),
  });
  const goHome = () => {
    closeAll();
    game?.enterHub();
    hub.show();
    side.render();
  };
  const nap = new NapPanel(hudEl.parentElement ?? hudEl, {
    getSave: () => game!.currentSave,
    onClaim: () => game?.claimNap(),
    onClick: () => sfx.play('click'),
  });
  scene.resize(initial.width, initial.height);
  new ResizeObserver(() => {
    const next = measure();
    app.renderer.resize(next.width, next.height, next.resolution);
    scene.resize(next.width, next.height);
  }).observe(appEl);
  game = new Game(scene, hud, {
    onLoot: (items, forage, seeds, notes) => hud.showLoot(items, forage, seeds, notes),
    onSave: () => {
      hub.refresh();
      prep.refresh();
      side.render();
      for (const panel of [album, board, arena, raid]) panel.refresh();
    },
    // the nap card only pops up on the village with nothing else open; otherwise the goal button keeps it waiting
    onNap: (reward) => {
      if (!hub.visible || nap.visible || panels().some((p) => p.visible)) return;
      nap.show(reward);
    },
    onArenaEnd: (outcome, rival) => result.arena(outcome, rival, () => {
      goHome();
      only(arena).open();
    }),
    onRaidEnd: (outcome, boss) => result.raid(outcome, boss, () => {
      goHome();
      only(raid).open();
    }),
  });
  game.start();
  hub.show();
  side.render();
  if (!game.currentSave.intro) {
    story.open(() => game?.updateSave({ ...game.currentSave, intro: true }));
  } else {
    game.checkNap();
  }
  // the battle stops while the tab is hidden, so time away counts as a nap
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') game?.checkNap();
    else game?.persist();
  });
  window.addEventListener('pagehide', () => game?.persist());
  // the phone dropped the GPU context (memory pressure, long sleep): save and reload instead of staying black
  app.canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    game?.persist();
    const reload = () => location.reload();
    if (document.visibilityState === 'visible') window.setTimeout(reload, 300);
    else document.addEventListener('visibilitychange', reload, { once: true });
  });
  window.setInterval(() => {
    if (document.visibilityState === 'visible') game?.persist();
  }, HEARTBEAT_MS);
  if (import.meta.env.DEV) {
    // dev-only handle for inspecting/pumping frames from the console
    (window as unknown as { __puff: unknown }).__puff = { app, game, gsap, sfx, weaponPose: WEAPON_POSE };
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
