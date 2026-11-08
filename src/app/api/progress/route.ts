import { NextResponse } from "next/server";
import { z } from "zod";
import { localStore } from "@/lib/local/store";
import { getLessonBySlug } from "@/lib/content/loader";
import { hasSameOrigin, readBoundedJson } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const progressInput = z.object({ lessonId: z.string().min(1).max(120), progressPercent: z.number().int().min(0).max(100), completed: z.boolean().optional() }).strict();

export async function GET(request: Request) {
  try {
    const lessonId = new URL(request.url).searchParams.get("lessonId") ?? undefined;
    return NextResponse.json({ progress: await localStore.getProgress(lessonId) });
  } catch { return NextResponse.json({ error: "Local progress is unavailable" }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  const body = await readBoundedJson(request, 2048);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const input = progressInput.safeParse(body.value);
  if (!input.success) return NextResponse.json({ error: "Invalid progress data" }, { status: 400 });
  if (!getLessonBySlug(input.data.lessonId)) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  try {
    const { lessonId, progressPercent, completed } = input.data;
    return NextResponse.json({ progress: await localStore.saveProgress(lessonId, progressPercent, completed) });
  } catch { return NextResponse.json({ error: "Local progress is unavailable" }, { status: 503 }); }
}
