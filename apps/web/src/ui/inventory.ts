// Bag & equipment screen: pick a puff, see its gear and stats, equip items, choose a skin.
import { SLOTS, createHero, fitsClass, itemScore, type Item, type Slot } from '@puff/sim';
import { TEAM, portraitUrl } from '../assets';
import { RELIC_INFO, SKINS, SLOT_LABEL, TIER_COLOR, formatStat, frameIcon, itemIcon, itemName, skinPortrait, tierLabel } from '../meta/itemInfo';
import { equip, equipBest, heroGear, itemById, unequip, wornBy, type SaveData } from '../meta/save';

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
  private heroId = TEAM[0]?.id ?? '';
  private slot: Slot = 'weapon';
  private selected: string | null = null;

  constructor(
    root: HTMLElement,
    private readonly deps: InventoryDeps,
  ) {
    this.el = document.createElement('section');
    this.el.className = 'bag-panel';
    this.el.hidden = true;
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'กระเป๋าและอุปกรณ์');
    root.appendChild(this.el);
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  open(): void {
    this.el.hidden = false;
    this.render();
  }

  close(): void {
    this.el.hidden = true;
  }

  private get hero() {
    return TEAM.find((h) => h.id === this.heroId) ?? TEAM[0]!;
  }

  private update(save: SaveData): void {
    this.deps.setSave(save);
    this.render();
  }

  private onClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!target) return;
    this.deps.onClick();
    const { act, id } = target.dataset;
    const save = this.deps.getSave();
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
        return this.update(TEAM.reduce((s, h) => equipBest(s, h.id, h.heroClass), save));
      case 'skin':
        return this.update({ ...save, skins: { ...save.skins, [this.heroId]: id === 'default' ? null : (id ?? null) } });
    }
  }

  private render(): void {
    const save = this.deps.getSave();
    const hero = this.hero;
    const skin = save.skins[hero.id] ?? null;
    const unit = createHero({ ...hero, level: save.teamLevel, gear: heroGear(save, hero.id) });
    const worn = save.equipped[hero.id] ?? {};
    const list = save.items
      .filter((i) => i.slot === this.slot && fitsClass(i, hero.heroClass))
      .sort((a, b) => itemScore(b) - itemScore(a));
    const current = itemById(save, worn[this.slot]);
    const selected = itemById(save, this.selected ?? undefined);

    this.el.innerHTML = `
      <div class="bag-sheet">
        <header class="bag-head">
          <h2>กระเป๋า & อุปกรณ์</h2>
          <button type="button" class="bag-close" data-act="close" aria-label="ปิด">✕</button>
        </header>
        <nav class="bag-heroes" aria-label="เลือกพัฟ">
          ${TEAM.map((h) => {
            const s = save.skins[h.id];
            return `<button type="button" data-act="hero" data-id="${h.id}" class="${h.id === hero.id ? 'on' : ''}" aria-label="${h.name}">
              <img src="${s ? skinPortrait(s) : portraitUrl(h.species, h.heroClass)}" alt=""></button>`;
          }).join('')}
        </nav>
        <div class="bag-hero">
          <img class="bag-face" src="${skin ? skinPortrait(skin) : portraitUrl(hero.species, hero.heroClass)}" alt="${hero.name}">
          <div class="bag-stats">
            <strong>${hero.name} <small>Lv.${save.teamLevel}</small></strong>
            <span>HP ${unit.stats.maxHp.toLocaleString('en-US')}</span><span>ATK ${unit.stats.atk.toLocaleString('en-US')}</span>
            <span>DEF ${unit.stats.def}</span><span>คริ ${(unit.stats.crit * 100).toFixed(0)}%</span>
            <span>ชาร์จอัลติ ×${unit.chargeRate.toFixed(2)}</span><span>ตีทุก ${(unit.stats.attackInterval / 1000).toFixed(2)} วิ</span>
          </div>
        </div>
        <div class="bag-slots">
          ${SLOTS.map((slot) => {
            const it = itemById(save, worn[slot]);
            return `<button type="button" data-act="slot" data-id="${slot}" class="slot ${slot === this.slot ? 'on' : ''}" aria-label="${SLOT_LABEL[slot]}">
              ${it ? tile(it) : `<svg viewBox="0 0 24 24" aria-hidden="true">${SLOT_ICON[slot]}</svg>`}<em>${SLOT_LABEL[slot]}</em></button>`;
          }).join('')}
        </div>
        <div class="bag-skins" aria-label="สกิน">
          <span>สกิน</span>
          <button type="button" data-act="skin" data-id="default" class="${!skin ? 'on' : ''}"><img src="${portraitUrl(hero.species, hero.heroClass)}" alt="ชุดปกติ"></button>
          ${SKINS.filter((s) => s.heroId === hero.id && save.ownedSkins.includes(s.id))
            .map((s) => `<button type="button" data-act="skin" data-id="${s.id}" class="${skin === s.id ? 'on' : ''} ${s.rarity.toLowerCase()}" title="${s.name}"><img src="${skinPortrait(s.id)}" alt="${s.name}"></button>`)
            .join('')}
        </div>
        <div class="bag-actions">
          <button type="button" data-act="best">ใส่ของดีที่สุด</button>
          <button type="button" data-act="best-all">ทั้งทีม</button>
          <small>มีผลตั้งแต่ด่านถัดไป</small>
        </div>
        ${selected ? detail(selected, current, save, hero.id) : ''}
        <div class="bag-grid" aria-label="${SLOT_LABEL[this.slot]}ในกระเป๋า">
          ${list.length ? list.map((it) => `<button type="button" data-act="item" data-id="${it.id}" class="cell ${it.id === this.selected ? 'on' : ''} ${wornBy(save, it.id) ? 'worn' : ''}">${tile(it)}</button>`).join('') : '<p class="empty">ยังไม่มีของช่องนี้ — ผ่านด่านเพื่อรับของ</p>'}
        </div>
      </div>`;
  }
}

