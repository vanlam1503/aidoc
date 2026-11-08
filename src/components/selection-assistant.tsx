"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type Selection = { text: string; top: number; left: number };

export function SelectionAssistant({ lessonTitle }: { lessonTitle: string }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const { locale, t } = useLanguage();

  useEffect(() => {
    const readSelection = () => {
      const selected = window.getSelection();
      const text = selected?.toString().trim();
      if (!selected || !text || text.length > 300 || !selected.rangeCount) { setSelection(null); return; }
      const range = selected.getRangeAt(0);
      const article = document.querySelector(".markdown-content");
      if (!article?.contains(range.commonAncestorContainer)) { setSelection(null); return; }
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) { setSelection(null); return; }
      setSelection({ text, top: Math.max(10, rect.top - 48), left: Math.min(window.innerWidth - 240, Math.max(10, rect.left + rect.width / 2 - 115)) });
    };
    document.addEventListener("mouseup", readSelection);
    document.addEventListener("keyup", readSelection);
    const clearOnScroll = () => setSelection(null);
    window.addEventListener("scroll", clearOnScroll, { passive: true });
    return () => { document.removeEventListener("mouseup", readSelection); document.removeEventListener("keyup", readSelection); window.removeEventListener("scroll", clearOnScroll); };
  }, []);

  function ask(kind: "translate" | "explain") {
    if (!selection) return;
    const prompt = kind === "translate"
      ? locale === "vi"
        ? `Dịch “${selection.text}” sang tiếng Việt và giải thích nghĩa trong bài “${lessonTitle}”, kèm một ví dụ ngắn.`
        : `Translate “${selection.text}” into English and explain its meaning in “${lessonTitle}”, with a short example.`
      : locale === "vi"
        ? `Giải thích “${selection.text}” trong bài “${lessonTitle}”, kèm ví dụ thực tế và liên hệ với một khái niệm AI Engineering liên quan.`
        : `Explain “${selection.text}” in “${lessonTitle}”, with a practical example and a related AI engineering concept.`;
    window.dispatchEvent(new CustomEvent("academy:ask-assistant", { detail: { prompt, autoSubmit: true } }));
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }

  if (!selection) return null;
  return <div className="selection-assistant" style={{ top: selection.top, left: selection.left }} role="group" aria-label={t("chat_title")} onMouseDown={(event) => event.preventDefault()}>
    <button type="button" onClick={() => ask("translate")}>⇄ {t("selection_translate")}</button>
    <button type="button" onClick={() => ask("explain")}>✳ {t("selection_ask")}</button>
  </div>;
}
