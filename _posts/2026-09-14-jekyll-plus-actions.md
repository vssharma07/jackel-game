---
layout: post
title: "Why Jekyll + GitHub Actions"
date: 2026-09-14 09:00:00 +0000
categories: github-actions
---

GitHub Pages has supported Jekyll natively for years — historically, pushing to a
repo with the right branch selected would trigger GitHub's own hidden build. These
days the more flexible (and more visible) route is to build it yourself with a
GitHub Actions workflow, which is what this site does.

The workflow has two jobs:

1. **build** — checks out the repo, sets up Ruby, installs gems with Bundler, and
   runs `actions/jekyll-build-pages` to turn the Markdown into a static `_site/`
   folder. That folder is uploaded as a Pages artifact.
2. **deploy** — takes that artifact and publishes it with `actions/deploy-pages`.

Splitting build and deploy into separate jobs is a common GitHub Actions pattern:
the build job can run on every push and pull request for validation, while only
the deploy job (gated with `needs: build`) actually touches the live site.
