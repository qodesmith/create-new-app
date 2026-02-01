import type {ProjectType} from '../utils/validation'
import type {GuidedOptions} from './guided-mode'

import {$} from 'bun'
import {existsSync} from 'node:fs'
import {dirname, join, parse} from 'node:path'
import process from 'node:process'

import {log} from '@clack/prompts'

import {
  ensureDir,
  getFilesRecursive,
  pathExists,
  readAndReplace,
} from '../utils/file-operations'
import {withSpinner} from '../utils/withSpinner'

/**
 * Get the path to a project template
 */
function getProjectPath(type: ProjectType): string {
  const templatesRoot = join(dirname(import.meta.dir), 'projects')

  switch (type) {
    case 'fullstack':
      return join(templatesRoot, 'fullstack')
    case 'client-only':
      return join(templatesRoot, 'client-only-react')
    case 'library':
      return join(templatesRoot, 'library')
    case 'vanilla':
      return join(templatesRoot, 'vanilla')
    default:
      // This should never happen.
      throw new Error(`Unknown project type: ${type}`)
  }
}

/**
 * Generate a project from templates
 */
export async function generateProject(options: GuidedOptions): Promise<void> {
  const {name, type} = options
  const targetDir = join(process.cwd(), name)

  /**
   * Full path to the project template:
   * <local path on computer>/src/projects/<project type - fullstack | library | etc>
   */
  const fullProjectPath = getProjectPath(type)

  // Check that the project type exists
  if (!pathExists(fullProjectPath)) {
    log.error(`Template for "${type}" not found at ${fullProjectPath}`)
    process.exit(1)
  }

  // Create target directory
  log.step(`Creating project directory: ${name}`)
  ensureDir(targetDir)

  // Replacements for files that have handlebars-style placeholders in them.
  const placeholderReplacements: Record<string, string> = {
    // biome-ignore-start lint/style/useNamingConvention: these are the template keys
    PROJECT_NAME: name,
    // Add other placeholders here...
    // biome-ignore-end lint/style/useNamingConvention: these are the template keys
  }

  // Copy and process template files
  await withSpinner('Copying project files...', async () => {
    const files = getFilesRecursive(fullProjectPath)
    const relativeFilePathsWithTemplate = new Set([
      '.env.development',
      'Dockerfile',
      'Dockerfile.local',
      'fly.toml',
      'litefs.yml',
      'package.json',
      'src/client/routes/index.tsx',
      'src/server/constants.ts',
      'src/server/index.html',
      'src/server/api/index.ts',
      'src/server/db/drizzleStudio.ts',
      'src/server/db/options.ts',
    ])

    for (const srcFile of files) {
      // Remove absolute path plus leading slash.
      const relativePath = srcFile.slice(fullProjectPath.length + 1)
      const destPath = join(targetDir, relativePath)
      const {base: fileName} = parse(srcFile)

      ensureDir(dirname(destPath))

      // Files that contain placeholders for replacement.
      if (relativeFilePathsWithTemplate.has(relativePath)) {
        const content = await readAndReplace(srcFile, placeholderReplacements)
        await Bun.write(destPath, content)
        continue
      }

      // Rename `-keep` files - name.ext-keep => name.ext
      if (fileName.endsWith('-keep')) {
        const sanitizedPath = destPath.slice(0, -5) // Remove "-keep" from path
        await Bun.write(sanitizedPath, Bun.file(srcFile))
        continue
      }

      // Simply copy the file.
      await Bun.write(destPath, Bun.file(srcFile))
    }
  })

  // Install dependencies
  await withSpinner('Installing dependencies...', async () => {
    await $`bun install`.cwd(targetDir).quiet()
  })

  // Set up Biome
  await withSpinner('Setting up Biome...', async () => {
    /**
     * Ensure the CLI does NOT create a biome.jsonc file. We will manually
     * create it so we can include a number of overrides to the config.
     */
    await $`bunx biomeInit --no-includeBiomeConfig`.cwd(targetDir).quiet()
  })

  // Update VSCode settings if they exist
  const vscodeSettingsPath = `${targetDir}/.vscode/settings.json`
  if (existsSync(vscodeSettingsPath)) {
    await withSpinner('Updating VS Code settings...', async () => {
      const vscodeSettingsRaw = await Bun.file(vscodeSettingsPath).text()
      const vscodeSettings = JSON.parse(vscodeSettingsRaw) as Record<
        string,
        unknown
      >

      vscodeSettings['typescript.preferences.importModuleSpecifier'] =
        'non-relative'

      await Bun.write(
        vscodeSettingsPath,
        JSON.stringify(vscodeSettings, null, 2)
      )
    })
  }

  try {
    await withSpinner('Initializing git...', async () => {
      await $`git init`.cwd(targetDir).quiet()
    })
  } catch {
    log.warning('Git initialization failed')
  }

  log.success('Project created successfully!')
}
