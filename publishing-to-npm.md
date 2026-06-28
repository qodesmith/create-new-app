# Publishing to npm

How to cut a release of `create-new-app` to the npm registry. Written against the v8 release; later releases follow the same shape with a different version bump.

## Prerequisites

- You are an npm maintainer of the `create-new-app` package.
- You're logged in to npm locally: `npm whoami` should print your username. If not, run `npm login`.
- The release PR is merged into `main`. We never publish from a feature branch.
- Your working copy of `main` is clean and up to date: `git status` shows nothing, `git pull` is a no-op.
- The version in `package.json` matches the version you intend to publish. The `prepublishOnly` script will run `bun test && bun run check` before publish — both must pass.

## v8 release (one-time, complete rewrite)

v7.5.0 is the current `latest` on npm. v8 is a complete rewrite with breaking changes. Two ways to ship it:

### Option A — direct publish to `latest` (simple)

Anyone with `create-new-app: "*"` or `create-new-app@latest` in a script gets v8 the moment you publish.

```shell
git checkout main
git pull

# Sanity-check what will ship
npm pack --dry-run

# Tag and push
git tag v8.0.0
git push origin v8.0.0

# Publish
npm publish

# Verify
npm view create-new-app@8.0.0
```

### Option B — staged via `next` dist-tag (recommended for a rewrite)

`latest` stays at 7.5.0 while v8 is available behind `@next`. You promote `8.0.0` to `latest` only after smoke-testing.

```shell
git checkout main
git pull

npm pack --dry-run

git tag v8.0.0
git push origin v8.0.0

# Publish behind the "next" tag — latest stays at 7.5.0
npm publish --tag next

# Try the published artifact end-to-end
bunx create-new-app@next test-fullstack -t fullstack
bunx create-new-app@next test-client     -t client-only

# When you're satisfied, promote to latest
npm dist-tag add create-new-app@8.0.0 latest

# Verify
npm view create-new-app dist-tags
```

If something is wrong in v8 after promotion, you can roll `latest` back:

```shell
npm dist-tag add create-new-app@7.5.0 latest
```

(`npm unpublish` is heavily restricted and discouraged — prefer dist-tag rollback or a follow-up patch release.)

## After publish

1. **Create a GitHub release** from the `v8.0.0` tag. Brief notes pointing at the breaking changes from v7 are enough — the README on npm covers the rest.
2. **Verify global install works** on a clean machine or container (see `local-package-testings.md` for the local equivalent):
   ```shell
   npm i -g create-new-app
   create-new-app --version    # should print 8.0.0
   ```
3. **Watch the npm package page** for the README to render correctly: <https://www.npmjs.com/package/create-new-app>.

## Subsequent releases (v8.0.1, v8.1.0, etc.)

The flow stays the same; the dist-tag dance is usually unnecessary for non-breaking bumps. Bump the version, tag, push, publish:

```shell
git checkout main
git pull

# Bump version + commit + tag in one step
npm version patch            # or `minor`, `major`
git push --follow-tags

npm publish
```

`npm version` does three things atomically: edits `package.json`, creates a commit (`v8.0.1`), and creates a matching git tag. `--follow-tags` on the push sends the commit and the tag together.

## Notes and gotchas

- **2FA**: if your npm account has 2FA enabled for publishes, `npm publish` will prompt for an OTP.
- **`prepublishOnly` runs locally**, not on the npm registry side. If tests fail, the publish aborts before the tarball is uploaded.
- **The published tarball** contains only what's in `"files"` in `package.json` (currently `["bin", "src"]`) plus a few always-included files (`package.json`, `README.md`, `LICENSE`). `dist/`, `node_modules/`, tests, plans, and `.md` docs in the repo root do **not** ship. Run `npm pack --dry-run` to confirm before any publish.
- **Bun is a hard runtime requirement** for the published CLI. The `bin/cna.js` wrapper checks for Bun on `PATH` at startup and prints an install hint if missing. The npm-side `engines.bun` field is documentation only — npm does not enforce non-node engines.
