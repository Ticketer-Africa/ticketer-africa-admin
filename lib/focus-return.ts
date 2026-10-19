/**
 * Remembers what had focus when an overlay opened and puts focus back when it
 * closes. Radix only restores focus to a Dialog.Trigger; overlays opened from
 * state (⌘K, the tab bar) need this or focus falls to <body>.
 */
export interface FocusReturn {
  /** Call when opening. `opener` wins over document.activeElement (Safari doesn't focus clicked buttons). */
  capture(opener?: Element | null): void;
  /** Use as a Radix `onCloseAutoFocus` handler. */
  restore(event: Event): void;
}

export function createFocusReturn(): FocusReturn {
  let target: HTMLElement | null = null;

  return {
    capture(opener) {
      const candidate = opener ?? document.activeElement;
      target =
        candidate instanceof HTMLElement && candidate !== document.body
          ? candidate
          : null;
    },
    restore(event) {
      const element = target;
      target = null;
      if (element && element.isConnected) {
        event.preventDefault();
        element.focus({ preventScroll: true });
      }
    },
  };
}
