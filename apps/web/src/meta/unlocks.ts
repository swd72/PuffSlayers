// When each village building opens. Unlocking as the story moves forward gives every few stages
// something new to look forward to (and keeps day one simple).
import type { SaveData } from './save';

export type Feature = 'garden' | 'board' | 'album' | 'pond' | 'arena' | 'raid';

/** Stages cleared before a building opens. */
export const UNLOCK_AT: Record<Feature, number> = {
  garden: 0,
  board: 0,
  album: 1,
  pond: 2,
  arena: 3,
  raid: 5,
};

/** `?dev` in the URL (or localStorage puff.dev = 1) opens everything for testing. */
const devUnlock = (() => {
  try {
    return new URLSearchParams(location.search).has('dev') || localStorage.getItem('puff.dev') === '1';
  } catch {
    return false;
  }
})();

export const clearedStages = (save: SaveData): number => save.stage - 1;
export const isOpen = (save: SaveData, feature: Feature): boolean => devUnlock || clearedStages(save) >= UNLOCK_AT[feature];
export const unlockText = (feature: Feature): string => `ผ่านด่าน 1-${UNLOCK_AT[feature]} เพื่อเปิด`;
/** Short form for the map label. */
export const unlockShort = (feature: Feature): string => `เปิดหลังด่าน 1-${UNLOCK_AT[feature]}`;
