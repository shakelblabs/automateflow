import { expect, test, type Page } from "@playwright/test";

import { trackConsoleErrors } from "./helpers";

async function addNode(page: Page, type: string) {
  await page.getByTestId(`palette-item-${type}`).click();
}

test.describe("Step 2 — Custom node components", () => {
  test("seeded trigger node uses the Trigger component (source handle, no target)", async ({
    page,
  }) => {
    await page.goto("/");

    const trigger = page.locator('[data-node-category="trigger"]').first();
    await expect(trigger).toBeVisible();
    // Entry trigger has an output but no input handle.
    await expect(trigger.getByTestId("handle-source")).toBeVisible();
    await expect(trigger.locator(".react-flow__handle-top")).toHaveCount(0);
  });

  test("each category renders its own distinct component", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");

    await addNode(page, "action-send-email"); // action
    await addNode(page, "condition-replied"); // logic
    await addNode(page, "handoff-unibox"); // handoff

    await expect(page.locator('[data-node-category="trigger"]')).toHaveCount(1);
    await expect(page.locator('[data-node-category="action"]')).toHaveCount(1);
    await expect(page.locator('[data-node-category="logic"]')).toHaveCount(1);
    await expect(page.locator('[data-node-category="handoff"]')).toHaveCount(1);

    expect(errors).toEqual([]);
  });

  test("Condition: Replied? renders two named Yes/No handles", async ({
    page,
  }) => {
    await page.goto("/");
    await addNode(page, "condition-replied");

    const condition = page.locator('[data-node-category="logic"]').first();
    await expect(condition).toHaveAttribute("data-branching", "true");

    // Two distinct source handles with ids `yes` and `no`.
    await expect(condition.getByTestId("handle-yes")).toBeVisible();
    await expect(condition.getByTestId("handle-no")).toBeVisible();
    // Rendered by React Flow with the handle ids we passed.
    await expect(condition.locator('[data-handleid="yes"]')).toHaveCount(1);
    await expect(condition.locator('[data-handleid="no"]')).toHaveCount(1);

    // Visible branch labels.
    await expect(condition.getByTestId("branch-label-yes")).toHaveText("Yes");
    await expect(condition.getByTestId("branch-label-no")).toHaveText("No");
  });

  test("terminal nodes (Exit, Handoff) have no outgoing handle", async ({
    page,
  }) => {
    await page.goto("/");
    await addNode(page, "action-exit");
    await addNode(page, "handoff-unibox");

    const exit = page.locator('[data-node-category="action"]').filter({
      hasText: "Exit Sequence",
    });
    await expect(exit).toBeVisible();
    await expect(exit.getByTestId("handle-source")).toHaveCount(0);

    const handoff = page.locator('[data-node-category="handoff"]').first();
    await expect(handoff.getByTestId("handle-source")).toHaveCount(0);
    // Handoff still accepts an incoming connection.
    await expect(handoff.locator(".react-flow__handle-top")).toHaveCount(1);
  });
});
