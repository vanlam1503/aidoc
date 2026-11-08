import { z } from "zod";

// Keys are opaque credentials. Allow auth-key punctuation and long values;
// reject only empty, oversized, or non-printable/header-unsafe input.
export const geminiApiKeySchema = z.string().trim().min(1).max(4096).regex(/^[\x21-\x7E]+$/);
export const geminiKeyInput = z.object({ apiKey: geminiApiKeySchema }).strict();
