import { expect, test } from "@playwright/test";

import { trackConsoleErrors } from "./helpers";

test.describe("Step 9 — Save as Campaign Template", () => {
  test("Save as Campaign Template opens the naming dialog", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("save-template-dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Save as Campaign Template" })
      .click();
    await expect(page.getByTestId("save-template-dialog")).toBeVisible();
    await expect(page.getByTestId("save-template-name-input")).toBeVisible();
  });

  test("blank name keeps Save disabled; Esc closes without saving", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: "Save as Campaign Template" })
      .click();
    await expect(page.getByTestId("save-template-submit")).toBeDisabled();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("save-template-dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Saved Templates" }).click();
    await expect(page.getByTestId("blueprint-list-empty")).toBeVisible();
  });

  test("named save stores blueprint visible in read-only list", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");

    await page
      .getByRole("button", { name: "Save as Campaign Template" })
      .click();
    await page
      .getByTestId("save-template-name-input")
      .fill("Standard 5-Touch Cold Outreach");
    await page.getByTestId("save-template-submit").click();
    await expect(page.getByTestId("save-template-dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Saved Templates" }).click();
    await expect(page.getByTestId("blueprint-list-dialog")).toBeVisible();
    const list = page.getByTestId("blueprint-list");
    await expect(
      list.getByText("Standard 5-Touch Cold Outreach"),
    ).toBeVisible();
    await expect(page.getByTestId("blueprint-list-empty")).toHaveCount(0);

    // Read-only: no load/apply actions.
    await expect(
      page.getByRole("button", { name: /apply|load|start campaign/i }),
    ).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test("multiple saves accumulate in the list", async ({ page }) => {
    await page.goto("/");

    for (const name of ["First Blueprint", "Second Blueprint"]) {
      await page
        .getByRole("button", { name: "Save as Campaign Template" })
        .click();
      await page.getByTestId("save-template-name-input").fill(name);
      await page.getByTestId("save-template-submit").click();
      await expect(page.getByTestId("save-template-dialog")).toHaveCount(0);
    }

    await page.getByRole("button", { name: "Saved Templates" }).click();
    const list = page.getByTestId("blueprint-list");
    await expect(list.getByText("First Blueprint")).toBeVisible();
    await expect(list.getByText("Second Blueprint")).toBeVisible();
  });
});
