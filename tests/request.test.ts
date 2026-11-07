import { describe, expect, it } from "vitest";
import { hasSameOrigin, readBoundedJson } from "@/lib/security/request";

describe("request guards", () => {
  it("parses bounded JSON and rejects oversized or malformed bodies", async () => {
    const valid = await readBoundedJson(new Request("https://academy.test/api", { method: "POST", body: JSON.stringify({ message: "hello" }) }), 100);
    expect(valid).toEqual({ ok: true, value: { message: "hello" } });

    const oversized = await readBoundedJson(new Request("https://academy.test/api", { method: "POST", body: "123456" }), 5);
    expect(oversized).toMatchObject({ ok: false, status: 413 });

    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode("123456")); controller.close(); } });
    const streamedOversized = await readBoundedJson(new Request("https://academy.test/api", { method: "POST", body: stream, duplex: "half" } as RequestInit & { duplex: "half" }), 5);
    expect(streamedOversized).toMatchObject({ ok: false, status: 413 });

    const malformed = await readBoundedJson(new Request("https://academy.test/api", { method: "POST", body: "{" }), 100);
    expect(malformed).toMatchObject({ ok: false, status: 400 });
  });

  it("requires an exact origin match", () => {
    expect(hasSameOrigin(new Request("https://academy.test/api", { headers: { origin: "https://academy.test" } }))).toBe(true);
    expect(hasSameOrigin(new Request("http://localhost:3100/api", { headers: { origin: "http://127.0.0.1:3100", host: "127.0.0.1:3100", "x-forwarded-host": "127.0.0.1:3100", "x-forwarded-proto": "http" } }))).toBe(true);
    expect(hasSameOrigin(new Request("https://academy.test/api", { headers: { origin: "https://evil.test" } }))).toBe(false);
    expect(hasSameOrigin(new Request("https://academy.test/api"))).toBe(false);
  });
});
