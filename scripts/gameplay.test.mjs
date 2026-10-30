import { register } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";
register(new URL("./game-loader.mjs", import.meta.url), import.meta.url);
const { getLevels } = await import("../src/game/catalog.ts");
const { canRemove, verifySolution } = await import("../src/game/engine.ts");
const { createSession, moveSession, undoSession } = await import("../src/game/session.ts");
const { escapeDistance, escapeFrame } = await import("../src/game/escape.ts");
const { clampCamera, zoomAt } = await import("../src/game/viewport.ts");
const { generateDaily, generateEndless } = await import("../src/game/generator.ts");

test("all 80 campaign levels are well formed and have a verified solution", () => {
  const levels = getLevels();
  assert.equal(levels.length, 80);
  for (const l of levels) {
    const seen = new Set();
    assert.equal(l.arrowCount, l.pieces.length);
    for (const p of l.pieces)
      for (let i = 0; i < p.path.length; i++) {
        const c = p.path[i],
          key = `${c.c},${c.r}`;
        assert.ok(!seen.has(key), `overlap: level ${l.id}, ${key}`);
        seen.add(key);
        assert.ok(c.c >= 0 && c.c < l.w && c.r >= 0 && c.r < l.h);
        if (i) assert.equal(Math.abs(c.c - p.path[i - 1].c) + Math.abs(c.r - p.path[i - 1].r), 1);
      }
    assert.ok(verifySolution(l.pieces, l.solution, l.w, l.h), `solution: ${l.id}`);
  }
});
test("a curved arrow's head is its endpoint, not an extreme body cell", () => {
  const p = {
    id: "a",
    dir: "up",
    color: 0,
    path: [
      { c: 1, r: 2 },
      { c: 1, r: 3 },
      { c: 2, r: 3 },
      { c: 3, r: 3 },
      { c: 3, r: 2 },
      { c: 3, r: 1 },
    ],
  };
  const blocker = { id: "b", dir: "right", color: 1, path: [{ c: 1, r: 1 }] };
  assert.equal(canRemove(p, [p, blocker], 5, 5), false);
  assert.equal(canRemove(p, [p], 5, 5), true);
  const self = {
    ...p,
    path: [
      { c: 1, r: 2 },
      { c: 1, r: 3 },
      { c: 2, r: 3 },
      { c: 2, r: 2 },
      { c: 2, r: 1 },
      { c: 1, r: 1 },
    ],
  };
  assert.equal(canRemove(self, [self], 5, 5), false);
});
test("immediate releases support successive launches and ignore duplicate taps", () => {
  const l = getLevels()[0];
  let s = createSession(l);
  const id = l.solution[0];
  s = moveSession(s, id, l);
  assert.equal(s.pieces.length, l.pieces.length - 1);
  assert.equal(moveSession(s, id, l), s);
  for (const next of l.solution.slice(1)) s = moveSession(s, next, l);
  assert.equal(s.pieces.length, 0);
  assert.equal(s.moves, l.pieces.length);
});
test("undo restores a lost heart and the board without refunding hints", () => {
  const l = getLevels()[1];
  const initial = createSession(l);
  const blocked = l.pieces.find((p) => !canRemove(p, l.pieces, l.w, l.h));
  assert.ok(blocked);
  const used = { ...initial, hintsLeft: initial.hintsLeft - 1, hintsUsed: 1 };
  const failed = moveSession(used, blocked.id, l);
  assert.equal(failed.hearts, l.hearts - 1);
  const restored = undoSession(failed);
  assert.equal(restored.hearts, l.hearts);
  assert.equal(restored.moves, 0);
  assert.equal(restored.hintsUsed, 1);
  assert.equal(restored.hintsLeft, used.hintsLeft);
  const moved = moveSession(restored, l.solution[0], l);
  assert.equal(undoSession(moved).pieces.length, l.pieces.length);
});
test("curved escape follows its body and finishes wholly outside every board", () => {
  for (const l of getLevels())
    for (const p of l.pieces) {
      assert.deepEqual(escapeFrame(p, 0), p.path);
      const end = escapeFrame(p, escapeDistance(p, l.w, l.h));
      assert.ok(end.every((c) => c.c < 0 || c.c >= l.w || c.r < 0 || c.r >= l.h));
      const frame = escapeFrame(p, 0.5);
      assert.ok(frame.every((c) => Number.isFinite(c.c) && Number.isFinite(c.r)));
      if (p.path.length > 1) {
        const length = frame
          .slice(1)
          .reduce((n, c, i) => n + Math.abs(c.c - frame[i].c) + Math.abs(c.r - frame[i].r), 0);
        assert.ok(Math.abs(length - (p.path.length - 1)) < 0.001);
      }
    }
});
test("zoom preserves its anchor and clamps panning at the board edges", () => {
  assert.deepEqual(clampCamera({ x: -10, y: 99, zoom: 1 }, 10, 10), { x: 5, y: 5, zoom: 1 });
  const camera = { x: 5, y: 5, zoom: 1 },
    anchor = { c: 4, r: 4 },
    zoomed = zoomAt(camera, 2, anchor, 10, 10);
  assert.equal((anchor.c - zoomed.x) * zoomed.zoom, (anchor.c - camera.x) * camera.zoom);
  assert.equal((anchor.r - zoomed.y) * zoomed.zoom, (anchor.r - camera.y) * camera.zoom);
  assert.equal(clampCamera({ x: 9, y: 9, zoom: 20 }, 10, 10).zoom, 4);
});
test("daily and endless recipes still generate solvable head-first snakes", () => {
  for (const date of ["2026-10-29", "2026-10-30", "2026-11-01"]) {
    const { level } = generateDaily(new Date(date));
    assert.ok(level);
    assert.ok(verifySolution(level.pieces, level.solution, level.w, level.h));
  }
  for (const wave of [1, 5, 12, 20]) {
    const l = generateEndless(wave, 4200);
    assert.ok(l);
    assert.ok(verifySolution(l.pieces, l.solution, l.w, l.h));
  }
});
