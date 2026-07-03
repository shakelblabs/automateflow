import { expect, test } from "@playwright/test";

import { trackConsoleErrors } from "./helpers";

test.describe("Step 11 — Sender Accounts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sender-accounts");
  });

  test("renders account list with usage indicators and pool preview", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    const table = page.getByTestId("sender-accounts-table");

    await expect(table).toBeVisible();
    await expect(table.getByText("alex@outboundlabs.io")).toBeVisible();
    await expect(table.getByText("32/50 today")).toBeVisible();

    await expect(page.getByTestId("pool-visualization")).toBeVisible();
    await expect(
      page.getByText("Pool preview (illustrative)"),
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("adds a sender account via manual SMTP form", async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const table = page.getByTestId("sender-accounts-table");

    await page.getByTestId("add-sender-account").click();
    await expect(page.getByTestId("sender-account-dialog")).toBeVisible();

    await page.getByTestId("sender-email-input").fill("new@example.com");
    await page.getByTestId("smtp-host-input").fill("smtp.example.com");
    await page.getByTestId("smtp-port-input").fill("587");
    await page.getByTestId("smtp-username-input").fill("new@example.com");
    await page.getByTestId("smtp-password-input").fill("secret");

    await page.getByTestId("sender-account-save").click();

    await expect(page.getByTestId("sender-account-dialog")).toHaveCount(0);
    await expect(table.getByText("new@example.com")).toBeVisible();
    await expect(page.getByText("Sender account added")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("OAuth and Test Connection buttons are visible but disabled", async ({
    page,
  }) => {
    await page.getByTestId("add-sender-account").click();

    const google = page.getByTestId("oauth-google-inline");
    await expect(google).toBeVisible();
    await expect(google).toBeDisabled();
    await expect(google).toHaveAttribute(
      "title",
      "Coming soon — OAuth connection",
    );

    const outlook = page.getByTestId("oauth-outlook-inline");
    await expect(outlook).toBeVisible();
    await expect(outlook).toBeDisabled();

    const testConnection = page.getByTestId("test-connection");
    await expect(testConnection).toBeVisible();
    await expect(testConnection).toBeDisabled();
    await expect(testConnection).toHaveAttribute("title", "Coming soon");
  });

  test("edits an existing sender account", async ({ page }) => {
    const table = page.getByTestId("sender-accounts-table");

    await page.getByTestId("sender-account-row-sender-1").click();
    await expect(page.getByTestId("sender-account-dialog")).toBeVisible();

    await page.getByTestId("sender-email-input").fill("alex.updated@outboundlabs.io");
    await page.getByTestId("daily-cap-input").fill("75");
    await page.getByTestId("sender-account-save").click();

    await expect(table.getByText("alex.updated@outboundlabs.io")).toBeVisible();
    await expect(page.getByText("Sender account updated")).toBeVisible();
  });

  test("deletes a sender account after confirmation", async ({ page }) => {
    const table = page.getByTestId("sender-accounts-table");

    await page.getByTestId("sender-account-row-sender-2").click();
    await page.getByTestId("sender-account-delete").click();
    await expect(page.getByTestId("delete-sender-dialog")).toBeVisible();

    await page.getByTestId("delete-sender-confirm").click();

    await expect(table.getByText("team@growthmail.co")).toHaveCount(0);
    await expect(
      page.getByText("Sender account deleted", { exact: true }),
    ).toBeVisible();
  });

  test("shows empty state when all accounts are deleted", async ({ page }) => {
    while ((await page.getByTestId("sender-accounts-table").count()) > 0) {
      await page.getByTestId(/^sender-account-row-/).first().click();
      await page.getByTestId("sender-account-delete").click();
      await page.getByTestId("delete-sender-confirm").click();
    }

    await expect(page.getByTestId("sender-accounts-empty")).toBeVisible();
  });
});
