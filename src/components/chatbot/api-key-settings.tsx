"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function ApiKeySettings({ configured, disabled, onSaved }: { configured: boolean; disabled: boolean; onSaved: (configured: boolean) => void }) {
  const { locale } = useLanguage();
  const vi = locale === "vi";
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function update(action: "save" | "remove", pastedKey?: string) {
    if (busy || disabled) return;
    const apiKey = (pastedKey ?? input.current?.value ?? "").trim();
    if (action === "save" && !/^[A-Za-z0-9_-]{20,256}$/.test(apiKey)) { setFailed(true); return; }
    // Do not keep credentials in React state or restore them into the page.
    if (input.current) input.current.value = "";
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/assistant/key", action === "save"
        ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) }
        : { method: "DELETE" });
      if (!response.ok) { setFailed(true); return; }
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("configured" in data) || typeof data.configured !== "boolean" || data.configured !== (action === "save")) {
        setFailed(true);
        return;
      }
      onSaved(data.configured);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }

  return <details className="chat-key-settings" open={!configured}>
    <summary>{vi ? "Cài đặt API key" : "API key settings"}<span role="status">{configured ? (vi ? "Đã bật chat" : "Chat enabled") : (vi ? "Chưa cấu hình" : "Not configured")}</span></summary>
    <form onSubmit={(event) => { event.preventDefault(); void update("save"); }}>
      <label htmlFor="assistant-api-key">Gemini API key</label>
      <input id="assistant-api-key" ref={input} type="password" onPaste={(event) => {
        if (busy || disabled) return;
        event.preventDefault();
        void update("save", event.clipboardData.getData("text/plain"));
      }} autoComplete="off" autoCapitalize="none" spellCheck={false} minLength={20} maxLength={256} required disabled={disabled || busy} placeholder={configured ? (vi ? "Nhập key mới để thay thế" : "Enter a new key to replace it") : (vi ? "Dán API key của bạn" : "Paste your API key")} aria-describedby="assistant-key-help" />
      <p id="assistant-key-help">{vi ? "Dán key để tự lưu và bật chat. Key chỉ lưu trên máy chạy ứng dụng và không hiển thị lại. Lấy key tại " : "Pasting saves and enables chat automatically. Saved only on this computer and never displayed again. Get a key from "}<a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.</p>
      <div className="chat-key-actions"><button type="submit" disabled={disabled || busy}>{busy ? (vi ? "Đang lưu…" : "Saving…") : (vi ? "Lưu API key" : "Save API key")}</button>{configured && <button type="button" disabled={disabled || busy} onClick={() => void update("remove")}>{vi ? "Xoá key" : "Remove key"}</button>}</div>
      {failed && <p role="alert">{vi ? "Không thể cập nhật key. Kiểm tra key và quyền ghi thư mục local rồi thử lại." : "Could not update the key. Check the key and local folder permissions, then try again."}</p>}
    </form>
  </details>;
}
