# Interview preparation

The learning path contains 99 original practice questions across all 33 lessons, with matching English and Vietnamese sections. Open a lesson and choose **Interview questions** or **Câu hỏi phỏng vấn** in its table of contents. Search indexes the questions and answer outlines in the selected language.

Each lesson includes three topic-specific questions, suggested answer outlines, direct primary-source citations, and implementation resources. Question 1 is marked with the visible literal `* Essential` and explains why it comes first. The marker expresses editorial importance, not repository stars. Work through prerequisites before advanced design exercises.

These are original preparation exercises synthesized from online technical references, not questions attributed to an employer or claims about interview frequency. Suggested design answers are engineering proposals rather than quotations or official requirements. Use a 60–90 second spoken answer, then discuss tradeoffs and a concrete example.

## Sources and compatibility

Source pages and repository roots were opened and checked on **2026-11-07**. Primary references include OpenAI Docs, Hugging Face, original research papers, MCP, LangChain/LangGraph/LangSmith, OWASP, pgvector, Promptfoo, OpenTelemetry, AWS, Google SRE, and GitHub documentation. Each answer links to the relevant page beside the claim. Repository links point to upstream projects or their maintained sample collections; they do not establish that every sample runs unchanged in this application.

The OpenAI examples use the Responses API vocabulary. LangChain and LangGraph links select the TypeScript documentation. MCP references use the published **2026-07-28** documentation; match an SDK release to the protocol version before adapting examples. These questions introduce no package or SDK upgrade. Cookbook examples are mostly Python and require adaptation to TypeScript. Project resources are building blocks, not completed portfolio projects.

Use OpenAI's evaluation best-practices page for methodology; this addition does not depend on the retiring OpenAI Evals service. Some Codex documentation now redirects to `learn.chatgpt.com`. The old `openai/skills` catalog is deprecated, so new skill examples point to `openai/plugins`. OWASP risk-page links retain their explicitly labeled 2025 edition and are used for the risk concepts, not presented as the latest numbering.

No primary source used here establishes employer-specific question frequency. No complete official implementation of the three portfolio projects was verified; the linked repositories are labeled as reference building blocks. No external service, API key, or signed-in account is required to read this material.

## Coverage

