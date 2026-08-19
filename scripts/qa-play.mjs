import { chromium } from "playwright";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.screenshot({ path: "/workspace/screenshots/home-mobile.png" });

await page.goto("http://127.0.0.1:8080/play/1", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const svg = page.locator("svg[aria-label='arrow board']");
await svg.waitFor();
const box = await svg.boundingBox();
const cellW = box.width / 5;
const cellH = box.height / 4;

// Solution: D (2,2)-(4,3) right, B (4,0) down, C (0,2) right, A (0,0) down
const taps = [
  [4, 3],
  [4, 0],
  [0, 2],
  [0, 0],
];
for (const [c, r] of taps) {
  await svg.click({ position: { x: (c + 0.5) * cellW, y: (r + 0.5) * cellH }, force: true });
  await page.waitForTimeout(360);
}

await page.screenshot({ path: "/workspace/screenshots/play-win.png" });
const body = await page.locator("body").innerText();
console.log(body);
console.log("WON", body.includes("réussi") || body.includes("cleared"));

await page.setViewportSize({ width: 1280, height: 800 });
await page.goto("http://127.0.0.1:8080/play/1", { waitUntil: "networkidle" });
await page.screenshot({ path: "/workspace/screenshots/play-desktop.png" });
await page.goto("http://127.0.0.1:8080/levels", { waitUntil: "networkidle" });
await page.screenshot({ path: "/workspace/screenshots/levels-desktop.png", fullPage: true });

await browser.close();
