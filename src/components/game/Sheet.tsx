import { useEffect, useRef, type ReactNode } from "react";
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  const root = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      el = root.current!;
    const controls = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],select,input,[tabindex="0"]',
        ),
      );
    (controls()[0] ?? el).focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && close.current) {
        e.preventDefault();
        e.stopPropagation();
        close.current();
      }
      if (e.key !== "Tab") return;
      const all = controls(),
        first = all[0],
        last = all[all.length - 1];
      if (!first) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div className="sheet-backdrop">
      <div
        ref={root}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="game-sheet"
      >
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
