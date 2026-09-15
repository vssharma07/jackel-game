---
layout: post
title: "Prerequisites: Setting Up Jekyll + GitHub Actions"
date: 2026-09-15 09:00:00 +0000
categories: setup
---

Before writing a single blog post, there's a short list of things that need to
exist — on your machine and on GitHub — for a Jekyll site to build and deploy
the way this one does. None of it is exotic, but skipping a step is exactly
what turns into a confusing CI failure later. Here's the full list, in the
order you'd actually hit them.

## On your local machine

You don't strictly need any of this locally — GitHub Actions can build the
site without you ever running Jekyll on your own laptop. But you want it
locally anyway, because "push and hope" is a bad way to debug a broken build.

- **Ruby** — Jekyll is a Ruby program. Version 3.1+ is a safe baseline (this
  repo was built and tested against Ruby 3.2 locally and Ruby 3.3 in CI).
  Check with `ruby -v`.
- **Bundler** — the dependency manager that reads a `Gemfile` and installs
  exact gem versions. It usually ships with Ruby; check with `bundle -v`, or
  install it with `gem install bundler` if it's missing.
- **Git**, obviously — and a way to authenticate to GitHub for pushing. Either
  an SSH key added to your GitHub account (`ssh-keygen`, then paste the
  `.pub` key at `github.com/settings/keys`), or a Personal Access Token if
  you're pushing over HTTPS.
- **A text editor.** Nothing Jekyll-specific required — posts are Markdown,
  config is YAML, layouts are HTML with Liquid tags. Syntax highlighting for
  those three helps but isn't required.

None of this needs a Jekyll-specific installer — `gem install jekyll` exists,
but this repo skips it in favor of pinning `jekyll` itself inside the
`Gemfile`, so the exact version is version-controlled instead of whatever
happens to be globally installed on a given machine.

## On GitHub

- **A GitHub repository.** Public works on every plan. A **private** repo
  needs GitHub Pro, Team, or Enterprise Cloud/Server — GitHub Free does not
  support Pages on private repositories at all. If the workflow's deploy step
  fails immediately with something like "Pages site failed," this is usually
  why.
- **Pages source set to "GitHub Actions."** One-time, manual, and easy to
  forget: **Settings → Pages → Build and deployment → Source → GitHub
  Actions.** Skipping this is the single most common reason a working
  workflow still fails on the `deploy-pages` step — the build can succeed
  perfectly and the deploy still has nowhere to publish to.
- **Actions enabled with the right permissions.** By default this is fine on
  a personal repo, but on an org-owned repo, check **Settings → Actions →
  General → Workflow permissions** allows the default `GITHUB_TOKEN` the
  scopes the workflow requests (`contents: read`, `pages: write`,
  `id-token: write` — declared right in `jekyll.yml`, not something you set
  globally, but the org-level policy has to allow it).

## Knowledge you actually need

- **Markdown** — that's what every post is written in.
- **Just enough YAML** to write front matter (`title:`, `date:`,
  `layout:`) and edit `_config.yml`. No YAML anchors or exotic features
  needed, just `key: value` pairs.
- **Basic Git** — `add`, `commit`, `push`. The workflow triggers on push, so
  that's the whole publishing step once everything is set up.
- **Basic GitHub Actions vocabulary** — a *workflow* is triggered by an
  event (`on:`), contains *jobs*, each job runs on a fresh VM (`runs-on:`)
  and contains *steps* — either a shell command (`run:`) or someone else's
  reusable action (`uses:`).

## One gotcha worth knowing in advance

If you run `bundle install` locally to generate `Gemfile.lock` and then commit
it, the lockfile records the **platform** it was built on (e.g.
`arm64-darwin-24` on Apple Silicon). GitHub's `ubuntu-latest` runner is
`x86_64-linux`, and a couple of this theme's dependencies (`sass-embedded`,
`google-protobuf`) ship platform-specific native builds. If the lockfile only
lists your local platform, CI's `bundle install` fails trying to resolve
those gems for Linux. Fix it once, locally, before it ever becomes a CI
failure:

```bash
bundle lock --add-platform x86_64-linux
```

Commit the updated `Gemfile.lock` and the CI build will have what it needs.

## Once all of this is true

...you're not writing any more setup — from here it's just: write a Markdown
file in `_posts/`, `git push`, and the site rebuilds and redeploys itself. The
next post in this blog walks through exactly which files in this repo make
that happen and what each one is for.
