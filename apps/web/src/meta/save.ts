// Player progress kept in this browser (prototype save; a server save comes later).
import {
  GARDEN,
  SLOTS,
  STARTER_PUFFS,
  freshPity,
  type CapsulePity,
  type DailyState,
  type FishLog,
  createRng,
  fitsClass,
  gearBonus,
  itemScore,
  recommendedLevel,
  rollItem,
  type GearBonus,
  type HeroClass,
  type IngredientId,
  type Item,
  type MealReaction,
  type NapReward,
  type Plot,
  type SeedKind,
  type Slot,
} from '@puff/sim';
import { DEFAULT_TEAM, ROSTER, TEAM_SIZE, heroDef, type HeroDef } from '../assets';
import { SKINS } from './itemInfo';

const SAVE_KEY = 'puff.save.v1';

export interface PondSave {
  /** Fishdex: fish id → how many caught, biggest size */
  readonly log: FishLog;
  readonly scales: number;
  /** bench puffs fishing on their own */
  readonly anglers: readonly string[];
  /** when auto-fish was last collected */
  readonly autoSince: number;
  /** pond-shop week and what was bought from it this week (item id → count) */
  readonly shopWeek: number;
  readonly bought: Readonly<Record<string, number>>;
}

export interface ArenaSave {
  readonly points: number;
  readonly honor: number;
  /** day index the tickets belong to, and fights used that day */
  readonly day: number;
  readonly used: number;
  readonly wins: number;
  readonly losses: number;
  /** seed of the rivals on offer (a new trio after every fight) */
  readonly seed: number;
}

export interface RaidSave {
  readonly week: number;
  /** share (0..1) of this week's boss pool already knocked off */
  readonly dealt: number;
  readonly day: number;
  readonly used: number;
  /** milestone chests already paid out this week */
  readonly claimed: number;
}

export interface SaveData {
  readonly v: 4;
  readonly stage: number;
  /** ids of the puffs that fight (up to TEAM_SIZE, in roster order); the rest sit on the bench */
  readonly team: readonly string[];
  /** heroId → level (raised with Petals) */
  readonly levels: Readonly<Record<string, number>>;
  readonly petals: number;
  readonly stardust: number;
  /** when the game was last seen running (ms since epoch), for the Nap Bank */
  readonly lastSeen: number;
  /** nap rewards waiting for the player to tap "collect" */
  readonly pendingNap: NapReward | null;
  readonly items: readonly Item[];
  /** heroId → slot → item id */
  readonly equipped: Readonly<Record<string, Partial<Record<Slot, string>>>>;
  /** heroId → chosen skin id (null = default look) */
  readonly skins: Readonly<Record<string, string | null>>;
  readonly ownedSkins: readonly string[];
  /** giant clears since the last relic */
  readonly relicPity: number;
  readonly nextId: number;
  /** foraged ingredients → how many */
  readonly pantry: Readonly<Partial<Record<IngredientId, number>>>;
  /** heroId → the ingredient it eats before each stage (while any are left) */
  readonly lunch: Readonly<Record<string, IngredientId | null>>;
  /** "species:ingredient" → what happened when it was fed (the food journal) */
  readonly foodLog: Readonly<Record<string, MealReaction>>;
  /** World-Waking Garden: seeds in the pouch, the plots, and blooms picked so far */
  readonly seeds: Readonly<Partial<Record<SeedKind, number>>>;
  readonly plots: readonly (Plot | null)[];
  readonly blooms: Readonly<Partial<Record<SeedKind, number>>>;
  /** Puff Album: which puffs are yours, their star-ups and spare shards */
  readonly owned: readonly string[];
  readonly stars: Readonly<Record<string, number>>;
  readonly shards: Readonly<Record<string, number>>;
  /** Dew Drops (Puff Capsule currency) and the capsule's pity counters */
  readonly dew: number;
  readonly pity: CapsulePity;
  /** day index of the last free daily capsule */
  readonly freePullDay: number;
  readonly daily: DailyState | null;
  readonly pond: PondSave;
  readonly arena: ArenaSave;
  readonly raid: RaidSave;
  /** the story intro has been shown */
  readonly intro: boolean;
}

export const foodKey = (species: string, id: IngredientId): string => `${species}:${id}`;

