import {readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'

type DepInfo = {
  package: string
  current: string
  latest: string
  source: string
}

/**
 * Fetch latest version from npm registry
 */
async function getLatestVersion(packageName: string): Promise<string | null> {
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
function findPackageJsonFiles(dir: string): string[] {
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
function parseVersion(version: string): string {
  return version.replace(/^[\^~]/, '')
}

/**
 * Check all deps in src/projects and log outdated ones
 */
export async function checkDeps(): Promise<void> {
  const projectsDir = join(dirname(import.meta.dir), 'projects')
  const packageFiles = findPackageJsonFiles(projectsDir)

  const allDeps = new Map<string, {version: string; source: string}>()

  for (const file of packageFiles) {
    const pkg = await Bun.file(file).json()
    const relativePath = file.replace(projectsDir, 'src/projects')

    const deps = {...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {})}
    for (const [name, version] of Object.entries(deps)) {
      if (typeof version === 'string' && version !== 'latest') {
        allDeps.set(name, {version, source: relativePath})
      }
    }
  }

  const outdated: DepInfo[] = []

  await Promise.all(
    Array.from(allDeps.entries()).map(async ([name, {version, source}]) => {
      const latest = await getLatestVersion(name)
      if (!latest) return

      const current = parseVersion(version)
      if (current !== latest) {
        outdated.push({package: name, current, latest, source})
      }
    })
  )

  if (outdated.length === 0) {
    // biome-ignore lint/suspicious/noConsole: CLI utility
    console.log('All dependencies are up to date!')
    return
  }

  outdated.sort((a, b) => a.package.localeCompare(b.package))
  // biome-ignore lint/suspicious/noConsole: CLI utility
  console.table(outdated)
}

// Run if executed directly
if (import.meta.main) {
  await checkDeps()
}
