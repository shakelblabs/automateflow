import { expect, test, type Page } from "@playwright/test";

import { checkSequenceFit } from "../src/lib/template-sequence-fit";
import { checkSpamScore } from "../src/lib/template-spam-score";
import { generateTemplateCopy } from "../src/lib/template-ai-generate";
import {
  connectHandles,
  fitView,
} from "./helpers";

const consoleErrors: string[] = [];

async function startFamilySetup(
  page: Page,
  familyName: string,
  size: 1 | 3 | 5,
) {
  await page.getByTestId("create-new-family").click();
  await page.getByTestId("family-name-input").fill(familyName);
  await page.getByTestId("family-size-select").click();
  await page.getByTestId(`family-size-${size}`).click();
  await page.getByTestId("family-setup-continue").click();
  await expect(page.getByTestId("family-editor")).toBeVisible();
}

test.describe("Step 12 — Template Builder", () => {
  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.goto("/template-builder");
  });

  test.afterEach(() => {
    expect(consoleErrors).toEqual([]);
  });

  test("list view groups seed families with fill progress", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Template Builder" })).toBeVisible();
    await expect(page.getByTestId("template-family-list")).toBeVisible();
    await expect(page.getByTestId("family-card-single-1")).toBeVisible();
    await expect(page.getByTestId("family-progress-single-1")).toHaveText(
      "1/1 steps filled",
    );
  });

  test("shows empty state when template library is reset", async ({ page }) => {
    await page.goto("/template-builder?templates=empty");
    await expect(page.getByTestId("template-family-empty")).toBeVisible();
    await expect(page.getByText("No template families yet")).toBeVisible();
  });

  test("create family flow saves a 1-step family", async ({ page }) => {
    await startFamilySetup(page, "Playwright Test Family", 1);

    await page.getByTestId("field-subject").fill("Hello from Playwright");
    await page.getByTestId("field-body").fill("Body copy for the test family.");
    await page.getByTestId("save-family").click();

    await expect(page.getByTestId("template-family-list")).toBeVisible();
    await expect(
      page.getByTestId("family-card-playwright-test-family"),
    ).toBeVisible();
  });

  test("create family flow saves a 5-step family", async ({ page }) => {
    await startFamilySetup(page, "Five Step Family", 5);

    await expect(page.getByTestId("step-tab-5")).toBeVisible();
    await page.getByTestId("field-subject").fill("Five step opener");
    await page.getByTestId("field-body").fill("First step body for five-step family.");
    await page.getByTestId("save-family").click();

    await expect(page.getByTestId("template-family-list")).toBeVisible();
    const card = page.getByTestId("family-card-five-step-family");
    await expect(card).toBeVisible();
    await expect(card).toContainText("5-Step sequence");
    await expect(page.getByTestId("family-progress-five-step-family")).toHaveText(
      "1/5 steps filled",
    );
  });

  test("Save Family allows partial fill with blank steps", async ({ page }) => {
    await startFamilySetup(page, "Partial Save Family", 3);

    await page.getByTestId("field-subject").fill("Only step one filled");
    await page.getByTestId("save-family").click();

    await expect(page.getByTestId("template-family-list")).toBeVisible();
    await expect(page.getByTestId("family-progress-partial-save-family")).toHaveText(
      "1/3 steps filled",
    );
  });

  test("variable token picker inserts {first_name} and disables personalization", async ({
    page,
  }) => {
    await startFamilySetup(page, "Token Test Family", 1);

    await page.getByTestId("field-body").fill("Hi ");
    await page.getByTestId("token-{first_name}").click();
    await expect(page.getByTestId("field-body")).toHaveValue("Hi {first_name}");

    const personalization = page.getByTestId("token-personalization");
    await expect(personalization).toBeDisabled();
    await expect(personalization).toHaveAttribute(
      "title",
      "Coming soon — AI-powered personalization from lead data",
    );
  });

  test("variable token picker inserts {last_name}, {company}, {job_title}, and {city}", async ({
    page,
  }) => {
    await startFamilySetup(page, "Remaining Tokens Family", 1);

    await page.getByTestId("field-body").fill("");
    await page.getByTestId("token-{last_name}").click();
    await expect(page.getByTestId("field-body")).toHaveValue("{last_name}");

    await page.getByTestId("field-body").fill("at ");
    await page.getByTestId("token-{company}").click();
    await expect(page.getByTestId("field-body")).toHaveValue("at {company}");

    await page.getByTestId("field-subject").fill("Role: ");
    await page.getByTestId("token-{job_title}").click();
    await expect(page.getByTestId("field-subject")).toHaveValue("Role: {job_title}");

    await page.getByTestId("field-body").fill("City: ");
    await page.getByTestId("token-{city}").click();
    await expect(page.getByTestId("field-body")).toHaveValue("City: {city}");
  });

  test("AI-Assist generates deterministic placeholder copy", async ({ page }) => {
    await startFamilySetup(page, "AI Assist Family", 1);

    await page.getByTestId("mode-ai").click();
    await page.getByTestId("field-aiPrompt").fill("Book a demo for outbound teams");
    await page.getByTestId("ai-generate-button").click();

    const expected = generateTemplateCopy(
      "Book a demo for outbound teams",
      "professional",
    );
    await expect(page.getByTestId("field-subject")).toHaveValue(expected.subject);
    await expect(page.getByTestId("field-body")).toHaveValue(expected.body);
  });

  test("Check Spam Score returns deterministic flagged words", async ({
    page,
  }) => {
    await startFamilySetup(page, "Spam Score Family", 1);

    await page.getByTestId("field-subject").fill("Act now — free offer!");
    await page.getByTestId("field-body").fill("Click here to buy now.");
    await page.getByTestId("check-spam-score").click();

    const result = checkSpamScore(
      "Act now — free offer!",
      "Click here to buy now.",
    );
    await expect(page.getByTestId("spam-score-result")).toContainText(
      `Score: ${result.score}/100`,
    );
    await expect(page.getByTestId("spam-score-result")).toContainText(
      `${result.risk} risk`,
    );
  });

  test("Check Tone & Sequence Fit shows step 1 sequence guidance", async ({
    page,
  }) => {
    await startFamilySetup(page, "Step One Guidance Family", 1);

    await page.getByTestId("check-sequence-fit").click();

    const result = checkSequenceFit({
      subject: "",
      body: "",
      tone: "professional",
      stepPosition: 1,
    });
    await expect(page.getByTestId("sequence-fit-result")).toContainText(
      result.stepGuidance,
    );
  });

  test("Check Tone & Sequence Fit flags repetition against prior step", async ({
    page,
  }) => {
    await startFamilySetup(page, "Sequence Fit Family", 3);

    await page.getByTestId("field-body").fill(
      "Hi there, we help teams automate outbound follow-up quickly.",
    );
    await page.getByTestId("step-tab-2").click();
    await page.getByTestId("field-body").fill(
      "Just following up — we help teams automate outbound follow-up quickly.",
    );
    await page.getByTestId("check-sequence-fit").click();

    const result = checkSequenceFit({
      subject: "",
      body: "Just following up — we help teams automate outbound follow-up quickly.",
      tone: "professional",
      stepPosition: 2,
      priorStep: {
        subject: "",
        body: "Hi there, we help teams automate outbound follow-up quickly.",
      },
    });
    await expect(page.getByTestId("sequence-fit-result")).toContainText(
      result.stepGuidance,
    );
    if (result.repetitionMessages[0]) {
      await expect(page.getByTestId("sequence-fit-result")).toContainText(
        result.repetitionMessages[0],
      );
    }
  });

  test("Check Tone & Sequence Fit shows step 3+ sequence guidance", async ({
    page,
  }) => {
    await startFamilySetup(page, "Step Three Guidance Family", 5);

    await page.getByTestId("step-tab-3").click();
    await page.getByTestId("check-sequence-fit").click();

    const result = checkSequenceFit({
      subject: "",
      body: "",
      tone: "professional",
      stepPosition: 3,
      priorStep: {
        subject: "",
        body: "Prior step content for context.",
      },
    });
    await expect(page.getByTestId("sequence-fit-result")).toContainText(
      result.stepGuidance,
    );
  });

  test("Check Tone & Sequence Fit shows tone-mismatch feedback", async ({
    page,
  }) => {
    await startFamilySetup(page, "Tone Mismatch Family", 1);

    const casualBody = "Hey!!! awesome yeah gonna be cool btw";
    await page.getByTestId("field-body").fill(casualBody);
    await page.getByTestId("check-sequence-fit").click();

    const result = checkSequenceFit({
      subject: "",
      body: casualBody,
      tone: "professional",
      stepPosition: 1,
    });
    expect(result.toneMessages.length).toBeGreaterThan(0);
    for (const message of result.toneMessages) {
      await expect(page.getByTestId("sequence-fit-result")).toContainText(message);
    }
  });

  test("edit existing family pre-fills and overwrites on save", async ({
    page,
  }) => {
    await page.getByTestId("family-card-single-1").click();
    await expect(page.getByTestId("family-editor")).toBeVisible();
    await page.getByTestId("field-subject").fill("Updated single touch subject");
    await page.getByTestId("save-family").click();
    await expect(page.getByTestId("template-family-list")).toBeVisible();

    await page.getByTestId("family-card-single-1").click();
    await expect(page.getByTestId("field-subject")).toHaveValue(
      "Updated single touch subject",
    );
  });

  test("templates created here appear in Campaign Canvas without refresh", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const familyName = "Live Wiring Family";

    await startFamilySetup(page, familyName, 1);
    await page.getByTestId("field-subject").fill("Live wiring subject");
    await page.getByTestId("field-body").fill("Live wiring body");
    await page.getByTestId("save-family").click();

    await page.getByTestId("nav-campaign-builder").click();
    await page.getByTestId("palette-item-action-send-email").click();
    await page.getByTestId("palette-item-action-exit").click();
    await fitView(page);

    const trigger = page.locator('[data-node-category="trigger"]').first();
    const email = page
      .locator('[data-testid="workflow-node"]')
      .filter({ hasText: "Send Email" })
      .first();
    const exit = page
      .locator('[data-testid="workflow-node"]')
      .filter({ hasText: "Exit Sequence" })
      .first();

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
    await page.getByTestId("field-templateId").click();
    await expect(
      page.getByTestId("option-templateId-custom-live-wiring-family-step-1"),
    ).toBeVisible();
  });
});
