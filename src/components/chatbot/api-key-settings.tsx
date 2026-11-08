"use client";

import { useRef, useState } from "react";
import { geminiApiKeySchema } from "@/lib/gemini/key-schema";
import { useLanguage } from "@/components/language-provider";

export function ApiKeySettings({ configured, disabled, onSaved }: { configured: boolean; disabled: boolean; onSaved: (configured: boolean) => void }) {
  const { locale } = useLanguage();
  const vi = locale === "vi";
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<"invalid" | "save" | "blocked" | "network" | null>(null);

  async function update(action: "save" | "remove") {
    if (busy || disabled) return;
    const apiKey = (input.current?.value ?? "").trim();
    if (action === "save" && !geminiApiKeySchema.safeParse(apiKey).success) { setFailure("invalid"); return; }
    // Keep the masked input until saving succeeds; never copy it into React state.
    setBusy(true);
    setFailure(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/assistant/key", action === "save"
        ? { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ apiKey }) }
        : { method: "DELETE", signal: controller.signal });
      if (!response.ok) { setFailure(response.status === 400 ? "invalid" : response.status === 403 ? "blocked" : "save"); return; }
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("configured" in data) || typeof data.configured !== "boolean" || data.configured !== (action === "save")) {
        setFailure("save");
        return;
      }
      if (input.current) input.current.value = "";
      onSaved(data.configured);
    } catch { setFailure("network"); }
    finally { window.clearTimeout(timeout); setBusy(false); }
  }

  const errorMessage = failure === "invalid"
    ? (vi ? "Dán đầy đủ API key trên một dòng (tối đa 4096 ký tự), không để trống." : "Paste the complete API key on one line (up to 4096 characters). This field cannot be empty.")
    : failure === "blocked"
      ? (vi ? "Yêu cầu lưu bị chặn. Tải lại trang ứng dụng rồi thử lại." : "The save request was blocked. Reload the app page and try again.")
      : failure === "network"
        ? (vi ? "Không nhận được phản hồi từ ứng dụng. Kiểm tra server local đang chạy rồi thử lưu lại." : "The app did not respond. Check that the local server is running, then save again.")
        : (vi ? "Không thể lưu key trên máy này. Kiểm tra quyền ghi thư mục .data rồi thử lại." : "Could not save the key on this computer. Check write access to the .data folder and try again.");

  return <details className="chat-key-settings" open={!configured}>
    <summary>{vi ? "Cài đặt API key" : "API key settings"}<span role="status">{configured ? (vi ? "Đã bật chat" : "Chat enabled") : (vi ? "Chưa cấu hình" : "Not configured")}</span></summary>
    <form noValidate onSubmit={(event) => { event.preventDefault(); void update("save"); }}>
      <label htmlFor="assistant-api-key">Gemini API key</label>
      <input id="assistant-api-key" ref={input} type="password" onChange={() => setFailure(null)} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={4096} disabled={disabled || busy} placeholder={configured ? (vi ? "Nhập key mới để thay thế" : "Enter a new key to replace it") : (vi ? "Dán API key của bạn" : "Paste your API key")} aria-invalid={failure === "invalid"} aria-describedby={failure ? "assistant-key-error assistant-key-help" : "assistant-key-help"} />
      {failure && <p id="assistant-key-error" role="alert">{errorMessage}</p>}
      <p id="assistant-key-help">{vi ? "Nhập hoặc dán key, rồi nhấn Lưu API key để bật chat. Key chỉ lưu trên máy chạy ứng dụng và không hiển thị lại. Lấy key tại " : "Enter or paste your key, then choose Save API key to enable chat. Saved only on this computer and never displayed again. Get a key from "}<a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.</p>
      <div className="chat-key-actions"><button type="submit" disabled={disabled || busy}>{busy ? (vi ? "Đang lưu…" : "Saving…") : (vi ? "Lưu API key" : "Save API key")}</button>{configured && <button type="button" disabled={disabled || busy} onClick={() => void update("remove")}>{vi ? "Xoá key" : "Remove key"}</button>}</div>
    </form>
  </details>;
}
