"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { searchLessons, type SearchResult } from "@/lib/search/search";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updatedAt: string; messages: Array<{ id: string; role: "user" | "assistant"; content: string }> };
type Source = { lessonId: string; title: string; sourcePath: string };
type Access = "unknown" | "ready" | "config" | "unavailable";
type AssistantMode = "chat" | "search";

export function Chatbot({ lessonId }: { lessonId?: string }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [access, setAccess] = useState<Access>("unknown");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const requestAbort = useRef<AbortController | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AssistantMode>("chat");
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { locale, t } = useLanguage();
  const searchResults = useMemo(() => searchLessons(searchIndex, searchQuery, undefined, locale).slice(0, 8), [searchIndex, searchQuery, locale]);
  const panel = useRef<HTMLElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open || !expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open, expanded]);

  useEffect(() => {
    if (!streaming) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [streaming]);
  useEffect(() => () => requestAbort.current?.abort(), []);

  useEffect(() => {
    if (!open) return;
    void loadHistory();
    const refreshSession = () => { if (document.visibilityState === "visible") void loadHistory(); };
    window.addEventListener("focus", refreshSession);
    document.addEventListener("visibilitychange", refreshSession);
    return () => { window.removeEventListener("focus", refreshSession); document.removeEventListener("visibilitychange", refreshSession); };
  }, [open]);
  useEffect(() => {
    if (!open || mode !== "search" || searchIndex.length) return;
    let active = true;
    fetch("/search-index.json").then((response) => response.ok ? response.json() as Promise<SearchResult[]> : []).then((items) => { if (active) setSearchIndex(items); }).catch(() => { if (active) setSearchIndex([]); });
    return () => { active = false; };
  }, [open, mode, searchIndex.length]);
  useEffect(() => {
    const handleAsk = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      if (!detail?.prompt) return;
      setDraft(detail.prompt);
      setMode("chat");
      setOpen(true);
    };
    window.addEventListener("academy:ask-assistant", handleAsk);
    return () => window.removeEventListener("academy:ask-assistant", handleAsk);
  }, []);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const target = access === "ready" ? input.current : panel.current?.querySelector<HTMLElement>(".chat-close");
      const timer = window.setTimeout(() => target?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    if (wasOpen.current) { launcher.current?.focus(); wasOpen.current = false; }
  }, [open, access]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, streaming]);
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); setExpanded(false); return; }
      if (event.key !== "Tab" || !open || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function loadHistory() {
    setLoading(true);
    try {
      const response = await fetch("/api/chat");
      if (!response.ok) { setAccess("unavailable"); return; }
      const data = await response.json() as { configured: boolean; conversations: Conversation[] };
      setConversations(data.conversations);
      setAccess(data.configured ? "ready" : "config");
    } catch { setAccess("unavailable"); }
    finally { setLoading(false); }
  }

  async function selectConversation(id: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/chat?conversationId=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("Unable to open this conversation");
      const data = await response.json() as { configured: boolean; conversation: Conversation };
      setActiveId(data.conversation.id);
      setMessages(data.conversation.messages.map((item) => ({ id: item.id, role: item.role, content: item.content })));
      setAccess(data.configured ? "ready" : "config");
      setSources([]);
    } catch { setError(t("chat_error")); }
    finally { setLoading(false); }
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || streaming || access !== "ready") return;
    setDraft("");
    setError("");
    setSources([]);
    const assistantId = `assistant-${Date.now()}`;
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: message }]);
    setElapsedSeconds(0);
    setStreaming(true);
    const abortController = new AbortController();
    requestAbort.current = abortController;
    // Backend deadlines are capped at 180s; bound a stalled browser connection too.
    const watchdog = window.setTimeout(() => abortController.abort(new DOMException("Response deadline exceeded", "TimeoutError")), 195_000);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, conversationId: activeId ?? undefined, lessonId, locale }), signal: abortController.signal });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({})) as { error?: string; code?: string };
        setError(data.error ?? "The assistant could not respond.");
        if (data.code === "GEMINI_NOT_CONFIGURED") setAccess("config");
        if (data.code === "USAGE_LIMIT") setError(data.error ?? "Usage limit reached.");
        setStreaming(false);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantCreated = false;
      let terminal = false;
      while (!terminal) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.split("\n").find((part) => part.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as { type: string; text?: string; conversationId?: string; sources?: Source[]; message?: string };
          if (event.type === "meta" && event.conversationId) setActiveId(event.conversationId);
          if (event.type === "delta" && event.text) {
            if (!assistantCreated) { setMessages((current) => [...current, { id: assistantId, role: "assistant", content: event.text! }]); assistantCreated = true; }
            else setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: item.content + event.text } : item));
          }
          if (event.type === "sources" && event.sources) setSources(event.sources);
          if (event.type === "error") { setError(event.message ?? t("chat_error")); terminal = true; break; }
          if (event.type === "done") { terminal = true; break; }
        }
      }
      if (!terminal) throw new Error("Incomplete assistant stream");
      void reader.cancel().catch(() => undefined);
      setStreaming(false);
      void loadHistory();
    } catch {
      setError(abortController.signal.aborted
        ? t(abortController.signal.reason?.name === "TimeoutError" ? "chat_timeout" : "chat_stopped")
        : t("chat_network_error"));
    } finally {
      window.clearTimeout(watchdog);
      if (requestAbort.current === abortController) requestAbort.current = null;
      setStreaming(false);
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); }
  }

  return <div className={`chat-widget${open && expanded ? " is-expanded" : ""}`}>
    {open && expanded && <div className="chat-backdrop" aria-hidden="true" />}
    {open && <section className={`chat-panel${expanded ? " is-expanded" : ""}`} role="dialog" aria-modal="true" aria-label={t("chat_title")} ref={panel}>
      <header className="chat-header"><div className="chat-mark">✳</div><div><strong>{t("chat_title")}</strong><span>{lessonId ? t("chat_context_lesson") : t("chat_context_general")}</span></div><button type="button" className="chat-expand" aria-label={t(expanded ? "chat_collapse" : "chat_expand")} title={t(expanded ? "chat_collapse" : "chat_expand")} aria-pressed={expanded} onClick={() => setExpanded((value) => !value)}><span aria-hidden="true">{expanded ? "↙" : "↗"}</span></button><button type="button" className="chat-close" onClick={() => { setOpen(false); setExpanded(false); }} aria-label={t("chat_close")}>×</button></header>
      <nav className="chat-mode-tabs" aria-label={t("chat_title")}><button type="button" aria-pressed={mode === "chat"} onClick={() => setMode("chat")}>{t("chat_tab_ask")}</button><button type="button" aria-pressed={mode === "search"} onClick={() => setMode("search")}>{t("chat_tab_search")}</button></nav>
      {mode === "search" ? <div className="chat-search-view"><label className="chat-search-input"><span aria-hidden="true">⌕</span><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("chat_search_placeholder")} /></label><div className="chat-search-results" aria-live="polite">{searchResults.length ? searchResults.map((result) => <Link key={result.id} href={`/learn/${result.id}`} onClick={() => setOpen(false)}><span className={`level level-${result.level}`}>{result.level}</span><strong>{result.title}</strong><small>{result.sectionTitle} · {result.description}</small></Link>) : <p>{t("chat_search_empty")}</p>}</div></div> : <>
      {(access === "ready" || access === "config") && <div className="chat-history-bar">{access === "ready" && <button type="button" disabled={streaming} onClick={() => { setActiveId(null); setMessages([]); setSources([]); setError(""); }}>{t("chat_new")}</button>}{conversations.length > 0 && <label>{t("chat_recent")} <select value={activeId ?? ""} disabled={streaming} onChange={(event) => event.target.value && void selectConversation(event.target.value)}><option value="">{t("chat_choose")}</option>{conversations.map((conversation) => <option key={conversation.id} value={conversation.id}>{conversation.title}</option>)}</select></label>}</div>}
      {loading && <div className="chat-loading" role="status">{t("chat_loading")}</div>}
      {!loading && access === "unknown" && <div className="chat-loading">{t("chat_connecting")}</div>}
      {!loading && access === "config" && <div className="chat-state"><span className="chat-state-icon">⚙</span><strong>{t("chat_config_title")}</strong><p>{t("chat_config_body")}</p><Link href="/setup">{t("chat_setup")}</Link>{conversations.length > 0 && <span className="history-note">{t("chat_history_saved")}</span>}</div>}
      {!loading && access === "unavailable" && <div className="chat-state"><strong>{t("chat_unavailable")}</strong><p>{t("chat_database")}</p><button type="button" onClick={() => void loadHistory()}>{t("retry")}</button></div>}
      {(access === "ready" || access === "config") && <div className="chat-messages" aria-live="polite">{messages.length === 0 && access === "ready" && <div className="chat-welcome"><span className="eyebrow">{t("chat_welcome_kicker")}</span><h3>{t("chat_welcome_title")}</h3><p>{t("chat_welcome_body")}</p><div className="chat-suggestions"><button onClick={() => setDraft(lessonId ? "Explain the key idea in this lesson and give me a short example." : "How should I start learning AI engineering?")}>{t("chat_suggestion_explain")}</button><button onClick={() => setDraft("Give me a practical exercise about context engineering.")}>{t("chat_suggestion_exercise")}</button><button onClick={() => setMode("search")}>{t("chat_suggestion_search")}</button></div></div>}
        {messages.map((message) => <article className={`chat-message ${message.role}`} key={message.id}><span>{message.role === "user" ? (locale === "vi" ? "BẠN" : "YOU") : "ACADEMY ASSISTANT"}</span><p>{message.content}</p></article>)}
        {streaming && messages.at(-1)?.role === "user" && <div className="chat-typing" role="status">{elapsedSeconds < 8 ? t("chat_thinking") : t("chat_waiting", { count: elapsedSeconds })}</div>}
        {sources.length > 0 && <div className="chat-sources"><span>{t("chat_sources")}</span>{sources.map((source) => <Link key={source.sourcePath} href={`/learn/${source.lessonId}`}>↗ {source.title} <small>{source.sourcePath}</small></Link>)}</div>}
        {error && <div className="chat-error" role="alert">{error}</div>}<div ref={bottom} /></div>}
      {access === "ready" && <form className="chat-composer" onSubmit={(event) => void submit(event)}><label className="sr-only" htmlFor="academy-chat-input">{t("chat_input_label")}</label><textarea id="academy-chat-input" ref={input} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onInputKeyDown} placeholder={t("chat_input_placeholder")} maxLength={4000} rows={2} disabled={streaming} /><div><span>{t("chat_disclaimer")}</span>{streaming ? <button type="button" onClick={() => requestAbort.current?.abort()} aria-label={t("chat_stop")}>■</button> : <button type="submit" disabled={!draft.trim()} aria-label={t("chat_send")}>↑</button>}</div></form>}
      </>}
      <footer className="chat-footer">{t("chat_footer")}</footer>
    </section>}
    <button ref={launcher} type="button" className={`chat-launcher ${open ? "is-open" : ""}`} aria-expanded={open} onClick={() => { if (open) setExpanded(false); setOpen((value) => !value); }}><span aria-hidden="true">{open ? "×" : "✳"}</span><small>{t("chat_tab_ask")}</small></button>
  </div>;
}
