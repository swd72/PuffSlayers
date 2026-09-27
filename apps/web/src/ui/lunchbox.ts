// "มื้อก่อนลุย" in the bag: the puff's chosen ingredient, and the pantry to pick from.
// What an ingredient does to a species stays a "?" until some puff of that species has tried it.
import { INGREDIENTS, INGREDIENT_IDS, PANTRY, type IngredientId, type MealReaction, type Species } from '@puff/sim';
import { INGREDIENT_INFO, REACTION_LABEL, formatStats, ingredientIcon } from '../meta/itemInfo';
import { knownReaction, pantryCount } from '../meta/picnic';
import type { SaveData } from '../meta/save';

/** First two Thai letters with their vowel/tone marks (a stand-in until the icon sheet exists). */
const firstLetters = (name: string): string =>
  Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(name), (g) => g.segment)
    .slice(0, 2)
    .join('');

const REACTION_CLASS: Record<MealReaction, string> = { favorite: 'fav', good: 'ok', refuse: 'no', tummyache: 'bad' };

function icon(id: IngredientId): string {
  const url = ingredientIcon(id);
  return url
    ? `<img class="food-icon" src="${url}" alt="">`
    : `<span class="food-icon text rarity-${INGREDIENTS[id].rarity}">${firstLetters(INGREDIENT_INFO[id].name)}</span>`;
}

function reactionChip(save: SaveData, species: Species, id: IngredientId): string {
  const r = knownReaction(save, species, id);
  return r ? `<span class="react ${REACTION_CLASS[r]}">${REACTION_LABEL[r]}</span>` : '<span class="react unknown">ยังไม่เคยลอง ?</span>';
}

/** The lunch slot row under the hero stats. */
export function lunchRow(save: SaveData, heroId: string, species: Species, open: boolean): string {
  const id = save.lunch[heroId] ?? null;
  const left = id ? pantryCount(save, id) : 0;
  const slot = id
    ? `${icon(id)}<span class="lunch-name">${INGREDIENT_INFO[id].name} <small>เหลือ ${left}</small></span>${reactionChip(save, species, id)}`
    : '<span class="lunch-empty">ยังไม่ได้เลือกอาหาร</span>';
  return `
    <div class="bag-lunch ${left === 0 && id ? 'empty-stock' : ''}">
      <span class="lunch-label">มื้อก่อนลุย</span>
      <button type="button" class="lunch-slot" data-act="pantry" aria-expanded="${open}">${slot}<i aria-hidden="true">${open ? '▲' : '▼'}</i></button>
    </div>`;
}

/** Pantry grid: tap to feed, or sell spares for Petals. */
export function pantryGrid(save: SaveData, heroId: string, species: Species): string {
  const chosen = save.lunch[heroId] ?? null;
  const owned = INGREDIENT_IDS.filter((id) => pantryCount(save, id) > 0 || id === chosen);
  const cards = owned
    .map((id) => {
      const info = INGREDIENTS[id];
      return `
      <div class="food-card ${id === chosen ? 'on' : ''} rarity-${info.rarity}">
        <button type="button" class="food-pick" data-act="lunch" data-id="${id}" aria-label="ให้กิน${INGREDIENT_INFO[id].name}">
          ${icon(id)}
          <span class="food-text"><b>${INGREDIENT_INFO[id].name} <small>×${pantryCount(save, id)}</small></b>
          <span class="food-buff">${formatStats(info.buff)}</span>
          ${reactionChip(save, species, id)}</span>
        </button>
        <button type="button" class="food-sell" data-act="sell" data-id="${id}" ${pantryCount(save, id) ? '' : 'disabled'}>ขาย <i class="petal-ico"></i>${PANTRY.sellPetals[info.rarity]}</button>
      </div>`;
    })
    .join('');
  return `
    <div class="bag-pantry">
      <p class="pantry-hint">ของที่เก็บได้จากด่าน กินก่อนเข้าด่านแล้วได้บัฟ 1 ด่าน — แต่บางอย่าง<b>บางเผ่ากินไม่ได้</b> ลองแล้วจะจดไว้ให้</p>
      ${owned.length ? `<div class="food-grid">${cards}</div>` : '<p class="empty">ยังไม่มีวัตถุดิบ — ผ่านด่านเพื่อเก็บ</p>'}
      ${chosen ? '<button type="button" class="food-none" data-act="lunch" data-id="">ไม่ต้องกินอะไร</button>' : ''}
    </div>`;
}
