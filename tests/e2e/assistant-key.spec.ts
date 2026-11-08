import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("key settings enable chat, stay masked and empty after saving, and support removal", async ({ page }) => {
  const key = "fake-test-key-12345678901234567890";
  let configured = false;
  await page.route("**/api/chat", route => route.fulfill({ json: { configured, conversations: [] } }));
  await page.route("**/api/assistant/key", async route => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON()).toEqual({ apiKey: key });
      configured = true;
    } else if (route.request().method() === "DELETE") configured = false;
    await route.fulfill({ json: { configured } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask assistant", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Academy AI Assistant" });
  const input = dialog.getByLabel("Gemini API key", { exact: true });
  await expect(input).toHaveAttribute("type", "password");
  await input.fill(key);
  await expect(input).not.toHaveAttribute("value", key);
  await dialog.getByRole("button", { name: "Save API key", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toBeEnabled();
  expect(await page.content()).not.toContain(key);
  expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain(key);
  await page.reload();
  await page.getByRole("button", { name: "Ask assistant", exact: true }).click();
  await dialog.getByText("API key settings", { exact: false }).click();
  await expect(input).toHaveValue("");
  await expect(dialog.getByText("Chat enabled", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Remove key", exact: true }).click();
  await expect(input).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toHaveCount(0);
  const scan = await new AxeBuilder({ page }).include(".chat-panel").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("pasting a key activates chat immediately and allows sending a question", async ({ page }) => {
  let configured = false;
  let saves = 0;
  let questions = 0;
  await page.route("**/api/assistant/key", async route => {
    configured = true;
    saves += 1;
    await route.fulfill({ json: { configured } });
  });
  await page.route("**/api/chat", async route => {
    if (route.request().method() === "POST") {
      questions += 1;
      await route.fulfill({ contentType: "text/event-stream", body: 'data: {"type":"delta","text":"Tokens are units of text."}\n\ndata: {"type":"done"}\n\n' });
    } else await route.fulfill({ json: { configured, conversations: [] } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Ask assistant", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Academy AI Assistant" });
  const keyInput = dialog.getByLabel("Gemini API key", { exact: true });
  await keyInput.evaluate(element => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", "fake-pasted-key-12345678901234567890");
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }));
  });
  await expect(dialog.getByRole("status")).toHaveText("Chat enabled");
  await expect(dialog.getByText("Google Gemini API configuration needed")).toHaveCount(0);
  await dialog.getByRole("textbox", { name: "Your question" }).fill("Explain tokens");
  await dialog.getByRole("button", { name: "Send question", exact: true }).click();
  await expect(dialog.getByText("Tokens are units of text.")).toBeVisible();
  expect(saves).toBe(1);
  expect(questions).toBe(1);
  expect(await page.content()).not.toContain("fake-pasted-key-12345678901234567890");
  expect((await page.request.get("/setup")).status()).toBe(404);
});
