import { chromium } from "@playwright/test";

const url = process.env.CANVAS_BASE_URL ?? "http://localhost:3003";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(url, { waitUntil: "networkidle" });

// Capture the chat input.
await page.getByRole("button", { name: "Generate with AI" }).click();
await page.getByTestId("generate-input").fill("Cold outreach, 4 touches, stop if they reply");
await page.waitForTimeout(300);
await page.screenshot({ path: "tests/.artifacts/step-07-chat.png" });
console.log("saved step-07-chat");

// Submit and capture the generated canvas.
await page.getByTestId("generate-submit").click();
await page.waitForTimeout(900);
await page.screenshot({ path: "tests/.artifacts/step-07-generated.png" });
console.log("saved step-07-generated");

await browser.close();