| Group | Questions | English lesson | Vietnamese lesson |
| --- | ---: | --- | --- |
| 01-foundations | 3 | [What is an LLM? How language models work](../content/01-foundations/01-llm-fundamentals/index.mdx#interview-questions) | [Tiếng Việt](../content/01-foundations/01-llm-fundamentals/vi.mdx) |
| 01-foundations | 3 | [Prompt Engineering Fundamentals](../content/01-foundations/02-prompt-engineering/index.mdx#interview-questions) | [Tiếng Việt](../content/01-foundations/02-prompt-engineering/vi.mdx) |
| 01-foundations | 3 | [Context Engineering: choosing the right information for a model](../content/01-foundations/03-context-engineering/index.mdx#interview-questions) | [Tiếng Việt](../content/01-foundations/03-context-engineering/vi.mdx) |
| 01-foundations | 3 | [Structured Outputs and data contracts](../content/01-foundations/04-structured-outputs/index.mdx#interview-questions) | [Tiếng Việt](../content/01-foundations/04-structured-outputs/vi.mdx) |
| 01-foundations | 3 | [Prompt Injection and trust boundaries](../content/01-foundations/05-prompt-injection/index.mdx#interview-questions) | [Tiếng Việt](../content/01-foundations/05-prompt-injection/vi.mdx) |
| 02-codex | 3 | [OpenAI Codex: coding agents in the development workflow](../content/02-codex/01-codex-introduction/index.mdx#interview-questions) | [Tiếng Việt](../content/02-codex/01-codex-introduction/vi.mdx) |
| 02-codex | 3 | [Codex CLI: working safely in the terminal](../content/02-codex/02-codex-cli/index.mdx#interview-questions) | [Tiếng Việt](../content/02-codex/02-codex-cli/vi.mdx) |
| 02-codex | 3 | [AGENTS.md: durable guidance for coding agents](../content/02-codex/03-agents-md/index.mdx#interview-questions) | [Tiếng Việt](../content/02-codex/03-agents-md/vi.mdx) |
| 02-codex | 3 | [Codex Skills: packaging specialist workflows](../content/02-codex/04-codex-skills/index.mdx#interview-questions) | [Tiếng Việt](../content/02-codex/04-codex-skills/vi.mdx) |
| 02-codex | 3 | [MCP fundamentals: connecting models to tools and context](../content/02-codex/05-codex-mcp/index.mdx#interview-questions) | [Tiếng Việt](../content/02-codex/05-codex-mcp/vi.mdx) |
| 02-codex | 3 | [Codex workflows: reviewing, fixing, and handing off patches](../content/02-codex/06-codex-workflows/index.mdx#interview-questions) | [Tiếng Việt](../content/02-codex/06-codex-workflows/vi.mdx) |
| 02-codex | 3 | [Codex configuration and permission boundaries](../content/02-codex/07-codex-configuration/index.mdx#interview-questions) | [Tiếng Việt](../content/02-codex/07-codex-configuration/vi.mdx) |
| 03-agent-fundamentals | 3 | [OpenAI Responses API: request and output lifecycle](../content/03-agent-fundamentals/01-responses-api/index.mdx#interview-questions) | [Tiếng Việt](../content/03-agent-fundamentals/01-responses-api/vi.mdx) |
| 03-agent-fundamentals | 3 | [Tool calling: validate intent before executing actions](../content/03-agent-fundamentals/02-tool-calling/index.mdx#interview-questions) | [Tiếng Việt](../content/03-agent-fundamentals/02-tool-calling/vi.mdx) |
| 03-agent-fundamentals | 3 | [OpenAI Agents SDK with TypeScript](../content/03-agent-fundamentals/03-agents-sdk-typescript/index.mdx#interview-questions) | [Tiếng Việt](../content/03-agent-fundamentals/03-agents-sdk-typescript/vi.mdx) |
| 03-agent-fundamentals | 3 | [Agent memory and state: retaining what recovery needs](../content/03-agent-fundamentals/04-agent-memory/index.mdx#interview-questions) | [Tiếng Việt](../content/03-agent-fundamentals/04-agent-memory/vi.mdx) |
| 04-langchain | 3 | [LangChain.js: composing models, prompts, and runnables](../content/04-langchain/01-langchain-js/index.mdx#interview-questions) | [Tiếng Việt](../content/04-langchain/01-langchain-js/vi.mdx) |
| 04-langchain | 3 | [RAG and embeddings: retrieve before generating](../content/04-langchain/02-rag-embeddings/index.mdx#interview-questions) | [Tiếng Việt](../content/04-langchain/02-rag-embeddings/vi.mdx) |
| 04-langchain | 3 | [Vector databases and hybrid search](../content/04-langchain/03-vector-databases/index.mdx#interview-questions) | [Tiếng Việt](../content/04-langchain/03-vector-databases/vi.mdx) |
| 04-langchain | 3 | [LangGraph state machines and conditional routing](../content/04-langchain/04-langgraph-state-machines/index.mdx#interview-questions) | [Tiếng Việt](../content/04-langchain/04-langgraph-state-machines/vi.mdx) |
| 04-langchain | 3 | [LangSmith: tracing and dataset-driven iteration](../content/04-langchain/05-langsmith/index.mdx#interview-questions) | [Tiếng Việt](../content/04-langchain/05-langsmith/vi.mdx) |
| 05-advanced | 3 | [Agent evaluations: measuring behavior you need to trust](../content/05-advanced/01-agent-evaluations/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/01-agent-evaluations/vi.mdx) |
| 05-advanced | 3 | [Prompt regression testing and release gates](../content/05-advanced/02-prompt-regression-testing/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/02-prompt-regression-testing/vi.mdx) |
| 05-advanced | 3 | [Security and guardrails for AI applications](../content/05-advanced/03-security-guardrails/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/03-security-guardrails/vi.mdx) |
| 05-advanced | 3 | [Observability: tracing, metrics, and alerts](../content/05-advanced/04-observability/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/04-observability/vi.mdx) |
| 05-advanced | 3 | [Token and cost optimization for AI systems](../content/05-advanced/05-token-cost-optimization/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/05-token-cost-optimization/vi.mdx) |
| 05-advanced | 3 | [Production deployment and CI/CD for AI applications](../content/05-advanced/06-production-ai/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/06-production-ai/vi.mdx) |
| 05-advanced | 3 | [Multi-agent architectures: splitting roles for a reason](../content/05-advanced/07-multi-agent-architectures/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/07-multi-agent-architectures/vi.mdx) |
| 05-advanced | 3 | [Orchestration and human-in-the-loop](../content/05-advanced/08-agent-orchestration/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/08-agent-orchestration/vi.mdx) |
| 05-advanced | 3 | [Checkpointing, retries, and recovery](../content/05-advanced/09-checkpointing-recovery/index.mdx#interview-questions) | [Tiếng Việt](../content/05-advanced/09-checkpointing-recovery/vi.mdx) |
| 06-projects | 3 | [Project: a code review agent with verifiable findings](../content/06-projects/01-code-review-agent-project/index.mdx#interview-questions) | [Tiếng Việt](../content/06-projects/01-code-review-agent-project/vi.mdx) |
| 06-projects | 3 | [Project: an API monitoring agent with controlled escalation](../content/06-projects/02-api-monitoring-agent-project/index.mdx#interview-questions) | [Tiếng Việt](../content/06-projects/02-api-monitoring-agent-project/vi.mdx) |
| 06-projects | 3 | [Project: a software engineering agent with checkpoints and approvals](../content/06-projects/03-software-engineering-agent-project/index.mdx#interview-questions) | [Tiếng Việt](../content/06-projects/03-software-engineering-agent-project/vi.mdx) |

## Flashcard practice

Open `/flashcards` from the main navigation or use the embedded practice below a lesson. Both reuse `src/components/flashcards/flashcard-practice.tsx`. The library filters by lesson and optionally by `* Essential`; essential questions appear first because they establish prerequisites. Essential questions retain curriculum prerequisite order; follow-up questions and answer positions shuffle when starting or restarting a session. English is the default; changing the selected language resets the session and uses the matching Vietnamese questions, answers, lesson titles, and source links.

`src/lib/flashcards/deck.ts` extracts the existing interview headings, answer outlines, essential rationale, and primary references. Stable IDs use `<lesson-id>:interview:<question-number>`, shared across translations. There is no duplicate question catalog or runtime AI call. For each question, the deck builder takes its answer plus three distinct outlines from other questions, preferring the same lesson and section. This is an answer-matching exercise against the authored outline, not a claim that the other statements are universally false or that open-ended design questions admit only one engineering solution. Primary references and a lesson link appear after selection.

`FlashcardPractice` accepts `cards`, a full answer `bank`, and `locale`; pass a filtered subset as `cards` to embed another deck. Keep the full bank available even for a one-question review so four distinct options remain possible. The localized wrapper resets practice when the lesson or language changes. Answers lock after the first choice; completion shows the score and allows missed-only review or a fresh shuffled run. Practice results remain in component memory for the current session and are not saved to an account.
