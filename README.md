# The Jackal's Den

A small Jekyll blog — no database, no server to manage. Content is Markdown files
in `_posts/`, built into static HTML by Jekyll, and deployed automatically to
GitHub Pages by a GitHub Actions workflow on every push to `main`.

## Run it locally

```bash
bundle install
bundle exec jekyll serve
```

Then visit `http://localhost:4000`.

## Structure

- [`_config.yml`](_config.yml) — site title, theme (`minima`), plugins.
- [`_posts/`](_posts) — blog posts, one Markdown file per post, named `YYYY-MM-DD-title.md`.
- [`index.md`](index.md) — home page (uses the theme's `home` layout, which lists posts).
- [`about.md`](about.md) — a static page, reachable at `/about/`.
- [`Gemfile`](Gemfile) — pins `jekyll`, the `minima` theme, and the plugins used.

## How the GitHub Actions deploy works

[`.github/workflows/jekyll.yml`](.github/workflows/jekyll.yml) has two jobs:

1. **build** — checks out the repo, sets up Ruby via `ruby/setup-ruby` (with
   Bundler caching), runs `actions/jekyll-build-pages` to generate `_site/`, and
   uploads that folder as a Pages artifact via `actions/upload-pages-artifact`.
2. **deploy** — gated with `needs: build`, publishes the artifact using
   `actions/deploy-pages`.

### One-time repo setup on GitHub

1. Push this repo to GitHub.
2. **Settings → Pages → Source: GitHub Actions.**
3. Push to `main` (or run the workflow manually via **Actions → Run workflow** —
   it supports `workflow_dispatch`). The deployed URL appears in the run summary
   and under Settings → Pages.

## Adding a new post

Create `_posts/YYYY-MM-DD-your-title.md` with front matter:

```markdown
---
layout: post
title: "Your Title"
date: YYYY-MM-DD HH:MM:SS +0000
categories: some-category
---

Your content here.
```

Push it — the workflow rebuilds and redeploys the whole site automatically.

## Presentation talking points

- **Static site generator vs. hand-written HTML** — Jekyll turns Markdown +
  layouts into HTML at build time; you write content, not markup.
- **Two-job workflow** — `build` and `deploy` as separate jobs connected by
  `needs:`, a common pattern for gating a risky step (deploying) behind a
  cheaper one (building) that can also run on pull requests for validation.
- **`ruby/setup-ruby` with `bundler-cache: true`** — caches installed gems
  between runs so CI doesn't reinstall the same dependencies every time.
- **Same Pages deploy actions as any static site** — `configure-pages`,
  `upload-pages-artifact`, `deploy-pages` don't care whether the artifact came
  from Jekyll, a plain `cp`, or any other generator.
