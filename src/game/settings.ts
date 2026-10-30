import { create } from "zustand";
import { readStored, writeStored } from "./storage";
export type GameSettings = {
  motion: "system" | "full" | "reduced";
  haptics: boolean;
  focus: boolean;
};
const defaults: GameSettings = { motion: "system", haptics: true, focus: false };
export const useSettings = create<
  GameSettings & { hydrate: () => void; patch: (p: Partial<GameSettings>) => void }
>((set, get) => ({
  ...defaults,
  hydrate: () => {
    try {
      const p = JSON.parse(readStored("neon-arrow-settings-v1") ?? "null");
      if (p)
        set({
          motion: ["system", "full", "reduced"].includes(p.motion) ? p.motion : "system",
          haptics: p.haptics !== false,
          focus: p.focus === true,
        });
    } catch {
      /* Defaults. */
    }
  },
  patch: (p) => {
    set(p);
    const s = get();
    writeStored(
      "neon-arrow-settings-v1",
      JSON.stringify({ motion: s.motion, haptics: s.haptics, focus: s.focus }),
    );
  },
}));
