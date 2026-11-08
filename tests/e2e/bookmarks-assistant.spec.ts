import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { BookmarkRecord } from "../../src/lib/bookmarks/schema";

async function mockBookmarks(page: Page) {
  let records: BookmarkRecord[] = [
    { id: "reference-1", kind: "link", title: "API reference notes", url: "https://example.com/reference", createdAt: "2026-11-07T12:00:00Z" },
  ];
  await page.route("**/api/bookmarks**", async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const body = route.request().postDataJSON();
      const bookmark: BookmarkRecord = { id: "saved-lesson", kind: "lesson", lessonId: body.lessonId, createdAt: "2026-11-08T12:00:00Z" };
      records = [...records, bookmark];
      await route.fulfill({ json: { bookmark } }); return;
    }
    if (method === "DELETE") {
      const body = route.request().postDataJSON();
      records = records.filter((record) => body.id ? record.id !== body.id : record.kind !== "lesson" || record.lessonId !== body.lessonId);
      await route.fulfill({ json: { saved: false } }); return;
    }
    await route.fulfill({ json: { bookmarks: records } });
  });
}

test("lesson bookmarks sync between the lesson, saved page, and reloads", async ({ page }, testInfo) => {
  await mockBookmarks(page);
  await page.goto("/learn/llm-fundamentals");
  await page.getByRole("button", { name: "Bookmark lesson", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove bookmark", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Bookmarks", exact: true }).first().click();
  await expect(page).toHaveURL(/\/bookmarks$/);
  await expect(page.getByRole("link", { name: "What is an LLM? How language models work", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("bookmarks-desktop.png"), fullPage: true });
  await page.getByRole("searchbox", { name: "Search saved lessons and links" }).fill("language models");
  await expect(page.locator(".saved-bookmark-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".saved-bookmark-card")).toHaveCount(2);
  const scan = await new AxeBuilder({ page }).include(".bookmark-library").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await page.getByRole("link", { name: "What is an LLM? How language models work", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove bookmark", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Remove bookmark", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bookmark lesson", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("custom links persist in local storage and can be searched and removed", async ({ page, request, baseURL }) => {
  const title = `Bookmark smoke test ${Date.now()}`;
  const url = `https://example.com/academy-bookmark-${Date.now()}`;
  let id: string | undefined;
  try {
    await page.goto("/bookmarks");
    await page.getByRole("textbox", { name: "URL", exact: true }).fill(url);
    await page.getByRole("textbox", { name: "Title (optional)" }).fill(title);
    await page.getByRole("button", { name: "Save link", exact: true }).click();
    await expect(page.getByText("Link saved locally.", { exact: true })).toBeVisible();
    const data = await (await request.get("/api/bookmarks")).json() as { bookmarks: BookmarkRecord[] };
    id = data.bookmarks.find((record) => record.kind === "link" && record.url === url)?.id;
    expect(id).toBeTruthy();
    await page.reload();
    const search = page.getByRole("searchbox", { name: "Search saved lessons and links" });
    await search.fill(title);
    await expect(page.getByRole("link", { name: title, exact: false })).toHaveAttribute("href", url);
    await page.getByRole("combobox", { name: "Filter bookmarks by type" }).selectOption("lesson");
    await expect(page.getByRole("heading", { name: "No matching bookmarks" })).toBeVisible();
    await page.getByRole("combobox", { name: "Filter bookmarks by type" }).selectOption("link");
    await page.getByRole("button", { name: `Remove bookmark: ${title}`, exact: true }).click();
    await expect(page.getByRole("heading", { name: "No matching bookmarks" })).toBeVisible();
    await page.reload();
    await search.fill(title);
    await expect(page.locator(".saved-bookmark-card")).toHaveCount(0);
  } finally {
    if (id) await request.delete("/api/bookmarks", { headers: { origin: baseURL! }, data: { id } });
  }
});

test("assistant expands and collapses without losing a draft", async ({ page }, testInfo) => {
  await page.route("**/api/chat", (route) => route.fulfill({ json: { configured: true, conversations: [] } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Ask assistant", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Academy AI Assistant" });
  const input = dialog.getByRole("textbox", { name: "Your question" });
  await input.fill("Explain how agent tools work.");
  const compact = await dialog.boundingBox();
  await dialog.getByRole("button", { name: "Expand assistant", exact: true }).click();
  await expect(dialog).toHaveClass(/is-expanded/);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  expect((await dialog.boundingBox())!.width).toBeGreaterThan(compact!.width * 2);
  await expect(input).toHaveValue("Explain how agent tools work.");
  await dialog.screenshot({ path: testInfo.outputPath("assistant-expanded.png") });
  const scan = await new AxeBuilder({ page }).include(".chat-panel").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await dialog.getByRole("button", { name: "Collapse assistant", exact: true }).click();
  await expect(dialog).not.toHaveClass(/is-expanded/);
  await expect(input).toHaveValue("Explain how agent tools work.");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("bookmarks and expanded assistant fit mobile and follow Vietnamese settings", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockBookmarks(page);
  await page.route("**/api/chat", (route) => route.fulfill({ json: { configured: true, conversations: [] } }));
  await page.goto("/bookmarks");
  await page.getByRole("combobox", { name: "Display language", exact: true }).selectOption("vi");
  await expect(page.getByRole("heading", { name: "Đã lưu", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Tìm bài học và link đã lưu" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("bookmarks-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Hỏi trợ lý", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Trợ lý AI Academy" });
  await dialog.getByRole("button", { name: "Mở rộng trợ lý", exact: true }).click();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBe(0); expect(bounds!.y).toBe(0);
  expect(bounds!.width).toBe(390); expect(bounds!.height).toBe(844);
  await expect(dialog.getByRole("button", { name: "Thu gọn trợ lý", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/dashboard");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("link", { name: "Đã lưu", exact: true })).toBeVisible();
});
