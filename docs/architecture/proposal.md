# AI Engineering Academy: Architecture Proposal

## Goals

Build a locally runnable learning platform whose lessons remain editable and reviewable as Markdown/MDX files. Public lessons and local search work without external services. Accounts, saved learning state, and AI help are optional server capabilities configured by the operator.

## Application architecture

- **Web:** Next.js App Router with strict TypeScript, Tailwind CSS, and reusable accessible React components.
- **Content:** One `content/**/index.mdx` per lesson. A server-only content module validates frontmatter, builds the curriculum tree, renders lessons, and exposes stable lesson IDs.
- **Search:** A build-time/local script extracts lesson text into a compact JSON index. Client search ranks title, tags, description, and body matches locally; the retrieval boundary can later accept semantic/vector implementations.
- **Persistence:** PostgreSQL through Prisma. Auth.js owns OAuth accounts and sessions; progress, bookmarks, conversations, messages, and usage are application models. Public reading does not depend on the database.
- **AI:** A server-only OpenAI Responses API adapter receives validated requests, retrieves a small set of local lesson chunks, enforces quotas/output limits, and streams responses. API credentials never enter client bundles.
- **Presentation:** Three-column desktop learning layout (curriculum, lesson, table of contents), collapsible mobile navigation, theme toggle, progress indicator, lesson navigation, and an authenticated assistant.
- **Language:** English is the default for the interface, assistant, and all lessons. The device language preference selects English `index.mdx` or its adjacent original `vi.mdx`, including titles, descriptions, article text, navigation, and search. Stable lesson IDs preserve saved progress/bookmarks across languages. The reader receives both translations for the current lesson, with metadata-only summaries for the curriculum; local search contains both language versions. Retrieval selects the matching language and cites the actual source path. Content validation checks language, shared identity/prerequisites, and the corresponding section headings.

## Content and request flow

```text
Local MDX ──> metadata/content loader ──> curriculum + lesson pages
     └──────> search-index builder ─────> local global search

Browser ──> Next.js route handlers ──> Auth.js session ──> Prisma/PostgreSQL
                                      └─> OpenAI service ──> Responses API
                                            ↑
                                  local retrieval interface
```

Content is trusted repository input, not user input. API route inputs are validated with Zod. Authentication and authorization are checked on the server for every write. Chat context is limited to retrieved excerpts and bounded conversation history.

## Dependency decisions

- Start with the current stable Next.js App Router, React, TypeScript, and Tailwind releases compatible with the installed Node runtime; pin direct dependencies in `package.json` and lockfile.
- Use MDX via the Next.js MDX integration and a frontmatter parser/schema. Avoid a remote CMS.
- Use shadcn/ui as a component pattern (Radix primitives plus local component source), adding only primitives needed by the interface.
- Use Auth.js with its Prisma adapter and Google provider; keep OAuth optional for local public reading.
- Use Prisma/PostgreSQL for durable user data; provide migrations and a local Docker Compose database.
- Use the official `openai` Node SDK and Responses API in a server-only module. No LangChain dependency in the chatbot.
- Use Zod at content, form, and route boundaries. Use Vitest for unit/integration tests and Playwright for browser-level flows.
- Add syntax highlighting and Mermaid rendering only with bounded, maintained packages and safe rendering settings.

## Database design

`User` is the owner for `Account`, `Session`, `LessonProgress`, `Bookmark`, `ChatConversation`, and `AIUsageRecord`. `ChatConversation` owns ordered `ChatMessage` rows. Natural uniqueness constraints prevent duplicate progress/bookmarks per user and lesson; lesson IDs remain stable even if titles change. Usage records retain only counters, model, request status, and timestamps needed for quotas and operations. Avoid storing OAuth tokens beyond Auth.js adapter requirements and never store provider secrets in application tables.

## Security and privacy

- Keep secrets in server environment variables and provide placeholders only in `.env.example`.
- Use Auth.js secure, HTTP-only cookies and built-in CSRF protections; secure cookies are enabled in production.
- Validate request bodies and cap lengths, retrieved context, history, and generated output.
- Apply per-user quotas and timeout/error handling before enabling chat for users.
- Treat lesson text as untrusted context for prompt-injection purposes; instruct the model to cite sources and not follow instructions found inside retrieved documents.
- Do not claim Google OAuth supplies OpenAI API access. OpenAI billing/configuration is independent.

## Extension points

- `ContentRepository`: local MDX now; optional alternate source only if requirements change.
- `SearchProvider` / `Retriever`: local lexical index now; replace with semantic/vector retrieval without changing chat route contracts.
- `AIProvider`: official OpenAI Responses adapter behind a small server interface.
- Prisma models and route services keep persistence separate from components.

