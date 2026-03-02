// biome-ignore-all lint/suspicious/noConsole: CLI utility

import {$} from 'bun'
import {dirname, join} from 'node:path'

import {collectProjectDeps} from './checkDeps'
import {rootDepsWhitelist} from './rootDepsWhitelist'

type SyncInfo = {
  package: string
  version: string
}

type UpdatedInfo = {
  package: string
  previous: string
  updated: string
}

/**
 * Sync root devDependencies to match the union of all project deps.
 * Adds missing project deps to root devDependencies (if not already in root
 * dependencies). Removes stale root devDependencies not found in any project.
 */
export async function syncDeps(): Promise<void> {
  const projectsDir = join(dirname(import.meta.dir), 'projects')
  const rootPkgPath = join(dirname(import.meta.dir), '..', 'package.json')
  const rootPkg = await Bun.file(rootPkgPath).json()

  const rootDeps: Record<string, string> = rootPkg.dependencies ?? {}
  const rootDevDeps: Record<string, string> = rootPkg.devDependencies ?? {}

  const projectDeps = await collectProjectDeps(projectsDir)

  const added: SyncInfo[] = []
  const updated: UpdatedInfo[] = []
  const removed: SyncInfo[] = []

  // Add missing: project deps not in root dependencies or devDependencies
  for (const [name, version] of projectDeps) {
    if (!(name in rootDeps || name in rootDevDeps)) {
      rootDevDeps[name] = version
      added.push({package: name, version})
    }
  }

  // Update mismatched: root devDeps that differ from project version
  for (const [name, version] of projectDeps) {
    if (name in rootDevDeps && rootDevDeps[name] !== version) {
      updated.push({package: name, previous: rootDevDeps[name], updated: version})
      rootDevDeps[name] = version
    }
  }

  // Remove stale: root devDeps not in any project file (skip whitelisted)
  for (const name of Object.keys(rootDevDeps)) {
    if (
      !(projectDeps.has(name) || rootDepsWhitelist.has(name)) &&
      rootDevDeps[name]
    ) {
      removed.push({package: name, version: rootDevDeps[name]})
      delete rootDevDeps[name]
    }
  }

  if (added.length === 0 && updated.length === 0 && removed.length === 0) {
    console.log('Root devDependencies already in sync!')
    return
  }

  // Sort devDependencies alphabetically
  const sorted: Record<string, string> = {}
  for (const key of Object.keys(rootDevDeps).sort()) {
    if (rootDevDeps[key]) {
      sorted[key] = rootDevDeps[key]
    }
  }
  rootPkg.devDependencies = sorted

  await Bun.write(rootPkgPath, JSON.stringify(rootPkg, null, 2))
  await $`bunx biome format --write ${rootPkgPath}`.quiet()

  if (added.length > 0) {
    added.sort((a, b) => a.package.localeCompare(b.package))
    console.log(`\nAdded to root devDependencies (${added.length}):`)
    console.table(added)
  }

  if (updated.length > 0) {
    updated.sort((a, b) => a.package.localeCompare(b.package))
    console.log(`\nUpdated in root devDependencies (${updated.length}):`)
    console.table(updated)
  }

  if (removed.length > 0) {
    removed.sort((a, b) => a.package.localeCompare(b.package))
    console.log(`\nRemoved from root devDependencies (${removed.length}):`)
    console.table(removed)
  }
}

// Run if executed directly
if (import.meta.main) {
  await syncDeps()
}
