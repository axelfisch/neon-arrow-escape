import { create } from "zustand";
import type { Progress } from "./types";
import { DEFAULT_PROGRESS } from "./types";
import { loadProgress, mergeProgress, saveProgress } from "./save";

type Store = {
  ready: boolean;
  progress: Progress;
  hydrate: () => void;
  setProgress: (p: Progress) => void;
  patch: (partial: Partial<Progress>) => void;
};

export const useProgress = create<Store>((set, get) => ({
  ready: false,
  progress: { ...DEFAULT_PROGRESS },
  hydrate: () => {
    set({ progress: loadProgress(), ready: true });
  },
  setProgress: (p) => {
    saveProgress(p);
    set({ progress: p, ready: true });
  },
  patch: (partial) => {
    const next = { ...get().progress, ...partial };
    saveProgress(next);
    set({ progress: next, ready: true });
  },
}));

export function applyRemote(remote: Progress) {
  const local = loadProgress();
  const merged = mergeProgress(local, remote);
  useProgress.getState().setProgress(merged);
  return merged;
}
