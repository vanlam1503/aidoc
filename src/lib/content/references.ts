export type ReferenceCategory =
  | "OpenAI and Codex"
  | "Prompt Engineering"
  | "AI Agents"
  | "LangChain and LangGraph"
  | "MCP"
  | "RAG and Vector Databases"
  | "Evals and Observability"
  | "Security and Production";

export type Reference = {
  name: string;
  url: string;
  description: string;
  category: ReferenceCategory;
  difficulty: "basic" | "intermediate" | "advanced";
  relatedLessons: string[];
  githubStars: string;
  lastVerified: string;
};

const verified = "2026-10-31";
const item = (name: string, url: string, description: string, category: ReferenceCategory, difficulty: Reference["difficulty"], relatedLessons: string[], githubStars = "Not available"): Reference => ({ name, url, description, category, difficulty, relatedLessons, githubStars, lastVerified: verified });

export const referenceCategories: ReferenceCategory[] = [
  "OpenAI and Codex", "Prompt Engineering", "AI Agents", "LangChain and LangGraph", "MCP", "RAG and Vector Databases", "Evals and Observability", "Security and Production",
];

export const references: Reference[] = [
  item("OpenAI Codex", "https://github.com/openai/codex", "Codex source code and public components for exploring coding agents that work with repositories.", "OpenAI and Codex", "intermediate", ["codex-introduction", "codex-cli"], "132.4k"),
  item("OpenAI Cookbook", "https://github.com/openai/openai-cookbook", "Practical examples of the Responses API, embeddings, prompt design, and OpenAI integrations.", "OpenAI and Codex", "basic", ["responses-api", "structured-outputs"], "76.9k"),
  item("OpenAI Agents SDK for JavaScript", "https://github.com/openai/openai-agents-js", "A TypeScript and JavaScript SDK for building agents, handoffs, tools, and tracing with OpenAI.", "AI Agents", "intermediate", ["agents-sdk-typescript", "tool-calling"], "4.0k"),
  item("Codex documentation", "https://developers.openai.com/codex/", "Official Codex documentation covering product usage and workspace configuration.", "OpenAI and Codex", "basic", ["codex-introduction", "codex-configuration"]),
  item("OpenAI Building agents track", "https://developers.openai.com/tracks/building-agents", "An official learning track covering agent concepts, implementation, and best practices.", "AI Agents", "intermediate", ["responses-api", "tool-calling"]),
  item("Prompt Engineering Guide", "https://github.com/dair-ai/Prompt-Engineering-Guide", "A community-maintained collection of prompting techniques and foundational reading.", "Prompt Engineering", "basic", ["prompt-engineering-basics", "context-engineering"], "79.7k"),
  item("Awesome ChatGPT Prompts", "https://github.com/f/awesome-chatgpt-prompts", "Example prompts for studying instruction structure, goals, and limitations.", "Prompt Engineering", "basic", ["prompt-engineering-basics"], "175.4k"),
  item("Awesome Prompt Engineering", "https://github.com/promptslab/Awesome-Prompt-Engineering", "A directory of prompt engineering resources, tools, and research.", "Prompt Engineering", "intermediate", ["prompt-engineering-basics", "agent-evaluations"], "6.4k"),
  item("12-Factor Agents", "https://github.com/humanlayer/12-factor-agents", "Principles for building observable, controllable agents that integrate with existing software.", "AI Agents", "advanced", ["agent-orchestration", "production-ai"], "26.9k"),
  item("MCP servers", "https://github.com/modelcontextprotocol/servers", "Example MCP servers showing how tools expose context and capabilities to clients.", "MCP", "intermediate", ["codex-mcp"], "91.7k"),
  item("MCP introduction", "https://modelcontextprotocol.io/introduction", "An introduction to the MCP protocol, hosts, clients, and servers.", "MCP", "basic", ["codex-mcp"]),
  item("LangChain.js", "https://github.com/langchain-ai/langchainjs", "A JavaScript library for model integrations, runnable composition, retrieval, and tools.", "LangChain and LangGraph", "intermediate", ["langchain-js"], "18.3k"),
  item("LangGraph.js", "https://github.com/langchain-ai/langgraphjs", "A runtime for graph-based agent workflows with state, conditional routing, streaming, and checkpointing.", "LangChain and LangGraph", "advanced", ["langgraph-state-machines", "checkpointing-recovery"], "3.4k"),
  item("LangChain documentation", "https://docs.langchain.com/", "Documentation for LangChain, LangGraph, retrieval, deployment, and tracing.", "LangChain and LangGraph", "intermediate", ["langchain-js", "rag-embeddings"]),
  item("OpenAI retrieval guide", "https://platform.openai.com/docs/guides/retrieval", "Official guidance on knowledge base search and retrieval augmented generation.", "RAG and Vector Databases", "intermediate", ["rag-embeddings"]),
  item("OpenAI embeddings guide", "https://platform.openai.com/docs/guides/embeddings", "Concepts and practical guidance for using embeddings in similarity, clustering, and search.", "RAG and Vector Databases", "intermediate", ["rag-embeddings", "vector-databases"]),
  item("Promptfoo", "https://github.com/promptfoo/promptfoo", "An open-source framework for prompt and model evaluations, red-team checks, and regression testing.", "Evals and Observability", "advanced", ["agent-evaluations", "prompt-regression-testing"], "26.7k"),
  item("OpenAI evaluation best practices", "https://developers.openai.com/api/docs/guides/evaluation-best-practices", "Guidance on evaluation design. The OpenAI Evals API is scheduled to retire on November 30, 2026; use this resource for methodology and keep test suites portable.", "Evals and Observability", "advanced", ["agent-evaluations"]),
  item("LangSmith Observability", "https://docs.langchain.com/langsmith/observability", "Tracing and metrics for diagnosing and monitoring LLM applications and building datasets.", "Evals and Observability", "advanced", ["langsmith", "observability"]),
  item("OWASP GenAI LLM Top 10 2026", "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/", "The 2026 edition covering LLM security risks and mitigations informed by practical research.", "Security and Production", "advanced", ["security-guardrails", "prompt-injection-fundamentals"]),
];
