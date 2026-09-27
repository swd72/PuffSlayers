// Bag & equipment screen: pick a puff, level it up, see its gear and stats, equip / forge items, choose a skin.
import { SLOTS, createHero, fitsClass, itemScore, levelUpCost, type Slot } from '@puff/sim';
import { ROSTER, TEAM_SIZE, portraitClass, portraitUrl } from '../assets';
import { SKINS, SLOT_LABEL, skinPortrait } from '../meta/itemInfo';
import { equip, equipBest, heroGear, heroLevel, itemById, unequip, wornBy, type SaveData } from '../meta/save';
import { autoMerge, levelUp, levelUpTeam, merge, reroll, salvage, toggleTeam, transfer, upgrade, type ActionResult } from '../meta/workshop';
import { itemDetail, tile } from './itemDetail';
import { lunchRow, pantryGrid } from './lunchbox';
import { sellIngredient, setLunch } from '../meta/picnic';
import type { IngredientId } from '@puff/sim';

const fmt = (n: number): string => n.toLocaleString('en-US');

export interface InventoryDeps {
  getSave(): SaveData;
  setSave(save: SaveData): void;
  onClick(): void;
}

const SLOT_ICON: Record<Slot, string> = {
  weapon: '<path d="M5 19 L16 8"/><path d="M14 5 L19 5 L19 10"/><path d="M4 15 L9 20"/>',
  hat: '<path d="M4 16 C4 9 8 5 12 5 C16 5 20 9 20 16 Z"/><path d="M3 16 H21"/>',
  outfit: '<path d="M8 4 L4 8 L6 11 L8 10 V20 H16 V10 L18 11 L20 8 L16 4 C15 6 9 6 8 4 Z"/>',
  charm: '<circle cx="12" cy="13" r="6"/><path d="M12 7 V3"/>',
  trinket: '<path d="M12 3 L14.5 9 L21 9.5 L16 13.5 L17.5 20 L12 16.5 L6.5 20 L8 13.5 L3 9.5 L9.5 9 Z"/>',
};

export class InventoryPanel {
  private readonly el: HTMLElement;
  private readonly sheet: HTMLElement;
  private heroId = ROSTER[0]?.id ?? '';
  private slot: Slot = 'weapon';
  private selected: string | null = null;
  private confirmSalvage: string | null = null;
  private pantryOpen = false;
  private toast: { text: string; ok: boolean } | null = null;

  constructor(
    root: HTMLElement,
    private readonly deps: InventoryDeps,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'bag-panel';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'กระเป๋าและอุปกรณ์');
    // the sheet stays put between renders so its slide-up plays only on open and the scroll position is kept
    this.sheet = document.createElement('div');
    this.sheet.className = 'bag-sheet';
    this.el.appendChild(this.sheet);
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  /** Opens the bag, optionally on a given puff (from the deploy screen). */
  open(heroId?: string): void {
    if (heroId) {
      this.heroId = heroId;
      this.selected = null;
      this.pantryOpen = false;
    }
    this.el.hidden = false;
    this.render();
  }

  close(): void {
    this.el.hidden = true;
  }

  private get hero() {
    return ROSTER.find((h) => h.id === this.heroId) ?? ROSTER[0]!;
  }

  private update(save: SaveData): void {
    this.deps.setSave(save);
    this.render();
  }

  private apply(result: ActionResult, keepSelection = true): void {
    this.toast = { text: result.message, ok: result.ok };
    if (!keepSelection || !result.save.items.some((i) => i.id === this.selected)) this.selected = null;
    this.update(result.save);
  }

