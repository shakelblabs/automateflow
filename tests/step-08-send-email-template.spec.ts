import { expect, test, type Page } from "@playwright/test";

import { summarize } from "../src/lib/node-definitions";
import {
  getEffectiveTemplateId,
  isV1AbVariantConfig,
  isV1SendEmailConfig,
} from "../src/lib/send-email-config";
import { connectHandles, fitView } from "./helpers";

const NODE = '[data-testid="workflow-node"]';

async function addNode(page: Page, type: string) {
  await page.getByTestId(`palette-item-${type}`).click();
}

async function selectOption(page: Page, triggerId: string, optionId: string) {
  await page.getByTestId(triggerId).click();
  await page.getByTestId(optionId).click();
}

function sendEmailNodes(page: Page) {
  return page.locator(NODE).filter({ hasText: "Send Email" });
}

test.describe("Step 8 — Send Email template selector (v2 §3)", () => {
  test("v1-shaped config normalizes to unmigrated empty state (§3.1)", () => {
    const v1Config = {
      mode: "manual",
      subject: "Legacy subject",
      body: "Legacy body",
      abEnabled: false,
    };
    expect(isV1SendEmailConfig(v1Config)).toBe(true);
    expect(getEffectiveTemplateId(v1Config)).toBeUndefined();
    expect(summarize("action-send-email", v1Config)).toBe(
      "No template selected",
    );

    const aiConfig = {
      mode: "ai",
      aiPrompt: "Book a demo",
      aiTone: "professional",
      abEnabled: false,
    };
    expect(isV1SendEmailConfig(aiConfig)).toBe(true);
    expect(getEffectiveTemplateId(aiConfig)).toBeUndefined();
  });

  test("v1-shaped A/B variant config normalizes to unmigrated empty state (§3.1)", () => {
    const v1AbConfig = {
      abEnabled: true,
      aMode: "manual",
      aSubject: "Legacy A subject",
      aBody: "Legacy A body",
      bMode: "ai",
      bPrompt: "Legacy B prompt",
      bTone: "professional",
      abMetric: "reply",
    };
    expect(isV1AbVariantConfig(v1AbConfig, "a")).toBe(true);
    expect(isV1AbVariantConfig(v1AbConfig, "b")).toBe(true);
    expect(getEffectiveTemplateId(v1AbConfig, "aTemplateId")).toBeUndefined();
    expect(getEffectiveTemplateId(v1AbConfig, "bTemplateId")).toBeUndefined();
    expect(summarize("action-send-email", v1AbConfig)).toBe(
      "A/B: No template selected vs No template selected (Reply rate)",
    );
  });

  test("no-template-selected warning toggles when a template is picked", async ({
    page,
  }) => {
    await page.goto("/");
    await addNode(page, "action-send-email");
    await addNode(page, "action-exit");
    await fitView(page);

    const trigger = page.locator('[data-node-category="trigger"]').first();
    const email = sendEmailNodes(page).first();
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

    await expect(page.getByTestId("validation-no-template-selected")).toHaveCount(
      1,
    );

    await email.click();
    await selectOption(
      page,
      "field-templateId",
      "option-templateId-single-touch-v1",
    );
    await expect(page.getByTestId("validation-no-template-selected")).toHaveCount(
      0,
    );
  });

  test("Template Builder link opens the coming-soon stub page", async ({
    page,
  }) => {
    await page.goto("/");
    await addNode(page, "action-send-email");
    await sendEmailNodes(page).first().click();

    await page.getByTestId("template-builder-link").click();
    await expect(page).toHaveURL(/\/template-builder$/);
    await expect(page.getByRole("heading")).toHaveText(
      "Template Builder — coming soon",
    );
  });

  test("template dropdown filters by step position and family size (§3.2)", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    for (let i = 0; i < 3; i += 1) {
      await addNode(page, "action-send-email");
      await addNode(page, "action-wait");
    }
    await addNode(page, "action-exit");
    await fitView(page);

    const trigger = page.locator('[data-node-category="trigger"]').first();
    const emails = sendEmailNodes(page);
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

    await fitView(page);
    await page.waitForTimeout(400);

    await emails.nth(0).click();
    await expect(page.getByTestId("field-templateId")).toBeVisible();

    await page.getByTestId("field-templateId").click();
    await expect(
      page.getByTestId("option-templateId-cold-open-3-v1"),
    ).toBeVisible();
    await expect(
      page.getByTestId("option-templateId-cold-open-5-v1"),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");

    await emails.nth(1).click();
    await expect(page.getByTestId("field-templateId")).toBeVisible();
    await page.getByTestId("field-templateId").click();
    await expect(
      page.getByTestId("option-templateId-follow-up-3-v1"),
    ).toBeVisible();
    await expect(
      page.getByTestId("option-templateId-cold-open-3-v1"),
    ).toHaveCount(0);
  });

  test("template dropdown options update live when canvas topology changes (§3.2)", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await addNode(page, "action-send-email");
    await addNode(page, "action-exit");
    await fitView(page);

    const trigger = page.locator('[data-node-category="trigger"]').first();
    const email = sendEmailNodes(page).first();
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
    await expect(page.getByTestId("field-templateId")).toBeVisible();

    await page.getByTestId("field-templateId").click();
    await expect(
      page.getByTestId("option-templateId-single-touch-v1"),
    ).toBeVisible();
    await expect(
      page.getByTestId("option-templateId-cold-open-3-v1"),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");

    // Extend to a 3-step family while the Send Email config panel stays open.
    await page.getByTestId("palette-item-action-send-email").click();
    await page.getByTestId("palette-item-action-wait").click();
    await page.getByTestId("palette-item-action-send-email").click();
    await page.getByTestId("palette-item-action-wait").click();
    await page.getByTestId("palette-item-action-send-email").click();
    await fitView(page);

    const emails = sendEmailNodes(page);
    const waits = page.locator(NODE).filter({ hasText: "Wait / Delay" });

    await connectHandles(
      page,
      email.getByTestId("handle-source"),
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
      waits
        .nth(1)
        .getByTestId("handle-source"),
      emails.nth(2).getByTestId("handle-target"),
    );
    await connectHandles(
      page,
      emails.nth(2).getByTestId("handle-source"),
      exit.getByTestId("handle-target"),
    );

    await expect(page.getByTestId("field-templateId")).toBeVisible();

    await page.getByTestId("field-templateId").click();
    await expect(
      page.getByTestId("option-templateId-cold-open-3-v1"),
    ).toBeVisible();
    await expect(
      page.getByTestId("option-templateId-single-touch-v1"),
    ).toHaveCount(0);
  });
});
