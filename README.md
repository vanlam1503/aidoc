# AI Engineering Academy

A local-first curriculum for building AI-powered software. Educational lessons live in `content/` as Markdown-compatible MDX files; there is no remote CMS requirement. Browse lessons, use search, track progress, save bookmarks, and open the dashboard locally without an account. The optional Gemini assistant uses a server API key.

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

English lessons require these level-two headings (subtitles may follow the heading): Learning objectives, Prerequisites, Theory, Architecture, TypeScript example, Practice, Common mistakes, Further reading, Interview questions, Quick quiz, and Completion criteria. Vietnamese lessons keep the corresponding translated headings, including Câu hỏi phỏng vấn. Run `npm run content:validate` to check metadata, required sections, duplicate IDs, prerequisite links, and reference links. Search is generated from the local lesson source; rebuild it with `npm run search:build` (also runs automatically before `dev` and `build`).

Every lesson includes three original interview practice questions with answer outlines, primary-source citations, and implementation resources, for 99 questions in both English and Vietnamese. Start with the visible `* Essential` question, then use the follow-up questions for technical tradeoffs and scenarios. Open the interview section from a lesson's table of contents or find it through local search. Use [/flashcards](/flashcards) for four-choice answer matching, lesson and `* Essential` filters, immediate feedback, and missed-question review. The same practice component appears below each lesson. See [interview preparation and source notes](docs/interview-preparation.md) for coverage and compatibility details; these exercises are not attributed to a particular employer.

The home page includes an interactive AI learning orbit: Prompting, Agents, and System revolve around AI in 24, 46, and 78 seconds respectively, so closer orbits move faster. A small decorative moon circles Agents every 6.5 seconds and shares the same pause and reduced-motion behavior. Hover or focus a topic control to pause; the animation continues when the pointer moves over empty space or lesson suggestions. Hover, focus, click, or tap a topic to reveal three localized lesson suggestions. The first recommendation is marked `* Essential` and links lead to lessons and their existing references/examples. A pause control and reduced-motion support are included. The reusable `LearningOrbit` component accepts lesson summaries and requires no external services.

## Local data and optional AI assistant

No Google login, OAuth setup, PostgreSQL, or database migration is required. Progress, bookmarks, conversation history, and request usage are saved in the ignored `.data/academy.json` file on this computer. The dashboard and lesson controls are available immediately. Back up that file if you want to preserve your learning state when moving the project.

Ask Assistant uses Google Gemini through the official `@google/genai` SDK. Put `GEMINI_API_KEY` in `.env`; optional `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`. `.env` is ignored by Git, and `.env.example` contains placeholders. The browser never receives the key. Restart the development server after setting it. See `/setup` or [Gemini assistant setup](docs/setup/assistant.md).

The app is a personal local workspace: every browser using this local server shares the same data file. Writes validate inputs and reject cross-origin requests. Chat keeps up to 20 conversations with 100 messages each, and retains 24 hours of request usage for the 10/hour and 30/day limits. This mode has no user accounts or cross-device account synchronization.

Open `/bookmarks` from navigation to search your saved collection, filter lessons/links, add a URL with an optional title, or remove an item. Bookmark controls appear on curriculum cards and at the top of each lesson. Lesson bookmarks keep stable IDs and resolve matching-language titles and descriptions; saved links keep their URL and title. Existing local lesson bookmarks remain available. All bookmark data stays in `.data/academy.json` across reloads and app restarts.

The Assistant header includes **Expand assistant / Collapse assistant**. Expanding keeps the conversation and unsent draft, provides a larger reading area, and supports a full-screen mobile layout. Close or Escape restores the normal page. Selecting text in a lesson and choosing **Ask assistant** or **Translate** opens the chat and sends the selected-text question immediately once the assistant is ready; no second Send click is needed. The request includes the lesson context and selected interface language.

## Tests and checks

```bash
npm run typecheck
npm run content:validate
npm test
npm run test:e2e
npm run build
```

The Playwright command starts an isolated local development server on port 3100. Install its browser once with `npx playwright install chromium`. If the app is already running on its default port, reuse it with `PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e`. Public E2E journeys and automated axe checks do not require a database or API credentials. Saved-state APIs and storage are tested without external services. Live Gemini responses require a valid key and model access.

## Architecture and roadmap

- [Architecture proposal](docs/architecture/proposal.md)
- [Milestones and verification strategy](docs/architecture/implementation-plan.md)

See [AGENTS.md](AGENTS.md) for coding conventions and the definition of done. The implementation includes 33 substantive lessons across Basic, Intermediate, and Advanced, local full-text search, references, responsive reading/navigation, themes, Mermaid diagrams, local file persistence, progress/bookmarks, a learning dashboard, and a Gemini assistant with local retrieval and usage controls. Tests cover local content/search, browser learning flows, API guards, keyboard focus, and axe WCAG 2 A/AA checks in light and dark themes. Live Gemini acceptance checks still require a valid API key and model access.
