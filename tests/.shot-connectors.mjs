import { chromium } from "@playwright/test";

const url = process.env.CANVAS_BASE_URL ?? "http://localhost:3003";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });

const node = (label) =>
  page.locator('[data-testid="workflow-node"]').filter({ hasText: label }).first();

async function connect(source, target) {
  const s = await source.boundingBox();
  const t = await target.boundingBox();
  const sx = s.x + s.width / 2, sy = s.y + s.height / 2;
  const tx = t.x + t.width / 2, ty = t.y + t.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx, sy + 12, { steps: 4 });
  await page.mouse.move(tx, ty, { steps: 20 });
  await page.mouse.move(tx, ty);
  await page.mouse.up();
  await page.waitForTimeout(200);
}

const fit = async () => {
  await page.locator(".react-flow__controls-fitview").click();
  await page.waitForTimeout(300);
};

await page.goto(url, { waitUntil: "networkidle" });
await page.getByTestId("palette-item-condition-replied").click();
await page.getByTestId("palette-item-handoff-unibox").click();
await page.getByTestId("palette-item-action-wait").click();
await fit();

const trigger = page.locator('[data-node-category="trigger"]').first();
const condition = page.locator('[data-node-category="logic"]').first();
await connect(trigger.getByTestId("handle-source"), condition.getByTestId("handle-target"));
await connect(condition.getByTestId("handle-yes"), node("Handoff: Unibox").getByTestId("handle-target"));
await connect(condition.getByTestId("handle-no"), node("Wait / Delay").getByTestId("handle-target"));
await fit();
await page.locator(".react-flow__controls-zoomout").click();
await page.locator(".react-flow__controls-zoomout").click();
await page.waitForTimeout(400);

await page.screenshot({ path: "tests/.artifacts/step-05-branching.png" });
await browser.close();
console.log("saved step-05-branching");
