---
name: release
description: Release new versions of the preserve-search-params packages via Changesets. Consume pending changesets, run checks, commit, ask the user to publish, and create per-package GitHub releases. Use when the user mentions releasing, publishing, cutting a release, or shipping a new version.
metadata:
  internal: true
---

# Release

Automate the release workflow for the `preserve-search-params` monorepo, which publishes three packages (`preserve-search-params`, `@preserve-search-params/next`, `@preserve-search-params/react-router`) using Changesets.

## Instructions

### 0. Verify on main branch

Before doing anything else, confirm the working tree is on `main` and up to date:

```bash
git branch --show-current
```

If not on `main`, switch and pull:

```bash
git checkout main && git pull
```

**Never start a release from a feature branch.** Version bumps, commits, and tags must land on `main`.

### 1. Inspect pending changesets

List pending changeset files (excluding `README.md`):

```bash
ls .changeset/*.md 2>/dev/null | grep -v README
```

If no pending changesets exist, stop and tell the user to add one first with `pnpm changeset`. Do not invent versions or bump packages by hand — Changesets is the source of truth.

Read each pending `.changeset/*.md` file. The frontmatter lists which packages will bump and at what level (patch/minor/major). Summarize for the user before proceeding so they can confirm the upcoming bumps.

For **prerelease** flows (alpha/beta/rc), check whether the repo is already in pre mode:

```bash
test -f .changeset/pre.json && cat .changeset/pre.json
```

If the user asks for a prerelease and the repo is not in pre mode, run:

```bash
pnpm changeset pre enter alpha   # or beta / rc
```

Then continue. To exit prerelease later, run `pnpm changeset pre exit` and release again as a stable version.

### 2. Apply the version bump

```bash
pnpm version
```

This runs `changeset version`, which consumes pending `.changeset/*.md` files, updates each affected `packages/*/package.json` version, regenerates per-package `CHANGELOG.md` files, and updates `pnpm-lock.yaml`.

Capture which packages and versions changed:

```bash
git diff --stat
git diff packages/*/package.json
```

Note the new version of each bumped package — these become the tag names later.

### 3. Run checks

```bash
pnpm lint-fix && pnpm lint && pnpm tsc && pnpm test && pnpm build
```

All must pass before committing. Turbo fans these out across packages.

### 4. Commit and push

Stage the version bumps, the regenerated `CHANGELOG.md` files, the consumed (deleted) `.changeset/*.md` files, and `pnpm-lock.yaml`. Commit message format:

- Single package bumped: `Release <pkg>@<version>` (e.g. `Release preserve-search-params@0.2.0`)
- Multiple packages bumped: `Release <pkg1>@<v1>, <pkg2>@<v2>` — or a short summary like `Release 2026-04-27` if the list is long.

Push to `main`.

### 5. Ask the user to publish

Tell the user to run from the repo root:

```bash
pnpm release
```

Which expands to `turbo run build && changeset publish`. This pushes each bumped package to npm and creates the per-package git tags (`preserve-search-params@X.Y.Z`, `@preserve-search-params/next@X.Y.Z`, `@preserve-search-params/react-router@X.Y.Z`).

For prerelease cycles, no extra flag is needed — `changeset publish` reads `.changeset/pre.json` and tags the npm release with the active pre tag (alpha/beta/rc) instead of `latest`.

**Do not run `pnpm release` yourself** — npm publish requires an OTP. Wait for the user to confirm they've published before continuing.

After they confirm, fetch the new tags locally:

```bash
git fetch --tags
```

### 6. Create one GitHub release per bumped package

For **each** package bumped in step 2, repeat 6a–6d.

Tag prefixes:
- `preserve-search-params` → `preserve-search-params@`
- `@preserve-search-params/next` → `@preserve-search-params/next@`
- `@preserve-search-params/react-router` → `@preserve-search-params/react-router@`

#### 6a. Find the previous tag for that package

```bash
git tag --list '<pkg-tag-prefix>@*' --sort=-version:refname | head -2
```

The first entry is the new tag just created; the second (if any) is the previous release for comparison. If there is no previous tag (first release of that package), use the repo's first commit (`git rev-list --max-parents=0 HEAD`) as the base.

#### 6b. Analyze changes in depth

Do not just copy the CHANGELOG. Study the actual changes to understand what they mean for users.

1. **Dependency changes first** — diff `packages/<pkg>/package.json` between previous and new tag. `peerDependencies` bumps are the highest-impact breaking change because they gate who can install the package at all (e.g. raising the React peer dep from `>=18` to `>=19` blocks every user on React 18). Flag these immediately.
2. **Public API diff** — diff `packages/<pkg>/src/index.ts` for added/removed exports.
3. **Filter commits to the package's path**:
   ```bash
   git log <prev-tag>..<new-tag> --oneline -- packages/<pkg>/
   ```
4. **List merged PRs in the window**:
   ```bash
   gh pr list --search "is:merged merged:>=<prev-tag-date>" --json number,title,author --limit 100
   ```
5. **Read every relevant PR's body** — PR bodies contain author-written summaries, migration instructions, and context that titles and diffs alone don't provide:
   ```bash
   gh pr view <number> --json body,title --jq '.title + "\n---\n" + .body'
   ```
   Run these in parallel (all PR reads in a single message) for efficiency. Filter to PRs that touched `packages/<pkg>/`.
6. **Read the changed source code** when a PR description is missing or unclear — don't assume what a change does from the title alone.

#### 6c. Compose release notes

Use the section Changesets just appended to `packages/<pkg>/CHANGELOG.md` as the spine — it is already grouped by bump type. Then enrich with the structure below, including only sections that apply:

- `## Breaking Changes` — narrative subsections explaining each breaking change, what it replaces, and what users need to do. Order by impact: **dependency requirement changes first**, then behavioral or API changes. Include code examples showing before/after when helpful.
- `## New Features` — bullet points with **bold title**, PR number in parens, and a one-line description drawn from the PR body.
- `## Bug Fixes` — bullet points with PR number and linked issue closes (e.g. "Closes #123").
- `## What's Changed` — full PR list with author links:

```
* <title> by @<author> in https://github.com/seasonedcc/preserve-search-params/pull/<number>
```

End with:

```
**Full Changelog**: https://github.com/seasonedcc/preserve-search-params/compare/<prev-tag>...<new-tag>
```

For a package's first release, replace the compare URL with a link to the new tag:

```
**Full Changelog**: https://github.com/seasonedcc/preserve-search-params/commits/<new-tag>
```

#### 6d. Create the release

For **stable** versions:

```bash
gh release create '<new-tag>' --title '<new-tag>' --notes "$(cat <<'EOF'
<release-notes>
EOF
)"
```

For **prerelease** versions (anything containing `-alpha`/`-beta`/`-rc` in the version):

```bash
gh release create '<new-tag>' --title '<new-tag>' --prerelease --notes "$(cat <<'EOF'
<release-notes>
EOF
)"
```

Always **single-quote the tag** — it contains `@` and, for the scoped packages, `/`, which the shell will otherwise misinterpret. Pass notes via HEREDOC to preserve formatting. Run releases sequentially per bumped package.
