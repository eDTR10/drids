# DRIDS

**DICT Region 10 Integrated Data Systems** — a customizable, responsive React dashboard for your systems and services.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. To check the production build:

```sh
npm test
npm run build
npm run preview
```

Browser integration tests exercise the production build, editing, persistence, filters, new tabs, backups, and mobile navigation:

```sh
npx playwright install chromium
npm run test:e2e
```

To use an installed Microsoft Edge instead, set `PLAYWRIGHT_CHANNEL=msedge` in your shell. Run `npm run format` to format the source.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project's files to its `main` branch, including `package-lock.json` and `.github/workflows/deploy.yml`.
2. In the repository, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Open **Actions → Deploy DRIDS to GitHub Pages → Run workflow**, or push another commit to `main`.
4. The workflow installs dependencies, runs tests, builds the project, and deploys `dist`. Find the published URL in the workflow's deployment or in **Settings → Pages**.

The relative Vite asset base (`./`) supports repository sites such as `https://username.github.io/DRIDS/`, user sites, and custom domains. There are no server routes or API keys to configure. For a custom domain, configure GitHub Pages DNS and add the domain in repository Pages settings.

Deployment setup follows [Vite's GitHub Pages guide](https://vite.dev/guide/static-deploy#github-pages) and [GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Customize the dashboard

- **Add system** adds a title, description, website, category, icon, and cover color. Optionally use a direct image URL.
- Every system card is a real link that opens in a new tab with `noopener noreferrer`.
- Use the pencil on a card to edit or remove it; use the star to pin it.
- Search titles, descriptions, and categories, filter by category, and sort by name.
- **Customize** changes between grid/list views, sets desktop column count, shows/hides covers, and reorders systems.
- Favorites and recently opened systems have dedicated sidebar filters.
- **Customize → Export backup / Import backup** transfers the workspace as validated JSON. Import and reset require confirmation inside the application.

## Set the shared starting systems

Edit `DEFAULT_SYSTEMS` in `src/data.js` to publish your organization's approved system links and descriptions. The supplied entries are starter public resources, not an inventory of internal Region 10 systems; check or replace their destinations before public rollout.

The theme uses DICT blue, yellow, red, and light gray. `public/dict-logo.png` is a locally bundled copy of the [DICT seal](https://commons.wikimedia.org/wiki/File:DICT-Logo-icon_only.png), used in the sidebar and as the browser tab icon. Existing saved workspace palette IDs remain compatible; their displayed colors follow the updated theme.

Available categories, icons, and cover palettes are defined in that file. Icon components are mapped in `src/App.jsx`. Fonts are bundled locally; default artwork uses CSS and SVG icons, so no external image service is needed. Custom cover URLs are fetched from the destination you specify.

## Data and persistence

This is a static, frontend-only portal. Settings, favorites, recent visits, and custom systems are stored in `localStorage` under `drids-workspace-v1`, independently for each browser and site origin. They are **not shared across users or synced to a server**. The dashboard does not authenticate users or grant access to linked systems.

Existing browsers retain their saved workspace when you update the shared defaults. Use **Customize → Reset workspace** to load new defaults (export a backup first). Clearing browser data removes personal customizations. Browser-storage failures display an export reminder.

## Project structure

```text
src/App.jsx                  Dashboard and customization dialogs
src/data.js                  Starter systems and backup validation
src/styles.css               Responsive layout and artwork
tests/workspace.test.js      Backup and link safety tests
.github/workflows/deploy.yml GitHub Pages deployment
```

Built with React, Vite, Lucide icons, DM Sans, and Manrope.
