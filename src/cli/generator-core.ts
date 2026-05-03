import type {ProjectType} from '../utils/validation'
import type {GuidedOptions} from './guided-mode'

import {randomBytes} from 'node:crypto'
import {existsSync} from 'node:fs'
import {join, parse, resolve} from 'node:path'
import process from 'node:process'

import {log} from '@clack/prompts'

import {
  ensureDir,
  getFilesRecursive,
  getIsTemplateFile,
  pathExists,
  replacePlaceholders,
} from '../utils/file-operations'
import {run} from '../utils/run'
import {withSpinner} from '../utils/withSpinner'

/**
 * Get the path to a project template
 */
function getProjectPath(type: ProjectType): string {
  const absolutePathToThisFile = import.meta.dir
  const templatesRoot = resolve(absolutePathToThisFile, '../projects')

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
  // The `create-new-app-template-*` strings are the literal `name` fields in
  // each template's package.json — kept as real npm names on disk so the
  // templates can be Bun workspace members of the root.
  const placeholderReplacements: Record<string, string> = {
    '{{PROJECT_NAME}}': name,
    '{{BETTER_AUTH_SECRET}}': randomBytes(32).toString('hex'),
    'create-new-app-template-fullstack': name,
    'create-new-app-template-client-only': name,

    // Add other placeholders here...
  }

  // Copy and process template files
  await withSpinner('Copying project files...', async () => {
    // const files = getFilesRecursive(fullProjectPath)
    const sharedDirAbsolute = resolve(import.meta.dir, '../shared')

    const sourcePaths = [fullProjectPath, sharedDirAbsolute]

    for (const sourcePath of sourcePaths) {
      const files = getFilesRecursive(sourcePath)

      for (const srcFileAbsolutePath of files) {
        /**
         * Get the relative path where the file will sit in the new project:
         *
         * ↓--------- Remove this from the path ----------↓
         * /Users/me/create-new-app/src/projects/fullstack/src/client/constants.ts
         *
         * Before:
         * /Users/me/create-new-app/src/projects/fullstack/src/client/constants.ts
         *
         * After:
         * src/client/constants.ts
         */
        const relativePathInProject = srcFileAbsolutePath.replace(
          `${sourcePath}/`,
          ''
        )
        const {base: fileName, dir: sourceDir} = parse(srcFileAbsolutePath)
        const isKeepFile = fileName.endsWith('-keep')
        const isKeepDir = sourceDir.includes('-keep')

        // Read the file to determine if it's a template file.
        let fileContents = await Bun.file(srcFileAbsolutePath).text()
        let destFilePath = join(targetDir, relativePathInProject)
        const isTemplateFile = getIsTemplateFile({
          fileContents,
          placeholderReplacements,
        })

        // Files that contain placeholders for replacement.
        if (isTemplateFile) {
          fileContents = replacePlaceholders(
            fileContents,
            placeholderReplacements
          )
        }

        // Rename `-keep` files - name.ext-keep => name.ext
        if (isKeepFile) {
          destFilePath = destFilePath.slice(0, -5) // Remove "-keep" from path
        }

        // Rename `-keep` directories - .dirname-keep => .dirname
        if (isKeepDir) {
          destFilePath = destFilePath.replaceAll('-keep/', '/')
        }

        const parentDirForFile = resolve(destFilePath, '..')
        ensureDir(parentDirForFile) // Creates the dir recursively if needed.
        await Bun.write(destFilePath, fileContents)
      }
    }
  })

  // Install dependencies
  await withSpinner('Installing dependencies...', async () => {
    await run('bun install', targetDir)
  })

  // Set up Biome
  await withSpinner('Setting up Biome...', async () => {
    /**
     * Ensure the CLI does NOT create a biome.jsonc file. We will manually
     * create it so we can include a number of overrides to the config.
     */
    await run('bunx biomeInit --no-include-biome-config', targetDir)
  })

  // Update VSCode settings if they exist - biomeInit above should create it.
  const vscodeSettingsPath = `${targetDir}/.vscode/settings.json`
  if (existsSync(vscodeSettingsPath)) {
    await withSpinner('Updating VS Code settings...', async () => {
      const vscodeSettingsRaw = await Bun.file(vscodeSettingsPath).text()
      const vscodeSettings = JSON.parse(vscodeSettingsRaw) as Record<
        string,
        unknown
      >
      const additionalSettings = {
        'js/ts.preferences.preferTypeOnlyAutoImports': true,
        'js/ts.preferences.importModuleSpecifier': 'non-relative',
        'js/ts.preferences.includePackageJsonAutoImports': 'auto',
      }

      await Bun.write(
        vscodeSettingsPath,
        JSON.stringify({...vscodeSettings, ...additionalSettings}, null, 2)
      )

      await run(`bunx biome format --write "${vscodeSettingsPath}"`, targetDir)
    })
  }

  try {
    await withSpinner('Initializing git...', async () => {
      await run('git init', targetDir)
    })
  } catch {
    log.warning('Git initialization failed')
  }

  log.success('Project created successfully!')
}
