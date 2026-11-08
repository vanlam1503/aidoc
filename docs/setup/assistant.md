# Google Gemini assistant setup

Ask Assistant uses the Gemini Developer API through the server-only `@google/genai` SDK adapter in `src/lib/gemini/client.ts`. The browser calls `/api/chat`; the server never returns the saved API key. No sign-in is required. Local lessons, search, dashboard, progress, and bookmarks work without API credentials.

## Configure the assistant

1. Get a key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Open **Ask Assistant → API key settings**, paste it into the password input to save and activate chat automatically. For manual entry, choose **Save API key**.
3. Chat becomes available immediately. The same settings allow replacing or removing the key.

The password field has no prefilled value, clears on submission, and never reloads the saved key. Saving sends the entered key to the local server in a POST body. The server validates input and same-origin requests, then atomically writes `.data/gemini-key.json` with file mode `0600`. API responses expose only configuration state, never the key. Browser localStorage/sessionStorage and learning/conversation data do not contain it. The credential file is protected by OS permissions and is not encrypted; Git ignores `.data/`. Saving establishes local configuration; Google validates the key and model access when a chat request is made.

API keys in environment variables are no longer used. Optional model and deadline settings remain server-side in `.env`:

```dotenv
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_MS=90000
```

`GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`; use a model enabled for your Google project. Restart the app after changing model/deadline environment variables. Saving or removing the key does not need a restart. Never put the key in `NEXT_PUBLIC_*`, source files, logs, or screenshots. This remains a personal workspace: browsers connected to this server share the key configuration, just as they share study data.

## Local persistence

All study state is stored in `.data/academy.json`, which Git ignores. No OAuth credentials, account, PostgreSQL service, or migrations are needed. This is one personal workspace shared by browsers connected to the same local server. Existing external database data is not modified or imported automatically.

The local store validates its schema and serializes writes through an atomic temporary-file rename. Back up `.data/academy.json` when moving the project. A malformed existing file is reported as unavailable rather than silently overwritten. Run one server process per data file.

## Assistant display

Use the expand control beside the close button to enlarge the Assistant. The same dialog remains mounted, so conversation text, streaming state, and the draft survive expanding/collapsing. The expanded mode locks page scrolling and supports keyboard navigation and mobile screens. Closing the dialog or pressing Escape restores page scrolling.

Selection toolbar actions open chat mode and automatically submit one context-aware question once configuration/history loading finishes. The selected phrase is sent with the current lesson and language. Ordinary draft-only events and manual composer input still wait for Send; closing the dialog or starting a new chat cancels a queued selection request.

## Behavior and verification

The migration keeps local lesson retrieval, selected-language instructions, citations, local conversation validation, hourly/daily workspace request limits, and the browser SSE event contract. Stored assistant history maps to Gemini's `model` role; adjacent turns with the same role are merged. System instructions stay separate from user text and retrieved excerpts.

Requests have a configurable deadline (90 seconds by default, 10–180 seconds through `GEMINI_TIMEOUT_MS`) and a 900-token output limit, with no automatic retries or continuation requests. Flash-Lite models use minimal thinking effort; other Gemini 3 models use low effort and do not request thought text. Local usage records count candidate and thinking output tokens. Interrupted, blocked, empty, or token-limited streams are marked failed and are not saved as successful assistant messages. Safe error codes distinguish timeout, key/access problems, unavailable models, quota, network errors, blocked output, and local save failures. The UI stops waiting as soon as it receives a terminal event, shows elapsed waiting time, and allows cancellation. A browser watchdog also bounds stalled connections. Provider error details and credentials are not sent to the browser.

Mocked tests cover real SDK request serialization, text/thought separation, rate limits, unknown conversation IDs, locale/context mapping, completion checks, cancellation, and timeout. Browser tests cover configuration copy and assistant interaction. A live Gemini response still requires a valid API key and model access; passing mocked tests does not establish those external services are configured.

## Implementation references

- \* Essential — [Gemini API reference](https://ai.google.dev/api): establishes authentication and streaming request/response fields used by the adapter.
- [Google Gen AI JavaScript SDK](https://github.com/googleapis/js-genai): upstream implementation and API types used for transport, cancellation, and text extraction.
- [Gemini API Cookbook](https://github.com/google-gemini/cookbook): official examples for checking SDK usage; adapt examples to this application's server-only persistence boundary.
- [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite): model reference for the default identifier. Documentation was checked on 2026-11-08; availability and quotas depend on the API project.
