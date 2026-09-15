# Jackal Dash

A tiny, dependency-free browser game — plain HTML/CSS/JS, no build step, no backend, no database. Made as a demo for "static site with basics of GitHub Actions."

Play: press <kbd>Space</kbd> / <kbd>↑</kbd> or tap the canvas to jump the jackal over rocks. Speed ramps up over time; your best score is kept in the browser's `localStorage` (client-side only — that's why no database is needed).

## Run it locally

No build tools required — just open the file, or serve it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## How the GitHub Actions setup works

Two workflows live in [.github/workflows](.github/workflows):

- **[ci.yml](.github/workflows/ci.yml)** — runs on every push and pull request to `main`. It checks out the repo and does a couple of cheap sanity checks (required files exist, `index.html` has a `<title>`). This is the "basics" workflow: triggers (`on:`), a job, steps, `runs-on`.
- **[deploy.yml](.github/workflows/deploy.yml)** — runs after `CI` finishes successfully on `main` (via `workflow_run`), or manually via `workflow_dispatch`. It packages the repository as a Pages artifact and deploys it using GitHub's official Pages actions (`configure-pages`, `upload-pages-artifact`, `deploy-pages`).

### One-time repo setup on GitHub

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the `Deploy to GitHub Pages` workflow manually from the **Actions** tab). Once it finishes, the deployment URL shows up in the workflow run summary and under **Settings → Pages**.

## Presentation talking points

- **No database, no server** — the whole app is static files; GitHub Pages just serves them.
- **`on:`** — what triggers a workflow (`push`, `pull_request`, `workflow_run`, `workflow_dispatch`).
- **`jobs` / `steps`** — a job runs on a fresh VM (`runs-on: ubuntu-latest`); steps run in order, each either a shell command (`run:`) or a reusable action (`uses:`).
- **Marketplace actions** — `actions/checkout`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages` are official, versioned building blocks instead of hand-rolled scripts.
- **Permissions & environments** — `deploy.yml` requests only the scopes it needs (`pages: write`, `id-token: write`) and deploys into the `github-pages` environment.
- **Separating CI from deploy** — validation runs on every push/PR; deployment only runs after CI passes on `main`, which is a common real-world pattern.
