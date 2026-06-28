import type {ProjectOptions, ProjectType, TemplateReplacements} from '../types'

import {randomBytes} from 'node:crypto'
import {existsSync, mkdirSync} from 'node:fs'
import {join, parse, resolve, sep} from 'node:path'
import process from 'node:process'

import {log} from '@clack/prompts'

import {run} from '../utils/run'
import {withSpinner} from '../utils/withSpinner'

/**
 * Replace placeholder substrings in `content`. Each key in `replacements` is
 * matched as a literal string (no `{{...}}` wrapping is added) and every
 * occurrence is replaced with its mapped value.
 */
export function replacePlaceholders(
  content: string,
  replacements: TemplateReplacements
): string {
  let result = content

  for (const [templateStr, value] of Object.entries(replacements)) {
    result = result.replaceAll(templateStr, value)
  }

  return result
}

/**
 * A SourceReader walks template directories and reads file contents.
 * Production uses Bun.Glob + Bun.file (DEFAULT_SOURCE_READER below); tests
 * use an in-memory adapter so the planning step can be exercised without
 * touching disk. Exported alongside planTemplate / applyPlan as internal
 * seams — generateProject is the module's external interface.
 *
 * `read` returns raw bytes so binary template assets (images, fonts, .webm,
 * etc.) survive the copy unchanged. Text substitution happens lazily inside
 * planTemplate — see `maybeSubstitute`.
 */
export type SourceReader = {
  list(dir: string): string[]
  read(path: string): Promise<Uint8Array>
}

export type FileWrite = {
  destPath: string
  contents: Uint8Array
}

const DEFAULT_SOURCE_READER: SourceReader = {
  list: dir =>
    Array.from(
      new Bun.Glob('**/*').scanSync({cwd: dir, absolute: true, dot: true})
    ),
  read: async path => new Uint8Array(await Bun.file(path).arrayBuffer()),
}

/**
 * Run placeholder substitution only on files that look like text templates.
 * We scan the raw bytes for any literal placeholder key; if none appear, the
 * bytes pass through untouched. This keeps binary assets (webm, fonts, etc.)
 * byte-identical to the source — a UTF-8 round trip would corrupt them.
 */
function maybeSubstitute(
  bytes: Uint8Array,
  replacements: TemplateReplacements
): Uint8Array {
  const templates = Object.keys(replacements)
  if (templates.length === 0) return bytes

  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const hasTemplate = templates.some(template => buf.indexOf(template) !== -1)
  if (!hasTemplate) return bytes

  const replaced = replacePlaceholders(buf.toString('utf8'), replacements)
  return new TextEncoder().encode(replaced)
}

function getProjectPath(type: ProjectType): string {
  const templatesRoot = resolve(import.meta.dir, '../projects')

  switch (type) {
    case 'fullstack':
      return join(templatesRoot, 'fullstack')
    case 'client-only':
      return join(templatesRoot, 'client-only-react')
    default:
      throw new Error(`Unknown project type: ${type}`)
  }
}

/**
 * Plan all file writes for a generation. Walks each source dir in order;
 * later sources win on destination-path conflicts. Pure given a SourceReader
 * and a frozen replacements map — no disk writes, no shell, no exits.
 */
export async function planTemplate(args: {
  sources: string[]
  targetDir: string
  replacements: TemplateReplacements
  reader: SourceReader
}): Promise<FileWrite[]> {
  const {sources, targetDir, replacements, reader} = args
  const planByDest = new Map<string, FileWrite>()

  for (const sourcePath of sources) {
    const files = reader.list(sourcePath)

    for (const srcFileAbsolutePath of files) {
      const relativePathInProject = srcFileAbsolutePath.replace(
        `${sourcePath}${sep}`,
        ''
      )
      const {base: fileName, dir: sourceDir} = parse(srcFileAbsolutePath)
      const isKeepFile = fileName.endsWith('-keep')
      const isKeepDir = sourceDir.includes('-keep')

      const fileContents = maybeSubstitute(
        await reader.read(srcFileAbsolutePath),
        replacements
      )
      let destPath = join(targetDir, relativePathInProject)

      // Rename `-keep` files: `name.ext-keep` → `name.ext`
      if (isKeepFile) {
        destPath = destPath.slice(0, -5)
      }

      // Rename `-keep` directories: `.dirname-keep/` → `.dirname/`
      if (isKeepDir) {
        destPath = destPath.replaceAll(`-keep${sep}`, sep)
      }

      planByDest.set(destPath, {destPath, contents: fileContents})
    }
  }

  return Array.from(planByDest.values())
}

/**
 * Write the planned tuples to disk, creating parent dirs as needed.
 */
export async function applyPlan(plan: FileWrite[]): Promise<void> {
  for (const {destPath, contents} of plan) {
    mkdirSync(resolve(destPath, '..'), {recursive: true})
    await Bun.write(destPath, contents)
  }
}

/**
 * Run the side-effecting steps that follow file writes: install deps, set up
 * Biome, optionally merge VS Code settings, init git. Each step shells out;
 * git failure is non-fatal and surfaces as a warning.
 */
async function runPostInstall(targetDir: string): Promise<void> {
  await withSpinner('Installing dependencies...', async () => {
    await run('bun install', targetDir)
  })

  await withSpinner('Setting up Biome...', async () => {
    // Skip biomeInit's own biome.jsonc; the template ships one with overrides.
    await run('bunx biomeInit --no-include-biome-config', targetDir)
  })

  const vscodeSettingsPath = join(targetDir, '.vscode', 'settings.json')
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

      await run(`bunx biome format --write '${vscodeSettingsPath}'`, targetDir)
    })
  }

  try {
    await withSpinner('Initializing git...', async () => {
      await run('git init', targetDir)
    })
  } catch {
    log.warning('Git initialization failed')
  }
}

/**
 * Generate a project from templates. Resolves the template path, builds the
 * replacements map (including a fresh BETTER_AUTH_SECRET), plans the file
 * output, applies it, then runs post-install steps.
 */
export async function generateProject(options: ProjectOptions): Promise<void> {
  const {name, type} = options
  const targetDir = join(process.cwd(), name)
  const fullProjectPath = getProjectPath(type)

  if (!existsSync(fullProjectPath)) {
    log.error(`Template for "${type}" not found at ${fullProjectPath}`)
    process.exit(1)
  }

  log.step(`Creating project directory: ${name}`)
  mkdirSync(targetDir, {recursive: true})

  // The `create-new-app-template-*` strings are the literal `name` fields in
  // each template's package.json — kept as real npm names on disk so the
  // templates can be Bun workspace members of the root.
  const replacements: TemplateReplacements = {
    '{{PROJECT_NAME}}': name,
    '{{BETTER_AUTH_SECRET}}': randomBytes(32).toString('hex'),
    'create-new-app-template-fullstack': name,
    'create-new-app-template-client-only': name,
  }

  const sharedDirAbsolute = resolve(import.meta.dir, '../shared')
  const sources = [fullProjectPath, sharedDirAbsolute]

  await withSpinner('Copying project files...', async () => {
    const plan = await planTemplate({
      sources,
      targetDir,
      replacements,
      reader: DEFAULT_SOURCE_READER,
    })
    await applyPlan(plan)
  })

  await runPostInstall(targetDir)

  log.success('Project created successfully!')
}
