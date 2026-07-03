import { chromium } from "@playwright/test";

const url = process.env.CANVAS_BASE_URL ?? "http://localhost:3003";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(url, { waitUntil: "networkidle" });
await page.getByTestId("palette-item-action-send-email").click();
await page
  .locator('[data-testid="workflow-node"]')
  .filter({ hasText: "Send Email" })
  .first()
  .click();

await page.getByTestId("ab-toggle").click();
await page.getByTestId("ab-split").focus();
await page.getByTestId("ab-split").press("ArrowRight");
await page.waitForTimeout(400);

await page.screenshot({ path: "tests/.artifacts/step-06-ab-config.png" });
console.log("saved step-06-ab-config");

await browser.close();
