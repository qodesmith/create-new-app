// biome-ignore-all lint/suspicious/noConsole: CLI utility

import {$} from 'bun'
import {dirname, join} from 'node:path'

import {
  findPackageJsonFiles,
  getLatestVersion,
  getPrefix,
  parseVersion,
} from './checkDeps'
import {syncDeps} from './syncDeps'

type UpdateInfo = {
  package: string
  previous: string
  updated: string
  source: string
}

/**
 * Update all deps in src/projects to latest, sync root devDeps via syncDeps,
 * then update root dependencies and peerDependencies independently.
 */
async function updateDeps(): Promise<void> {
  const projectsDir = join(dirname(import.meta.dir), 'projects')
  const packageFiles = findPackageJsonFiles(projectsDir)
  const rootPkgPath = join(dirname(import.meta.dir), '..', 'package.json')

  // Collect all unique package names from project files
  const allPackages = new Map<string, string>()
  for (const file of packageFiles) {
    const pkg = await Bun.file(file).json()
    const deps = {...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {})}

    for (const [name, version] of Object.entries(deps)) {
      if (
        typeof version === 'string' &&
        version !== 'latest' &&
        getPrefix(version)
      ) {
        allPackages.set(name, version)
      }
    }
  }

  // Fetch all latest versions in parallel
  const latestVersions = new Map<string, string>()
  await Promise.all(
    Array.from(allPackages.keys()).map(async name => {
      const latest = await getLatestVersion(name)
      if (latest) latestVersions.set(name, latest)
    })
  )

  const updates: UpdateInfo[] = []

  // 1. Update project package.json files
  for (const file of packageFiles) {
    const pkg = await Bun.file(file).json()
    const relativePath = file.replace(projectsDir, 'src/projects')
    let changed = false

    for (const depKey of ['dependencies', 'devDependencies'] as const) {
      const deps = pkg[depKey]
      if (!deps) continue

      for (const [name, version] of Object.entries(deps)) {
        if (
          typeof version !== 'string' ||
          version === 'latest' ||
          !getPrefix(version)
        ) {
          continue
        }

        const latest = latestVersions.get(name)
        if (!latest) continue

        const current = parseVersion(version)
        if (current !== latest) {
          const prefix = getPrefix(version)
          const newVersion = `${prefix}${latest}`
          deps[name] = newVersion
          changed = true

          updates.push({
            package: name,
            previous: version,
            updated: newVersion,
            source: relativePath,
          })
        }
      }
    }

    if (changed) {
      await Bun.write(file, JSON.stringify(pkg, null, 2))
      await $`bunx biome format --write ${file}`.quiet()
    }
  }

  // 2. Sync root devDependencies from project files
  await syncDeps()

  // 3. Update root dependencies and peerDependencies independently
  const rootPkg = await Bun.file(rootPkgPath).json()
  let rootChanged = false

  // Fetch latest for root-only packages (deps + peerDeps)
  const rootOnlyPackages = new Set<string>()
  for (const depKey of ['dependencies', 'peerDependencies'] as const) {
    const deps = rootPkg[depKey]
    if (!deps) continue
    for (const [name, version] of Object.entries(deps)) {
      if (
        typeof version === 'string' &&
        version !== 'latest' &&
        getPrefix(version as string) &&
        !latestVersions.has(name)
      ) {
        rootOnlyPackages.add(name)
      }
    }
  }

  await Promise.all(
    Array.from(rootOnlyPackages).map(async name => {
      const latest = await getLatestVersion(name)
      if (latest) latestVersions.set(name, latest)
    })
  )

  for (const depKey of ['dependencies', 'peerDependencies'] as const) {
    const deps = rootPkg[depKey]
    if (!deps) continue

    for (const [name, version] of Object.entries(deps)) {
      if (
        typeof version !== 'string' ||
        version === 'latest' ||
        !getPrefix(version)
      ) {
        continue
      }

      const latest = latestVersions.get(name)
      if (!latest) continue

      const current = parseVersion(version)
      if (current !== latest) {
        const prefix = getPrefix(version)
        const newVersion = `${prefix}${latest}`
        deps[name] = newVersion
        rootChanged = true

        updates.push({
          package: name,
          previous: version,
          updated: newVersion,
          source: 'package.json',
        })
      }
    }
  }

  if (rootChanged) {
    await Bun.write(rootPkgPath, JSON.stringify(rootPkg, null, 2))
    await $`bunx biome format --write ${rootPkgPath}`.quiet()
  }

  // 4. Sync packageManager field across root + project package.json files
  await syncPackageManager(rootPkgPath, packageFiles)

  if (updates.length === 0) {
    console.log('All dependencies are already up to date!')
    return
  }

  updates.sort((a, b) => a.package.localeCompare(b.package))
  console.log(`\nUpdated ${updates.length} dependencies:`)
  console.table(updates)
}

/**
 * Sync the packageManager field in root and project package.json files
 * to match the @types/bun devDependency version (pinned, no ^ or ~).
 */
async function syncPackageManager(
  rootPkgPath: string,
  projectFiles: string[]
): Promise<void> {
  const rootPkg = await Bun.file(rootPkgPath).json()
  const typesVersion: string | undefined =
    rootPkg.devDependencies?.['@types/bun']
  if (!typesVersion) return

  const pinned = parseVersion(typesVersion)
  const expected = `bun@${pinned}`
  const allFiles = [rootPkgPath, ...projectFiles]

  for (const file of allFiles) {
    const pkg = await Bun.file(file).json()

    // For project files, only sync if packageManager is already declared.
    if (file !== rootPkgPath && !pkg.packageManager) continue

    if (pkg.packageManager === expected) continue

    const previous = pkg.packageManager
    pkg.packageManager = expected
    await Bun.write(file, JSON.stringify(pkg, null, 2))
    await $`bunx biome format --write ${file}`.quiet()

    const label = file === rootPkgPath ? 'package.json' : file.split('/projects/')[1]
    console.log(
      `Updated packageManager in ${label}: ${previous ?? '(none)'} → ${expected}`
    )
  }
}

// Run if executed directly
if (import.meta.main) {
  await updateDeps()
}
