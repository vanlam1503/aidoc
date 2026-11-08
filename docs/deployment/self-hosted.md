# Self-host the learning app

The app needs a Node.js server. GitHub Pages serves static files and cannot run the app's Next.js pages or API routes. This repository includes a Docker setup for a small server or VPS with Docker Compose and a Render Blueprint for a managed deployment.

## Deploy with Render

1. Sign in to Render and choose **New → Blueprint**.
2. Connect `vanlam1503/aidoc` and select the `main` branch. Render reads `render.yaml` and shows the web service and persistent disk before creating them.
3. Create the Blueprint. After the service is live, open its `onrender.com` URL; the app name in the Blueprint is `aidoc-learning-vanlam1503`.
4. Open **Ask Assistant → API key settings** and save your Gemini key. It is stored on the attached persistent disk.

Render persistent disks require a paid web service plan. The Blueprint uses the smallest paid plan and a 1 GB disk so learner data survives redeploys. Review the charges shown by Render before creating the service. See [Render's persistent disk requirements](https://render.com/docs/disks) and [Blueprint configuration](https://render.com/docs/blueprint-spec).

The GitHub Pages address `vanlam1503.github.io/aidoc/` will continue to serve the repository's Pages source. Use the Render URL for the running learning app unless you configure a custom domain to point to Render.

## Requirements

- A Linux server with Docker Engine and the Docker Compose plugin.
- A domain name pointed at that server, plus HTTPS from a reverse proxy such as Caddy, nginx, or Traefik.
- One running app instance with a persistent Docker volume. The app stores bookmarks, progress, chat history, usage records, and the Gemini API key in `.data/` on that volume.

## Deploy

1. Clone this repository onto the server and enter its directory.
2. Optionally create a server-side `.env` file to set `PORT`, `GEMINI_MODEL`, or `GEMINI_TIMEOUT_MS`. Do not commit it.
3. Build and start the app:

   ```sh
   docker compose up -d --build
   ```

4. Configure the reverse proxy to send HTTPS traffic to `127.0.0.1:3000` (or the port selected with `PORT`).
5. Open the domain and set the Gemini API key in **Ask Assistant → API key settings**. The key is saved in the persistent volume and is never embedded in the page.

To deploy a later revision, pull the latest code and run `docker compose up -d --build` again. Back up the Docker volume named `academy-data` before replacing or moving the server. `docker compose down -v` deletes this data.

## Important storage detail

The JSON store coordinates writes within a single Node.js process. Run one app container and keep the `academy-data` volume attached to it. Multiple replicas or ephemeral serverless instances do not share this file and can lose or split writes. A multi-instance deployment requires migrating the store and Gemini credential persistence to shared database/secret storage.

GitHub Pages can remain enabled for the repository README, but the learning site itself must be visited at the domain configured for this server. To stop the old Pages URL from presenting the README as the app, disable Pages in the repository's **Settings → Pages** after the server is live.
