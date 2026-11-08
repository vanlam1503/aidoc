import { z } from "zod";

export const bookmarkUrlSchema = z.string().trim().min(1).max(2048).url().refine((value) => {
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use an http or https URL").transform((value) => new URL(value).href).refine((value) => value.length <= 2048, "URL is too long");

// Legacy lesson bookmarks had no kind field. Parsing adds it without losing data.
export const bookmarkRecordSchema = z.union([
  z.object({ id: z.string(), kind: z.literal("lesson").default("lesson"), lessonId: z.string(), createdAt: z.string().datetime() }),
  z.object({ id: z.string(), kind: z.literal("link"), url: bookmarkUrlSchema, title: z.string().min(1).max(160), createdAt: z.string().datetime() }),
]);
export type BookmarkRecord = z.infer<typeof bookmarkRecordSchema>;
