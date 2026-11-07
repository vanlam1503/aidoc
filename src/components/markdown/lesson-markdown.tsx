"use client";

import { isValidElement, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { MermaidChart } from "@/components/markdown/mermaid-chart";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (node && typeof node === "object" && "props" in node) return textContent((node as { props: { children?: ReactNode } }).props.children);
  return "";
}

function CopyButton({ value }: { value: string }) {
  const [label, setLabel] = useState("Copy");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setLabel("Copied");
      window.setTimeout(() => setLabel("Copy"), 1600);
    } catch {
      setLabel("Copy failed");
      window.setTimeout(() => setLabel("Copy"), 1600);
    }
  }
  return <button type="button" className="code-copy" onClick={copy} aria-label="Copy code to clipboard">{label}</button>;
}

function CodeFrame({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const child = Array.isArray(children) ? children[0] : children;
  if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className?.split(/\s+/).includes("language-mermaid")) {
    return <MermaidChart source={textContent(child.props.children)} />;
  }
  return <div className="code-frame"><CopyButton value={textContent(children)} /><pre {...props} tabIndex={0}>{children}</pre></div>;
}

export function LessonMarkdown({ source, language = defaultLocale }: { source: string; language?: Locale }) {
  return <article className="markdown-content" lang={language}><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]} components={{ pre: CodeFrame }}>{source}</ReactMarkdown></article>;
}
