/**
 * Packages that should never be removed from root devDependencies,
 * even if they're not found in any project package.json.
 */
export const rootDepsWhitelist = new Set(['@types/bun'])
