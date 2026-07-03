import { expect, test, type Page } from "@playwright/test";

import { connectHandles, fitView, trackConsoleErrors } from "./helpers";

const NODE = '[data-testid="workflow-node"]';
const EDGE = ".react-flow__edge";

function nodeByText(page: Page, label: string) {
  return page.locator(NODE).filter({ hasText: label }).first();
}

async function addNode(page: Page, type: string) {
  await page.getByTestId(`palette-item-${type}`).click();
}

test.describe("Step 5 — Connectors & branching", () => {
  test("connecting two nodes renders an edge", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");
    await addNode(page, "action-send-email");
    await fitView(page);

    await expect(page.locator(EDGE)).toHaveCount(0);

    const trigger = page.locator('[data-node-category="trigger"]').first();
    const sendEmail = nodeByText(page, "Send Email");
    await connectHandles(
      page,
      trigger.getByTestId("handle-source"),
      sendEmail.getByTestId("handle-target"),
    );

    await expect(page.locator(EDGE)).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("no-entry-trigger warning appears when the entry trigger is removed", async ({
    page,
  }) => {
    await page.goto("/");

    // Entry trigger present at load → no warning.
    await expect(page.getByTestId("validation-no-entry-trigger")).toHaveCount(0);

    // Delete the only entry trigger.
    await page.locator('[data-node-category="trigger"]').first().click();
    await page.getByTestId("delete-node-btn").click();

    await expect(page.getByTestId("validation-no-entry-trigger")).toHaveCount(1);

    // Re-add it → warning clears.
    await addNode(page, "trigger-new-lead");
    await expect(page.getByTestId("validation-no-entry-trigger")).toHaveCount(0);
  });

  test("no-lead-list warning toggles with the lead list selection (v2 §2)", async ({
    page,
  }) => {
    await page.goto("/");

    // Seeded trigger loads with a lead list selected → no warning.
    await expect(page.getByTestId("validation-no-lead-list")).toHaveCount(0);

    // Clear the selection is not possible via the empty option, so re-add a
    // fresh entry trigger (added with no default lead list) to hit the warning.
    await page.locator('[data-node-category="trigger"]').first().click();
    await page.getByTestId("delete-node-btn").click();
    await addNode(page, "trigger-new-lead");
    await expect(page.getByTestId("validation-no-lead-list")).toHaveCount(1);

    // Selecting a list clears the warning.
    await page.locator('[data-node-category="trigger"]').first().click();
    await page.getByTestId("field-leadList").click();
    await page.getByTestId("option-leadList-q2-saas-founders").click();
    await expect(page.getByTestId("validation-no-lead-list")).toHaveCount(0);
  });

  test("dead-end warning clears when a node is connected onward", async ({
    page,
  }) => {
    await page.goto("/");

    // Seeded trigger has no outgoing connection → one dead-end.
    await expect(page.getByTestId("validation-dead-end")).toHaveCount(1);

    await addNode(page, "action-exit");
    await fitView(page);

    // Exit is terminal — adding it does NOT add a dead-end (still just trigger).
    await expect(page.getByTestId("validation-dead-end")).toHaveCount(1);

    // Connect trigger → Exit. Trigger now has an outgoing edge; Exit is terminal.
    const trigger = page.locator('[data-node-category="trigger"]').first();
    const exit = nodeByText(page, "Exit Sequence");
    await connectHandles(
      page,
      trigger.getByTestId("handle-source"),
      exit.getByTestId("handle-target"),
    );

    // No dead-ends remain.
    await expect(page.getByTestId("validation-dead-end")).toHaveCount(0);
  });

  test("terminal nodes never raise a false dead-end warning", async ({
    page,
  }) => {
    await page.goto("/");
    await addNode(page, "action-exit");
    await addNode(page, "handoff-unibox");

    // Canvas: trigger (dead-end) + Exit (terminal) + Handoff (terminal).
    // Only the trigger should be flagged.
    await expect(page.getByTestId("validation-dead-end")).toHaveCount(1);
    const banner = page.getByTestId("validation-banner");
    await expect(banner).not.toContainText("Exit Sequence");
    await expect(banner).not.toContainText("Handoff: Unibox");
  });

  test("unconnected Yes-path warning toggles, and the Yes edge is labeled", async ({
    page,
  }) => {
    await page.goto("/");
    await addNode(page, "condition-replied");
    // Tag Lead is now deferred; use Handoff: Unibox as the Yes-path terminal.
    await addNode(page, "handoff-unibox");
    await fitView(page);

    // Condition's Yes-path is not connected.
    await expect(page.getByTestId("validation-unconnected-yes")).toHaveCount(1);

    const condition = page.locator('[data-node-category="logic"]').first();
    const handoff = nodeByText(page, "Handoff: Unibox");
    await connectHandles(
      page,
      condition.getByTestId("handle-yes"),
      handoff.getByTestId("handle-target"),
    );

    // Warning clears and the edge carries a "Yes" label.
    await expect(page.getByTestId("validation-unconnected-yes")).toHaveCount(0);
    await expect(page.locator('[data-branch="yes"]')).toBeVisible();
  });

  test("deleting a node removes its edges cleanly (no orphans)", async ({
    page,
  }) => {
    await page.goto("/");
    await addNode(page, "action-send-email");
    await fitView(page);

    const trigger = page.locator('[data-node-category="trigger"]').first();
    const sendEmail = nodeByText(page, "Send Email");
    await connectHandles(
      page,
      trigger.getByTestId("handle-source"),
      sendEmail.getByTestId("handle-target"),
    );
    await expect(page.locator(EDGE)).toHaveCount(1);
    await expect(page.locator(NODE)).toHaveCount(2);

    // Delete the connected node.
    await sendEmail.click();
    await page.getByTestId("delete-node-btn").click();

    await expect(page.locator(NODE)).toHaveCount(1);
    await expect(page.locator(EDGE)).toHaveCount(0);
  });
});
