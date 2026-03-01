// biome-ignore-all lint/suspicious/noConsole: CLI utility

import {$} from 'bun'
import {dirname, join} from 'node:path'

import {findPackageJsonFiles, getLatestVersion, parseVersion} from './checkDeps'

type UpdateInfo = {
  package: string
  previous: string
  updated: string
  source: string
}

/**
 * Check if a version string has a ^ or ~ prefix
 */
function getPrefix(version: string): string {
  const match = version.match(/^[\^~]/)
  return match ? match[0] : ''
}

/**
 * Update all deps in src/projects and root package.json to latest versions
 */
async function updateDeps(): Promise<void> {
  const projectsDir = join(dirname(import.meta.dir), 'projects')
  const packageFiles = findPackageJsonFiles(projectsDir)
  const rootPkgPath = join(dirname(import.meta.dir), '..', 'package.json')

  // Collect all unique package names from project files
  const allPackages = new Map<string, string>() // name -> version string

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

  // Update project package.json files
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

  // Update root package.json to stay in sync
  const rootPkg = await Bun.file(rootPkgPath).json()
  let rootChanged = false

  for (const depKey of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ] as const) {
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

  if (updates.length === 0) {
    console.log('All dependencies are already up to date!')
    return
  }

  updates.sort((a, b) => a.package.localeCompare(b.package))
  console.log(`Updated ${updates.length} dependencies:`)
  console.table(updates)
}

// Run if executed directly
if (import.meta.main) {
  await updateDeps()
}
