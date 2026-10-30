import { useEffect, useRef, useState } from "react";
import { enterFullscreen, fullscreenElement, leaveFullscreen } from "@/lib/fullscreen";

export function useGameFullscreen() {
  const root = useRef<HTMLDivElement>(null);
  const [immersive, setImmersive] = useState(false);
  const native = useRef(false),
    pending = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const sync = () => {
      const active = fullscreenElement(document) === root.current;
      if (native.current && !active) setImmersive(false);
      native.current = active;
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !fullscreenElement(document)) setImmersive(false);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    window.addEventListener("keydown", escape);
    return () => {
      mounted.current = false;
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("keydown", escape);
      if (native.current) void leaveFullscreen(document);
    };
  }, []);
  useEffect(() => {
    if (!immersive) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [immersive]);
  async function toggle() {
    if (pending.current || !root.current) return;
    pending.current = true;
    try {
      if (immersive) {
        await leaveFullscreen(document);
        if (mounted.current) setImmersive(false);
      } else {
        setImmersive(true);
        const active = await enterFullscreen(root.current);
        if (mounted.current) native.current = active;
        else if (active) await leaveFullscreen(document);
      }
    } finally {
      pending.current = false;
    }
  }
  return { root, immersive, toggle };
}