  private onClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!target) return;
    this.deps.onClick();
    const { act, id } = target.dataset;
    const save = this.deps.getSave();
    if (act !== 'salvage') this.confirmSalvage = null;
    this.toast = null;
    switch (act) {
      case 'close':
        return this.close();
      case 'hero':
        this.heroId = id ?? this.heroId;
        this.selected = null;
        return this.render();
      case 'slot':
        this.slot = (id as Slot) ?? this.slot;
        this.selected = null;
        return this.render();
      case 'item':
        this.selected = id ?? null;
        return this.render();
      case 'equip': {
        const item = itemById(save, id);
        if (item) this.update(equip(save, this.heroId, item));
        return;
      }
      case 'unequip':
        return this.update(unequip(save, this.heroId, this.slot));
      case 'best':
        return this.update(equipBest(save, this.heroId, this.hero.heroClass));
      case 'best-all':
        return this.update(ROSTER.reduce((s, h) => equipBest(s, h.id, h.heroClass), save));
      case 'level':
        return this.apply(levelUp(save, this.heroId));
      case 'pantry':
        this.pantryOpen = !this.pantryOpen;
        return this.render();
      case 'lunch':
        this.pantryOpen = false;
        return this.apply(setLunch(save, this.heroId, (id || null) as IngredientId | null));
      case 'sell':
        return this.apply(sellIngredient(save, id as IngredientId));
      case 'team':
        return this.apply(toggleTeam(save, this.heroId));
      case 'level-team':
        return this.apply(levelUpTeam(save));
      case 'upgrade':
        return this.apply(upgrade(save, id ?? ''));
      case 'merge': {
        const before = new Set(save.items.map((i) => i.id));
        const result = merge(save, id ?? '');
        // select the freshly made item so its stats show right away
        this.selected = result.save.items.find((i) => !before.has(i.id))?.id ?? this.selected;
        return this.apply(result);
      }
      case 'auto-merge':
        return this.apply(autoMerge(save), false);
      case 'salvage':
        if (this.confirmSalvage !== id) {
          this.confirmSalvage = id ?? null;
          return this.render();
        }
        this.confirmSalvage = null;
        return this.apply(salvage(save, id ?? ''), false);
      case 'reroll':
        return this.apply(reroll(save, id ?? '', Number(target.dataset.sub)));
      case 'transfer':
        return this.apply(transfer(save, id ?? '', target.dataset.to ?? ''));
      case 'skin':
        return this.update({ ...save, skins: { ...save.skins, [this.heroId]: id === 'default' ? null : (id ?? null) } });
    }
  }

  private render(): void {
    const save = this.deps.getSave();
    const hero = this.hero;
    const skin = save.skins[hero.id] ?? null;
    const level = heroLevel(save, hero.id);
    const unit = createHero({ ...hero, level, gear: heroGear(save, hero.id) });
    const levelCost = levelUpCost(level);
    const inTeam = save.team.includes(hero.id);
    const worn = save.equipped[hero.id] ?? {};
    const list = save.items
      .filter((i) => i.slot === this.slot && fitsClass(i, hero.heroClass))
      .sort((a, b) => itemScore(b) - itemScore(a));
    const current = itemById(save, worn[this.slot]);
    const selected = itemById(save, this.selected ?? undefined);

    this.sheet.innerHTML = `
        <header class="bag-head">
          <h2>กระเป๋า & อุปกรณ์</h2>
          <span class="wallet" aria-label="เงินที่มี"><span><i class="petal-ico"></i>${fmt(save.petals)}</span><span><i class="dust-ico"></i>${fmt(save.stardust)}</span></span>
          <button type="button" class="bag-close" data-act="close" aria-label="ปิด">✕</button>
        </header>
        <nav class="bag-heroes" aria-label="เลือกพัฟ">
          ${ROSTER.map((h) => {
            const s = save.skins[h.id];
            const bench = !save.team.includes(h.id);
            return `<button type="button" data-act="hero" data-id="${h.id}" class="${h.id === hero.id ? 'on' : ''} ${bench ? 'bench' : ''}" aria-label="${h.name}${bench ? ' (พัก)' : ''}">
              <img class="${s ? '' : portraitClass(h.species, h.heroClass)}" src="${s ? skinPortrait(s) : portraitUrl(h.species, h.heroClass)}" alt="">${bench ? '<i>พัก</i>' : ''}</button>`;
          }).join('')}
        </nav>
        <p class="bag-team-count">ในทีม ${save.team.length}/${TEAM_SIZE} · แตะพัฟแล้วกด "ลงทีม / พัก" เพื่อสลับ</p>
        <div class="bag-hero">
          <img class="bag-face ${skin ? '' : portraitClass(hero.species, hero.heroClass)}" src="${skin ? skinPortrait(skin) : portraitUrl(hero.species, hero.heroClass)}" alt="${hero.name}">
          <div class="bag-stats">
            <strong>${hero.name} <small>Lv.${level}</small></strong>
            <span>HP ${unit.stats.maxHp.toLocaleString('en-US')}</span><span>ATK ${unit.stats.atk.toLocaleString('en-US')}</span>
            <span>DEF ${unit.stats.def}</span><span>คริ ${(unit.stats.crit * 100).toFixed(0)}%</span>
            <span>ชาร์จอัลติ ×${unit.chargeRate.toFixed(2)}</span><span>ตีทุก ${(unit.stats.attackInterval / 1000).toFixed(2)} วิ</span>
          </div>
        </div>
        <div class="bag-level">
          <button type="button" class="lv-btn" data-act="level" ${save.petals < levelCost ? 'disabled' : ''}>
            <span>อัปเลเวล → Lv.${level + 1}</span><small><i class="petal-ico"></i>${fmt(levelCost)}</small>
          </button>
          <button type="button" class="lv-team" data-act="level-team">อัปทั้งทีม</button>
          <button type="button" class="team-btn ${inTeam ? 'out' : 'in'}" data-act="team">${inTeam ? 'พัก' : 'ลงทีม'}</button>
        </div>
        ${lunchRow(save, hero.id, hero.species, this.pantryOpen)}
        ${this.pantryOpen ? pantryGrid(save, hero.id, hero.species) : ''}
        <div class="bag-slots">
          ${SLOTS.map((slot) => {
            const it = itemById(save, worn[slot]);
            return `<button type="button" data-act="slot" data-id="${slot}" class="slot ${slot === this.slot ? 'on' : ''}" aria-label="${SLOT_LABEL[slot]}">
              ${it ? tile(it) : `<svg viewBox="0 0 24 24" aria-hidden="true">${SLOT_ICON[slot]}</svg>`}<em>${SLOT_LABEL[slot]}</em></button>`;
          }).join('')}
        </div>
        <div class="bag-skins" aria-label="สกิน">
          <span>สกิน</span>
          <button type="button" data-act="skin" data-id="default" class="${!skin ? 'on' : ''}"><img class="${portraitClass(hero.species, hero.heroClass)}" src="${portraitUrl(hero.species, hero.heroClass)}" alt="ชุดปกติ"></button>
          ${SKINS.filter((s) => s.heroId === hero.id && save.ownedSkins.includes(s.id))
            .map((s) => `<button type="button" data-act="skin" data-id="${s.id}" class="${skin === s.id ? 'on' : ''} ${s.rarity.toLowerCase()}" title="${s.name}"><img src="${skinPortrait(s.id)}" alt="${s.name}"></button>`)
            .join('')}
        </div>
        <div class="bag-actions">
          <button type="button" data-act="best">ใส่ของดีที่สุด</button>
          <button type="button" data-act="best-all">ทั้งทีม</button>
          <button type="button" class="auto-merge" data-act="auto-merge">รวมอัตโนมัติ</button>
          <small>มีผลตั้งแต่ด่านถัดไป</small>
        </div>
        <p class="bag-toast ${this.toast?.ok ? 'ok' : 'bad'}" aria-live="polite">${this.toast?.text ?? ''}</p>
        ${selected ? itemDetail(selected, { save, heroId: hero.id, current, confirmSalvage: this.confirmSalvage }) : ''}
        <div class="bag-grid" aria-label="${SLOT_LABEL[this.slot]}ในกระเป๋า">
          ${list.length ? list.map((it) => `<button type="button" data-act="item" data-id="${it.id}" class="cell ${it.id === this.selected ? 'on' : ''} ${wornBy(save, it.id) ? 'worn' : ''}">${tile(it)}</button>`).join('') : '<p class="empty">ยังไม่มีของช่องนี้ — ผ่านด่านเพื่อรับของ</p>'}
        </div>
`;
  }
}
