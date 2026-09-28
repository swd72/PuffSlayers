import { isBossStage, isGiantStage, recommendedLevel, type BattleState, type HeroClass, type IngredientId, type Item, type SeedKind } from '@puff/sim';
import { SEED_NAME } from '../meta/garden';
import { chapterName, stageLabel } from '../meta/guide';
import { CLASS_COLOR, STAGE_NAME, ULTIMATE_NAME, portraitClass, portraitUrl } from '../assets';
import { INGREDIENT_INFO, TIER_COLOR, frameIcon, ingredientIcon, itemIcon, itemName, skinPortrait } from '../meta/itemInfo';

export interface HudStatus {
  readonly petals: number;
  readonly auto: boolean;
  readonly speed: number;
  readonly teamLevel: number;
  /** Arena / Raid: replaces the stage card text (title, line under it) */
  readonly mode?: { readonly name: string; readonly title: string; readonly sub: string; readonly alert?: boolean };
}

const CLASS_ICON: Record<HeroClass, string> = {
  'pillow-guard': '<path d="M12 3 L19 6 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V6 Z"/>',
  'carrot-knight': '<path d="M5 19 C9 9 15 5 20 4 C16 8 12 13 10 20"/><path d="M4 20 L8 16"/>',
  'leaf-archer': '<path d="M4 20 L18 6"/><path d="M13 5 H19 V11"/><path d="M4 14 L7 17 M8 12 L11 15"/>',
  'bubble-mage': '<circle cx="9" cy="14" r="5"/><circle cx="16.5" cy="7.5" r="3"/><circle cx="18" cy="16" r="2"/>',
  'mochi-cleric': '<path d="M12 4 V20 M4 12 H20"/><circle cx="12" cy="12" r="3"/>',
  'bell-bard': '<path d="M6 17 C6 9 8 5 12 5 C16 5 18 9 18 17 Z"/><path d="M4 17 H20"/><circle cx="12" cy="20" r="1.4"/>',
  'root-druid': '<path d="M12 21 V11"/><path d="M12 14 C9 14 7 12 6 9 M12 12 C15 12 17 10 18 7"/><path d="M12 21 C10 19 7 19 5 20 M12 21 C14 19 17 19 19 20"/>',
};

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

export interface HudHandlers {
  /** returns the new muted state */
  onToggleMute(): boolean;
  onClick(): void;
  onToggleAuto(): void;
  onCycleSpeed(): void;
  onPortrait(heroId: string): void;
  onOpenBag(): void;
}

export class Hud {
  private readonly portraits = new Map<string, HTMLButtonElement>();
  private readonly stageLabel: HTMLElement;
  private readonly levelLabel: HTMLElement;
  private readonly stageName: HTMLElement;
  private readonly waveDots: HTMLElement;
  private readonly petalLabel: HTMLElement;
  private readonly autoButton: HTMLButtonElement;
  private readonly speedButton: HTMLButtonElement;
  private readonly bar: HTMLElement;
  private readonly overlay: HTMLElement;
  private readonly bossBar: HTMLElement;
  private comboCount = 0;
  private lastUltimateAt = -Infinity;

