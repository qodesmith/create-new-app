```text
                         __
                        /\ \__
  ___  _ __   __     __ \ \ ,_\    __
 /'___/\`'__/'__`\ /'__`\\ \ \/  /'__`\
/\ \__\ \ \/\  __//\ \L\.\\ \ \_/\  __/
\ \____\ \_\ \____\ \__/.\_\ \__\ \____\
 \/____/\/_/\/____/\/__/\/_/\/__/\/____/
  ___      __  __  __  __
/' _ `\  /'__`/\ \/\ \/\ \
/\ \/\ \/\  __\ \ \_/ \_/ \
\ \_\ \_\ \____\ \___x___/'
 \/_/\/_/\/____/\/__//__/
   __    _____   _____    By: The Qodesmith
 /'__`\ /\ '__`\/\ '__`\
/\ \L\.\\ \ \L\ \ \ \L\ \
\ \__/.\_\ \ ,__/\ \ ,__/
 \/__/\/_/\ \ \/  \ \ \/
           \ \_\   \ \_\
            \/_/    \/_/
```

# Create New App &middot; [![npm version](https://badge.fury.io/js/create-new-app.svg)](https://badge.fury.io/js/create-new-app)

Spin up a production-ready React app in one command. Pick **fullstack** (React + Bun + Hono + SQLite + Drizzle + Better Auth) or **client-only** (React SPA + TanStack Router + Tailwind). No ejecting, no webpack config, no Node - just Bun, end to end.

---

## What's new in v8

This is a complete rewrite of Create New App.

- **Bun-native, top to bottom.** The CLI is Bun TypeScript. The templates use Bun's bundler, Bun's dev server, Bun's `serve()`, and Bun's SQLite. No Node, no webpack, no Vite.
- **Two opinionated templates, not a buffet of flags.** The previous CLI mixed-and-matched Express, MongoDB, React Router, and sandbox files. v8 generates exactly one of two well-tested project shapes.
- **Modern React stack.** React 19, TanStack Router (file-based, type-safe), TanStack Query, TanStack Form, Tailwind v4, shadcn/ui (Radix primitives), Jotai for state, Biome for lint/format, Knip for dead-code detection.
- **Fullstack means fullstack.** The fullstack template ships with Hono routing, Drizzle ORM, LiteFS-replicated SQLite, Better Auth (including passkeys), Resend email, a Fly.io deploy config, and a multi-stage Dockerfile.

If you want the old Express/MongoDB/sandbox CLI, install v7. v8 is a different tool with the same name.

---

## Requirements

**[Bun](https://bun.sh) is required.** This generator runs on Bun, and every project it generates runs on Bun too - dev server, bundler, test runner, SQLite driver, production server. No Node, no webpack, no Vite. Bun is fast, batteries-included, and a joy to work with - that's the whole point.

If Bun isn't installed, the CLI prints an install hint and exits. Get Bun first:

```shell
curl -fsSL https://bun.sh/install | bash
```

## Installation

```shell
bun install -g create-new-app
# or with npm:
npm install -g create-new-app
# or use it ad-hoc:
bunx create-new-app my-app
```

---

## Usage

### Guided

```shell
create-new-app
# or the short alias:
cna
```

You'll be asked two things:

1. **Project name** - used as the directory name and as the `name` field in `package.json`. Must be lowercase, may contain numbers, hyphens, and underscores, and must not start with a number or hyphen.
2. **Project type** - `Fullstack` or `Client-only SPA`.

That's it. The generator copies the template, replaces `{{PROJECT_NAME}}` placeholders, installs dependencies with Bun, runs `bunx biomeInit`, merges some VS Code settings if a `.vscode` directory was created, and initializes a git repo.

### Non-interactive

```shell
# Name only - prompts for the type.
cna my-app

# Name + type - runs without prompts.
cna my-app --type fullstack
cna my-app -t client-only

