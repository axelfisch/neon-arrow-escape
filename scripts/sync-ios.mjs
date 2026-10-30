import { readFile, writeFile, mkdir, cp, access, rm, mkdtemp } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const runtime = "ios/App/NeonRuntime/Frameworks";
const hashes = {
  Capacitor: "9316f568444411d362dcb4d1946e7572d4aef5d690c122ff6f1cb8a44a920c9f",
  Cordova: "bdcd8eab2d62a077efd76c3c8b9629e65ae7043c1462289a1e55de9be19bbf1f",
};
await access("site/index.html");
await mkdir(runtime, { recursive: true });
for (const [name, expected] of Object.entries(hashes)) {
  try {
    await access(`${runtime}/${name}.xcframework/Info.plist`);
    continue;
  } catch {}
  const response = await fetch(
    `https://github.com/ionic-team/capacitor-swift-pm/releases/download/8.5.3/${name}.xcframework.zip`,
  );
  if (!response.ok) throw new Error(`Cannot download ${name}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== expected)
    throw new Error(`Checksum mismatch: ${name}`);
  const temp = await mkdtemp(join(tmpdir(), "neon-runtime-"));
  try {
    const zip = join(temp, "runtime.zip");
    await writeFile(zip, bytes);
    execFileSync("unzip", ["-q", zip, "-d", temp]);
    await cp(join(temp, `${name}.xcframework`), `${runtime}/${name}.xcframework`, {
      recursive: true,
    });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
await rm("ios/App/App/public", { recursive: true, force: true });
await cp("site", "ios/App/App/public", { recursive: true });
const config = JSON.parse(await readFile("capacitor.config.json", "utf8"));
await writeFile(
  "ios/App/App/capacitor.config.json",
  JSON.stringify({ ...config, packageClassList: [] }, null, 2),
);
await writeFile(
  "ios/App/App/config.xml",
  '<?xml version="1.0" encoding="UTF-8"?><widget xmlns="http://www.w3.org/ns/widgets" version="1.0.0"></widget>',
);
console.log("Neon Arrow iOS synchronized (official Capacitor 8.5.3, local assets).");