/** Fields added in save v4 (phases 3–5), for new saves and migrations. */
function v4Fields(): Pick<SaveData, 'owned' | 'stars' | 'shards' | 'dew' | 'pity' | 'freePullDay' | 'daily' | 'pond' | 'arena' | 'raid' | 'intro'> {
  return {
    owned: STARTER_PUFFS,
    stars: {},
    shards: {},
    // enough for a first 3 capsules, so the machine can be tried right away
    dew: 300,
    pity: freshPity(),
    freePullDay: -1,
    daily: null,
    pond: { log: {}, scales: 0, anglers: [], autoSince: Date.now(), shopWeek: -1, bought: {} },
    arena: { points: 0, honor: 0, day: -1, used: 0, wins: 0, losses: 0, seed: Date.now() >>> 0 },
    raid: { week: -1, dealt: 0, day: -1, used: 0, claimed: 0 },
    intro: false,
  };
}

function starterSave(): SaveData {
  const rng = createRng(Date.now() >>> 0);
  let n = 0;
  const items: Item[] = [];
  const equipped: Record<string, Partial<Record<Slot, string>>> = {};
  for (const hero of ROSTER.filter((h) => STARTER_PUFFS.includes(h.id))) {
    const weapon = rollItem(rng, `i${n++}`, { tier: 0, slot: 'weapon', heroClass: hero.heroClass });
    items.push(weapon);
    equipped[hero.id] = { weapon: weapon.id };
  }
  // a few spares so the bag isn't empty on day one
  for (const slot of ['hat', 'outfit', 'charm', 'trinket', 'hat', 'outfit'] as const) items.push(rollItem(rng, `i${n++}`, { tier: rng.next() < 0.5 ? 0 : 1, slot }));
  return {
    ...v4Fields(),
    v: 4,
    stage: 1,
    team: DEFAULT_TEAM,
    levels: Object.fromEntries(STARTER_PUFFS.map((id) => [id, recommendedLevel(1)])),
    petals: 0,
    stardust: 0,
    lastSeen: Date.now(),
    pendingNap: null,
    items,
    equipped,
    skins: {},
    // prototype: every skin is unlocked so they can be tried out
    ownedSkins: SKINS.map((s) => s.id),
    relicPity: 0,
    nextId: n,
    // a first handful to try the picnic with (grapes teach that dogs can't have them)
    pantry: { 'sweet-clover': 2, 'sunny-carrot': 2, 'sunflower-seeds': 2, 'wild-grapes': 1 },
    lunch: {},
    foodLog: {},
    // a daisy seed to plant on day one
    seeds: { daisy: 2 },
    plots: emptyPlots(),
    blooms: {},
  };
}

const emptyPlots = (): (Plot | null)[] => Array.from({ length: GARDEN.startPlots }, () => null);

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as SaveData | SaveV3 | SaveV2 | SaveV1;
      if (data && Array.isArray(data.items)) {
        if (data.v === 4) return withRoster({ ...v4Fields(), ...data });
        // older saves already met the story, so they skip the intro
        if (data.v === 3) return withRoster({ ...v4Fields(), ...data, v: 4, intro: true });
        const fresh = { team: DEFAULT_TEAM, pantry: {}, lunch: {}, foodLog: {}, seeds: {}, plots: emptyPlots(), blooms: {} };
        if (data.v === 2) return withRoster({ ...v4Fields(), ...data, v: 4, ...fresh, intro: true });
        if (data.v === 1) return withRoster({ ...v4Fields(), ...migrateV1(data), v: 4, ...fresh, intro: true });
      }
    }
  } catch {
    // unreadable or blocked storage: start fresh
  }
  return starterSave();
}

/** Third format: every puff was owned; no album, capsule, quests, pond, arena or raid. */
type SaveV3 = Omit<SaveData, 'v' | keyof ReturnType<typeof v4Fields>> & { readonly v: 3 };
/** Second format: no roster (the same six always fought). */
type SaveV2 = Omit<SaveV3, 'v' | 'team' | 'pantry' | 'lunch' | 'foodLog' | 'seeds' | 'plots' | 'blooms'> & { readonly v: 2 };
/** First format: one shared team level, no Stardust or nap clock. */
type SaveV1 = Omit<SaveV2, 'v' | 'levels' | 'stardust' | 'lastSeen' | 'pendingNap'> & { readonly v: 1; readonly teamLevel: number };

