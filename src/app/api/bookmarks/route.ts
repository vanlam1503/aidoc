import { NextResponse } from "next/server";
import { z } from "zod";
import { localStore } from "@/lib/local/store";
import { bookmarkUrlSchema } from "@/lib/bookmarks/schema";
import { getLessonBySlug } from "@/lib/content/loader";
import { hasSameOrigin, readBoundedJson } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const lessonInput = z.object({ lessonId: z.string().min(1).max(120) }).strict();
const createInput = z.union([lessonInput, z.object({ url: bookmarkUrlSchema, title: z.string().trim().max(160).optional() }).strict()]);
const deleteInput = z.union([lessonInput, z.object({ id: z.string().min(1).max(120) }).strict()]);

export async function GET(request: Request) {
  try {
    const lessonId = new URL(request.url).searchParams.get("lessonId") ?? undefined;
    return NextResponse.json({ bookmarks: await localStore.getBookmarks(lessonId) });
  } catch { return NextResponse.json({ error: "Local bookmarks are unavailable" }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  const body = await readBoundedJson(request, 4096);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const input = createInput.safeParse(body.value);
  if (!input.success) return NextResponse.json({ error: "Invalid bookmark data. Use a lesson ID or an http/https link." }, { status: 400 });
  try {
    if ("lessonId" in input.data) {
      if (!getLessonBySlug(input.data.lessonId)) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      return NextResponse.json({ bookmark: await localStore.saveBookmark(input.data.lessonId) });
    }
    return NextResponse.json({ bookmark: await localStore.saveLink(input.data.url, input.data.title) });
  } catch { return NextResponse.json({ error: "Local bookmarks are unavailable" }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  const body = await readBoundedJson(request, 512);
  if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
  const input = deleteInput.safeParse(body.value);
  if (!input.success) return NextResponse.json({ error: "Invalid bookmark data" }, { status: 400 });
  try {
    if ("id" in input.data) await localStore.removeBookmarkById(input.data.id);
    else {
      if (!getLessonBySlug(input.data.lessonId)) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      await localStore.removeBookmark(input.data.lessonId);
    }
    return NextResponse.json({ saved: false });
  } catch { return NextResponse.json({ error: "Local bookmarks are unavailable" }, { status: 503 }); }
}
