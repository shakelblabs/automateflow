import { chromium } from "@playwright/test";

const url = process.env.CANVAS_BASE_URL ?? "http://localhost:3003";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });

async function shot(name, build) {
  await page.goto(url, { waitUntil: "networkidle" });
  await build();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `tests/.artifacts/${name}.png` });
  console.log(`saved ${name}`);
}

const addSelect = async (type, label) => {
  await page.getByTestId(`palette-item-${type}`).click();
  await page.locator('[data-testid="workflow-node"]').filter({ hasText: label }).first().click();
};

await shot("step-04-send-email-template", async () => {
  await addSelect("action-send-email", "Send Email");
});

await shot("step-04-wait", async () => {
  await addSelect("action-wait", "Wait / Delay");
  await page.getByTestId("field-duration").fill("3");
});

await shot("step-04-new-lead-list", async () => {
  // Tag Lead is deferred (v2 §5); capture the New Lead Added lead-list config.
  await page.locator('[data-node-category="trigger"]').first().click();
  await page.getByTestId("field-leadList").click();
  await page.getByTestId("option-leadList-enterprise-cto").click();
});

await browser.close();
