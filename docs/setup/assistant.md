# Google Gemini assistant setup

Ask Assistant uses the Gemini Developer API through the server-only `@google/genai` SDK adapter in `src/lib/gemini/client.ts`. The browser calls `/api/chat`; it never receives the API key. No sign-in is required. Local lessons, search, dashboard, progress, and bookmarks work without API credentials.

## Configure the server

Copy `.env.example` to `.env` if the local file does not already exist. Put your key in the project-root `.env`:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_MS=90000
```

`GEMINI_API_KEY` is required. `GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash-lite`; use a Gemini model enabled for your Google project. Restart `npm run dev` after editing environment variables. Next.js loads `.env` automatically; an existing `.env.local` overrides matching variables, so remove stale overrides if a change appears ineffective.

`.gitignore` excludes `.env` and `.env.*` while retaining example files. The checked-in `.env.example` contains placeholders only. Never put the key in `NEXT_PUBLIC_*` variables, browser code, source files, or screenshots. Deployments should set these variables in their server secret configuration.

## Local persistence

All study state is stored in `.data/academy.json`, which Git ignores. No OAuth credentials, account, PostgreSQL service, or migrations are needed. This is one personal workspace shared by browsers connected to the same local server. Existing external database data is not modified or imported automatically.

The local store validates its schema and serializes writes through an atomic temporary-file rename. Back up `.data/academy.json` when moving the project. A malformed existing file is reported as unavailable rather than silently overwritten. Run one server process per data file.

## Assistant display

Use the expand control beside the close button to enlarge the Assistant. The same dialog remains mounted, so conversation text, streaming state, and the draft survive expanding/collapsing. The expanded mode locks page scrolling and supports keyboard navigation and mobile screens. Closing the dialog or pressing Escape restores page scrolling.

## Behavior and verification

The migration keeps local lesson retrieval, selected-language instructions, citations, local conversation validation, hourly/daily workspace request limits, and the browser SSE event contract. Stored assistant history maps to Gemini's `model` role; adjacent turns with the same role are merged. System instructions stay separate from user text and retrieved excerpts.

Requests have a configurable deadline (90 seconds by default, 10–180 seconds through `GEMINI_TIMEOUT_MS`) and a 900-token output limit, with no automatic retries or continuation requests. Flash-Lite models use minimal thinking effort; other Gemini 3 models use low effort and do not request thought text. Local usage records count candidate and thinking output tokens. Interrupted, blocked, empty, or token-limited streams are marked failed and are not saved as successful assistant messages. Safe error codes distinguish timeout, key/access problems, unavailable models, quota, network errors, blocked output, and local save failures. The UI stops waiting as soon as it receives a terminal event, shows elapsed waiting time, and allows cancellation. A browser watchdog also bounds stalled connections. Provider error details and credentials are not sent to the browser.

Mocked tests cover real SDK request serialization, text/thought separation, rate limits, unknown conversation IDs, locale/context mapping, completion checks, cancellation, and timeout. Browser tests cover configuration copy and assistant interaction. A live Gemini response still requires a valid API key and model access; passing mocked tests does not establish those external services are configured.

## Implementation references

- \* Essential — [Gemini API reference](https://ai.google.dev/api): establishes authentication and streaming request/response fields used by the adapter.
- [Google Gen AI JavaScript SDK](https://github.com/googleapis/js-genai): upstream implementation and API types used for transport, cancellation, and text extraction.
- [Gemini API Cookbook](https://github.com/google-gemini/cookbook): official examples for checking SDK usage; adapt examples to this application's server-only persistence boundary.
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite): model reference for the default identifier. Documentation was checked on 2026-11-08; availability and quotas depend on the API project.
