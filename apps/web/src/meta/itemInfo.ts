// Display data for items and skins: names, icons, tier colors, stat labels.
import { hasSheet } from '../assets';
import { INGREDIENT_IDS, TIERS, type HeroClass, type IngredientId, type Item, type MealReaction, type RelicId, type Slot, type StatKey, type Tier } from '@puff/sim';

const ROOT = '/sprites/v2';

export const TIER_LABEL: Record<(typeof TIERS)[number], string> = {
  crumb: 'Crumb',
  fluffy: 'Fluffy',
  silky: 'Silky',
  dreamy: 'Dreamy',
  starry: 'Starry',
  mythic: 'Mythic Puff',
  cosmic: 'Cosmic Cotton',
};
export const TIER_COLOR = ['#d9cbb8', '#6cc7a0', '#7db8ea', '#a98bea', '#edb24e', '#ff8fb8', '#8b7bff'] as const;
export const tierLabel = (tier: Tier): string => TIER_LABEL[TIERS[tier]];

export const SLOT_LABEL: Record<Slot, string> = { weapon: 'อาวุธ', hat: 'หมวก', outfit: 'ชุด', charm: 'ตุ๊กตาพกพา', trinket: 'ของเสริม' };

const WEAPON_NAME: Record<HeroClass, string> = {
  'pillow-guard': 'โล่หมอน',
  'carrot-knight': 'ดาบแครอท',
  'leaf-archer': 'ธนูเถาวัลย์',
  'bubble-mage': 'ไม้กายสิทธิ์ฟอง',
  'mochi-cleric': 'คทาโมจิ',
  'bell-bard': 'กระดิ่ง',
  'root-druid': 'ไม้เท้ารากไม้',
};

const DESIGN_NAME: Record<Exclude<Slot, 'weapon'>, readonly string[]> = {
  hat: ['หมวกฝาหม้อ', 'ฮู้ดใบไม้', 'หมวกพ่อมดไอติม', 'มงกุฎดังโงะ', 'มงกุฎดอกไม้', 'หมวกไหมพรม', 'หมวกซามูไร', 'มงกุฎดาว'],
  outfit: ['เกราะนวม', 'ชุดนอนหมี', 'ผ้ากันเปื้อนปิกนิก', 'เสื้อคลุมดวงดาว', 'เสื้อคลุมเทศกาล', 'ผ้าคลุมใบไม้', 'เกราะซามูไร', 'เสื้อคลุมเมฆ'],
  charm: ['ตุ๊กตาหมี', 'เข็มกลัดโคลเวอร์', 'ผ้าพันคอถัก', 'จี้พระจันทร์', 'ถุงเมล็ด', 'พวงกุญแจกระดิ่ง', 'ล็อกเก็ตดาว', 'โถน้ำผึ้ง'],
  trinket: ['ลูกโอ๊ก', 'ก้อนหินยิ้ม', 'ขนนก', 'ลูกอม', 'กระดุมรุ้ง', 'เปลือกหอย', 'ลูกแก้ว', 'กุญแจจิ๋ว'],
};

export const RELIC_INFO: Record<RelicId, { name: string; effect: string }> = {
  'carrot-excalibur': { name: 'Carrot Excalibur', effect: 'Carrot Crescent แรงขึ้น 60%' },
  'bottomless-cheek-pouch': { name: 'Bottomless Cheek Pouch', effect: 'Cheek Cannon พ่น 5 เมล็ด (Hamham)' },
  'grandmas-knitted-scarf': { name: "Grandma's Knitted Scarf", effect: 'ฟื้นจากงีบ 1 ครั้งต่อการต่อสู้' },
  'moonlit-lullaby-bell': { name: 'Moonlit Lullaby Bell', effect: 'ท่าไม้ตาย Bard ทำให้ศัตรูรอบตัวหลับ' },
  'sunflower-crown': { name: 'Sunflower Crown', effect: 'ทีมฟื้น 15% HP ทุกคลื่นใหม่' },
  'lucky-clover-pin': { name: 'Lucky Clover Pin', effect: 'โอกาสได้ของดีขึ้น' },
};

export const STAT_LABEL: Record<StatKey, string> = {
  atkPct: 'ATK',
  hpPct: 'HP',
  defPct: 'DEF',
  crit: 'คริ',
  dodge: 'หลบ',
  haste: 'ความเร็วตี',
  charge: 'ชาร์จอัลติ',
  luck: 'โชค',
};

export const formatStat = (stat: StatKey, value: number): string => `${STAT_LABEL[stat]} +${(value * 100).toFixed(1)}%`;

export function itemName(item: Item): string {
  if (item.relic) return RELIC_INFO[item.relic].name;
  if (item.slot === 'weapon') return `${WEAPON_NAME[item.heroClass ?? 'carrot-knight']} ${tierLabel(item.tier)}`;
  return DESIGN_NAME[item.slot][item.design % 8] ?? SLOT_LABEL[item.slot];
}

export function itemIcon(item: Item): string {
  if (item.relic) return `${ROOT}/relic/${item.relic}-0.png`;
  if (item.slot === 'weapon') {
    // classes whose weapon icons aren't generated yet borrow the cleric's staff
    const cls = item.heroClass && hasSheet(`item/weapon-${item.heroClass}`) ? item.heroClass : 'mochi-cleric';
    return `${ROOT}/item/weapon-${cls}-${item.tier}.png`;
  }
  return `${ROOT}/item/${item.slot}-${item.design % 8}.png`;
}

