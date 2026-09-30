---
layout: post
title: "Leaking and Cleaning"
date: 2026-09-30 10:42:44 +0000
---

---
layout: post
title: "Leaking and Cleaning"
date: 2026-09-30 09:00:00 +0000
categories: meta
---


# How to use gitleaks and git-filter-repo

Secrets land in Git more often than anyone likes to admit: an API key in a config file, a `.env` committed by mistake, a token pasted into a script during a late debug session. Two tools cover the usual cleanup path. **gitleaks** finds the secret. **git-filter-repo** removes it from history. Neither replaces rotating the credential.

## What each tool is for

| Tool | Job |
| --- | --- |
| [gitleaks](https://github.com/gitleaks/gitleaks) | Scan commits, working trees, and diffs for hardcoded secrets |
| [git-filter-repo](https://github.com/newren/git-filter-repo) | Rewrite Git history so a file, path, or blob is gone |

Scan first. Rewrite only after you know what must disappear. Then rotate every credential that was ever pushed, because clones, forks, CI caches, and backups can still hold the old history.

## Install

**gitleaks** (Homebrew or the GitHub release binary):

```bash
brew install gitleaks
gitleaks version
```

**git-filter-repo** needs Python 3 and a reasonably new Git:

```bash
brew install git-filter-repo
git filter-repo --version
```

On Debian or Ubuntu, `pip install git-filter-repo` or the distro package works the same way. Confirm `git filter-repo` is on your `PATH` before you rewrite anything.

## Scan with gitleaks

From the repository root, scan the full history:

```bash
gitleaks detect --source . --verbose
```

A non-zero exit code means gitleaks reported findings. The default report is `gitleaks-report.json` in the current directory. Point it somewhere else if you do not want that file in the work tree:

```bash
gitleaks detect --source . --report-path /tmp/gitleaks-report.json --report-format json
```

Other useful modes:

```bash
# Working tree and uncommitted files only (no Git history)
gitleaks dir .

# Staged changes, suitable for a pre-commit hook
gitleaks protect --staged --verbose

# A single commit range
gitleaks detect --log-opts="--since=2024-01-01"
```

Read the report before you rewrite history. Each finding includes the rule, file, commit, and a redacted snippet. Treat the report as sensitive: it describes where secrets lived.

### A small config file

Drop `.gitleaks.toml` in the repo when you need allowlists for known-safe strings (test fixtures, documentation examples):

```toml
title = "project gitleaks config"

[extend]
useDefault = true

[allowlist]
description = "Known placeholder values"
paths = ['''(^|/)docs/examples/''']
regexes = ['''EXAMPLE_ONLY_NOT_A_REAL_KEY''']
```

Keep allowlists narrow. A broad path ignore hides real leaks.

### Pre-commit

A typical hook fails the commit when staged content matches a rule:

```bash
#!/bin/sh
gitleaks protect --staged --redact --verbose
```

Install it with [pre-commit](https://pre-commit.com/) or copy it to `.git/hooks/pre-commit` and make it executable. Hooks only see what developers run locally, so keep a CI scan as well:

```bash
gitleaks detect --source . --redact --exit-code 1
```

## Remove history with git-filter-repo

`git filter-repo` rewrites commits. After it finishes, every commit hash from the rewritten point forward is new. Anyone who already cloned the repo must reset or re-clone. Coordinate that before you push.

**Work on a fresh clone.** Filter-repo refuses to run in a dirty tree and, by default, removes `origin` so you cannot push the rewrite by accident.

```bash
git clone --mirror git@example.com:org/app.git app-clean.git
cd app-clean.git
```

A mirror clone is a bare repo that already has every ref. That is the safest place to rewrite.

### Delete a file everywhere

If `.env` or a key file was committed:

```bash
git filter-repo --invert-paths --path .env --path config/secrets.yml
```

`--invert-paths` keeps every path except the ones you name. The file disappears from every commit, not only the latest one.

### Strip a directory

```bash
git filter-repo --invert-paths --path-glob 'secrets/**'
```

### Replace a string in blobs

When the secret sits inside a file you still need (a source file, a CI config), replace the value instead of deleting the file. Put the exact string in a replacements file. Use the real leaked value only on a trusted machine, and do not commit that file:

```text
AKIA_EXAMPLE_LEAKED_VALUE==>***REMOVED***
```

```bash
git filter-repo --replace-text /tmp/replacements.txt
```

Prefer deleting the file when the whole file is the secret. String replacement misses copies that were renamed, encoded, or split across lines.

### Put the cleaned history back

Filter-repo drops the `origin` remote. Add it again only when you intend to publish the rewrite:

```bash
git remote add origin git@example.com:org/app.git
git push --force --all origin
git push --force --tags origin
```

Force-pushing the default branch needs permission and a team plan: open pull requests will not apply cleanly, and every local clone should be replaced.

```bash
# On each developer machine, after the force push
git fetch origin
git checkout main
git reset --hard origin/main
```

If the repository is public or widely forked, assume the old objects still exist somewhere. Rotating the credential is the control that actually matters. History rewrite limits further exposure; it does not undo a leak.

## A practical sequence

1. Run `gitleaks detect` and save the report outside the repo.
2. Revoke and rotate every credential in the report. Do this before or at the same time as the rewrite, not weeks later.
3. Clone with `--mirror` and run `git filter-repo` to drop the paths or replace the strings.
4. Scan the rewritten repo again with gitleaks. Findings should be gone.
5. Force-push, tell the team to re-clone, and turn on `gitleaks protect` in pre-commit and CI so the same file does not come back.

## Limits worth remembering

- Gitleaks matches patterns and entropy. It misses secrets that look like ordinary strings, and it flags some false positives. Review the report.
- `git filter-repo` does not touch GitHub issues, pull request comments, CI logs, Slack, or deployed artifacts. Search those separately.
- GitHub and GitLab may retain unreachable commits for a while. After a force push, ask the host to drop cached views and enable secret scanning if the platform offers it.
- Never run a history rewrite on the only copy of a repository. Keep the mirror clone until the new history is pushed and a second gitleaks scan is clean.

Used together, the two tools are a detection step and a history-editing step. The rotation of the leaked credential is the step that closes the incident.
