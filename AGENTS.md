# AI Engineering Academy contributor guide

## Architecture

- Next.js App Router pages and reusable interface components live under `src/`.
- Lessons are local Markdown-compatible MDX files under `content/`; keep one `index.mdx` per lesson.
- `src/lib/content/` validates and loads metadata/content. `src/lib/search/` owns local lexical indexing and ranking.
- `src/lib/local/store.ts` owns single-user local progress, bookmarks, conversations, and usage in the ignored `.data/academy.json` file. No login or database service is required.
- `src/lib/bookmarks/schema.ts` defines backward-compatible lesson/link bookmarks. Shared client bookmark state belongs in `BookmarkProvider`; `/bookmarks` provides local search and link management.
- Validate API inputs and enforce same-origin checks before local writes; keep atomic serialized file updates in the store.
- External service access belongs in server-only feature modules or route handlers, never in UI components.
- Keep the local learning flow free of account requirements. Gemini API keys stay in the ignored server file `.data/gemini-key.json` (mode `0600`); settings endpoints must never return credentials.

## Standards

- TypeScript strict mode; avoid `any`, validate external input, and keep IDs stable.
- Use English as the default for the interface, assistant, and new educational content; retain standard technical terminology. Existing Vietnamese lessons remain available.
- Keep the default locale in `src/lib/i18n/config.ts`. Each lesson uses an English `index.mdx` (`language: en`); preserve the Vietnamese original in the adjacent `vi.mdx` (`language: vi`), with the same stable ID and prerequisites. Settings must select the matching lesson text, metadata, navigation, and search results; translations retain their corresponding section headings.
- Write original educational explanations; verify definitions against primary resources and cite them instead of reproducing them.
- Keep secrets server-side and out of source control. Avoid adding dependencies without a concrete need.
- Preserve keyboard navigation, semantic landmarks, visible focus, and responsive behavior.

## Recommendations and learning resources

- Attach relevant reference pages, upstream GitHub repositories, and sample project repositories to each recommendation or suggested learning item. Explain briefly how each resource supports the recommendation; if a resource category does not apply or no trustworthy example is available, say so instead of inventing a link.
- Mark essential, high-value recommendations and resources with a visible literal `*` and the label `Essential`, explain why they matter, and list them first within the relevant section or resource group. Order essential work by risk and prerequisite dependencies. The marker denotes editorial importance, not GitHub star count.
- Prefer official documentation and maintained upstream examples. Verify links and version compatibility when possible; label unverified links explicitly and do not equate repository popularity with quality.

## Commands

- `npm run dev` — local development server
- `npm run typecheck` — strict TypeScript check
- `npm run content:validate` — validate lesson metadata and IDs
- `npm run search:build` — rebuild the local search index
- `npm test` — run Vitest unit/integration tests
- `npm run test:e2e` — run Playwright journeys and axe accessibility checks
- `npx playwright install chromium` — install the browser used by E2E tests
- `npm run test:all` — run unit/integration and E2E suites
- `npm run build` — production build

## Definition of done

For each milestone, run typecheck, content validation, relevant tests, and a production build; fix failures and inspect the final changes. Keep architecture, setup, and status documentation aligned with implemented behavior. Do not mark unimplemented milestones complete.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
