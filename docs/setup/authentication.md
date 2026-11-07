# Local Google OAuth and PostgreSQL setup

Public lessons do not require any of these services. Sign-in, dashboard, saved progress, and bookmarks require PostgreSQL and Google OAuth.

## 1. Start PostgreSQL

```bash
docker compose up -d
```

The local compose service publishes PostgreSQL on host port `5434` (container port `5432`) and uses database `academy`, user `academy`, and password `academy-local`. These defaults are for local development only. Port `5434` avoids conflicting with a PostgreSQL server already using the common host port `5432`.

## 2. Create Google OAuth credentials

In Google Cloud Console, create/select a project, configure the OAuth consent screen, then create an OAuth client ID of type **Web application**. Add:

- Authorized JavaScript origin: `http://localhost:3001`
- Authorized redirect URI: `http://localhost:3001/api/auth/callback/google`

If the consent screen is in testing mode, add the Google accounts you will use as test users.

## 3. Configure environment variables

Copy `.env.example` to `.env.local`, then fill in the Google client ID and secret. Generate a unique `AUTH_SECRET`, for example:

```bash
openssl rand -base64 32
```

Keep `.env.local` out of source control. `AUTH_SECRET`, Google OAuth credentials, and database connection strings are server-only.

## 4. Apply the database migration

```bash
npm install
npm run db:migrate
npm run dev
```

`npm run db:migrate` creates the tables from the checked-in migration. Use `npm run db:studio` to inspect local records. Production deployments should set the same variables in the hosting secret store and run `npm run db:deploy` during release.

Google OAuth authenticates the Academy account only. It does not grant ChatGPT Plus or OpenAI API access. Configure OpenAI independently with `OPENAI_API_KEY` and `OPENAI_MODEL`; see the in-app `/setup` page.
