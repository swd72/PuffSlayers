// Selected-item card in the bag: stats, compare, and the forge buttons (upgrade, merge, salvage, reroll, move +N).
import { FORGE, itemScore, mainValue, maxPlus, plusOf, rerollCost, salvageValue, upgradeChance, upgradeCost, type Item } from '@puff/sim';
import { heroDef } from '../assets';
import { RELIC_INFO, TIER_COLOR, formatStat, frameIcon, itemIcon, itemName, tierLabel } from '../meta/itemInfo';
import { wornBy, type SaveData } from '../meta/save';
import { mergePartners, transferSource } from '../meta/workshop';

const fmt = (n: number): string => n.toLocaleString('en-US');

export function tile(item: Item): string {
  const plus = plusOf(item);
  return `<span class="tile ${item.relic ? 'relic' : ''}" style="--tier:${TIER_COLOR[item.tier]}"><img class="frame" src="${frameIcon(item.tier)}" alt=""><img class="icon" src="${itemIcon(item)}" alt="${itemName(item)}">${plus ? `<b class="plus">+${plus}</b>` : ''}</span>`;
}

export interface DetailContext {
  readonly save: SaveData;
  readonly heroId: string;
  readonly current: Item | undefined;
  /** item id waiting for a second tap to confirm salvage */
  readonly confirmSalvage: string | null;
}

export function itemDetail(item: Item, ctx: DetailContext): string {
  const { save, heroId, current } = ctx;
  const delta = itemScore(item) - (current ? itemScore(current) : 0);
  const owner = wornBy(save, item.id);
  const ownerName = owner ? heroDef(owner)?.name : undefined;
  const isMine = owner === heroId;
  const plus = plusOf(item);
  return `
    <div class="bag-detail" style="--tier:${TIER_COLOR[item.tier]}">
      <div class="detail-top">
        ${tile(item)}
        <div class="info">
          <strong>${itemName(item)}${plus ? ` <em class="plus-label">+${plus}</em>` : ''}</strong>
          <span class="tier">${tierLabel(item.tier)}${item.relic ? ' · ของแรร์' : ''} · ตีบวกสูงสุด +${maxPlus(item)}</span>
          <span class="main">${formatStat(item.main.stat, mainValue(item))}</span>
          ${item.subs.map((s, i) => subLine(item, i, formatStat(s.stat, s.value), save.stardust)).join('')}
          ${item.relic ? `<span class="relic-fx">${RELIC_INFO[item.relic].effect}</span>` : ''}
          ${!isMine ? `<span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲ ดีกว่าของที่ใส่อยู่' : '▼ ด้อยกว่าของที่ใส่อยู่'}</span>` : ''}
          ${ownerName && !isMine ? `<small>ใส่อยู่ที่ ${ownerName}</small>` : ''}
        </div>
        ${isMine ? '<button type="button" class="wear" data-act="unequip">ถอด</button>' : `<button type="button" class="wear" data-act="equip" data-id="${item.id}">ใส่</button>`}
      </div>
      <div class="forge">${forgeButtons(item, ctx, Boolean(owner))}</div>
    </div>`;
}

function subLine(item: Item, index: number, label: string, stardust: number): string {
  const cost = rerollCost(item);
  return `<span class="sub">${label}<button type="button" class="reroll" data-act="reroll" data-id="${item.id}" data-sub="${index}" ${stardust < cost ? 'disabled' : ''} aria-label="สุ่ม ${label} ใหม่ ใช้ Stardust ${cost}">↻ <i class="dust-ico"></i>${cost}</button></span>`;
}

function forgeButtons(item: Item, ctx: DetailContext, worn: boolean): string {
  const { save } = ctx;
  const buttons: string[] = [];

  const plus = plusOf(item);
  if (plus >= maxPlus(item)) {
    buttons.push('<button type="button" class="up-btn" disabled>ตีบวกเต็มแล้ว</button>');
  } else {
    const cost = upgradeCost(item);
    const short = save.petals < cost.petals || save.stardust < cost.stardust;
    const pity = item.forgePity ?? 0;
    buttons.push(`<button type="button" class="up-btn" data-act="upgrade" data-id="${item.id}" ${short ? 'disabled' : ''}>
      <span>ตีบวก +${plus + 1}</span>
      <small><i class="petal-ico"></i>${fmt(cost.petals)}${cost.stardust ? ` <i class="dust-ico"></i>${fmt(cost.stardust)}` : ''} · ${Math.round(upgradeChance(item) * 100)}%${pity ? ` · เกจ ${pity}` : ''}</small>
    </button>`);
  }

  const source = transferSource(save, ctx.heroId, item);
  if (source) {
    buttons.push(`<button type="button" class="move-btn" data-act="transfer" data-id="${source.id}" data-to="${item.id}"><span>ย้าย +${plusOf(source)} มาชิ้นนี้</span><small>ฟรี</small></button>`);
  }

  if (!item.relic && item.tier <= FORGE.maxMergeTier) {
    const partners = mergePartners(save, item).length;
    buttons.push(`<button type="button" class="merge-btn" data-act="merge" data-id="${item.id}" ${partners < 2 ? 'disabled' : ''}>
      <span>รวม 3 → ${tierLabel((item.tier + 1) as Item['tier'])}</span><small>มีคู่ ${Math.min(partners, 2)}/2</small></button>`);
  }

  if (!item.relic && !worn) {
    const confirming = ctx.confirmSalvage === item.id;
    buttons.push(`<button type="button" class="salvage-btn ${confirming ? 'confirm' : ''}" data-act="salvage" data-id="${item.id}">
      <span>${confirming ? 'แตะอีกครั้งเพื่อแยก' : 'แยก'}</span><small><i class="dust-ico"></i>+${salvageValue(item)}</small></button>`);
  }
  return buttons.join('');
}
