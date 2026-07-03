import { expect, test, type Locator, type Page } from "@playwright/test";

import { generateSequence } from "../src/lib/ai-generate";
import { fitView, trackConsoleErrors } from "./helpers";

const NODE = '[data-testid="workflow-node"]';

function nodesByLabel(page: Page, label: string): Locator {
  return page.locator(NODE).filter({ hasText: label });
}

async function openGenerate(page: Page) {
  await page.getByRole("button", { name: "Generate with AI" }).click();
  await expect(page.getByTestId("generate-dialog")).toBeVisible();
}

async function generate(page: Page, prompt: string) {
  await openGenerate(page);
  await page.getByTestId("generate-input").fill(prompt);
  await page.getByTestId("generate-submit").click();
  await expect(page.getByTestId("generate-dialog")).toHaveCount(0);
}

async function expectAllSendEmailsEmpty(page: Page) {
  const emails = nodesByLabel(page, "Send Email");
  const count = await emails.count();
  for (let i = 0; i < count; i += 1) {
    await expect(emails.nth(i).getByTestId("node-summary")).toHaveText(
      "No template selected",
    );
  }
}

test.describe("Step 7 — AI chat-to-canvas generation", () => {
  test("generateSequence produces v2 empty-template Send Email configs (§4.1)", () => {
    const sequence = generateSequence("3 touches");
    const emails = sequence.steps.filter(
      (step) => step.type === "action-send-email",
    );
    expect(emails.length).toBe(3);

    for (const step of emails) {
      const config = step.config ?? {};
      expect(config.templateId).toBeUndefined();
      expect(config.aTemplateId).toBeUndefined();
      expect(config.bTemplateId).toBeUndefined();
      expect(config.mode).toBeUndefined();
      expect(config.subject).toBeUndefined();
      expect(config.body).toBeUndefined();
      expect(config.aiPrompt).toBeUndefined();
    }

    const trigger = sequence.steps.find(
      (step) => step.type === "trigger-new-lead",
    );
    expect(trigger?.config?.leadList).toBeTruthy();
  });

  test("the Generate with AI button opens and closes the chat input", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("generate-dialog")).toHaveCount(0);
    await openGenerate(page);
    await expect(page.getByTestId("generate-input")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("generate-dialog")).toHaveCount(0);

    await openGenerate(page);
    await page.getByTestId("generate-example-0").click();
    await expect(page.getByTestId("generate-input")).toHaveValue(
      "Cold outreach, 4 touches, stop if they reply",
    );
    await page.getByTestId("generate-cancel").click();
    await expect(page.getByTestId("generate-dialog")).toHaveCount(0);
  });

  test("prompt with touches + reply branch builds the full branched sequence", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");

    await generate(page, "Cold outreach, 4 touches, stop if they reply");

    await expect(nodesByLabel(page, "New Lead Added")).toHaveCount(1);
    await expect(nodesByLabel(page, "Send Email")).toHaveCount(4);
    await expect(nodesByLabel(page, "Wait / Delay")).toHaveCount(4);
    await expect(nodesByLabel(page, "Condition: Replied?")).toHaveCount(1);
    await expect(nodesByLabel(page, "Handoff: Unibox")).toHaveCount(1);
    await expect(nodesByLabel(page, "Exit Sequence")).toHaveCount(1);

    await expect(page.getByText("Yes", { exact: true }).first()).toBeVisible();

    await expectAllSendEmailsEmpty(page);
    await expect(page.getByTestId("validation-no-template-selected")).toHaveCount(
      4,
    );
    await expect(page.getByTestId("validation-no-lead-list")).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("a different prompt produces a distinct, linear sequence (no branch)", async ({
    page,
  }) => {
    await page.goto("/");

    await generate(page, "3 follow-up emails then exit");

    await expect(nodesByLabel(page, "Send Email")).toHaveCount(3);
    await expect(nodesByLabel(page, "Wait / Delay")).toHaveCount(3);
    await expect(nodesByLabel(page, "Exit Sequence")).toHaveCount(1);
    await expect(nodesByLabel(page, "Condition: Replied?")).toHaveCount(0);
    await expect(nodesByLabel(page, "Handoff: Unibox")).toHaveCount(0);

    await expectAllSendEmailsEmpty(page);
    await expect(page.getByTestId("validation-no-template-selected")).toHaveCount(
      3,
    );
  });

  test("regenerating replaces the canvas rather than appending", async ({
    page,
  }) => {
    await page.goto("/");

    await generate(page, "4 touches");
    await expect(nodesByLabel(page, "Send Email")).toHaveCount(4);

    await generate(page, "2 touches");
    await expect(nodesByLabel(page, "Send Email")).toHaveCount(2);
    await expect(page.getByTestId("validation-no-template-selected")).toHaveCount(
      2,
    );
  });

  test("a generated node opens the same config form as a manually-added one, and stays editable", async ({
    page,
  }) => {
    await page.goto("/");

    await generate(page, "2 follow-up emails");
    await fitView(page);
    await nodesByLabel(page, "Send Email").first().click({ force: true });

    const generatedFormFields = [
      "template-selector",
      "field-templateId",
      "template-builder-link",
      "ab-toggle",
    ];
    for (const id of generatedFormFields) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
    await expect(page.getByTestId("mode-manual")).toHaveCount(0);
    await expect(page.getByTestId("mode-ai")).toHaveCount(0);
    await expect(page.getByTestId("field-subject")).toHaveCount(0);
    await expect(page.getByTestId("field-body")).toHaveCount(0);
    await expect(
      nodesByLabel(page, "Send Email").first().getByTestId("node-summary"),
    ).toHaveText("No template selected");

    await nodesByLabel(page, "Wait / Delay").first().click();
    await page.getByTestId("field-duration").fill("5");
    await expect(
      nodesByLabel(page, "Wait / Delay").first().getByTestId("node-summary"),
    ).toHaveText("Wait 5 days");

    await page.reload();
    await page.getByTestId("palette-item-action-send-email").click();
    await nodesByLabel(page, "Send Email").first().click();
    for (const id of generatedFormFields) {
      await expect(page.getByTestId(id)).toBeVisible();
    }
  });
});
