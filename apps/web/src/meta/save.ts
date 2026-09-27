// Player progress kept in this browser (prototype save; a server save comes later).
import {
  SLOTS,
  createRng,
  fitsClass,
  gearBonus,
  itemScore,
  recommendedLevel,
  rollItem,
  type GearBonus,
  type HeroClass,
  type Item,
  type Slot,
} from '@puff/sim';
import { TEAM } from '../assets';
import { SKINS } from './itemInfo';

const SAVE_KEY = 'puff.save.v1';

export interface SaveData {
  readonly v: 1;
  readonly stage: number;
  readonly teamLevel: number;
  readonly petals: number;
  readonly items: readonly Item[];
  /** heroId → slot → item id */
  readonly equipped: Readonly<Record<string, Partial<Record<Slot, string>>>>;
  /** heroId → chosen skin id (null = default look) */
  readonly skins: Readonly<Record<string, string | null>>;
  readonly ownedSkins: readonly string[];
  /** giant clears since the last relic */
  readonly relicPity: number;
  readonly nextId: number;
}

function starterSave(): SaveData {
  const rng = createRng(Date.now() >>> 0);
  let n = 0;
  const items: Item[] = [];
  const equipped: Record<string, Partial<Record<Slot, string>>> = {};
  for (const hero of TEAM) {
    const weapon = rollItem(rng, `i${n++}`, { tier: 0, slot: 'weapon', heroClass: hero.heroClass });
    items.push(weapon);
    equipped[hero.id] = { weapon: weapon.id };
  }
  // a few spares so the bag isn't empty on day one
  for (const slot of ['hat', 'outfit', 'charm', 'trinket', 'hat', 'outfit'] as const) items.push(rollItem(rng, `i${n++}`, { tier: rng.next() < 0.5 ? 0 : 1, slot }));
  return {
    v: 1,
    stage: 1,
    teamLevel: recommendedLevel(1),
    petals: 0,
    items,
    equipped,
    skins: {},
    // prototype: every skin is unlocked so they can be tried out
    ownedSkins: SKINS.map((s) => s.id),
    relicPity: 0,
    nextId: n,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as SaveData;
      if (data && data.v === 1 && Array.isArray(data.items)) return data;
    }
  } catch {
    // unreadable or blocked storage: start fresh
  }
  return starterSave();
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // storage full or blocked: progress stays for this session only
  }
}

export const itemById = (save: SaveData, id: string | undefined): Item | undefined => (id ? save.items.find((i) => i.id === id) : undefined);

export function equippedItems(save: SaveData, heroId: string): Item[] {
  return SLOTS.flatMap((slot) => {
    const item = itemById(save, save.equipped[heroId]?.[slot]);
    return item ? [item] : [];
  });
}

export const heroGear = (save: SaveData, heroId: string): GearBonus => gearBonus(equippedItems(save, heroId));

/** Which hero wears this item, if anyone. */
export function wornBy(save: SaveData, itemId: string): string | undefined {
  return Object.entries(save.equipped).find(([, slots]) => Object.values(slots).includes(itemId))?.[0];
}

/** Puts an item on a hero (taking it off whoever wore it). */
export function equip(save: SaveData, heroId: string, item: Item): SaveData {
  const equipped: Record<string, Partial<Record<Slot, string>>> = {};
  for (const [hid, slots] of Object.entries(save.equipped)) {
    equipped[hid] = Object.fromEntries(Object.entries(slots).filter(([, id]) => id !== item.id));
  }
  equipped[heroId] = { ...equipped[heroId], [item.slot]: item.id };
  return { ...save, equipped };
}

export function unequip(save: SaveData, heroId: string, slot: Slot): SaveData {
  const { [slot]: _removed, ...rest } = save.equipped[heroId] ?? {};
  return { ...save, equipped: { ...save.equipped, [heroId]: rest } };
}

/** Best free (or already own) item per slot for this hero. */
export function equipBest(save: SaveData, heroId: string, heroClass: HeroClass): SaveData {
  let next = save;
  for (const slot of SLOTS) {
    const candidates = next.items.filter((i) => i.slot === slot && fitsClass(i, heroClass) && (!wornBy(next, i.id) || wornBy(next, i.id) === heroId));
    const best = [...candidates].sort((a, b) => itemScore(b) - itemScore(a))[0];
    if (best) next = equip(next, heroId, best);
  }
  return next;
}

/** New loot fills empty slots automatically so fresh drops are felt right away. */
export function autoEquipEmpty(save: SaveData, items: readonly Item[]): SaveData {
  let next = save;
  for (const item of items) {
    const hero = TEAM.find((h) => fitsClass(item, h.heroClass) && !next.equipped[h.id]?.[item.slot]);
    if (hero) next = equip(next, hero.id, item);
  }
  return next;
}

/** Team-wide luck from gear (Lucky Clover Pin adds a flat bonus). */
export function teamLuck(save: SaveData): number {
  return TEAM.reduce((sum, h) => {
    const g = heroGear(save, h.id);
    return sum + (g.stats.luck ?? 0) + (g.relics.includes('lucky-clover-pin') ? 0.15 : 0);
  }, 0);
}
