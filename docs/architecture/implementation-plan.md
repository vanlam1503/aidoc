# Implementation Plan

## Milestones and definition of done

### Phase 1 — Local learning core

1. Initialize the Next.js App Router, strict TypeScript, Tailwind, and base UI conventions.
2. Add the persistent documentation/curriculum skeleton and local MDX lesson loader with validated frontmatter.
3. Seed substantive foundational lessons and curriculum groups.
4. Build responsive navigation, lesson view, breadcrumbs, TOC, previous/next links, theme control, and reading progress.
5. Generate and use a local full-text search index with difficulty filters.

**Done when:** app starts locally; lessons load from local files; navigation and search work without external services; typecheck and relevant tests pass; diff and known gaps are reviewed.

### Phase 2 — Complete curriculum and references

Populate all Basic, Intermediate, and Advanced topics with distinct lessons following the required ten-part lesson structure. Add the categorized reference library, related-lesson links, verified-date fields, and GitHub stars only where the API provides them. Add content validation and index scripts.

### Phase 3 — Identity and learning persistence

Add Prisma schema and migrations for Auth.js, progress, bookmarks, conversations, messages, and usage. Configure Google OAuth, local PostgreSQL instructions, protected dashboard, profile/sign-out, and server-authorized progress/bookmark writes. Public lesson pages remain anonymous.

### Phase 4 — AI assistant

Add the official OpenAI SDK Responses API, local chunk retrieval, citations to lesson paths/IDs, streaming, bounded user conversation history, Zod validation, timeouts, error handling, and per-user quotas. Render an explicit configuration state when the API key is absent.

### Phase 5 — Quality and operations

Add Vitest unit/integration coverage and Playwright end-to-end journeys, accessibility review, security review, performance work, CI guidance, and complete setup/architecture/known-limitations documentation.

## Database outline

Use Auth.js-compatible `User`, `Account`, and `Session` models. Add `LessonProgress` and `Bookmark` unique on `(userId, lessonId)`. Add `ChatConversation` owned by a user with `ChatMessage` children. Add `AIUsageRecord` indexed by `(userId, createdAt)` for quota checks. Use cascades for user-owned records and timestamps for mutable records.

## Testing strategy

- Unit: frontmatter validation, lesson discovery/order, search tokenization/ranking, content link integrity, and retrieval ranking.
- Integration: route validation/auth guards, persistence constraints, chat quota/error paths, and citation formatting.
- E2E: browse lessons anonymously, search/filter/open a lesson, navigate mobile sidebar, theme toggle, OAuth when credentials exist, authenticated progress/bookmarks, and chat when configured.
- Operational checks: strict TypeScript, production build, content validator, migration status, and manual accessibility/keyboard pass.

## Current status

- Architecture proposal and phased implementation plan are written.
- **Phase 1 complete:** Next.js 16 App Router, strict TypeScript, Tailwind 4, shadcn-style local UI components, validated MDX loading, five substantive Basic lessons, responsive curriculum/lesson reader, themes, global/local full-text search, generated search index, breadcrumbs, previous/next, TOC, reading progress, copy-code controls, and Mermaid rendering.
- **Phase 2 complete:** 28 additional original lessons cover Codex, Agents, LangChain/LangGraph, advanced engineering, and projects. References are grouped into all eight requested categories with related lesson IDs, last-verified dates, and GitHub stars sourced from the repository pages where available.
- **Public-app verification (2026-11-07):** `npm run typecheck`, `npm test`, `npm run content:validate`, `npm run search:build`, `npm run test:e2e`, and `npm run build` pass. Vitest covers 30 tests; Playwright covers 14 browser tests, including the full English curriculum, lesson body/navigation/search language switching, saved preferences, assistant request locale, and light/dark axe checks. The E2E suite was run against the updated production app on `http://localhost:3001`. All 33 original Vietnamese source files remain preserved byte-for-byte in adjacent `vi.mdx` files; stable lesson IDs and prerequisites are unchanged.
- **Phase 3 implementation:** Auth.js Google provider with Prisma database sessions; PostgreSQL schema and initial migration; dashboard/profile, sign-out, protected progress/bookmark APIs, and client save controls. Live PostgreSQL migration and OAuth acceptance checks remain outstanding; the schema and initial migration are present.
- **Phase 4 implementation:** Official OpenAI Node SDK Responses API, bounded local lexical retrieval, streaming assistant, per-user conversation history, Zod/request size/origin validation, hourly/daily quotas, usage tracking, output/token limits, API-key configuration state, and local lesson citations. Live API tests require user-provided OpenAI credentials and a working database.
- **Phase 5 implementation:** Vitest tests cover curriculum integrity, references, search ranking/filtering, retrieval ranking/bounds, streamed request-size/origin guards, and search-box behavior. Playwright covers anonymous search-to-lesson and reference-to-lesson journeys, mobile lesson navigation, protected API responses, security response headers, assistant focus management, and axe WCAG 2 A/AA checks in light and dark themes. Added security response headers, fixed issues found by axe and the API integration test, and deferred Mermaid to its own client chunk.
- **English default:** All 33 lessons have English canonical `index.mdx` files and original Vietnamese `vi.mdx` translations with unchanged IDs/prerequisites. Settings selects titles, descriptions, body text, sidebar, table of contents, pagination, search results, and learning pathway links together. The assistant retrieves matching-language source files and cites their actual paths. Public lesson routes remain statically generated. The existing localhost production process must be restarted after a fresh build to serve changes. The header now uses an explicit English/Tiếng Việt selector showing the current locale. Re-selecting a language preserves that choice. Regression tests verify label/content agreement at `/#curriculum` from both saved locales, through repeated choices and reloads, including a mobile viewport.
- **Service-dependent verification outstanding:** The initial PostgreSQL migration, persisted progress/bookmarks, database sessions, quota behavior, Google OAuth, and live Responses API calls were not exercised as part of this language review. These acceptance checks require a working database and configured provider credentials; the assistant locale browser test uses a mocked response.

