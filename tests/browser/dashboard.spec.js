import { test, expect } from "@playwright/test";

test("dashboard creates, edits, persists, and removes a system", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".system-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Add system", exact: true }).click();
  await page
    .getByLabel("System title", { exact: true })
    .fill("Regional Records");
  await page.getByLabel("Website URL").fill("https://example.com/records");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Regional document tracking.");
  await page.getByRole("button", { name: "files icon", exact: true }).click();
  await page.getByRole("button", { name: "blue cover", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add system", exact: true })
    .click();
  await expect(page.locator(".system-card")).toHaveCount(7);
  await page
    .getByRole("button", { name: "Pin Regional Records", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unpin Regional Records", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Search systems", { exact: true })
    .fill("Regional Records");
  await expect(page.locator(".system-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Edit Regional Records", exact: true })
    .click();
  await page
    .getByLabel("System title", { exact: true })
    .fill("Regional Archive");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit Regional Archive", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("button", { name: "Yes, remove", exact: true }).click();
  await expect(page.locator(".system-card")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("links open new tabs and record visits; favorites and filters work", async ({
  page,
  context,
}) => {
  await context.route("https://e.gov.ph/", (route) =>
    route.fulfill({ body: "<h1>Destination</h1>", contentType: "text/html" }),
  );
  await page.goto("/");
  const link = page.getByRole("link", {
    name: "Open eGovPH in a new tab",
    exact: true,
  });
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  const popupPromise = context.waitForEvent("page");
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(popup.url()).toBe("https://e.gov.ph/");
  await popup.close();
  await page
    .getByRole("button", { name: "Recently opened", exact: true })
    .click();
  await expect(page.locator(".system-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Favorites", exact: false })
    .filter({ has: page.locator(".nav-count") })
    .click();
  await expect(page.locator(".system-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Overview", exact: false }).click();
  await page.getByLabel("Filter by category").selectOption("Connectivity");
  await expect(page.locator(".system-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Free Wi-Fi for All" }),
  ).toBeVisible();
});

test("layout, backup import, keyboard dialog dismissal, and desktop appearance", async ({
  page,
}) => {
  await page.goto("/");
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await page
    .getByRole("button", { name: "Compact list", exact: false })
    .click();
  await page.getByRole("switch", { name: "Show cover artwork" }).click();
  await page
    .getByRole("button", { name: "Move eGovPH down", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("drids-workspace.json");
  const file = await download.path();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":2}'),
    });
  await expect(page.getByRole("alert")).toContainText("valid DRIDS backup");
  await page.locator("input[type=file]").setInputFiles(file);
  await page
    .getByRole("button", { name: "Replace workspace", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".systems-grid")).toHaveClass(/layout-list/);
  await expect(page.locator(".system-card .system-cover")).toHaveCount(0);
  await expect(page.locator(".system-card").first()).toContainText(
    "DICT Official Portal",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("mobile navigation and layout fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cybersecurity", exact: true })
    .click();
  await expect(page.locator(".system-card")).toHaveCount(1);
  await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
  await page.getByRole("button", { name: "Add system", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.querySelector("dialog").scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
});
