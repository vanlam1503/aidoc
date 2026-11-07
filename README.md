# AI Engineering Academy

A local-first curriculum for building AI-powered software. Educational lessons live in `content/` as Markdown-compatible MDX files; there is no remote CMS requirement. Anonymous learners can browse lessons, use local search, and read the references library. Optional Google OAuth, PostgreSQL persistence, and the AI assistant enable account features.

## Requirements

- Node.js 20.9 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3001. Lessons and search work without credentials or a database.

## Content workflow

English is the default for the interface, assistant, and all 33 lessons. The language selected in Settings applies to lesson titles, descriptions, body text, the table of contents, navigation, search results, and learning pathway links. The header language selector displays the current selection: choosing English displays English content, and choosing Tiếng Việt displays Vietnamese content. Selecting the same language again keeps it selected. The preference is saved on the current device; browser language does not override the English default. Selecting Vietnamese loads the original Vietnamese lessons.

Each lesson has an English `content/<section>/<lesson>/index.mdx` with validated YAML frontmatter. Its optional Vietnamese translation is stored alongside it as `vi.mdx`, with the same stable `id` and prerequisites and `language: vi`. The canonical lesson defaults to `language: en`. Add metadata and the required lesson sections to both versions. The reader selects the matching translation and sets the article language accordingly. If a translation is unavailable, it falls back to the English lesson.

English lessons require these level-two headings (subtitles may follow the heading): Learning objectives, Prerequisites, Theory, Architecture, TypeScript example, Practice, Common mistakes, Further reading, Quick quiz, and Completion criteria. Vietnamese lessons keep the equivalent existing headings. Run `npm run content:validate` to check metadata, required sections, duplicate IDs, prerequisite links, and reference links. Search is generated from the local lesson source; rebuild it with `npm run search:build` (also runs automatically before `dev` and `build`).

## Optional account and AI services

PostgreSQL and Prisma are implemented for user-owned progress, bookmarks, and chat history. Start the database with `docker compose up -d`; copy `.env.example` to `.env.local`; then follow [Google OAuth setup](docs/setup/authentication.md) and run `npm run db:migrate`. Public lessons remain available without these services. OpenAI API access is configured separately with `OPENAI_API_KEY`; a Google account does not include ChatGPT Plus or Codex API usage.

The AI assistant uses the official OpenAI Node SDK and Responses API. Set both `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env.local`; it retrieves a small number of local lesson chunks, streams the answer, and stores conversation history for the signed-in user. See the in-app `/setup` page for a short checklist.

## Tests and checks

```bash
npm run typecheck
npm run content:validate
npm test
npm run test:e2e
npm run build
```

The Playwright command starts an isolated local development server on port 3100. Install its browser once with `npx playwright install chromium`. If the app is already running on its default port, reuse it with `PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e`. Public E2E journeys and automated axe checks do not require a database or API credentials. OAuth, saved state, and live assistant journeys require the services above.

## Architecture and roadmap

- [Architecture proposal](docs/architecture/proposal.md)
- [Milestones and verification strategy](docs/architecture/implementation-plan.md)

See [AGENTS.md](AGENTS.md) for coding conventions and the definition of done. The implementation includes 33 substantive lessons across Basic, Intermediate, and Advanced, local full-text search, references, responsive reading/navigation, themes, Mermaid diagrams, Google OAuth, PostgreSQL progress/bookmarks, a learning dashboard, and an OpenAI assistant with local retrieval and usage controls. Tests cover local content/search, browser learning flows, API guards, keyboard focus, and axe WCAG 2 A/AA checks in light and dark themes. Database, OAuth, and live OpenAI acceptance checks still require local services and credentials.
