import { expect, test } from "@playwright/test";

for (const locale of ["en", "vi"] as const) {
  test(`selected text ${locale === "en" ? "explanation" : "translation"} sends immediately in ${locale}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("academy-locale", value), locale);
    const posts: { message: string; lessonId: string; locale: string }[] = [];
    const answer = locale === "en" ? "Tokens are pieces of text processed by a language model. A word may use more than one token." : "Token là đơn vị văn bản model xử lý; một từ có thể gồm nhiều token.";
    await page.route("**/api/chat", async (route) => {
      if (route.request().method() === "GET") { await route.fulfill({ json: { configured: true, conversations: [] } }); return; }
      posts.push(route.request().postDataJSON());
      await route.fulfill({ contentType: "text/event-stream", body: `data: ${JSON.stringify({ type: "delta", text: answer })}\n\ndata: {"type":"done"}\n\n` });
    });
    await page.goto("/learn/llm-fundamentals");
    await expect(page.locator(".markdown-content")).toHaveAttribute("lang", locale);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".markdown-content").evaluate((article) => {
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) if (/tokens?/i.test(node.textContent ?? "")) { node.parentElement?.scrollIntoView({ block: "center" }); break; }
    });
    await page.waitForTimeout(100); // Let the scroll event finish before making a selection.
    const selected = await page.locator(".markdown-content").evaluate((article) => {
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const match = /tokens?/i.exec(node.textContent ?? "");
        if (!match) continue;
        const range = document.createRange();
        range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
        const selection = window.getSelection()!;
        selection.removeAllRanges(); selection.addRange(range);
        document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        return match[0];
      }
      throw new Error("No token text found in the lesson");
    });
    const toolbar = page.locator(".selection-assistant");
    await expect(toolbar).toBeVisible();
    await toolbar.getByRole("button", { name: locale === "en" ? /Ask assistant/ : /Dịch nghĩa/ }).click();
    const dialog = page.getByRole("dialog", { name: locale === "en" ? "Academy AI Assistant" : "Trợ lý AI Academy" });
    await expect(dialog.locator(".chat-message.assistant")).toHaveText(new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ locale, lessonId: "llm-fundamentals" });
    expect(posts[0].message).toContain(selected);
    expect(posts[0].message).toContain(locale === "en" ? "Explain" : "Dịch");
    await expect(dialog.getByRole("textbox")).toHaveValue("");
    await expect(toolbar).not.toBeVisible();
  });
}