# Validate-only mode: never prompt. Errors out if anything is missing or invalid.
cna my-app -t fullstack -y
```

### Options

| Option           | Alias | Type    | Description                                                                                       |
|------------------|-------|---------|---------------------------------------------------------------------------------------------------|
| `[project-name]` | -     | string  | Positional. Used as the directory name and `package.json` name. Prompted if omitted.              |
| `--type`         | `-t`  | string  | One of `fullstack`, `client-only`. Prompted if omitted (or invalid) and `--yes` isn't set.        |
| `--yes`          | `-y`  | boolean | Skip all prompts. Every required value must be present and valid, or the CLI exits with an error. |
| `--help`         | `-h`  | boolean | Print help and exit.                                                                              |
| `--version`      | `-v`  | boolean | Print the version and exit.                                                                       |

If `--yes` is omitted, any value that's missing or fails validation is prompted for (with the invalid value pre-filled so you can correct it).

After generation:

```shell
cd my-app
bun dev
```

**Always use `bun` to run the generated project's scripts - not `npm run`.** The templates use inline env-var prefixes in `package.json` scripts (e.g. `NODE_ENV=development bun --bun run ./startDev.ts`), which is POSIX shell syntax. Bun's built-in shell handles this on every platform, including Windows. `npm run` dispatches through `cmd.exe` on Windows and fails with `'NODE_ENV' is not recognized`. Stick to `bun dev`, `bun run db:init`, and so on.

Search the generated codebase for `TODO` to find the spots you'll want to address before deploying.

---

## The two templates

### Fullstack

A single deployable that serves the React client and a Hono-based API from one Bun process.

**Stack**

- **Runtime / bundler**: Bun (`bun build` + `bun --bun run`), with HMR in dev via Bun's native hot reloading
- **Server**: Bun's `serve()` with Hono routes mounted as the fallback `fetch` handler
- **Database**: SQLite via Bun's `bun:sqlite` + [Drizzle ORM](https://orm.drizzle.team/), with [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) wired up for local schema inspection
- **Replicated SQLite in prod**: [LiteFS](https://fly.io/docs/litefs/) (Fly.io) for read replicas and primary failover
- **Auth**: [Better Auth](https://www.better-auth.com/) with `@better-auth/passkey` for WebAuthn
- **Email**: [Resend](https://resend.com/) + [React Email](https://react.email/) templates (signup verification, change-email, password reset, account deletion)
- **Client**: React 19 + [TanStack Router](https://tanstack.com/router) (file-based, type-safe, with route trees auto-generated by `tsr watch`), [TanStack Query](https://tanstack.com/query), [TanStack Form](https://tanstack.com/form), [Jotai](https://jotai.org/) for atom-based state
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css), [shadcn/ui](https://ui.shadcn.com/) components on top of Radix primitives, [Lucide](https://lucide.dev/) icons, [Motion](https://motion.dev/) for animations
- **Validation**: [Arktype](https://arktype.io/) (`@hono/arktype-validator`, `drizzle-arktype`)
- **Image handling**: [Sharp](https://sharp.pixelplumbing.com/) for avatar processing
- **Deploy**: Multi-stage `Dockerfile` (production), `Dockerfile.local` (local prod testing), `fly.toml`, `litefs.yml`, and a `deploy.ts` script
- **Tooling**: [Biome](https://biomejs.dev/) for lint + format, [Knip](https://knip.dev/) for dead-code detection, strict TypeScript with separate `tsconfig.json` projects for `client/`, `server/`, and `shared/`

**Repository shape**

```
my-app/
├── src/
│   ├── client/          # React app (entry: app.tsx)
│   │   ├── routes/      # File-based TanStack Router
│   │   ├── components/  # `ui/` (shadcn) and `custom/`
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── state/       # Jotai atoms
│   │   ├── apiClient.ts # Hono RPC + Better Auth clients
│   │   └── router.tsx
│   ├── server/
│   │   ├── bunServer.ts # Entry - Bun.serve()
│   │   ├── hono/        # API routes, auth, static assets
│   │   ├── middleware/  # auth, admin, CORS, no-direct-request, security headers
│   │   ├── db/          # Drizzle schemas, migrations, seed, Drizzle Studio
│   │   ├── email/       # React Email templates
│   │   └── utils/       # logger, env helpers, error handling
│   └── shared/          # Code/types shared across client and server
├── build.ts             # Production bundle (client + server in one pass)
├── startDev.ts          # Dev orchestrator (spawns `tsr watch` + `bun --hot`)
├── initDevDb.ts         # First-run DB bootstrap
├── deploy.ts            # Fly.io deploy script
├── Dockerfile           # Multi-stage prod image
├── Dockerfile.local     # Identical pipeline for local prod smoke-tests
├── fly.toml
├── litefs.yml
└── package.json
```

**Scripts**

| Script                 | What it does                                                                    |
|------------------------|---------------------------------------------------------------------------------|
| `bun dev`              | Start the dev server (HMR, route tree generation, auto-open browser)            |
| `bun dev:all`          | Same as `dev`, but listens on `0.0.0.0` so phones on the same Wi-Fi can connect |
| `bun dev:email`        | Run React Email's preview server against `src/server/email`                     |
| `bun run db:init`      | Initialize a fresh local SQLite database with schema and seed data              |
| `bun run db:view`      | Open Drizzle Studio against the local database                                  |
| `bun run typecheck`    | Run `tsc --noEmit` against shared, client, server, and root configs             |
| `bun run knip`         | Find unused files, exports, and dependencies                                    |
| `bun run deploy`       | Build and deploy to Fly.io                                                      |
| `bun run docker:local` | Build the local production Docker image                                         |

### Client-only SPA

A standalone React app - no server, no database, no auth. Same DX as the fullstack template (Bun bundler, HMR, TanStack everything, Tailwind, shadcn) but without the backend layer.

**Stack**

React 19, TanStack Router, TanStack Query, TanStack Form, Tailwind v4, shadcn/ui, Jotai, Biome, Knip, strict TypeScript, Bun bundler + dev server.

**Repository shape**

```
my-app/
├── src/
│   ├── routes/        # File-based TanStack Router
│   ├── components/    # `ui/` (shadcn) and `custom/`
│   ├── hooks/
│   ├── lib/
│   ├── state/         # Jotai atoms
│   ├── app.tsx
│   ├── app.css
│   └── router.tsx
├── index.html
├── build.ts
├── startDev.ts
├── bunServer.ts       # Tiny static server used by the bundler in dev
├── Dockerfile
└── package.json
```

**Scripts**

| Script                 | What it does                                            |
|------------------------|---------------------------------------------------------|
| `bun dev`              | Start the dev server with HMR and route tree generation |
| `bun dev:all`          | Same as `dev`, but listens on `0.0.0.0`                 |
| `bun run typecheck`    | Run `tsc --noEmit`                                      |
| `bun run knip`         | Find unused files, exports, and dependencies            |
| `bun run docker:build` | Build a production Docker image                         |

---

## What the generator actually does

When you run `cna my-app -t fullstack`, here's the sequence:

1. **Validate inputs.** Name and type are checked against the same rules used by the prompts.
2. **Create the target directory.** `my-app/` under your current working directory.
3. **Plan the file copy.** The template directory (`src/projects/fullstack` or `src/projects/client-only-react`) plus a small `src/shared` overlay are walked. Files ending in `-keep` (e.g. `.gitignore-keep`, `biome.jsonc-keep`) and directories ending in `-keep` (e.g. `.claude-keep`, `.vscode-keep`) are renamed on write - this dodges npm's behavior of stripping `.gitignore` from published packages and keeps Bun workspaces from misinterpreting nested config files in the monorepo.
4. **Replace placeholders.** `{{PROJECT_NAME}}` is replaced with your app name; `{{BETTER_AUTH_SECRET}}` is replaced with a freshly generated 32-byte hex secret (fullstack only). The template's `package.json` name (`create-new-app-template-fullstack` / `-client-only`) is also rewritten to your project's name.
5. **Write the files.** Single pass, parent directories created as needed.
6. **Install dependencies** via `bun install`.
7. **Initialize Biome** via `bunx biomeInit --no-include-biome-config` (the template ships its own `biome.jsonc`, so we skip the one biomeInit would write).
8. **Merge VS Code settings** if a `.vscode/settings.json` was generated.
9. **`git init`.** Non-fatal - if it fails, you'll see a warning and the rest of the generation still succeeds.

---

## Development

This repo uses Bun. Standard workflow:

```shell
bun install           # Install root deps
bun run dev           # Run the CLI locally (src/cli/index.ts)
bun test              # Run the test suite
bun test --watch      # Watch mode
bun run check         # Biome check
bun run check:fix     # Biome check + autofix
```

### Project layout

```
create-new-app/
├── bin/
│   └── cna.js                      # Node wrapper - checks for Bun, execs the CLI
├── src/
│   ├── cli/
│   │   ├── index.ts                # Entry - parse args, run, print next steps
│   │   ├── options-parser.ts       # node:util parseArgs wrapper
│   │   ├── resolveProjectOptions.ts # CLI args → validated options, with prompts
│   │   └── generateProject.ts      # Plan + apply file writes, run post-install
│   ├── projects/
│   │   ├── fullstack/              # Fullstack template
│   │   └── client-only-react/      # Client-only template
│   ├── shared/                     # Files overlaid on every template
│   ├── utils/                      # run(), withSpinner()
│   └── types.ts
├── tests/                          # bun:test
├── package.json                    # Workspaces: src/projects/*
└── biome.jsonc
```

The two templates are real Bun workspace members, so you can `cd src/projects/fullstack && bun install` to work on them as if they were standalone apps.

### Adding to a template

Templates are plain files on disk. To change what gets generated:

1. Edit files under `src/projects/<template>/`.
2. Use `{{PROJECT_NAME}}` and `{{BETTER_AUTH_SECRET}}` placeholders where needed.
3. If you're adding a file that npm would otherwise strip on publish, or that Bun workspaces would resolve too eagerly, suffix the name with `-keep` (and update tests if relevant).
4. Run `bun test` - the integration test generates a real project and checks the output.

---

## License

MIT &copy; [Qodesmith](https://github.com/qodesmith)
