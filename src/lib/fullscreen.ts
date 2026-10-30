// Keep a CSS immersive mode available when a browser cannot fullscreen HTML.
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void | Promise<void>;
};
type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void | Promise<void>;
};
export function fullscreenElement(doc: Document): Element | null {
  return doc.fullscreenElement ?? (doc as FullscreenDocument).webkitFullscreenElement ?? null;
}
export async function enterFullscreen(element: HTMLElement): Promise<boolean> {
  try {
    if (element.requestFullscreen) await element.requestFullscreen();
    else if ((element as FullscreenElement).webkitRequestFullscreen)
      await (element as FullscreenElement).webkitRequestFullscreen!();
    else return false;
    return fullscreenElement(element.ownerDocument) === element;
  } catch {
    return false;
  }
}
export async function leaveFullscreen(doc: Document): Promise<void> {
  if (!fullscreenElement(doc)) return;
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else await (doc as FullscreenDocument).webkitExitFullscreen?.();
  } catch {
    // The browser may already be leaving fullscreen after a navigation.
  }
}
