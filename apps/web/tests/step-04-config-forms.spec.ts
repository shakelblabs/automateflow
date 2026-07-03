import { expect, test, type Locator, type Page } from "@playwright/test";

import { trackConsoleErrors, connectHandles, fitView } from "./helpers";

const NODE = '[data-testid="workflow-node"]';

/** Add a node via the palette and select it, returning its canvas locator. */
async function addAndSelect(
  page: Page,
  type: string,
  label: string,
): Promise<Locator> {
  await page.getByTestId(`palette-item-${type}`).click();
  const node = page.locator(NODE).filter({ hasText: label }).first();
  await node.click();
  return node;
}

async function selectOption(page: Page, triggerId: string, optionId: string) {
  await page.getByTestId(triggerId).click();
  await page.getByTestId(optionId).click();
}

/** The live summary line rendered inside a canvas node card. */
function cardSummary(node: Locator): Locator {
  return node.getByTestId("node-summary");
}

test.describe("Step 4 — Config forms", () => {
  test("New Lead Added: lead list dropdown drives the card summary", async ({
    page,
  }) => {
    await page.goto("/");
    const node = page.locator('[data-node-category="trigger"]').first();
    await node.click();

    // Seeded with the first mock list so the app loads clean (no warning).
    await expect(page.getByTestId("field-leadList")).toBeVisible();
    await expect(cardSummary(node)).toHaveText(
      "List: Q2 SaaS Founders (240 leads)",
    );

    await selectOption(page, "field-leadList", "option-leadList-enterprise-cto");
    await expect(cardSummary(node)).toHaveText("List: Enterprise CTOs (88 leads)");
  });

  test("Email Replied: campaign dropdown drives the card summary", async ({
    page,
  }) => {
    await page.goto("/");
    const node = await addAndSelect(page, "trigger-email-replied", "Email Replied");

    await expect(page.getByTestId("field-campaign")).toBeVisible();
    await expect(cardSummary(node)).toHaveText("Replies from: Q1 Outbound");

    await selectOption(page, "field-campaign", "option-campaign-product-launch");
    await expect(cardSummary(node)).toHaveText("Replies from: Product Launch");
  });

  test("Wait / Delay: duration + unit + business-hours checkbox", async ({
    page,
  }) => {
    await page.goto("/");
    const node = await addAndSelect(page, "action-wait", "Wait / Delay");

    await expect(page.getByTestId("field-duration")).toBeVisible();
    await expect(page.getByTestId("field-unit")).toBeVisible();
    const businessHours = page.getByTestId("field-businessHours");
    await expect(businessHours).toBeVisible();
    await expect(cardSummary(node)).toHaveText("Wait 2 days");

    await page.getByTestId("field-duration").fill("5");
    await expect(cardSummary(node)).toHaveText("Wait 5 days");

    // Singular unit label at duration 1.
    await page.getByTestId("field-duration").fill("1");
    await selectOption(page, "field-unit", "option-unit-hours");
    await expect(cardSummary(node)).toHaveText("Wait 1 hour");

    // Business-hours checkbox toggles.
    await expect(businessHours).toHaveAttribute("aria-checked", "false");
    await businessHours.click();
    await expect(businessHours).toHaveAttribute("aria-checked", "true");
  });

  test("Send Email: template selector drives the card summary", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");
    const node = await addAndSelect(page, "action-send-email", "Send Email");

    await expect(page.getByTestId("template-selector")).toBeVisible();
    await expect(page.getByTestId("field-templateId")).toBeVisible();
    await expect(page.getByTestId("template-builder-link")).toBeVisible();
    await expect(page.getByTestId("mode-manual")).toHaveCount(0);
    await expect(page.getByTestId("mode-ai")).toHaveCount(0);
    await expect(page.getByTestId("field-subject")).toHaveCount(0);
    await expect(cardSummary(node)).toHaveText("No template selected");

    // Wire trigger → Send Email → Exit so family size resolves to 1-step.
    await page.getByTestId("palette-item-action-exit").click();
    await fitView(page);
    const trigger = page.locator('[data-node-category="trigger"]').first();
    const exit = page.locator('[data-testid="workflow-node"]').filter({
      hasText: "Exit Sequence",
    }).first();
    await connectHandles(
      page,
      trigger.getByTestId("handle-source"),
      node.getByTestId("handle-target"),
    );
    await connectHandles(
      page,
      node.getByTestId("handle-source"),
      exit.getByTestId("handle-target"),
    );
    await node.click();

    await selectOption(
      page,
      "field-templateId",
      "option-templateId-single-touch-v1",
    );
    await expect(page.getByTestId("template-preview")).toContainText(
      "Quick idea for {{company}}",
    );
    await expect(cardSummary(node)).toHaveText("Template: Single Touch v1");

    expect(errors).toEqual([]);
  });

  test("No-config nodes show informational notes only", async ({ page }) => {
    await page.goto("/");

    await addAndSelect(page, "condition-replied", "Condition: Replied?");
    await expect(page.getByTestId("config-note")).toContainText(
      "automatically reads from the campaign's reply trigger",
    );

    await addAndSelect(page, "action-exit", "Exit Sequence");
    await expect(page.getByTestId("config-note")).toContainText("terminal");

    await addAndSelect(page, "handoff-unibox", "Handoff: Unibox");
    await expect(page.getByTestId("config-note")).toContainText(
      "Reply handling continues in Unibox",
    );
  });
});
