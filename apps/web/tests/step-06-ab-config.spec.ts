import { expect, test, type Locator, type Page } from "@playwright/test";

import { connectHandles, fitView, trackConsoleErrors } from "./helpers";

const NODE = '[data-testid="workflow-node"]';

async function addSendEmail(page: Page): Promise<Locator> {
  await page.goto("/");
  await page.getByTestId("palette-item-action-send-email").click();
  const node = page.locator(NODE).filter({ hasText: "Send Email" }).first();
  await node.click();
  return node;
}

async function selectOption(page: Page, triggerId: string, optionId: string) {
  await page.getByTestId(triggerId).click();
  await page.getByTestId(optionId).click();
}

function cardSummary(node: Locator): Locator {
  return node.getByTestId("node-summary");
}

/** Wire trigger → Send Email → Exit so family size resolves to 1-step. */
async function wireOneStepPath(page: Page, email: Locator) {
  await page.getByTestId("palette-item-action-exit").click();
  await fitView(page);
  const trigger = page.locator('[data-node-category="trigger"]').first();
  const exit = page.locator(NODE).filter({ hasText: "Exit Sequence" }).first();
  await connectHandles(
    page,
    trigger.getByTestId("handle-source"),
    email.getByTestId("handle-target"),
  );
  await connectHandles(
    page,
    email.getByTestId("handle-source"),
    exit.getByTestId("handle-target"),
  );
  await email.click();
}

/** Wire a 3-touch linear path so step-1 templates from the 3-family are available. */
async function wireThreeStepPath(page: Page, email: Locator) {
  for (let i = 0; i < 2; i += 1) {
    await page.getByTestId("palette-item-action-send-email").click();
    await page.getByTestId("palette-item-action-wait").click();
  }
  await page.getByTestId("palette-item-action-exit").click();
  await fitView(page);

  const trigger = page.locator('[data-node-category="trigger"]').first();
  const emails = page.locator(NODE).filter({ hasText: "Send Email" });
  const waits = page.locator(NODE).filter({ hasText: "Wait / Delay" });
  const exit = page.locator(NODE).filter({ hasText: "Exit Sequence" }).first();

  await connectHandles(
    page,
    trigger.getByTestId("handle-source"),
    emails.nth(0).getByTestId("handle-target"),
  );
  await connectHandles(
    page,
    emails.nth(0).getByTestId("handle-source"),
    waits.nth(0).getByTestId("handle-target"),
  );
  await connectHandles(
    page,
    waits.nth(0).getByTestId("handle-source"),
    emails.nth(1).getByTestId("handle-target"),
  );
  await connectHandles(
    page,
    emails.nth(1).getByTestId("handle-source"),
    waits.nth(1).getByTestId("handle-target"),
  );
  await connectHandles(
    page,
    waits.nth(1).getByTestId("handle-source"),
    emails.nth(2).getByTestId("handle-target"),
  );
  await connectHandles(
    page,
    emails.nth(2).getByTestId("handle-source"),
    exit.getByTestId("handle-target"),
  );
  await email.click();
}

