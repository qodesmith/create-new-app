# Local package testing

How to exercise the **exact artifact** that would be published to npm — without actually publishing. Use this before every release to catch path-resolution surprises, missing files in `"files"`, and broken `bin` wrappers.

The simulated flow is: build the tarball with `npm pack`, install that tarball globally, then run the CLI from a directory that is not this repo.

## One-shot recipe

```shell
# 1. From the repo root, build the tarball
cd /Users/qodesmith/repos/create-new-app
bun pm pack
# Produces: create-new-app-8.0.0.tgz

# 2. Move to a scratch directory outside the repo
mkdir -p /tmp/cna-test && cd /tmp/cna-test

# 3. Install the tarball globally
bun i -g /Users/qodesmith/repos/create-new-app/create-new-app-8.0.0.tgz

# 4. Confirm the global bin is on PATH
which create-new-app
create-new-app --version    # should print 8.0.0

# 5. Generate both templates
create-new-app fullstack-test -t fullstack
create-new-app client-test    -t client-only

# 6. Boot the fullstack project
cd fullstack-test
bun dev

# 7. Boot the client project
cd ../client-test
bun dev
```

If steps 4–7 all work, the artifact is good.

## What each step actually verifies

| Step                                         | What it catches                                                                                                                                                                                                                          |
|----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `bun pm pack`                                | Errors in `package.json` (bad `bin`, malformed `files`).                                                                                                                                                                                 |
| `bun pm pack --dry-run`                      | What ships vs. what's left out. Run this first if you've changed `"files"` or added new template assets.                                                                                                                                 |
| `bun i -g ./...tgz`                          | The `bin` wrapper is wired up correctly and the shim lands on `PATH`.                                                                                                                                                                    |
| `create-new-app --version`                   | The wrapper successfully execs `bun src/cli/index.ts` and arg-forwarding works.                                                                                                                                                          |
| `create-new-app fullstack-test -t fullstack` | Template files are present in the published tarball (the original `/$bunfs/...` bug would surface here as "Template not found"). Post-install steps (`bun install`, `bunx biomeInit`, `git init`) all run against the generated project. |
| `bun dev` in the generated app               | The generated `package.json`, scripts, and template substitutions all produced a working app.                                                                                                                                            |

## Verify the Bun-missing error path

The wrapper prints a friendly install hint when `bun` isn't on `PATH`. To force-test that branch without uninstalling Bun:

```shell
# Strip bun from PATH for one invocation. Adjust the node path to match `which node`.
env PATH=/usr/bin:/bin:$(dirname "$(which node)") create-new-app
```

Expected output:

```
create-new-app requires Bun to run.

Install Bun: https://bun.sh
  curl -fsSL https://bun.sh/install | bash

Then re-run the command.
```

Exit code should be `1`.

## Cleanup

```shell
# Uninstall the global package
bun remove -g create-new-app

# Wipe the scratch dir
rm -rf /tmp/cna-test

# Delete the tarball from the repo
rm /Users/qodesmith/repos/create-new-app/create-new-app-*.tgz
```

## Notes

- **Why not `npm link`?** `npm link` symlinks the working tree, so it never exercises the `"files"` allowlist or the published tarball shape. It can pass while `npm publish` would ship a broken package. Use `npm pack` + install-from-tarball for any pre-release test.
- **Run from a directory that is not this repo.** `import.meta.dir` in `src/cli/generateProject.ts` resolves relative to the installed location, not the cwd, so running from the repo accidentally can mask path bugs that show up only after install.
- **Watch the post-install output.** The generator shells out to `bun install` and `bunx biomeInit`. Any error there is a real problem, not a packaging problem — fix it in `generateProject.ts` or in the template.
