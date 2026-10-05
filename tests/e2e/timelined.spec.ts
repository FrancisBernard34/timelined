import { test, expect, type APIRequestContext } from "@playwright/test";

// A period is unique per calendar month and the DB is shared, so these tests
// run serially and cooperate on one period.
test.describe.configure({ mode: "serial" });

const periodName = `E2E Period ${Date.now()}`;

async function clearPeriods(request: APIRequestContext) {
  const res = await request.get("/api/periods");
  if (!res.ok()) return;
  for (const period of await res.json()) {
    await request.delete(`/api/periods/${period.id}`);
  }
}

test("creates a period, adds a task, and it persists after reload", async ({
  page,
  request,
}) => {
  await clearPeriods(request);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Timelined" })).toBeVisible();

  // Create a period for the current month.
  await page.getByRole("button", { name: "New Period" }).click();
  await page.getByPlaceholder("Period name...").fill(periodName);
  await page.getByRole("button", { name: "Create" }).click();

  const bubble = page.getByText(periodName, { exact: true });
  await expect(bubble).toBeVisible();

  // Open its schedule and add a task.
  await bubble.click();
  await expect(
    page.getByRole("heading", { name: `${periodName} Schedule` }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Add New Task" }).click();
  const times = page.locator('input[type="time"]');
  await times.nth(0).fill("09:00");
  await times.nth(1).fill("09:30");
  await page.getByPlaceholder("Task name").fill("Morning standup");

  // The UI saves the schedule optimistically; wait for the PUT before reloading.
  const saved = page.waitForResponse(
    (response) =>
      response.url().includes("/schedule") &&
      response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(page.getByText("Morning standup")).toBeVisible();
  await saved;

  // Reload: data must come back from the API, not local state.
  await page.reload();
  const bubbleAfterReload = page.getByText(periodName, { exact: true });
  await expect(bubbleAfterReload).toBeVisible();
  await bubbleAfterReload.click();
  await expect(page.getByText("Morning standup")).toBeVisible();
});

test("rejects a second period for the same month", async ({ page, request }) => {
  // Guarantee a period exists for the current month (409 if one already does).
  await request.post("/api/periods", {
    data: {
      name: "Seed",
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    },
  });

  await page.goto("/");
  await page.getByRole("button", { name: "New Period" }).click();
  await page.getByPlaceholder("Period name...").fill("Duplicate attempt");

  const dialogPromise = page.waitForEvent("dialog");
  await page.getByRole("button", { name: "Create" }).click();

  const dialog = await dialogPromise;
  expect(dialog.message()).toContain("already exists");
  await dialog.accept();
});

test("deletes the period", async ({ page }) => {
  await page.goto("/");
  await page.getByText(periodName, { exact: true }).click();
  await page.getByRole("button", { name: "Delete Period" }).click();

  const deleted = page.waitForResponse(
    (response) =>
      response.url().includes("/api/periods/") &&
      response.request().method() === "DELETE",
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await deleted;

  await expect(page.getByText(periodName, { exact: true })).toHaveCount(0);
});
