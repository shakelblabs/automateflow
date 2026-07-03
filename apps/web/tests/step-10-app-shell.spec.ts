import { expect, test } from "@playwright/test";

import { trackConsoleErrors } from "./helpers";

test.describe("Step 10 — App shell", () => {
  test("renders icon-rail sidebar and global top bar without console errors", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");

    const sidebar = page.getByTestId("app-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveCSS("width", "68px");

    await expect(page.getByTestId("global-top-bar")).toBeVisible();
    await expect(page.getByTestId("global-top-bar")).toContainText(
      "Campaign Builder",
    );
    await expect(page.getByTestId("user-menu")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Campaign Canvas header renders below global bar unchanged", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("campaign-name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Test run" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  });

  test("sidebar navigation works between Campaign Builder and Sender Accounts", async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    await page.goto("/");

    await page.getByTestId("nav-sender-accounts").click();
    await expect(page).toHaveURL("/sender-accounts");
    await expect(page.getByText("Sender Accounts").first()).toBeVisible();

    await page.getByTestId("nav-campaign-builder").click();
    await expect(page).toHaveURL("/");
    await expect(page.locator(".react-flow")).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("canvas state persists when navigating away and back", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("workflow-node")).toHaveCount(1);
    const initialCount = 1;

    await page.getByTestId("palette-item-action-wait").click();
    await expect(page.getByTestId("workflow-node")).toHaveCount(
      initialCount + 1,
    );

    await page.getByTestId("nav-sender-accounts").click();
    await page.getByTestId("nav-campaign-builder").click();

    await expect(page.getByTestId("workflow-node")).toHaveCount(
      initialCount + 1,
    );
  });

  test("coming-soon nav items are disabled with tooltips", async ({
    page,
  }) => {
    await page.goto("/");

    const dashboard = page.getByTestId("nav-dashboard");
    await expect(dashboard).toHaveAttribute("aria-disabled", "true");
    await expect(dashboard).toHaveAttribute("title", "Coming soon");

    const leads = page.getByTestId("nav-leads");
    await expect(leads).toHaveAttribute("aria-disabled", "true");
    await expect(leads).toHaveAttribute("title", "Coming soon");
  });

  test("Template Builder nav links to the Template Builder page", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("nav-template-builder").click();
    await expect(page).toHaveURL("/template-builder");
    await expect(
      page.getByRole("heading", { name: "Template Builder" }),
    ).toBeVisible();
    await expect(page.getByTestId("template-family-list")).toBeVisible();
  });
});
