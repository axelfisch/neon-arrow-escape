import { register } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";
register(new URL("./game-loader.mjs", import.meta.url), import.meta.url);
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => memory.set(k, v),
  removeItem: (k) => memory.delete(k),
};
globalThis.window = {};
const { getLevels } = await import("../src/game/catalog.ts");
const { createSession, moveSession, undoSession } = await import("../src/game/session.ts");
const { saveCheckpoint, restoreCheckpoint, clearCheckpoint, readCheckpoint } =
  await import("../src/game/checkpoint.ts");
const { canRemove } = await import("../src/game/engine.ts");
const { loadProgress, saveProgress } = await import("../src/game/save.ts");
const { installNativeStorage, writeStored, readStored, flushStorage } =
  await import("../src/game/storage.ts");
test("campaign checkpoint restores pieces, elapsed time, hints and working undo history", () => {
  const l = getLevels()[1];
  let s = createSession(l);
  s = moveSession(s, l.solution[0], l);
  const blocked = s.pieces.find((p) => !canRemove(p, s.pieces, l.w, l.h));
  assert.ok(blocked);
  s = moveSession(s, blocked.id, l);
  s = { ...s, hintsLeft: s.hintsLeft - 1, hintsUsed: 1 };
  saveCheckpoint(l, s, 1234);
  assert.deepEqual(restoreCheckpoint(l), { session: s, elapsed: 1234 });
  assert.equal(undoSession(restoreCheckpoint(l).session).hearts, l.hearts);
  assert.equal(restoreCheckpoint(getLevels()[0]), null);
});
test("corrupt checkpoint cannot inject pieces or invalid counters", () => {
  const l = getLevels()[0];
  saveCheckpoint(l, createSession(l), 0);
  const good = readCheckpoint();
  for (const state of [
    { ...good.state, ids: ["foreign"] },
    { ...good.state, hearts: -1 },
    { ...good.state, hintsLeft: 999 },
    { ...good.state, history: null },
    { ...good.state, ids: [good.state.ids[0], good.state.ids[0]] },
  ]) {
    memory.set("neon-arrow-checkpoint-v1", JSON.stringify({ ...good, state }));
    assert.equal(restoreCheckpoint(l), null);
  }
  clearCheckpoint();
  assert.equal(readCheckpoint(), null);
});
test("daily cannot overwrite campaign resume and completed board removes its checkpoint", () => {
  const l = getLevels()[0];
  let s = createSession(l);
  saveCheckpoint(l, s, 0);
  saveCheckpoint({ ...l, id: 0, key: "daily" }, s, 100);
  assert.equal(readCheckpoint().key, l.key);
  for (const id of l.solution) s = moveSession(s, id, l);
  saveCheckpoint(l, s, 500);
  assert.equal(readCheckpoint(), null);
});
test("existing preview preference is preserved while a missing preference defaults to one tap", () => {
  memory.set("neon-arrow-escape-v1", JSON.stringify({ sound: false }));
  assert.equal(loadProgress().inspect, false);
  memory.set("neon-arrow-escape-v1", JSON.stringify({ inspect: true }));
  assert.equal(loadProgress().inspect, true);
  const p = loadProgress();
  saveProgress(p);
  assert.equal(loadProgress().inspect, true);
});
test("native file backend keeps ordered snapshots and deletion without relying on localStorage", async () => {
  const saved = [];
  installNativeStorage({ "neon-arrow-settings-v1": "native" }, async (v) => {
    saved.push(v);
  });
  assert.equal(readStored("neon-arrow-settings-v1"), "native");
  writeStored("neon-arrow-settings-v1", "a");
  writeStored("neon-arrow-settings-v1", "b");
  writeStored("neon-arrow-settings-v1", null);
  await flushStorage();
  assert.deepEqual(saved, [
    { "neon-arrow-settings-v1": "a" },
    { "neon-arrow-settings-v1": "b" },
    {},
  ]);
});
