import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import * as reactClient from "better-auth/react";
import * as plugins from "better-auth/client/plugins";

// Execute the real client module with the same flag substituted by Vite.
// Keep Better Auth real: mocking its constructor would hide the iOS failure.
const source = readFileSync(new URL("../src/lib/auth/client.ts", import.meta.url), "utf8");
function loadClient(flag, origin, t) {
  const previous = globalThis.window;
  globalThis.window = { location: { origin, hostname: new URL(origin).hostname } };
  t.after(() => {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });
  const exports = {};
  const dependencies = {
    "better-auth/react": reactClient,
    "better-auth/client/plugins": plugins,
    "./providers": { GROK_PROVIDERS: [] },
  };
  const { outputText } = ts.transpileModule(
    source.replaceAll("import.meta.env.VITE_AUTH_ENABLED", JSON.stringify(flag)),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  );
  runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    window: globalThis.window,
    URL,
  });
  return exports;
}

test("offline Capacitor startup does not construct Better Auth or request an auth URL", async (t) => {
  const client = loadClient("false", "capacitor://localhost", t);
  assert.equal(client.authEnabled, false);
  assert.equal(client.authClient, null);
  await client.signOut();
  await assert.rejects(client.signIn("grok-google"), /Accounts are unavailable/);
  // This is the actual exception the previous unconditional constructor raised.
  assert.throws(() => reactClient.createAuthClient(), /Invalid base URL: capacitor:\/\/localhost/);
});

test("static HTTPS builds also skip the disabled account client", (t) => {
  const client = loadClient("false", "https://neonarrow.netlify.app", t);
  assert.equal(client.authClient, null);
});

test("account-enabled web builds still initialize the real session client", (t) => {
  const client = loadClient("true", "https://example.com", t);
  assert.equal(client.authEnabled, true);
  assert.equal(typeof client.authClient.useSession, "function");
  assert.equal(typeof client.authClient.signIn.oauth2, "function");
});
