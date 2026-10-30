/** Synchronous game API with an optional durable native file backend. */
export const STORAGE_KEYS = [
  "neon-arrow-escape-v1",
  "neon-arrow-settings-v1",
  "neon-arrow-checkpoint-v1",
] as const;
let nativeValues: Record<string, string> | null = null;
let writeNative: ((values: Record<string, string>) => Promise<void>) | null = null;
let writes: Promise<void> = Promise.resolve();
export function installNativeStorage(
  values: Record<string, string>,
  writer: (values: Record<string, string>) => Promise<void>,
) {
  nativeValues = values;
  writeNative = writer;
}
export function readStored(key: string): string | null {
  if (nativeValues) return nativeValues[key] ?? null;
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writeStored(key: string, value: string | null) {
  try {
    if (typeof localStorage !== "undefined") {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } catch {
    /* The native file remains authoritative when available. */
  }
  if (!nativeValues || !writeNative) return;
  if (value === null) delete nativeValues[key];
  else nativeValues[key] = value;
  const snapshot = { ...nativeValues },
    writer = writeNative;
  writes = writes
    .catch(() => {})
    .then(() => writer(snapshot))
    .catch(() => {
      if (typeof window !== "undefined") window.dispatchEvent(new Event("neon:save-error"));
    });
}
export function flushStorage() {
  return writes;
}
