import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** "⌘" on Apple platforms, "Ctrl" elsewhere. Server render assumes "⌘". */
export function useModKey(): string {
  return useSyncExternalStore(
    subscribe,
    () =>
      /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
        ? "⌘"
        : "Ctrl ",
    () => "⌘",
  );
}
