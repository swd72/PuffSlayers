// Display data for items and skins: names, icons, tier colors, stat labels.
import { TIERS, type HeroClass, type Item, type RelicId, type Slot, type StatKey, type Tier } from '@puff/sim';

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
  if (item.slot === 'weapon') return `${ROOT}/item/weapon-${item.heroClass ?? 'carrot-knight'}-${item.tier}.png`;
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
