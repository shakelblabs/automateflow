import { expect, test } from "@playwright/test";

import { trackConsoleErrors } from "./helpers";

test.describe("Step 1 — Layout shell", () => {
  test("renders the three-panel layout without console errors", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");

    // Left palette (Section 1).
    await expect(
      page.getByRole("heading", { name: "Workflow steps" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search steps…")).toBeVisible();

    // Middle canvas.
    await expect(page.locator(".react-flow")).toBeVisible();

    // Right inspector — "No step selected" state.
    await expect(page.getByText("No step selected")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("campaign name is editable inline", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("campaign-name").click();
    const input = page.getByTestId("campaign-name-input");
    await expect(input).toBeVisible();
    await input.fill("Enterprise Nurture");
    await input.press("Enter");

    await expect(page.getByTestId("campaign-name")).toHaveText(
      "Enterprise Nurture",
    );
  });

  test("subtitle is editable inline", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("campaign-subtitle").click();
    const input = page.getByTestId("campaign-subtitle-input");
    await input.fill("Warm inbound · 3 touches");
    await input.press("Enter");

    await expect(page.getByTestId("campaign-subtitle")).toHaveText(
      "Warm inbound · 3 touches",
    );
  });

  test("status badge cycles Draft → Active → Paused", async ({ page }) => {
    await page.goto("/");

    const badge = page.getByTestId("status-badge");
    await expect(badge).toHaveText("Draft");
    await badge.click();
    await expect(badge).toHaveText("Active");
    await badge.click();
    await expect(badge).toHaveText("Paused");
    await badge.click();
    await expect(badge).toHaveText("Draft");
  });

  test("inspector toggles between its two states (select node, Esc to clear)", async ({
    page,
  }) => {
    await page.goto("/");

    // State 1: no selection.
    await expect(page.getByText("No step selected")).toBeVisible();

    // Select the seeded entry-trigger node → State 2: node config.
    await page.getByTestId("workflow-node").first().click();
    await expect(page.getByText("No step selected")).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "New Lead Added" }),
    ).toBeVisible();

    // Esc returns to State 1 (Section 1).
    await page.keyboard.press("Escape");
    await expect(page.getByText("No step selected")).toBeVisible();
  });
});
