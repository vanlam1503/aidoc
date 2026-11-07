import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/database/prisma";
import { getLessonBySlug } from "@/lib/content/loader";
import { hasSameOrigin, readBoundedJson } from "@/lib/security/request";

const bookmarkInput = z.object({ lessonId: z.string().min(1).max(120) }).strict();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const lessonId = new URL(request.url).searchParams.get("lessonId");
    const bookmarks = lessonId
      ? await prisma.bookmark.findUnique({ where: { userId_lessonId: { userId: session.user.id, lessonId } } })
      : await prisma.bookmark.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ bookmarks });
  } catch {
    return NextResponse.json({ error: "Bookmark service is unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body = await readBoundedJson(request, 512);
    if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
    const input = bookmarkInput.safeParse(body.value);
    if (!input.success) return NextResponse.json({ error: "Invalid bookmark data" }, { status: 400 });
    if (!getLessonBySlug(input.data.lessonId)) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    const bookmark = await prisma.bookmark.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId: input.data.lessonId } },
      create: { userId: session.user.id, lessonId: input.data.lessonId },
      update: {},
    });
    return NextResponse.json({ bookmark });
  } catch {
    return NextResponse.json({ error: "Bookmark service is unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body = await readBoundedJson(request, 512);
    if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
    const input = bookmarkInput.safeParse(body.value);
    if (!input.success) return NextResponse.json({ error: "Invalid bookmark data" }, { status: 400 });
    await prisma.bookmark.deleteMany({ where: { userId: session.user.id, lessonId: input.data.lessonId } });
    return NextResponse.json({ saved: false });
  } catch {
    return NextResponse.json({ error: "Bookmark service is unavailable" }, { status: 503 });
  }
}
