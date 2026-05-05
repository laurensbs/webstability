import { test, expect } from "@playwright/test";

test("home renders hero in NL by default", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("blijft werken");
});

test("home in ES via /es", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("sigue funcionando");
});

test("translated slugs resolve: /verhuur ↔ /es/alquiler", async ({ page }) => {
  const nl = await page.goto("/verhuur");
  expect(nl?.status()).toBe(200);
  const es = await page.goto("/es/alquiler");
  expect(es?.status()).toBe(200);
});

test("blog post detail renders MDX content", async ({ page }) => {
  await page.goto("/blog/verhuursysteem-kiezen");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Verhuursysteem kiezen");
  await expect(page.getByText("Past het bij jouw type verhuur?")).toBeVisible();
});

test("portal redirects unauthenticated users to /login", async ({ page }) => {
  const res = await page.goto("/portal/dashboard");
  await expect(page).toHaveURL(/\/login/);
  expect(res?.ok()).toBe(true);
});

test("sitemap.xml and robots.txt are served", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");
});
