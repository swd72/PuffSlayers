// Idle battles are watched without touching the screen, so phones would dim and lock mid-fight.
// NoSleep uses the Screen Wake Lock API where it exists (HTTPS / localhost) and otherwise a tiny
// muted looping video, which also works when the game is opened over the LAN (plain http).
// Both need a tap first, so every tap re-arms it (the lock is dropped whenever the tab is hidden).
import NoSleep from 'nosleep.js';

export function keepScreenAwake(): void {
  const noSleep = new NoSleep();
  if (import.meta.env.DEV) (window as unknown as { __noSleep: unknown }).__noSleep = noSleep;
  const arm = () => {
    if (!noSleep.isEnabled) noSleep.enable().catch(() => undefined);
  };
  window.addEventListener('pointerdown', arm);
  window.addEventListener('keydown', arm);
  document.addEventListener('visibilitychange', () => {
    // coming back: the wake lock can be taken again without a tap in most browsers
    if (document.visibilityState === 'visible' && noSleep.isEnabled) {
      noSleep.disable();
      arm();
    }
  });
}
