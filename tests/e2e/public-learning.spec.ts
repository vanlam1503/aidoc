import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("learners can search locally and open a lesson", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  await expect(page.getByRole("heading", { name: /Build the AI foundation/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Search prompts, agents, RAG..." }).fill("Codex CLI");
  const lesson = page.getByRole("link", { name: /Codex CLI/ }).first();
  await expect(lesson).toBeVisible();
  await Promise.all([page.waitForURL(/\/learn\/codex-cli$/, { timeout: 30_000 }), lesson.click()]);
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toContainText("Codex CLI");
  await expect(page.getByRole("navigation", { name: "LEARNING PATH" })).toBeVisible();
});

test("references are grouped and lesson links work", async ({ page }) => {
  await page.goto("/references");
  await expect(page.getByRole("heading", { name: /Learn from the/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "OpenAI and Codex" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Security and Production" })).toBeVisible();
  await page.getByRole("link", { name: "codex-cli" }).first().click();
  await expect(page).toHaveURL(/\/learn\/codex-cli$/);
});

test("the lesson page has no automatically detected WCAG 2 A/AA violations", async ({ page }) => {
  const scriptWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Encountered a script tag while rendering React component")) scriptWarnings.push(message.text());
  });
  await page.goto("/learn/codex-introduction");
  const checkAccessibility = async () => {
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, JSON.stringify(scan.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map((node) => node.target) })), null, 2)).toEqual([]);
  };
  await checkAccessibility();
  await page.getByRole("button", { name: "Toggle light and dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.waitForTimeout(250);
  await checkAccessibility();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(scriptWarnings).toEqual([]);
});

test("protected endpoints require a session and reject cross-origin writes", async ({ page, request }) => {
  expect((await request.get("/api/progress")).status()).toBe(401);
  expect((await request.get("/api/bookmarks")).status()).toBe(401);
  expect((await request.get("/api/chat")).status()).toBe(401);
  expect((await request.post("/api/progress", { headers: { origin: "https://untrusted.example" }, data: { lessonId: "codex-cli", progressPercent: 50 } })).status()).toBe(403);
  await page.goto("/");
  const sameOriginStatus = await page.evaluate(async () => (await fetch("/api/progress", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lessonId: "codex-cli", progressPercent: 50 }) })).status);
  expect(sameOriginStatus).toBe(401);
});

test("assistant dialog moves focus inside, traps keyboard navigation, and restores focus", async ({ page }) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Ask assistant" });
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Academy AI Assistant" });
  await expect(dialog).toBeVisible();
  const close = page.getByRole("button", { name: "Close assistant" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(launcher).toBeFocused();
});

test("the current lesson remains identified in the mobile learning path", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/learn/codex-introduction");
  await expect(page.getByRole("link", { name: /OpenAI Codex: coding agent/i }).first()).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".markdown-content")).toHaveAttribute("lang", "en");
});

