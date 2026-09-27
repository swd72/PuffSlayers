// Everything that makes a puff stronger outside its level: gear, rarity + stars (album),
// the garden's blooms and the Fishdex. Shown in the bag and used for every battle.
import { addStats, fishdexBonus, gardenBonus, puffBonus, puffInfo, type GearBonus } from '@puff/sim';
import { heroGear, type SaveData } from './save';

export function heroPower(save: SaveData, heroId: string): GearBonus {
  const gear = heroGear(save, heroId);
  const info = puffInfo(heroId);
  const album = info ? puffBonus(info.rarity, save.stars[heroId] ?? 0) : {};
  const stats = addStats(addStats(addStats(gear.stats, album), gardenBonus(save.blooms)), fishdexBonus(save.pond.log));
  return { ...gear, stats };
}