  constructor(
    private readonly root: HTMLElement,
    startMuted: boolean,
    handlers: HudHandlers,
  ) {
    root.innerHTML = `
      <div class="hud-top">
        <div class="top-left">
          <button class="auto" type="button" aria-pressed="true"><span class="auto-label">Auto</span><span class="switch"><span class="knob"></span></span></button>
          <button class="bag" type="button" aria-label="กลับหมู่บ้าน">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"/></svg>
            <span>หมู่บ้าน</span><i class="bag-dot" hidden></i>
          </button>
        </div>
        <div class="stage-card"><span class="stage-name"></span><strong class="stage-label"></strong><span class="level-label"></span><span class="wave-dots"></span></div>
        <div class="top-right">
          <span class="petals" aria-label="Petal"><i></i><b class="petal-count">0</b></span>
          <button class="speed" type="button" aria-label="ความเร็วเกม">×1</button>
          <button class="sound" type="button" aria-label="เสียง" aria-pressed="true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path class="spk" d="M4 9 H8 L13 5 V19 L8 15 H4 Z"/><path class="on" d="M16 9 C17.5 10.5 17.5 13.5 16 15 M18.5 6.5 C21.5 9.5 21.5 14.5 18.5 17.5"/><path class="off" d="M16 9 L21 15 M21 9 L16 15"/></svg>
          </button>
        </div>
      </div>
      <div class="boss-bar" hidden><span class="boss-name"></span><span class="boss-rage">ENRAGED</span><span class="boss-hp"><i></i></span></div>
      <div class="overlay" aria-live="polite"></div>
      <div class="loot" aria-live="polite"></div>
      <div class="portrait-bar"></div>`;
    this.stageLabel = this.q('.stage-label');
    this.levelLabel = this.q('.level-label');
    this.stageName = this.q('.stage-name');
    this.waveDots = this.q('.wave-dots');
    this.petalLabel = this.q('.petal-count');
    this.autoButton = this.q<HTMLButtonElement>('.auto');
    this.speedButton = this.q<HTMLButtonElement>('.speed');
    this.bar = this.q('.portrait-bar');
    this.overlay = this.q('.overlay');
    this.bossBar = this.q('.boss-bar');
    this.q('.bag').addEventListener('click', () => {
      handlers.onClick();
      this.q('.bag-dot').hidden = true;
      handlers.onOpenBag();
    });
    this.autoButton.addEventListener('click', () => {
      handlers.onClick();
      handlers.onToggleAuto();
    });
    this.speedButton.addEventListener('click', () => {
      handlers.onClick();
      handlers.onCycleSpeed();
    });
    const sound = this.q<HTMLButtonElement>('.sound');
    const showSound = (muted: boolean) => {
      sound.setAttribute('aria-pressed', String(!muted));
      sound.classList.toggle('muted', muted);
    };
    showSound(startMuted);
    sound.addEventListener('click', () => showSound(handlers.onToggleMute()));
    this.bar.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-hero]');
      if (button?.dataset.hero) handlers.onPortrait(button.dataset.hero);
    });
  }

  private q<T extends HTMLElement = HTMLElement>(selector: string): T {
    const el = this.root.querySelector<T>(selector);
    if (!el) throw new Error(`HUD element ${selector} missing`);
    return el;
  }

  buildPortraits(state: BattleState, skins: Readonly<Record<string, string | null>> = {}): void {
    this.bar.innerHTML = '';
    this.portraits.clear();
    for (const hero of state.units.filter((u) => u.side === 'hero')) {
      if (!hero.species || !hero.heroClass) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'portrait';
      button.dataset.hero = hero.id;
      button.setAttribute('aria-label', `${hero.name} — ${ULTIMATE_NAME[hero.heroClass]}`);
      button.style.setProperty('--class-color', hex(CLASS_COLOR[hero.heroClass]));
      button.innerHTML = `
        <span class="ring"><span class="face ${skins[hero.id] ? '' : portraitClass(hero.species, hero.heroClass)}" style="background-image:url('${skins[hero.id] ? skinPortrait(skins[hero.id] ?? '') : portraitUrl(hero.species, hero.heroClass)}')"></span></span>
        <span class="class-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${CLASS_ICON[hero.heroClass]}</svg></span>
        <span class="ready">ULT</span>
        <span class="hp"><i></i></span>`;
      this.bar.appendChild(button);
      this.portraits.set(hero.id, button);
    }
  }

  render(state: BattleState, status: HudStatus): void {
    const { petals, auto, speed, teamLevel, mode } = status;
    const stage = state.config.stage;
    const boss = isBossStage(stage) && state.wave === state.config.waves.length - 1;
    this.stageName.textContent = mode ? mode.name : `${STAGE_NAME} · ${chapterName(stage)}`;
    this.stageLabel.textContent = mode ? mode.title : boss ? `ด่าน ${stageLabel(stage)} · ${isGiantStage(stage) ? 'GIANT' : 'BOSS'}` : `ด่าน ${stageLabel(stage)}`;
    this.levelLabel.textContent = mode ? mode.sub : `ทีม Lv.${teamLevel} · แนะนำ Lv.${recommendedLevel(stage)}`;
    this.levelLabel.classList.toggle('under', mode ? !!mode.alert : teamLevel < recommendedLevel(stage));
    this.waveDots.hidden = !!mode;
    this.renderBoss(state);
    this.waveDots.innerHTML = state.config.waves
      .map((_, i) => `<i class="${i < state.wave ? 'done' : i === state.wave ? 'now' : ''}"></i>`)
      .join('');
    this.petalLabel.textContent = petals.toLocaleString('en-US');
    this.autoButton.setAttribute('aria-pressed', String(auto));
    this.autoButton.classList.toggle('on', auto);
    this.speedButton.textContent = `×${speed}`;
    for (const hero of state.units) {
      const button = this.portraits.get(hero.id);
      if (!button) continue;
      const ready = hero.hp > 0 && hero.energy >= 100;
      button.style.setProperty('--energy', `${hero.energy}%`);
      button.style.setProperty('--hp', `${(hero.hp / hero.stats.maxHp) * 100}%`);
      button.classList.toggle('is-ready', ready);
      button.classList.toggle('is-down', hero.hp <= 0);
      button.disabled = hero.hp <= 0;
    }
  }

  private renderBoss(state: BattleState): void {
    const boss = state.units.find((u) => u.isBoss && u.hp > 0);
    this.bossBar.hidden = !boss;
    if (!boss) return;
    this.q('.boss-name').textContent = `${boss.name}  ${Math.ceil((boss.hp / boss.stats.maxHp) * 100)}%`;
    this.bossBar.style.setProperty('--hp', `${(boss.hp / boss.stats.maxHp) * 100}%`);
    this.bossBar.classList.toggle('giant', boss.isGiant);
    this.bossBar.classList.toggle('enraged', boss.enraged);
  }

  /** Stage-clear rewards: item cards pop in one by one above the portraits. */
  showLoot(items: readonly Item[], forage: readonly IngredientId[] = [], seeds: readonly SeedKind[] = [], notes: readonly string[] = []): void {
    const box = this.q('.loot');
    box.innerHTML = '';
    if (!items.length && !forage.length && !seeds.length && !notes.length) return;
    if (notes.length) {
      const line = document.createElement('p');
      line.className = 'loot-notes';
      line.textContent = notes.join(' · ');
      box.appendChild(line);
    }
    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = `loot-card${item.relic ? ' relic' : ''}`;
      card.style.setProperty('--tier', TIER_COLOR[item.tier]);
      card.style.animationDelay = `${i * 0.12}s`;
      card.innerHTML = `<img class="frame" src="${frameIcon(item.tier)}" alt=""><img class="icon" src="${itemIcon(item)}" alt="${itemName(item)}">`;
      box.appendChild(card);
    });
    forage.forEach((id, i) => {
      const card = document.createElement('div');
      card.className = 'loot-card forage';
      card.style.animationDelay = `${(items.length + i) * 0.12}s`;
      const icon = ingredientIcon(id);
      card.innerHTML = icon ? `<img class="icon" src="${icon}" alt="${INGREDIENT_INFO[id].name}">` : `<span class="forage-name">${INGREDIENT_INFO[id].name}</span>`;
      box.appendChild(card);
    });
    seeds.forEach((kind, i) => {
      const card = document.createElement('div');
      card.className = 'loot-card forage seed';
      card.style.animationDelay = `${(items.length + forage.length + i) * 0.12}s`;
      card.innerHTML = `<span class="forage-name">เมล็ด<br>${SEED_NAME[kind]}</span>`;
      box.appendChild(card);
    });
    if (items.some((i) => i.relic)) this.banner('ได้ของแรร์!', 1800);
    this.q('.bag-dot').hidden = false;
    window.setTimeout(() => {
      box.innerHTML = '';
    }, 2600);
  }

  /** No cut-in banner any more (it froze the fight too often): only FLUFFY ×N when ultimates chain. */
  ultimate(now: number): void {
    this.comboCount = now - this.lastUltimateAt < 2500 ? this.comboCount + 1 : 1;
    this.lastUltimateAt = now;
    if (this.comboCount >= 2) this.flash('combo', `FLUFFY ×${this.comboCount}!`, '#ffc93c', 1200);
  }

  banner(text: string, ms = 1600): void {
    this.flash('banner', text, '#ffffff', ms);
  }

  private flash(kind: string, text: string, color: string, ms: number): HTMLElement {
    this.overlay.querySelector(`.${kind}`)?.remove();
    const el = document.createElement('div');
    el.className = kind;
    el.style.setProperty('--accent', color);
    const label = document.createElement('span');
    label.className = `${kind}-text`;
    label.textContent = text;
    el.appendChild(label);
    this.overlay.appendChild(el);
    window.setTimeout(() => el.remove(), ms);
    return el;
  }
}
