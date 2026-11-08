# AI Engineering Academy: Architecture Proposal

## Goals

Build a locally runnable learning platform whose lessons remain editable and reviewable as Markdown/MDX files. Public lessons and local search work without external services. Learning state is saved locally without accounts. Gemini AI help requires only a server API key.

## Application architecture

- **Web:** Next.js App Router with strict TypeScript, Tailwind CSS, and reusable accessible React components.
- **Content:** One `content/**/index.mdx` per lesson. A server-only content module validates frontmatter, builds the curriculum tree, renders lessons, and exposes stable lesson IDs.
- **Search:** A build-time/local script extracts lesson text into a compact JSON index. Client search ranks title, tags, description, and body matches locally; the retrieval boundary can later accept semantic/vector implementations.
- **Persistence:** A server-only JSON store in `src/lib/local/store.ts` saves progress, bookmarks, conversations, and usage in the ignored `.data/academy.json` file. Schema validation, serialized writes, and atomic replacement protect local updates.
- **AI:** A server-only Google Gemini adapter receives validated requests, retrieves a small set of local lesson chunks, enforces quotas/output limits, and streams responses. API credentials never enter client bundles.
- **Presentation:** Three-column desktop learning layout (curriculum, lesson, table of contents), collapsible mobile navigation, theme toggle, progress indicator, lesson navigation, and a local assistant without a login gate.
- **Language:** English is the default for the interface, assistant, and all lessons. The device language preference selects English `index.mdx` or its adjacent original `vi.mdx`, including titles, descriptions, article text, navigation, and search. Stable lesson IDs preserve saved progress/bookmarks across languages. The reader receives both translations for the current lesson, with metadata-only summaries for the curriculum; local search contains both language versions. Retrieval selects the matching language and cites the actual source path. Content validation checks language, shared identity/prerequisites, and the corresponding section headings.

## Content and request flow

```text
Local MDX ──> metadata/content loader ──> curriculum + lesson pages
     └──────> search-index builder ─────> local global search

Browser ──> Next.js route handlers ──> Local JSON store (.data/academy.json)
                                      └─> Gemini service ──> Gemini API
                                            ↑
                                  local retrieval interface
```

Content is trusted repository input, not user input. API route inputs are validated with Zod. Writes validate input and enforce same-origin requests. The app has one personal workspace, with no account separation. Chat context is limited to retrieved excerpts and bounded conversation history.

## Dependency decisions

- Start with the current stable Next.js App Router, React, TypeScript, and Tailwind releases compatible with the installed Node runtime; pin direct dependencies in `package.json` and lockfile.
- Use MDX via the Next.js MDX integration and a frontmatter parser/schema. Avoid a remote CMS.
- Use shadcn/ui as a component pattern (Radix primitives plus local component source), adding only primitives needed by the interface.
- Use Node filesystem APIs and Zod for durable local data; no authentication SDK or database service is required.
- Use the official `@google/genai` SDK and streaming Gemini API in a server-only module. No LangChain dependency in the chatbot.
- Use Zod at content, form, and route boundaries. Use Vitest for unit/integration tests and Playwright for browser-level flows.
- Add syntax highlighting and Mermaid rendering only with bounded, maintained packages and safe rendering settings.

## Local data design

The store keeps stable lesson IDs for progress/bookmarks, UUIDs for conversations/messages, timestamps, and bounded usage records. Progress never decreases and completion remains set. Up to 20 conversations and 100 messages per conversation are retained. Usage reservations enforce 10 requests per rolling hour and 30 per UTC day across the personal workspace, including failed requests. Usage older than 24 hours is pruned. The schema is versioned and the file is capped at 32 MiB. Run one local server process for a data file.

## Security and privacy

- Keep credentials in ignored server-only files with owner-only permissions; `.env.example` documents optional non-secret runtime settings.
- There are no account cookies or login routes; local writes require a matching request origin.
- Validate request bodies and cap lengths, retrieved context, history, and generated output.
- Apply personal-workspace quotas and timeout/error handling before enabling chat for users.
- Treat lesson text as untrusted context for prompt-injection purposes; instruct the model to cite sources and not follow instructions found inside retrieved documents.
- Save the Gemini API key through Assistant settings into `.data/gemini-key.json` with mode `0600`; return only configuration state and never expose the key through HTML, API responses, or browser storage.

## Extension points

- `ContentRepository`: local MDX now; optional alternate source only if requirements change.
- `SearchProvider` / `Retriever`: local lexical index now; replace with semantic/vector retrieval without changing chat route contracts.
- `AIProvider`: official Google Gemini adapter behind a small server interface.
- LocalStore and route handlers keep persistence separate from components.