test.describe("Step 6 — Send Email A/B config", () => {
  test("A/B toggle is off by default and reveals/hides the variant forms", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    const node = await addSendEmail(page);

    const abToggle = page.getByTestId("ab-toggle");
    await expect(abToggle).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("template-selector")).toBeVisible();
    await expect(page.getByTestId("field-templateId")).toBeVisible();
    await expect(page.getByTestId("variant-a")).toHaveCount(0);
    await expect(page.getByTestId("variant-b")).toHaveCount(0);
    await expect(cardSummary(node)).toHaveText("No template selected");

    await abToggle.click();
    await expect(abToggle).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("variant-a")).toBeVisible();
    await expect(page.getByTestId("variant-b")).toBeVisible();
    await expect(page.getByTestId("variant-a-template-selector")).toBeVisible();
    await expect(page.getByTestId("field-aTemplateId")).toBeVisible();
    await expect(page.getByTestId("field-bTemplateId")).toBeVisible();
    await expect(page.getByTestId("ab-config")).toBeVisible();
    await expect(page.getByTestId("template-selector")).toHaveCount(0);

    await abToggle.click();
    await expect(page.getByTestId("variant-a")).toHaveCount(0);
    await expect(page.getByTestId("template-selector")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("each variant selects a template independently", async ({ page }) => {
    const node = await addSendEmail(page);
    await wireOneStepPath(page, node);
    await page.getByTestId("ab-toggle").click();

    await expect(page.getByTestId("variant-a-template-selector")).toBeVisible();
    await expect(page.getByTestId("variant-b-template-selector")).toBeVisible();

    await selectOption(
      page,
      "field-aTemplateId",
      "option-aTemplateId-single-touch-v1",
    );
    await expect(page.getByTestId("variant-a-template-preview")).toContainText(
      "Quick idea for {{company}}",
    );
    await expect(page.getByTestId("variant-b-template-preview")).toHaveCount(0);

    await selectOption(
      page,
      "field-bTemplateId",
      "option-bTemplateId-single-touch-v1",
    );
    await expect(page.getByTestId("variant-b-template-preview")).toContainText(
      "Quick idea for {{company}}",
    );
    await expect(page.getByTestId("variant-a-template-preview")).toBeVisible();
  });

  test("split slider changes value and label", async ({ page }) => {
    await addSendEmail(page);
    await page.getByTestId("ab-toggle").click();

    const slider = page.getByTestId("ab-split");
    await expect(slider).toHaveValue("50");
    await expect(page.getByTestId("ab-split-label")).toHaveText("A 50% / B 50%");

    await slider.focus();
    await slider.press("ArrowRight");
    await expect(slider).toHaveValue("60");
    await expect(page.getByTestId("ab-split-label")).toHaveText("A 60% / B 40%");
  });

  test("winning-metric dropdown updates and drives the summary", async ({
    page,
  }) => {
    const node = await addSendEmail(page);
    await page.getByTestId("ab-toggle").click();

    await expect(cardSummary(node)).toHaveText(
      "A/B: No template selected vs No template selected (Reply rate)",
    );

    await selectOption(page, "field-abMetric", "option-abMetric-open");
    await expect(cardSummary(node)).toHaveText(
      "A/B: No template selected vs No template selected (Open rate)",
    );

    await selectOption(page, "field-abMetric", "option-abMetric-click");
    await expect(cardSummary(node)).toHaveText(
      "A/B: No template selected vs No template selected (Click rate)",
    );
  });

  test("Lock winner toggle is off by default and toggles on", async ({
    page,
  }) => {
    await addSendEmail(page);
    await page.getByTestId("ab-toggle").click();

    const lock = page.getByTestId("ab-lock");
    await expect(lock).toHaveAttribute("aria-checked", "false");
    await lock.click();
    await expect(lock).toHaveAttribute("aria-checked", "true");
  });

  test("A/B mode with empty variants triggers no-template-selected warning", async ({
    page,
  }) => {
    const node = await addSendEmail(page);
    await wireOneStepPath(page, node);
    await page.getByTestId("ab-toggle").click();

    await expect(page.getByTestId("validation-no-template-selected")).toHaveCount(
      1,
    );
  });

  test("Variant A and B Template Builder links open the Template Builder page", async ({
    page,
  }) => {
    const node = await addSendEmail(page);
    await wireOneStepPath(page, node);
    await page.getByTestId("ab-toggle").click();

    await page.getByTestId("variant-a-template-builder-link").click();
    await expect(page).toHaveURL(/\/template-builder$/);
    await expect(
      page.getByRole("heading", { name: "Template Builder" }),
    ).toBeVisible();
    await expect(page.getByTestId("template-family-list")).toBeVisible();

    const nodeB = await addSendEmail(page);
    await wireOneStepPath(page, nodeB);
    await page.getByTestId("ab-toggle").click();

    await page.getByTestId("variant-b-template-builder-link").click();
    await expect(page).toHaveURL(/\/template-builder$/);
    await expect(
      page.getByRole("heading", { name: "Template Builder" }),
    ).toBeVisible();
    await expect(page.getByTestId("template-family-list")).toBeVisible();
  });

  test("summary reflects A/B state and variant template selections", async ({
    page,
  }) => {
    const node = await addSendEmail(page);

    await expect(cardSummary(node)).toHaveText("No template selected");

    await wireThreeStepPath(page, node);
    await page.getByTestId("ab-toggle").click();
    await expect(cardSummary(node)).toHaveText(
      "A/B: No template selected vs No template selected (Reply rate)",
    );

    await selectOption(
      page,
      "field-aTemplateId",
      "option-aTemplateId-cold-open-3-v1",
    );
    await expect(cardSummary(node)).toHaveText(
      "A/B: Cold Open v1 vs No template selected (Reply rate)",
    );

    await selectOption(
      page,
      "field-bTemplateId",
      "option-bTemplateId-cold-open-3-v2",
    );
    await expect(cardSummary(node)).toHaveText(
      "A/B: Cold Open v1 vs Cold Open v2 (Reply rate)",
    );

    await page.getByTestId("ab-toggle").click();
    await expect(cardSummary(node)).toHaveText("No template selected");
  });
});
