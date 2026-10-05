import { test, expect, type Page } from "@playwright/test";

// A period is unique per calendar month and each test gets a fresh browser
// context, so we re-authenticate a shared account before every test, then
// cooperate on data within the serial run.
test.describe.configure({ mode: "serial" });

const email = `e2e-${Date.now()}@test.dev`;
const password = "password123";

async function authenticate(page: Page) {
  const signup = await page.request.post("/api/auth/signup", {
    data: { email, password, name: "E2E User" },
  });

  if (signup.status() === 409) {
    const login = await page.request.post("/api/auth/login", {
      data: { email, password },
    });
    expect(login.ok()).toBeTruthy();
  } else {
    expect(signup.ok()).toBeTruthy();
  }
}

async function clearPeriods(page: Page) {
  const res = await page.request.get("/api/periods");
  if (!res.ok()) return;
  for (const period of await res.json()) {
    await page.request.delete(`/api/periods/${period.id}`);
  }
}

test.beforeEach(async ({ page }) => {
  await authenticate(page);
  await clearPeriods(page);
});

test("rejects unauthenticated API requests", async ({ playwright }) => {
  const anon = await playwright.request.newContext({
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
  });
  const res = await anon.get("/api/periods");
  expect(res.status()).toBe(401);
  await anon.dispose();
});

test("redirects the root to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});

test("renders in Portuguese at /pt-br", async ({ page }) => {
  await page.goto("/pt-br");
  await expect(
    page.getByRole("button", { name: "Novo Período" }),
  ).toBeVisible();
});

test("switches language with the locale switcher", async ({ page }) => {
  await page.goto("/en");
  await page.getByLabel("Language").selectOption("pt-br");
  await expect(page).toHaveURL(/\/pt-br$/);
  await expect(
    page.getByRole("button", { name: "Novo Período" }),
  ).toBeVisible();
});

test("has a working theme toggle on the login screen", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Log out" }).click();

  const toggle = page.getByRole("button", { name: "Toggle theme" });
  await expect(toggle).toBeVisible();
  await toggle.click();

  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("signs up a new user through the UI", async ({ page }) => {
  const fresh = `ui-${Date.now()}@test.dev`;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Timelined" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await page.getByRole("button", { name: "Need an account? Sign up" }).click();

  await page.getByLabel("Name").fill("UI User");
  await page.getByLabel("Email").fill(fresh);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Timelined" })).toBeVisible();
});

test("creates a period, adds a task, and it persists after reload", async ({
  page,
}) => {
  const periodName = `E2E Period ${Date.now()}`;

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Timelined" })).toBeVisible();

  await page.getByRole("button", { name: "New Period" }).click();
  await page.getByPlaceholder("Period name...").fill(periodName);
  await page.getByRole("button", { name: "Create" }).click();

  const bubble = page.getByText(periodName, { exact: true });
  await expect(bubble).toBeVisible();
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

  await page.reload();
  const bubbleAfterReload = page.getByText(periodName, { exact: true });
  await expect(bubbleAfterReload).toBeVisible();
  await bubbleAfterReload.click();
  await expect(page.getByText("Morning standup")).toBeVisible();
});

test("edits an existing task inline", async ({ page }) => {
  const periodName = `Edit ${Date.now()}`;

  await page.goto("/");
  const day = await page.evaluate(() => new Date().getDay());
  const month = await page.evaluate(() => new Date().getMonth());
  const year = await page.evaluate(() => new Date().getFullYear());

  const created = await page.request.post("/api/periods", {
    data: { name: periodName, month, year },
  });
  const period = await created.json();
  await page.request.put(`/api/periods/${period.id}/schedule`, {
    data: {
      tasks: [
        { name: "Old name", dayOfWeek: day, startTime: "09:00", endTime: "10:00" },
      ],
    },
  });

  await page.reload();
  await page.getByText(periodName, { exact: true }).click();
  await expect(page.getByText("Old name")).toBeVisible();

  await page.getByRole("button", { name: "Edit task" }).click();
  await page.getByLabel("Task name").fill("New name");

  const saved = page.waitForResponse(
    (response) =>
      response.url().includes("/schedule") &&
      response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save task" }).click();
  await saved;

  await expect(page.getByText("New name")).toBeVisible();

  await page.reload();
  await page.getByText(periodName, { exact: true }).click();
  await expect(page.getByText("New name")).toBeVisible();
});

test("moves a task to another day by dragging it", async ({ page }) => {
  const periodName = `Drag ${Date.now()}`;

  await page.goto("/");
  const today = await page.evaluate(() => new Date().getDay());
  const month = await page.evaluate(() => new Date().getMonth());
  const year = await page.evaluate(() => new Date().getFullYear());
  const targetDay = (today + 1) % 7;

  const created = await page.request.post("/api/periods", {
    data: { name: periodName, month, year },
  });
  const period = await created.json();
  await page.request.put(`/api/periods/${period.id}/schedule`, {
    data: {
      tasks: [
        { name: "Movable", dayOfWeek: today, startTime: "09:00", endTime: "10:00" },
      ],
    },
  });

  await page.reload();
  await page.getByText(periodName, { exact: true }).click();
  await expect(page.getByTestId("task-card")).toBeVisible();

  const saved = page.waitForResponse(
    (response) =>
      response.url().includes("/schedule") &&
      response.request().method() === "PUT",
  );
  await page
    .getByTestId("task-card")
    .dragTo(page.getByTestId(`day-${targetDay}`));
  await saved;

  // The drop selects the target day, so the task stays on screen.
  await expect(page.getByTestId("task-card")).toBeVisible();

  await page.reload();
  await page.getByText(periodName, { exact: true }).click();
  await page.getByTestId(`day-${targetDay}`).click();
  await expect(page.getByText("Movable")).toBeVisible();
});

test("rejects a second period for the same month", async ({ page }) => {
  await page.request.post("/api/periods", {
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

test("keeps data after logging out and back in", async ({ page }) => {
  const name = `Persist ${Date.now()}`;
  await page.request.post("/api/periods", {
    data: {
      name,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    },
  });

  await page.goto("/");
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(
    page.getByRole("button", { name: "Need an account? Sign up" }),
  ).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

test("deletes the period", async ({ page }) => {
  const name = `Delete ${Date.now()}`;
  await page.request.post("/api/periods", {
    data: {
      name,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
    },
  });

  await page.goto("/");
  await page.getByText(name, { exact: true }).click();
  await page.getByRole("button", { name: "Delete Period" }).click();

  const deleted = page.waitForResponse(
    (response) =>
      response.url().includes("/api/periods/") &&
      response.request().method() === "DELETE",
  );
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await deleted;

  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
});
