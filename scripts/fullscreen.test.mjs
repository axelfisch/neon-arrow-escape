import { register } from "node:module";
import test from "node:test";
import assert from "node:assert/strict";
register(new URL("./game-loader.mjs", import.meta.url), import.meta.url);
const { enterFullscreen, leaveFullscreen, fullscreenElement } =
  await import("../src/lib/fullscreen.ts");

test("fullscreen enters on the requested game and exits cleanly", async () => {
  const doc = {
    fullscreenElement: null,
    async exitFullscreen() {
      this.fullscreenElement = null;
    },
  };
  const game = {
    ownerDocument: doc,
    async requestFullscreen() {
      doc.fullscreenElement = this;
    },
  };
  assert.equal(await enterFullscreen(game), true);
  assert.equal(fullscreenElement(doc), game);
  await leaveFullscreen(doc);
  assert.equal(fullscreenElement(doc), null);
});
test("unsupported or denied fullscreen leaves the immersive fallback available", async () => {
  assert.equal(await enterFullscreen({ ownerDocument: {} }), false);
  assert.equal(
    await enterFullscreen({
      ownerDocument: {},
      requestFullscreen() {
        return Promise.reject(new Error("denied"));
      },
    }),
    false,
  );
  await leaveFullscreen({});
});
test("WebKit fullscreen uses the prefixed element and exit APIs", async () => {
  const doc = {
    webkitFullscreenElement: null,
    webkitExitFullscreen() {
      this.webkitFullscreenElement = null;
    },
  };
  const game = {
    ownerDocument: doc,
    webkitRequestFullscreen() {
      doc.webkitFullscreenElement = this;
    },
  };
  assert.equal(await enterFullscreen(game), true);
  await leaveFullscreen(doc);
  assert.equal(fullscreenElement(doc), null);
});
