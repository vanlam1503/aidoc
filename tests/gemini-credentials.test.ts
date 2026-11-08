import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GeminiCredentials } from "@/lib/gemini/credentials";

let directory: string;
let filePath: string;
beforeEach(async () => { directory = await fs.mkdtemp(path.join(os.tmpdir(), "academy-key-test-")); filePath = path.join(directory, "private", "key.json"); });
afterEach(async () => { await fs.rm(directory, { force: true, recursive: true }); });

describe("local API credentials", () => {
  it("persists and replaces the key with owner-only permissions, then removes it", async () => {
    const store = new GeminiCredentials(filePath);
    expect(await store.read()).toBeNull();
    await store.save("test-key-12345678901234567890");
    expect(await new GeminiCredentials(filePath).read()).toBe("test-key-12345678901234567890");
    expect((await fs.stat(filePath)).mode & 0o777).toBe(0o600);
    await store.save("replacement-12345678901234567890");
    expect(await store.read()).toBe("replacement-12345678901234567890");
    await store.remove();
    expect(await store.read()).toBeNull();
  });

  it("preserves long auth keys with punctuation without truncating or reformatting them", async () => {
    const key = `AQ.${"Ab9_-".repeat(150)}.signature+/=`;
    const store = new GeminiCredentials(filePath);
    await store.save(key);
    expect(await new GeminiCredentials(filePath).read()).toBe(key);
  });

  it("rejects malformed values and reports corrupt files without including secrets", async () => {
    const store = new GeminiCredentials(filePath);
    await expect(store.save("")).rejects.toThrow("Invalid API key");
    await fs.mkdir(path.dirname(filePath));
    await fs.writeFile(filePath, '{"apiKey":"secret value with spaces"}');
    await expect(store.read()).rejects.toThrow("Local credentials unavailable");
    expect(await fs.readFile(filePath, "utf8")).toContain("secret value with spaces");
  });
});
