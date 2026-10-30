import { Capacitor, registerPlugin } from "@capacitor/core";
import { flushStorage, installNativeStorage, STORAGE_KEYS } from "./storage";
import { useSettings } from "./settings";
import { suspendAudio } from "./audio";
interface NeonDevicePlugin {
  readStore(): Promise<{ value: string | null }>;
  writeStore(options: { value: string }): Promise<void>;
  impact(options: { kind: string }): Promise<void>;
  share(options: { text: string }): Promise<void>;
  addListener(event: "inactive", listener: () => void): Promise<{ remove: () => Promise<void> }>;
}
const Native = registerPlugin<NeonDevicePlugin>("NeonDevice");
export const isNative = () => Capacitor.isNativePlatform();
export async function initializeDevice() {
  if (!isNative()) return;
  document.documentElement.classList.add("native-ios");
  const { value } = await Native.readStore();
  let values: Record<string, string> = {};
  if (value) {
    const decoded: unknown = JSON.parse(value);
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded))
      throw new Error("Invalid save file");
    values = Object.fromEntries(
      Object.entries(decoded).filter(
        ([k, v]) =>
          STORAGE_KEYS.includes(k as (typeof STORAGE_KEYS)[number]) && typeof v === "string",
      ),
    );
  } else {
    // Only migrate storage belonging to this app's WKWebView; Safari is a different origin.
    for (const key of STORAGE_KEYS) {
      try {
        const v = localStorage.getItem(key);
        if (v) values[key] = v;
      } catch {}
    }
  }
  installNativeStorage(values, async (values) => {
    await Native.writeStore({ value: JSON.stringify(values) });
  });
  await Native.addListener("inactive", () => {
    suspendAudio();
    window.dispatchEvent(new Event("neon:inactive"));
    void flushStorage();
  });
}
let lastImpact = 0;
export function impact(kind: "start" | "blocked" | "win" | "select" | "undo") {
  if (!isNative() || !useSettings.getState().haptics) return;
  const now = Date.now();
  if (kind === "start" && now - lastImpact < 80) return;
  lastImpact = now;
  void Native.impact({ kind }).catch(() => {});
}
export async function shareResult(text: string): Promise<"shared" | "unsupported"> {
  if (isNative()) {
    await Native.share({ text });
    return "shared";
  }
  if (navigator.share) {
    await navigator.share({ title: "Neon Arrow", text });
    return "shared";
  }
  return "unsupported";
}
