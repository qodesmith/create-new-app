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
│   ├── templates/
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
