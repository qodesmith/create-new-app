// biome-ignore-all lint/suspicious/noConsole: CLI utility

import {readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'

import {rootDepsWhitelist} from './rootDepsWhitelist'

type DepInfo = {
  package: string
  current: string
  latest: string
  source: string
}

type MissingInfo = {
  package: string
  version: string
  source: string
}

type StaleInfo = {
  package: string
  version: string
}

/**
 * Fetch latest version from npm registry
 */
export async function getLatestVersion(
  packageName: string
): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`)
    if (!res.ok) return null
    const data = (await res.json()) as {version: string}
    return data.version
  } catch {
    return null
  }
}

/**
 * Find all package.json files in src/projects recursively
 */
export function findPackageJsonFiles(dir: string): string[] {
  const files: string[] = []
  const entries = readdirSync(dir, {withFileTypes: true})

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findPackageJsonFiles(fullPath))
    } else if (entry.name === 'package.json') {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Parse version string, stripping ^ or ~ prefix
 */
export function parseVersion(version: string): string {
  return version.replace(/^[\^~]/, '')
}

/**
 * Check if a version string has a ^ or ~ prefix
 */
export function getPrefix(version: string): string {
  const match = version.match(/^[\^~]/)
  return match ? match[0] : ''
}

/**
 * Compare two semver strings. Returns positive if a > b, negative if a < b, 0 if equal.
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Collect all deps from all project package.json files into a Map.
 * If same package appears with different versions, keep the highest semver.
 */
export async function collectProjectDeps(
  projectsDir: string
): Promise<Map<string, string>> {
  const packageFiles = findPackageJsonFiles(projectsDir)
  const result = new Map<string, string>()

  for (const file of packageFiles) {
    const pkg = await Bun.file(file).json()
    const deps = {...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {})}

    for (const [name, version] of Object.entries(deps)) {
      if (typeof version !== 'string' || version === 'latest') continue

      const existing = result.get(name)
      if (existing) {
        // Keep the highest semver version
        const existingClean = parseVersion(existing)
        const newClean = parseVersion(version)
        if (compareSemver(newClean, existingClean) > 0) {
          result.set(name, version)
        }
      } else {
        result.set(name, version)
      }
    }
  }

  return result
}

/**
 * Check all deps in src/projects and log outdated, missing, and stale
 */
export async function checkDeps(): Promise<void> {
  const projectsDir = join(dirname(import.meta.dir), 'projects')
  const rootPkgPath = join(dirname(import.meta.dir), '..', 'package.json')
  const rootPkg = await Bun.file(rootPkgPath).json()

  const rootDeps: Record<string, string> = {
    ...(rootPkg.dependencies ?? {}),
    ...(rootPkg.devDependencies ?? {}),
  }

  const packageFiles = findPackageJsonFiles(projectsDir)

  // Collect project deps (for missing/stale checks)
  const projectDeps = new Map<string, {version: string; source: string}>()
  for (const file of packageFiles) {
    const pkg = await Bun.file(file).json()
    const relativePath = file.replace(projectsDir, 'src/projects')
    const deps = {...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {})}

    for (const [name, version] of Object.entries(deps)) {
      if (typeof version === 'string' && version !== 'latest') {
        projectDeps.set(name, {version, source: relativePath})
      }
    }
  }

  // Build full dep list for outdated check (can have dupes across sources)
  const allDeps: {name: string; version: string; source: string}[] = []
  const seen = new Set<string>()

  for (const [name, {version, source}] of projectDeps) {
    allDeps.push({name, version, source})
    seen.add(`${name}@${source}`)
  }

  for (const depKey of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ] as const) {
    const deps = rootPkg[depKey]
    if (!deps) continue

    for (const [name, version] of Object.entries(deps)) {
      const key = `${name}@package.json`
      if (typeof version === 'string' && version !== 'latest' && !seen.has(key)) {
        allDeps.push({name, version, source: 'package.json'})
        seen.add(key)
      }
    }
  }

  // --- Outdated ---
  const outdated: DepInfo[] = []
  await Promise.all(
    allDeps.map(async ({name, version, source}) => {
      const latest = await getLatestVersion(name)
      if (!latest) return

      const current = parseVersion(version)
      if (current !== latest) {
        outdated.push({package: name, current, latest, source})
      }
    })
  )

  // --- Missing ---
  const missing: MissingInfo[] = []
  for (const [name, {version, source}] of projectDeps) {
    if (!(name in rootDeps)) {
      missing.push({package: name, version, source})
    }
  }

  // --- Stale ---
  const projectDepNames = new Set(projectDeps.keys())
  const stale: StaleInfo[] = []
  for (const [name, version] of Object.entries(rootPkg.devDependencies ?? {})) {
    if (!(projectDepNames.has(name) || rootDepsWhitelist.has(name))) {
      stale.push({package: name, version: version as string})
    }
  }

  // --- Output ---
  let clean = true

  if (outdated.length > 0) {
    clean = false
    outdated.sort((a, b) => a.package.localeCompare(b.package))
    console.log(`\nOutdated (${outdated.length}):`)
    console.table(outdated)
  }

  if (missing.length > 0) {
    clean = false
    missing.sort((a, b) => a.package.localeCompare(b.package))
    console.log(`\nMissing from root (${missing.length}):`)
    console.table(missing)
  }

  if (stale.length > 0) {
    clean = false
    stale.sort((a, b) => a.package.localeCompare(b.package))
    console.log(`\nStale in root devDependencies (${stale.length}):`)
    console.table(stale)
  }

  if (clean) {
    console.log('All dependencies are up to date and in sync!')
  }
}

// Run if executed directly
if (import.meta.main) {
  await checkDeps()
}
