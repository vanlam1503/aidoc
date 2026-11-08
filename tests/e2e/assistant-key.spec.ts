import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("key settings enable chat, stay masked and empty after saving, and support removal", async ({ page }) => {
  const key = `AQ.${"Ab9_-".repeat(150)}.signature+/=`;
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
  await input.fill("");
  await dialog.getByRole("button", { name: "Save API key", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Paste the complete API key");
  expect(configured).toBe(false);
  await input.fill(key);
  await expect(input).not.toHaveAttribute("value", key);
  await dialog.getByRole("button", { name: "Save API key", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Your question" })).toBeEnabled();
  await expect(dialog.getByRole("heading", { name: "What are you working through?" })).toBeVisible();
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

test("pasting then saving a key restores the ready chat and allows sending a question", async ({ page }) => {
  let configured = false;
  let saves = 0;
  let questions = 0;
  let finishSave!: () => void;
  const saveGate = new Promise<void>(resolve => { finishSave = resolve; });
  await page.route("**/api/assistant/key", async route => {
    saves += 1;
    await saveGate;
    configured = true;
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
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(async () => navigator.clipboard.writeText("fake-pasted-key-12345678901234567890"));
  await keyInput.focus();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+v" : "Control+v");
  await expect(keyInput).toHaveValue("fake-pasted-key-12345678901234567890");
  await expect(keyInput).toHaveAttribute("type", "password");
  expect(saves).toBe(0);
  await dialog.getByRole("button", { name: "Save API key", exact: true }).click();
  finishSave();
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
