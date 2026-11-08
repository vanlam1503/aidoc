import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test("mobile app navigation opens lessons and remembers the last lesson", async ({ page }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "App navigation" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Learn", exact: true }).tap();
  await expect(navigation.getByRole("link", { name: "Learn", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goto("/learn/prompt-engineering-basics");
  await expect(navigation.getByRole("link", { name: "Learn", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Home", exact: true }).tap();
  await expect(page.locator(".mobile-study-card")).toHaveAttribute("href", "/learn/prompt-engineering-basics");
  await expect(page.locator(".mobile-study-card")).toContainText("PICK UP WHERE YOU LEFT OFF");
  await navigation.getByRole("link", { name: "Flashcards", exact: true }).tap();
  await expect(page).toHaveURL(/\/flashcards$/);
  await expect(navigation.getByRole("link", { name: "Flashcards", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Bookmarks", exact: true }).tap();
  await expect(page).toHaveURL(/\/bookmarks$/);
  await page.getByRole("combobox", { name: "Display language" }).selectOption("vi");
  await expect(page.getByRole("navigation", { name: "Điều hướng ứng dụng" }).getByRole("link", { name: "Đã lưu", exact: true })).toHaveAttribute("aria-current", "page");
});

test("mobile screens fit narrow viewports and navigation is accessible", async ({ page }) => {
  for (const width of [360, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/learn/llm-fundamentals", "/flashcards", "/bookmarks", "/dashboard", "/settings"]) {
      await page.goto(route);
      await expect(page.getByRole("navigation", { name: "App navigation" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const navigation = await page.locator(".mobile-navigation").boundingBox();
      expect(navigation!.y + navigation!.height).toBeLessThanOrEqual(845);
      const language = await page.locator(".locale-switch").boundingBox();
      expect(language!.x + language!.width).toBeLessThanOrEqual(width);
    }
  }
  const accessibility = await new AxeBuilder({ page }).include(".mobile-navigation").withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
});
