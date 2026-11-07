export type JsonBodyResult = { ok: true; value: unknown } | { ok: false; status: 400 | 403 | 413; message: string };

export async function readBoundedJson(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) return { ok: false, status: 413, message: "Request body is too large" };
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400, message: "Request body must be valid JSON" };
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, message: "Request body is too large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, message: "Unable to read request body" };
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown }; }
  catch { return { ok: false, status: 400, message: "Request body must be valid JSON" }; }
}

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const hostHeader = request.headers.get("host");
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const hosts = [...new Set([forwardedHost, hostHeader].filter((value): value is string => Boolean(value)))];
    const protocols = [...new Set([forwardedProtocol, requestUrl.protocol].filter((value): value is string => Boolean(value)).map((value) => value.endsWith(":") ? value : `${value}:`))];
    const acceptedOrigins = [requestUrl.origin];
    for (const host of hosts) for (const protocol of protocols) acceptedOrigins.push(new URL(`${protocol}//${host}`).origin);
    return acceptedOrigins.includes(new URL(origin).origin);
  }
  catch { return false; }
}
