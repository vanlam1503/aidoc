import { NextResponse } from "next/server";
import { geminiCredentials, geminiKeyInput } from "@/lib/gemini/credentials";
import { hasSameOrigin, readBoundedJson } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (data: { configured?: boolean; error?: string }, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  try { return reply({ configured: Boolean(await geminiCredentials.read()) }); }
  catch { return reply({ error: "Unable to read local API configuration" }, 503); }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return reply({ error: "Cross-origin request denied" }, 403);
  const body = await readBoundedJson(request, 32_768);
  if (!body.ok) return reply({ error: body.message }, body.status);
  const parsed = geminiKeyInput.safeParse(body.value);
  if (!parsed.success) return reply({ error: "Enter a valid Gemini API key" }, 400);
  try {
    await geminiCredentials.save(parsed.data.apiKey);
    return reply({ configured: true });
  } catch { return reply({ error: "Unable to save local API configuration" }, 503); }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) return reply({ error: "Cross-origin request denied" }, 403);
  try { await geminiCredentials.remove(); return reply({ configured: false }); }
  catch { return reply({ error: "Unable to remove local API configuration" }, 503); }
}
