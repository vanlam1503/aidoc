import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { geminiKeyInput } from "@/lib/gemini/key-schema";
export { geminiKeyInput } from "@/lib/gemini/key-schema";


/** Credentials never join learning data, browser storage, or API responses. */
export class GeminiCredentials {
  constructor(private readonly filePath: string) {}

  async read(): Promise<string | null> {
    try {
      if ((await fs.stat(this.filePath)).size > 32_768) throw new Error("Invalid credential file");
      const parsed = geminiKeyInput.safeParse(JSON.parse(await fs.readFile(this.filePath, "utf8")) as unknown);
      if (!parsed.success) throw new Error("Invalid credential file");
      return parsed.data.apiKey;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
      throw new Error("Local credentials unavailable");
    }
  }

  async save(apiKey: string): Promise<void> {
    const parsed = geminiKeyInput.safeParse({ apiKey });
    if (!parsed.success) throw new Error("Invalid API key");
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temporary = `${this.filePath}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temporary, JSON.stringify(parsed.data), { mode: 0o600, flag: "wx" });
      await fs.rename(temporary, this.filePath);
    } finally { await fs.rm(temporary, { force: true }).catch(() => undefined); }
  }

  async remove(): Promise<void> { await fs.rm(this.filePath, { force: true }); }
}

export const geminiCredentials = new GeminiCredentials(path.join(process.cwd(), ".data", "gemini-key.json"));
