# CLI Generator Tooling Plan

## Tool Choices

| Category    | Tool                 | Notes                                  |
|-------------|----------------------|----------------------------------------|
| Runtime     | Bun                  | Native APIs, fast                      |
| Arg parsing | `Bun.util.parseArgs` | Built-in, no dep                       |
| Prompts     | `@clack/prompts`     | Includes styling/spinners              |
| Templating  | String replacement   | No engine, just `{{VAR}}` placeholders |
| File ops    | Bun native fs        | `Bun.write`, `node:fs`                 |
| Validation  | Manual               | Simple if/else checks                  |
| Pkg manager | Bun (hardcoded)      | No detection needed                    |
| Testing     | `bun:test`           | Built-in, Jest-compatible              |

## Dependencies

```json
{
  "dependencies": {
    "@clack/prompts": "^0.x"
  },
  "devDependencies": {}
}
```

Only 1 external runtime dependency.

## Implementation Order

1. Set up project structure per `planning.md`
2. Implement `src/utils/` helpers (file ops, logger, validation)
3. Implement `src/cli/options-parser.ts` using `parseArgs`
4. Implement `src/cli/guided-mode.ts` using `@clack/prompts`
5. Implement `src/cli/cli-mode.ts` for non-interactive usage
6. Implement `src/cli/generator-core.ts` - orchestrates generation
7. Build `src/projects/fullstack/` templates
8. Add tests with `bun:test`
9. Configure build/publish workflow

## Distribution

- **npm**: `npx create-new-app` / `npm i -g create-new-app`
- **GitHub releases**: Standalone binaries via `bun build --compile`
- **Package name**: `create-new-app` (primary), `cna` (alias in bin field)

## Template Strategy

- Templates stored as files in `src/projects/`, copied at runtime
- Placeholders use `{{VAR}}` syntax, replaced via string ops
- Dependency versions use `^x.x.x` ranges (less maintenance)
