import { expect, type ConsoleMessage, type Locator, type Page } from "@playwright/test";

/**
 * Collects console errors during a test so specs can assert the spec's
 * "no console errors" acceptance criterion (Section 5).
 */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/**
 * Applies a deterministic canvas fixture via the Generate-with-AI entry point.
 * Used for backward-compat render tests that cannot use the palette (deferred nodes).
 */
export async function applyCanvasFixturePrompt(page: Page, prompt: string) {
  await page.getByRole("button", { name: "Generate with AI" }).click();
  await expect(page.getByTestId("generate-dialog")).toBeVisible();
  await page.getByTestId("generate-input").fill(prompt);
  await page.getByTestId("generate-submit").click();
  await expect(page.getByTestId("generate-dialog")).toHaveCount(0);
}

/**
 * Simulates an HTML5 drag-and-drop with a real DataTransfer, since Playwright's
 * mouse-based dragTo does not populate `dataTransfer` (which the canvas reads
 * via the `application/reactflow` MIME type).
 */
export async function html5DragDrop(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
) {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await page.dispatchEvent(sourceSelector, "dragstart", { dataTransfer });
  await page.dispatchEvent(targetSelector, "dragover", { dataTransfer });
  await page.dispatchEvent(targetSelector, "drop", { dataTransfer });
  await page.dispatchEvent(sourceSelector, "dragend", { dataTransfer });
}

/** Fit all nodes into view (moves them away from the top validation banner). */
export async function fitView(page: Page) {
  await page.locator(".react-flow__controls-fitview").click();
  await page.waitForTimeout(300);
}

/**
 * Draws a React Flow connection by dragging from a source handle to a target
 * handle using real pointer/mouse events (React Flow connections are not HTML5
 * drag-and-drop).
 */
export async function connectHandles(
  page: Page,
  source: Locator,
  target: Locator,
) {
  await source.scrollIntoViewIfNeeded();
  const s = await source.boundingBox();
  const t = await target.boundingBox();
  if (!s || !t) throw new Error("Cannot connect: handle bounding box missing");

  const sx = s.x + s.width / 2;
  const sy = s.y + s.height / 2;
  const tx = t.x + t.width / 2;
  const ty = t.y + t.height / 2;

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // Arm the connection with a small initial move before heading to the target.
  await page.mouse.move(sx, sy + 12, { steps: 4 });
  await page.mouse.move(tx, ty, { steps: 20 });
  await page.mouse.move(tx, ty);
  await page.mouse.up();
  await page.waitForTimeout(200);
}
