import { chromium } from "@playwright/test";

const url = process.env.CANVAS_BASE_URL ?? "http://localhost:3003";
const out = process.argv[2] ?? "tests/.artifacts/shell.png";

const add = (process.env.ADD ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
await page.goto(url, { waitUntil: "networkidle" });
for (const type of add) {
  await page.getByTestId(`palette-item-${type}`).click();
  await page.waitForTimeout(120);
}
if (add.length) {
  await page.keyboard.press("Escape");
  await page.locator(".react-flow__controls-fitview").click();
  await page.waitForTimeout(500);
}
if (process.env.REVEAL) {
  await page.getByTestId(process.env.REVEAL).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}
const clip = process.env.CLIP; // e.g. "0,0,320,860"
await page.screenshot({
  path: out,
  ...(clip
    ? (() => {
        const [x, y, width, height] = clip.split(",").map(Number);
        return { clip: { x, y, width, height } };
      })()
    : {}),
});
await browser.close();
console.log(`saved ${out}`);
