import arrowLicense from "../../../public/licenses/arrow-escape-MIT.txt?raw";
import capacitorLicense from "../../../public/licenses/capacitor-MIT.txt?raw";
import monoLicense from "../../../public/licenses/ibmplexmono-OFL.txt?raw";
import sansLicense from "../../../public/licenses/ibmplexsans-OFL.txt?raw";
import syneLicense from "../../../public/licenses/syne-OFL.txt?raw";
import { useEffect, useState } from "react";
import { useProgress } from "@/game/progress-store";
import { useSettings } from "@/game/settings";
import { setSoundEnabled, unlockAudio } from "@/game/audio";
import { Sheet } from "./Sheet";
export function useReducedMotion() {
  const motion = useSettings((s) => s.motion);
  const [system, setSystem] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)"),
      update = () => setSystem(m.matches);
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  // Always honor the system accessibility setting.
  return system || motion === "reduced";
}
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const p = useProgress((s) => s.progress),
    patch = useProgress((s) => s.patch),
    s = useSettings(),
    fr = p.lang === "fr";
  const rows = [
    {
      label: fr ? "Vibrations" : "Haptics",
      on: s.haptics,
      change: () => s.patch({ haptics: !s.haptics }),
    },
    {
      label: fr ? "Son" : "Sound",
      on: p.sound,
      change: () => {
        unlockAudio();
        setSoundEnabled(!p.sound);
        patch({ sound: !p.sound });
      },
    },
    {
      label: fr ? "Aperçu avant lancement" : "Preview before tap",
      on: p.inspect,
      change: () => patch({ inspect: !p.inspect }),
    },
    {
      label: fr ? "Mode concentration" : "Focus mode",
      on: s.focus,
      change: () => s.patch({ focus: !s.focus }),
    },
  ];
  return (
    <Sheet title={fr ? "Réglages" : "Settings"} onClose={onClose}>
      <label className="setting-row">
        {fr ? "Animations" : "Motion"}
        <select
          value={s.motion}
          onChange={(e) => s.patch({ motion: e.target.value as typeof s.motion })}
        >
          <option value="system">{fr ? "Système" : "System"}</option>
          <option value="full">{fr ? "Complètes" : "Full"}</option>
          <option value="reduced">{fr ? "Sobres" : "Reduced"}</option>
        </select>
      </label>
      {rows.map((r) => (
        <div className="setting-row" key={r.label}>
          <span>{r.label}</span>
          <button
            type="button"
            role="switch"
            aria-label={r.label}
            aria-checked={r.on}
            className="neon-switch"
            onClick={r.change}
          >
            <span />
          </button>
        </div>
      ))}
      <button
        className="setting-row language-row"
        onClick={() => patch({ lang: fr ? "en" : "fr" })}
      >
        {fr ? "Langue" : "Language"}
        <span>{fr ? "Français" : "English"}</span>
      </button>
      <p className="sheet-note">
        {fr
          ? "Les réglages d’accessibilité du système restent prioritaires. Les vibrations sont disponibles dans l’app iPhone."
          : "System accessibility settings take priority. Haptics are available in the iPhone app."}
      </p>
      <details className="credits">
        <summary>{fr ? "Crédits et licences" : "Credits and licenses"}</summary>
        <p>Neon Arrow · AiXel Studio</p>
        {[
          { name: "Arrow Escape · Umang · MIT", text: arrowLicense },
          { name: "Capacitor · Ionic · MIT", text: capacitorLicense },
          { name: "IBM Plex Mono · OFL", text: monoLicense },
          { name: "IBM Plex Sans · OFL", text: sansLicense },
          { name: "Syne · OFL", text: syneLicense },
        ].map((l) => (
          <details key={l.name}>
            <summary>{l.name}</summary>
            <pre>{l.text}</pre>
          </details>
        ))}
      </details>
      <button className="sheet-primary" onClick={onClose}>
        OK
      </button>
    </Sheet>
  );
}