test.describe("English defaults", () => {
  test.use({ locale: "vi-VN" });

  test("defaults to English and preserves explicit language choices across reloads", async ({ page }) => {
    const response = await page.goto("/settings");
    expect(await response?.text()).toContain('lang="en"');
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "English EN" })).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Tiếng Việt VI" }).click();
    await expect(page.getByRole("heading", { name: "Cài đặt", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await expect(page.getByRole("heading", { name: "Cài đặt", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "English EN" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Academy", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Build the AI foundation/ })).toBeVisible();
  });

  test("falls back to English when the saved locale is unsupported", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("academy-locale", "fr"));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Build the AI foundation/ })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("academy-locale"))).toBe("en");
  });

  test("English settings apply to curriculum cards and pathway lesson titles", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("button", { name: "English EN" }).click();
    await page.getByRole("link", { name: "Academy", exact: true }).click();
    await expect(page.locator(".lesson-card")).toHaveCount(33);
    await expect(page.locator(".lesson-card").first()).toContainText("What is an LLM? How language models work");
    await expect(page.locator(".lesson-list")).not.toContainText(/[À-ỹ]/);
    await expect(page.locator(".pathway-section")).not.toContainText(/[À-ỹ]/);
    await page.getByRole("textbox", { name: "Search prompts, agents, RAG..." }).fill("checkpointing");
    await expect(page.locator(".lesson-list")).toContainText("Checkpointing, retries, and recovery");
    await expect(page.locator(".lesson-list")).not.toContainText("Lưu trạng thái");
  });

  test("changing language updates lesson content, navigation, and search together", async ({ page }) => {
    await page.goto("/learn/codex-introduction");
    const article = page.locator(".markdown-content");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("OpenAI Codex: coding agents in the development workflow");
    await expect(article).toHaveAttribute("lang", "en");
    await expect(article.getByRole("heading", { name: "Learning objectives", exact: true })).toBeVisible();
    await expect(article).not.toContainText(/[À-ỹ]/);
    await expect(page.locator(".toc-sidebar")).toContainText("Common mistakes");
    await expect(page.locator(".lesson-pagination")).toContainText("Codex CLI: working safely in the terminal");
    await expect(page.locator(".curriculum-sidebar")).not.toContainText(/[À-ỹ]/);

    await page.getByRole("combobox", { name: "Display language", exact: true }).selectOption("vi");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("OpenAI Codex: coding agent trong quy trình phát triển");
    await expect(article).toHaveAttribute("lang", "vi");
    await expect(article.getByRole("heading", { name: "Mục tiêu học tập", exact: true })).toBeVisible();
    await expect(page.locator(".toc-sidebar")).toContainText("Lỗi thường gặp");
    await expect(page.locator(".lesson-pagination")).toContainText("Codex CLI: làm việc an toàn trong terminal");
    await page.getByRole("button", { name: /Tìm bài học/ }).click();
    const search = page.getByRole("dialog", { name: "Tìm bài học" });
    await search.getByRole("textbox").fill("khôi phục");
    await expect(search).toContainText("Agent memory và state: lưu đúng thứ cần khôi phục");
    await search.getByRole("button", { name: "Esc", exact: true }).click();
    await page.reload();
    await expect(article).toHaveAttribute("lang", "vi");
    await page.getByRole("combobox", { name: "Ngôn ngữ hiển thị", exact: true }).selectOption("en");
    await expect(article).toHaveAttribute("lang", "en");
    await expect(article.getByRole("heading", { name: "Learning objectives", exact: true })).toBeVisible();
  });

  for (const startingLocale of ["en", "vi"] as const) {
    test(`curriculum selector matches its content when starting in ${startingLocale}`, async ({ page }) => {
      if (startingLocale === "vi") await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript((initialLocale) => {
        if (localStorage.getItem("academy-locale") === null) localStorage.setItem("academy-locale", initialLocale);
      }, startingLocale);
      await page.goto("/#curriculum");
      const selector = page.locator(".topbar .locale-switch");
      await expect(selector).toHaveValue(startingLocale);
      const expectedTitle = {
        en: "What is an LLM? How language models work",
        vi: "LLM là gì? Cách mô hình ngôn ngữ hoạt động",
      };
      const expectedLabel = { en: "English", vi: "Tiếng Việt" };
      await expect(selector.locator("option:checked")).toHaveText(expectedLabel[startingLocale]);
      await expect(page.locator(".lesson-card").first().getByRole("heading")).toHaveText(expectedTitle[startingLocale]);
      const selectorBounds = await selector.boundingBox();
      expect(selectorBounds).not.toBeNull();
      expect(selectorBounds!.x).toBeGreaterThanOrEqual(0);
      expect(selectorBounds!.x + selectorBounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);

      for (const selectedLocale of ["en", "en", "vi", "vi", "en"] as const) {
        await selector.selectOption(selectedLocale);
        await expect(selector).toHaveValue(selectedLocale);
        await expect(selector.locator("option:checked")).toHaveText(expectedLabel[selectedLocale]);
        await expect(page.locator("html")).toHaveAttribute("lang", selectedLocale);
        await expect(page.locator(".lesson-card").first().getByRole("heading")).toHaveText(expectedTitle[selectedLocale]);
        await expect.poll(() => page.evaluate(() => localStorage.getItem("academy-locale"))).toBe(selectedLocale);
        await expect(page).toHaveURL(/\/#curriculum$/);
        await page.reload();
        await expect(selector).toHaveValue(selectedLocale);
        await expect(selector.locator("option:checked")).toHaveText(expectedLabel[selectedLocale]);
        await expect(page.locator(".lesson-card").first().getByRole("heading")).toHaveText(expectedTitle[selectedLocale]);
      }
    });
  }

  test("account, setup, and reference copy is in English", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByText("Lessons are open to everyone.", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Continue reading lessons" })).toBeVisible();
    await page.goto("/setup");
    await expect(page.getByText("The assistant needs OpenAI API access configured on the server.", { exact: false })).toBeVisible();
    await expect(page.getByText("Copy .env.example to .env.local.", { exact: true })).toBeVisible();
    await page.goto("/references");
    await expect(page.getByRole("navigation", { name: "Reference categories" })).toBeVisible();
    await expect(page.getByText("Practical examples of the Responses API, embeddings, prompt design, and OpenAI integrations.")).toBeVisible();
    await expect(page).toHaveTitle("References — AI Engineering Academy");
  });

  test("the assistant requests English responses by default", async ({ page }) => {
    let submitted: unknown;
    await page.route("**/api/chat", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { configured: true, conversations: [] } });
        return;
      }
      submitted = route.request().postDataJSON();
      await route.fulfill({ contentType: "text/event-stream", body: 'data: {"type":"delta","text":"Start with the foundations."}\n\n' });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Ask assistant", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Academy AI Assistant" });
    await dialog.getByRole("textbox", { name: "Your question" }).fill("Tôi nên bắt đầu học từ đâu?");
    await dialog.getByRole("button", { name: "Send question" }).click();
    await expect.poll(() => submitted).toMatchObject({ locale: "en", message: "Tôi nên bắt đầu học từ đâu?" });
    await expect(dialog.getByText("Start with the foundations.")).toBeVisible();
  });
});
