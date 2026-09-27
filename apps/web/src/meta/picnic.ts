// Picnic before each stage: every fighting puff eats its chosen ingredient (if any are left).
// Also: choosing lunches, selling ingredients, and adding forage drops to the pantry.
import { INGREDIENTS, PANTRY, mealEffect, type IngredientId, type MealEffect, type Species, type StatBlock } from '@puff/sim';
import { heroDef } from '../assets';
import { INGREDIENT_INFO } from './itemInfo';
import { activeTeam, foodKey, type SaveData } from './save';
import type { ActionResult } from './workshop';

export interface ServedMeal {
  readonly heroId: string;
  readonly ingredient: IngredientId;
  readonly effect: MealEffect;
}

export const pantryCount = (save: SaveData, id: IngredientId): number => save.pantry[id] ?? 0;

/** Feeds the fighting puffs before a stage: uses up what they eat and records what happened in the food journal. */
export function serveMeals(save: SaveData): { save: SaveData; meals: ServedMeal[] } {
  let next = save;
  const meals: ServedMeal[] = [];
  for (const hero of activeTeam(save)) {
    const id = next.lunch[hero.id];
    if (!id || pantryCount(next, id) <= 0) continue;
    const effect = mealEffect(id, hero.species);
    meals.push({ heroId: hero.id, ingredient: id, effect });
    next = {
      ...next,
      pantry: effect.eaten ? { ...next.pantry, [id]: pantryCount(next, id) - 1 } : next.pantry,
      foodLog: { ...next.foodLog, [foodKey(hero.species, id)]: effect.reaction },
    };
  }
  return { save: next, meals };
}

/** Stats a hero gets from this stage's meal. */
export const mealStats = (meals: readonly ServedMeal[], heroId: string): StatBlock => meals.find((m) => m.heroId === heroId)?.effect.stats ?? {};

export function setLunch(save: SaveData, heroId: string, id: IngredientId | null): ActionResult {
  const name = heroDef(heroId)?.name ?? heroId;
  return {
    save: { ...save, lunch: { ...save.lunch, [heroId]: id } },
    ok: true,
    message: id ? `${name} จะกิน${INGREDIENT_INFO[id].name}ก่อนด่านถัดไป` : `${name} ไม่กินอะไร`,
  };
}

export function sellIngredient(save: SaveData, id: IngredientId): ActionResult {
  if (pantryCount(save, id) <= 0) return { save, ok: false, message: 'ไม่มีของนี้แล้ว' };
  const petals = PANTRY.sellPetals[INGREDIENTS[id].rarity];
  return {
    save: { ...save, pantry: { ...save.pantry, [id]: pantryCount(save, id) - 1 }, petals: save.petals + petals },
    ok: true,
    message: `ขาย${INGREDIENT_INFO[id].name} ได้ ${petals} Petal`,
  };
}

export function addForage(save: SaveData, found: readonly IngredientId[]): SaveData {
  const pantry = { ...save.pantry };
  for (const id of found) pantry[id] = (pantry[id] ?? 0) + 1;
  return { ...save, pantry };
}

/** What the journal knows about feeding this ingredient to this species (undefined = never tried). */
export const knownReaction = (save: SaveData, species: Species, id: IngredientId) => save.foodLog[foodKey(species, id)];
