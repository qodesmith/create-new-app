# CLI App Generator

This is a CLI tool that generates applications. There are 4 types of
applications that users can generate:

## Fullstack

This is a fullstack React application powered by Bun. Key technologies include:

### Backend

**Bun**
- Serves as both the dev server _and_ the main server entrypoint
- Will handle serving primarily the index.html file (main entrypoint)
- Will be used to bundle the application
- Ensures code-splitting for Tanstack Router lazy routes (see below)

**Hono**
- Serves as the API server
- Will serve all other requests that Bun does not handle
- Provides middleware for various endpoints
- Provides a client-side RPC client

**SQLite + Drizzle**
- Bun includes SQLite out of the box making this an easy choice
- Drizzle as the ORM to handle SQLite commands elegantly in TypeScript

**Better Auth**
- Library that handles authentication
- Creates and manages SQLite tables around authentication so we don't have to
- Provides RPC clients for the server and the client

**Resend + React Email**
- Library that handles sending emails
- The solution provided to Better Auth to send authentication emails, password
  change request emails, etc.
- React Email serving as the server-side email template engine of choice to

### Frontend

**React**
- Our frontend framework of choice
- We're NOT using "React Server Components"

**Tanstack Router**
- For client-side routing
- Used for data-fetching as well

**Tanstack Form**
- Client-side form library
- Handles the login and signup pages if user-management is selected

**Jotai**
- Global state management solution
- `store` is protected against SSR state leakage

**Tailwind + Shadcn**
- Frontend components & styling
- Forms the basis of the design system

### Other Tools

**Arktype**
- Schema validation
- Shared between the client and server

**Utils**
- Utility library via the `@qodestack/utils` package
- Shared between the client and server

**Biome**
- Custom Biome config via the `@qodestack/biome-config` package

# Folder Structure

```
.
├── src/
│   ├── cli/
│   │   ├── index.ts               # Entry point for the CLI command (e.g., `create-new-app`)
│   │   ├── guided-mode.ts         # Logic for the interactive/guided process (prompts)
│   │   ├── cli-mode.ts            # Logic for the single-command/CLI-only mode
│   │   ├── options-parser.ts      # Parses and validates command line arguments
│   │   └── generator-core.ts      # Core function that takes options and executes generation
│   │
│   ├── projects/
│   │   ├── core/
│   │   │   ├── common-react/      # Reusable files/logic for React apps (e.g., tsconfig, vite config, shared hooks)
│   │   │   └── common-server/     # Reusable server files (e.g., shared utils, database connection stub)
│   │   │
│   │   ├── fullstack/             # Template for Fullstack React Application
│   │   │   ├── client/            # Client-side specific files
│   │   │   ├── server/            # Server-side specific files
│   │   │   └── package.json.hbs   # Template-specific package.json (using handlebars/templating)
│   │   │
│   │   ├── client-only-react/     # Template for Client-only React Application
│   │   │   └── ...
│   │   │
│   │   ├── vanilla/               # Template for Vanilla JS Application
│   │   │   └── ...
│   │   │
│   │   └── library/               # Template for Library (npm package)
│   │       └── ...
│   │
│   └── utils/
│       ├── file-operations.ts     # Utility functions for copying, reading, writing files
│       ├── logger.ts              # Custom logging/output functions
│       └── validation.ts          # Logic for validating input/options
│
├── tests/
│   ├── cli.test.ts                # Tests for the CLI input/parsing logic
│   └── templates.test.ts          # Tests for ensuring generated projects are valid
│
├── package.json                   # Dependencies for the CLI tool itself
└── tsconfig.json
```

_Why would you need a `common-server` folder if there's only 1 option to
generate a project with a server? None of that code would be shared with other
potential generated projects_

TL;DR - for future-proofing and separation of concerns in anticipation of growth
