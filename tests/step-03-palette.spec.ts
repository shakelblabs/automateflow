import { expect, test } from "@playwright/test";

import { E2E_FIXTURE_PROMPT_V1_TAG_LEAD } from "../src/lib/ai-generate";
import { getNodeDefinition, summarize } from "../src/lib/node-definitions";
import { applyCanvasFixturePrompt, html5DragDrop, trackConsoleErrors } from "./helpers";

const NODE = '[data-testid="workflow-node"]';

test.describe("Step 3 — Palette wiring", () => {
  test("search filters palette items by name in real time", async ({
    page,
  }) => {
    await page.goto("/");

    // Baseline: multiple active items visible.
    await expect(page.getByTestId("palette-item-action-send-email")).toBeVisible();
    await expect(page.getByTestId("palette-item-action-wait")).toBeVisible();

    await page.getByLabel("Search steps").fill("Wait");

    await expect(page.getByTestId("palette-item-action-wait")).toBeVisible();
    await expect(
      page.getByTestId("palette-item-action-send-email"),
    ).toBeHidden();
    await expect(page.getByTestId("palette-item-trigger-new-lead")).toBeHidden();

    // Clearing restores the full list.
    await page.getByLabel("Search steps").fill("");
    await expect(
      page.getByTestId("palette-item-action-send-email"),
    ).toBeVisible();
  });

  test("search matching nothing shows an empty state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search steps").fill("zzzznope");
    await expect(page.getByTestId("palette-empty")).toBeVisible();
  });

  test("click-to-add places a node on the canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(NODE)).toHaveCount(1); // seeded trigger

    await page.getByTestId("palette-item-action-wait").click();

    await expect(page.locator(NODE)).toHaveCount(2);
    await expect(
      page.locator('[data-node-category="action"]').filter({
        hasText: "Wait / Delay",
      }),
    ).toBeVisible();
  });

  test("drag-and-drop adds a node to the canvas", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");
    await expect(page.locator(NODE)).toHaveCount(1);

    await html5DragDrop(
      page,
      '[data-testid="palette-item-action-send-email"]',
      ".react-flow__pane",
    );

    await expect(page.locator(NODE)).toHaveCount(2);
    await expect(
      page.locator('[data-node-category="action"]').filter({
        hasText: "Send Email",
      }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("deferred nodes render greyed under 'Coming soon' and cannot be added", async ({
    page,
  }) => {
    await page.goto("/");

    const deferredTypes = [
      "condition-opened",
      "condition-clicked",
      "condition-sentiment",
      // Tag Lead relocated to the Logic "Coming soon" section (v2 §5).
      "action-tag-lead",
    ];

    // Rendered under the Logic group's "Coming soon" subsection.
    await expect(page.getByTestId("palette-coming-soon-logic")).toBeVisible();

    for (const type of deferredTypes) {
      const item = page.getByTestId(`palette-deferred-${type}`);
      await expect(item).toBeVisible();
      // Tooltip on hover (Section 2.9).
      await expect(item).toHaveAttribute("title", "Available in a future release");
      // Greyed + not interactive.
      await expect(item).toHaveAttribute("aria-disabled", "true");
      // Not draggable (rendered as a plain div, no draggable attribute).
      await expect(item).not.toHaveAttribute("draggable", "true");
      // No active palette button exists for a deferred type.
      await expect(page.getByTestId(`palette-item-${type}`)).toHaveCount(0);
    }

    // Clicking a deferred item must not add a node to the canvas.
    await expect(page.locator(NODE)).toHaveCount(1);
    await page.getByTestId("palette-deferred-condition-opened").click();
    await page.waitForTimeout(200);
    await expect(page.locator(NODE)).toHaveCount(1);
  });

  test("palette scrolls independently so bottom 'Coming soon' items are reachable (v2 §1)", async ({
    page,
  }) => {
    // Emulate a short viewport at 100% zoom so palette content overflows.
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto("/");

    const viewport = page
      .getByTestId("workflow-steps-scroll")
      .locator('[data-slot="scroll-area-viewport"]');

    // The scroll region must be bounded (content taller than the visible box),
    // otherwise items below the fold are unreachable — the reported bug.
    const { scrollHeight, clientHeight } = await viewport.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(scrollHeight).toBeGreaterThan(clientHeight);

    // The last coming-soon item must be reachable via the palette's own scroll.
    const last = page.getByTestId("palette-deferred-condition-sentiment");
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
  });

  test("v1-shaped Tag Lead config still summarizes (§5 defensive)", () => {
    const v1Config = { tag: "interested" as const };
    expect(summarize("action-tag-lead", v1Config)).toBe("Tag as: Interested");

    const customConfig = { tag: "custom" as const, customTag: "Enterprise" };
    expect(summarize("action-tag-lead", customConfig)).toBe(
      "Tag as: Enterprise",
    );

    const definition = getNodeDefinition("action-tag-lead");
    expect(definition?.deferred).toBe(true);
    expect(definition?.category).toBe("action");
  });

  test("v1-shaped Tag Lead node renders on canvas without crashing (§5)", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");
    await applyCanvasFixturePrompt(page, E2E_FIXTURE_PROMPT_V1_TAG_LEAD);

    const tagNode = page.locator(NODE).filter({ hasText: "Tag Lead" });
    await expect(tagNode).toBeVisible();
    await expect(tagNode.getByTestId("node-summary")).toHaveText(
      "Tag as: Enterprise",
    );

    await tagNode.click();
    await expect(page.getByTestId("field-tag")).toBeVisible();
    await expect(page.getByTestId("palette-item-action-tag-lead")).toHaveCount(
      0,
    );

    expect(errors).toEqual([]);
  });
});