export const frameIcon = (tier: Tier): string => `${ROOT}/item/frame-${tier}.png`;

// ---------- skins ----------

export interface SkinInfo {
  readonly id: string;
  readonly heroId: string;
  readonly name: string;
  readonly rarity: 'Rare' | 'Legendary';
}

export const SKINS: readonly SkinInfo[] = [
  { id: 'pajama-pudding', heroId: 'pudding', name: 'Pajama Pudding', rarity: 'Rare' },
  { id: 'pumpkin-knight-tofu', heroId: 'tofu', name: 'Pumpkin Knight', rarity: 'Rare' },
  { id: 'rainbow-ranger-usagi', heroId: 'usagi', name: 'Rainbow Ranger', rarity: 'Rare' },
  { id: 'snow-globe-kinako', heroId: 'kinako', name: 'Snow Globe', rarity: 'Rare' },
  { id: 'sakura-festival-momo', heroId: 'momo', name: 'Sakura Festival', rarity: 'Rare' },
  { id: 'bear-king-mimi', heroId: 'mimi', name: 'Bear King', rarity: 'Legendary' },
];

export const skinPortrait = (skinId: string): string => `${ROOT}/portrait/skin-${skinId}.png`;

// ---------- ingredients (picnic) ----------

export const INGREDIENT_INFO: Record<IngredientId, { name: string; desc: string }> = {
  'sweet-clover': { name: 'โคลเวอร์หวาน', desc: 'ใบกลมหอมหวาน กินแล้วอิ่มท้อง' },
  dandelion: { name: 'แดนดิไลออน', desc: 'เบาเหมือนปุยขน กินแล้วตัวเบา' },
  'sunny-carrot': { name: 'แครอทแดดอุ่น', desc: 'กรอบ หวาน ตาไวขึ้น' },
  'sweet-potato': { name: 'มันหวานเผา', desc: 'อุ่นๆ หอมๆ มีแรงสู้' },
  'sunflower-seeds': { name: 'เมล็ดทานตะวัน', desc: 'ของโปรดคนแก้มป่อง นำโชค' },
  'crunchy-acorn': { name: 'ลูกโอ๊กกรอบ', desc: 'เปลือกแข็ง กินแล้วตัวแกร่ง — แต่ไม่ใช่ทุกคนกินได้' },
  'bitter-almond': { name: 'อัลมอนด์ขม', desc: 'ขมนิดๆ ทนทาน — บางเผ่าห้ามกิน' },
  'wild-grapes': { name: 'องุ่นป่า', desc: 'ฉ่ำน้ำ ขยับไวขึ้น — แต่บางเผ่าห้ามกินเด็ดขาด' },
  'lemon-drop': { name: 'มะนาวหยดน้ำผึ้ง', desc: 'เปรี้ยวจี๊ด ชาร์จพลังไว — เปรี้ยวเกินไปสำหรับบางคน' },
  'forest-avocado': { name: 'อะโวคาโดป่า', desc: 'มันเยอะ บำรุงดี — บางเผ่ากินแล้วป่วย' },
  'wild-onion': { name: 'หัวหอมป่า', desc: 'ฉุนแรง พลังพุ่ง — สัตว์ส่วนใหญ่ห้ามกิน!' },
  'cocoa-pod': { name: 'ฝักโกโก้', desc: 'หอมช็อกโกแลต... พัฟไม่ควรกินเลย เก็บไว้ขายดีกว่า' },
  'glow-mushroom': { name: 'เห็ดเรืองแสง', desc: 'เห็ดหายากใต้ดิน ชาร์จพลังแรง — เห็ดป่าอันตรายสำหรับบางคน' },
  honeycomb: { name: 'รวงผึ้ง', desc: 'หวานเยิ้ม ฟื้นแรงและเร่งมือ' },
  'wiggle-worm': { name: 'ไส้เดือนดุ๊กดิ๊ก', desc: 'อาหารโปรดของตุ่น คนอื่นไม่แตะ' },
  'moon-berry': { name: 'เบอร์รี่แสงจันทร์', desc: 'ผลไม้ในตำนาน เก่งขึ้นทุกด้าน' },
};

export const REACTION_LABEL: Record<MealReaction, string> = {
  favorite: 'ชอบมาก! ×2',
  good: 'กินได้',
  refuse: 'ไม่ยอมกิน',
  tummyache: 'ปวดท้อง!',
};

/** Icon from the generated 4×4 ingredient sheet, if it exists yet (order = INGREDIENT_IDS). */
export function ingredientIcon(id: IngredientId): string | null {
  const index = INGREDIENT_IDS.indexOf(id);
  return hasSheet('item/ingredient') && index >= 0 ? `${ROOT}/item/ingredient-${index}.png` : null;
}

/** "ATK +8% · HP +5%" for a stat block (negative values show as −). */
export const formatStats = (stats: Partial<Record<StatKey, number>>): string =>
  Object.entries(stats)
    .map(([k, v]) => `${STAT_LABEL[k as StatKey]} ${(v ?? 0) >= 0 ? '+' : '−'}${Math.abs((v ?? 0) * 100).toFixed(0)}%`)
    .join(' · ');