function migrateV1(old: SaveV1): SaveV2 {
  const { teamLevel: shared, v: _v, ...rest } = old;
  return { ...rest, v: 2, levels: Object.fromEntries(DEFAULT_TEAM.map((id) => [id, shared])), stardust: 0, lastSeen: Date.now(), pendingNap: null };
}

/**
 * Makes sure every owned puff exists in the save: a puff that joined after this save was made
 * starts at the team's level with a Crumb weapon, and the team list only holds owned ids.
 */
function withRoster(save: SaveData): SaveData {
  const known = new Set(ROSTER.map((h) => h.id));
  const owned = [...new Set([...STARTER_PUFFS, ...(save.owned ?? [])])].filter((id) => known.has(id));
  const team = save.team.filter((id) => owned.includes(id)).slice(0, TEAM_SIZE);
  let next: SaveData = {
    ...save,
    owned,
    team: team.length ? team : DEFAULT_TEAM,
    pantry: save.pantry ?? {},
    lunch: save.lunch ?? {},
    foodLog: save.foodLog ?? {},
    seeds: save.seeds ?? {},
    plots: save.plots ?? emptyPlots(),
    blooms: save.blooms ?? {},
  };
  for (const id of owned) next = welcomePuff(next, id);
  return next;
}

/** A newly owned puff joins at the team's level with a Crumb weapon for its class (if the bag has none). */
export function welcomePuff(save: SaveData, heroId: string): SaveData {
  const hero = heroDef(heroId);
  if (!hero) return save;
  let next: SaveData = save.owned.includes(heroId) ? save : { ...save, owned: [...save.owned, heroId] };
  if (next.levels[heroId] === undefined) next = { ...next, levels: { ...next.levels, [heroId]: teamLevel(next) } };
  if (!next.equipped[heroId]?.weapon && !next.items.some((i) => i.slot === 'weapon' && i.heroClass === hero.heroClass && !wornBy(next, i.id))) {
    const rng = createRng((Date.now() ^ next.nextId * 0x9e3779b1) >>> 0);
    const weapon = rollItem(rng, `i${next.nextId}`, { tier: 0, slot: 'weapon', heroClass: hero.heroClass });
    next = { ...next, items: [...next.items, weapon], nextId: next.nextId + 1, equipped: { ...next.equipped, [heroId]: { ...next.equipped[heroId], weapon: weapon.id } } };
  }
  return next;
}

/** Every puff the player has, in album order. */
export const ownedRoster = (save: SaveData): HeroDef[] => ROSTER.filter((h) => save.owned.includes(h.id));

/** The puffs that fight, in roster order. */
export const activeTeam = (save: SaveData): HeroDef[] => ROSTER.filter((h) => save.team.includes(h.id));

export const heroLevel = (save: SaveData, heroId: string): number => save.levels[heroId] ?? recommendedLevel(1);

/** Shown as "ทีม Lv." in the HUD: the average of the puffs that fight, rounded down. */
export function teamLevel(save: SaveData): number {
  const team = activeTeam(save);
  return team.length ? Math.floor(team.reduce((sum, h) => sum + heroLevel(save, h.id), 0) / team.length) : recommendedLevel(1);
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

/** New loot fills empty slots automatically so fresh drops are felt right away (fighters first, then the bench). */
export function autoEquipEmpty(save: SaveData, items: readonly Item[]): SaveData {
  let next = save;
  const order = [...activeTeam(save), ...ownedRoster(save).filter((h) => !save.team.includes(h.id))];
  for (const item of items) {
    const hero = order.find((h) => fitsClass(item, h.heroClass) && !next.equipped[h.id]?.[item.slot]);
    if (hero) next = equip(next, hero.id, item);
  }
  return next;
}

/** Team-wide luck from gear (Lucky Clover Pin adds a flat bonus). */
export function teamLuck(save: SaveData): number {
  return activeTeam(save).reduce((sum, h) => {
    const g = heroGear(save, h.id);
    return sum + (g.stats.luck ?? 0) + (g.relics.includes('lucky-clover-pin') ? 0.15 : 0);
  }, 0);
}
