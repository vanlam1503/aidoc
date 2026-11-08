import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/gemini/credentials", async (original) => ({ ...await original<typeof import("@/lib/gemini/credentials")>(), geminiCredentials: mocks }));
import { DELETE, GET, POST } from "@/app/api/assistant/key/route";
const secret = "test-secret-12345678901234567890";
function request(method = "POST", body: unknown = { apiKey: secret }, origin = "http://localhost:3001") {
  return new Request("http://localhost:3001/api/assistant/key", { method, headers: { origin, "Content-Type": "application/json" }, ...(method === "POST" ? { body: JSON.stringify(body) } : {}) });
}
beforeEach(() => { vi.resetAllMocks(); mocks.read.mockResolvedValue(secret); mocks.save.mockResolvedValue(undefined); mocks.remove.mockResolvedValue(undefined); });

describe("write-only local API key configuration", () => {
  it("returns only configuration state on read/save/delete, never the key", async () => {
    for (const response of [await GET(), await POST(request()), await DELETE(request("DELETE"))]) {
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      const text = await response.text();
      expect(text).not.toContain(secret);
      expect(Object.keys(JSON.parse(text))).toEqual(["configured"]);
    }
    expect(mocks.save).toHaveBeenCalledWith(secret);
    expect(mocks.remove).toHaveBeenCalledOnce();
  });
  it("rejects missing/cross origins and invalid or oversized input before saving", async () => {
    for (const origin of ["https://evil.example", ""]) {
      expect((await POST(request("POST", { apiKey: secret }, origin))).status).toBe(403);
      expect((await DELETE(request("DELETE", undefined, origin))).status).toBe(403);
    }
    expect((await POST(request("POST", { apiKey: "short" }))).status).toBe(400);
    expect((await POST(request("POST", { apiKey: secret, extra: true }))).status).toBe(400);
    expect((await POST(request("POST", { apiKey: "x".repeat(2000) }))).status).toBe(413);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("does not leak file or provider details on storage failures", async () => {
    mocks.save.mockRejectedValue(new Error(secret));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(secret);
  });
});
