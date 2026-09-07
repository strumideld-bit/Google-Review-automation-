import { test, expect } from "@playwright/test";

// These run against the seeded "demo" client from db/schema.sql, so
// DATABASE_URL must point at a database that's had the schema applied.

test("5 stars redirects to the Google review link", async ({ page }) => {
  // The demo client's review URL is a placeholder — intercept it instead
  // of actually hitting google.com in CI.
  await page.route("https://search.google.com/**", (route) =>
    route.fulfill({ status: 200, body: "ok" })
  );

  await page.goto("/demo");
  await page.getByRole("button", { name: "5 gwiazdek" }).click();
  await expect(page.getByRole("heading", { name: "Cieszymy się!" })).toBeVisible();

  await page.getByRole("button", { name: "Pomiń i przejdź teraz" }).click();
  await page.waitForURL("**/local/writereview**");
});

test("a low rating opens the private feedback form and never mentions Google", async ({
  page,
}) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "2 gwiazdki" }).click();
  await expect(page.getByRole("heading", { name: "Przykro nam to słyszeć" })).toBeVisible();

  await page.getByPlaceholder("Co poszło nie tak?").fill("Kawa była zimna.");
  await page.getByRole("button", { name: "Wyślij prywatnie" }).click();

  await expect(page.getByRole("heading", { name: "Dziękujemy za informację" })).toBeVisible();
  await expect(page.getByText(/google/i)).toHaveCount(0);
});
