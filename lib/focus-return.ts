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

/**
 * Fallback focus target when the element that should get focus back no
 * longer exists (an action whose trigger vanished after a refetch): the
 * page's own heading (PageHeader / DetailHeader mark it `data-page-title`).
 * Returns false when there's no heading.
 */
export function focusPageHeading(): boolean {
  const heading = document.querySelector<HTMLElement>("[data-page-title]");
  if (!heading) return false;
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  return true;
}
