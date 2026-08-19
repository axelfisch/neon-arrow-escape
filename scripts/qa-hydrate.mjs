import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type()==="error") errors.push(m.text()); });
for (const url of ["http://127.0.0.1:8080/", "http://127.0.0.1:8080/levels", "http://127.0.0.1:8080/play/1", "http://127.0.0.1:8080/login"]) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
}
await page.screenshot({ path: "/workspace/screenshots/win-fixed.png" });
// play to win quickly for overlay shot
await page.goto("http://127.0.0.1:8080/play/1", { waitUntil: "networkidle" });
const svg = page.locator("svg[aria-label='arrow board']");
const box = await svg.boundingBox();
const cellW = box.width / 5, cellH = box.height / 4;
for (const [c,r] of [[4,3],[4,0],[0,2],[0,0]]) {
  await svg.click({ position: { x: (c+0.5)*cellW, y: (r+0.5)*cellH }, force: true });
  await page.waitForTimeout(340);
}
await page.screenshot({ path: "/workspace/screenshots/win-overlay.png" });
console.log("ERRORS", errors);
await browser.close();
