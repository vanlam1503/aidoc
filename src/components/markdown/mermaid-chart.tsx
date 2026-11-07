"use client";

import { useEffect, useId, useState } from "react";

export function MermaidChart({ source }: { source: string }) {
  const id = `academy-mermaid-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void import("mermaid").then(async ({ default: mermaid }) => {
      if (!active) return;
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: document.documentElement.classList.contains("dark") ? "dark" : "default" });
      const { svg: rendered } = await mermaid.render(id, source);
      if (active) setSvg(rendered);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, source]);

  if (error) return <pre className="mermaid-error" role="status">Unable to render this diagram. Check the Mermaid syntax.</pre>;
  return <div className="mermaid-chart" role="img" aria-label="Mermaid diagram">{svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <span>Rendering diagram…</span>}</div>;
}
