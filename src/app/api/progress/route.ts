import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/database/prisma";
import { getLessonBySlug } from "@/lib/content/loader";
import { hasSameOrigin, readBoundedJson } from "@/lib/security/request";

const progressInput = z.object({ lessonId: z.string().min(1).max(120), progressPercent: z.number().int().min(0).max(100), completed: z.boolean().optional() }).strict();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const lessonId = new URL(request.url).searchParams.get("lessonId");
    const progress = lessonId
      ? await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: session.user.id, lessonId } } })
      : await prisma.lessonProgress.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" } });
    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json({ error: "Progress service is unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body = await readBoundedJson(request, 2048);
    if (!body.ok) return NextResponse.json({ error: body.message }, { status: body.status });
    const input = progressInput.safeParse(body.value);
    if (!input.success) return NextResponse.json({ error: "Invalid progress data" }, { status: 400 });
    if (!getLessonBySlug(input.data.lessonId)) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    const { lessonId, progressPercent, completed = false } = input.data;
    const existing = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: session.user.id, lessonId } } });
    const now = new Date();
    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId } },
      create: { userId: session.user.id, lessonId, progressPercent, completed, completedAt: completed ? now : null, lastReadAt: now },
      update: { progressPercent: Math.max(progressPercent, existing?.progressPercent ?? 0), completed: completed || Boolean(existing?.completed), completedAt: completed ? existing?.completedAt ?? now : existing?.completedAt, lastReadAt: now },
    });
    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json({ error: "Progress service is unavailable" }, { status: 503 });
  }
}
