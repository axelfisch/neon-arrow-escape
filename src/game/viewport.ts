export type Camera = { x: number; y: number; zoom: number };
export const TAP_SLOP = 8;
export const LONG_PRESS_MS = 350;
export function clampZoom(zoom: number) {
  return Math.max(1, Math.min(4, zoom));
}
export function clampCamera(camera: Camera, w: number, h: number): Camera {
  const zoom = clampZoom(camera.zoom),
    halfW = w / (2 * zoom),
    halfH = h / (2 * zoom);
  return {
    zoom,
    x: Math.max(halfW, Math.min(w - halfW, camera.x)),
    y: Math.max(halfH, Math.min(h - halfH, camera.y)),
  };
}
export function zoomAt(
  camera: Camera,
  zoom: number,
  anchor: { c: number; r: number },
  w: number,
  h: number,
): Camera {
  const nextZoom = clampZoom(zoom),
    ratio = camera.zoom / nextZoom;
  return clampCamera(
    {
      zoom: nextZoom,
      x: anchor.c + (camera.x - anchor.c) * ratio,
      y: anchor.r + (camera.y - anchor.r) * ratio,
    },
    w,
    h,
  );
}