function tile(item: Item): string {
  return `<span class="tile ${item.relic ? 'relic' : ''}" style="--tier:${TIER_COLOR[item.tier]}"><img class="frame" src="${frameIcon(item.tier)}" alt=""><img class="icon" src="${itemIcon(item)}" alt="${itemName(item)}"></span>`;
}

function detail(item: Item, current: Item | undefined, save: SaveData, heroId: string): string {
  const delta = itemScore(item) - (current ? itemScore(current) : 0);
  const owner = wornBy(save, item.id);
  const ownerName = owner ? TEAM.find((h) => h.id === owner)?.name : undefined;
  const isMine = owner === heroId;
  return `
    <div class="bag-detail" style="--tier:${TIER_COLOR[item.tier]}">
      ${tile(item)}
      <div class="info">
        <strong>${itemName(item)}</strong>
        <span class="tier">${tierLabel(item.tier)}${item.relic ? ' · ของแรร์' : ''}</span>
        <span class="main">${formatStat(item.main.stat, item.main.value)}</span>
        ${item.subs.map((s) => `<span>${formatStat(s.stat, s.value)}</span>`).join('')}
        ${item.relic ? `<span class="relic-fx">${RELIC_INFO[item.relic].effect}</span>` : ''}
        ${!isMine ? `<span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲ ดีกว่าของที่ใส่อยู่' : '▼ ด้อยกว่าของที่ใส่อยู่'}</span>` : ''}
        ${ownerName && !isMine ? `<small>ใส่อยู่ที่ ${ownerName}</small>` : ''}
      </div>
      ${isMine ? '<button type="button" data-act="unequip">ถอด</button>' : `<button type="button" data-act="equip" data-id="${item.id}">ใส่</button>`}
    </div>`;
}
