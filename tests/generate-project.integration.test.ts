import {afterEach, beforeEach, describe, expect, it} from 'bun:test'
import {createHash} from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve, sep} from 'node:path'

import {applyPlan, planTemplate} from '../src/cli/generateProject'

function listFilesRecursive(dir: string): string[] {
  return Array.from(
    new Bun.Glob('**/*').scanSync({cwd: dir, absolute: true, dot: true})
  )
}

/**
 * Integration test that exercises the real Bun.Glob source reader plus
 * applyPlan against a real temp directory. Complements the in-memory unit
 * tests in plan-template.test.ts by verifying the production SourceReader
 * adapter actually walks and reads the way planTemplate expects.
 */

let workDir: string
let sourceDir: string
let targetDir: string

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'cna-integ-'))
  sourceDir = join(workDir, 'src')
  targetDir = join(workDir, 'out')
  mkdirSync(sourceDir, {recursive: true})
})

afterEach(() => {
  if (existsSync(workDir)) {
    rmSync(workDir, {recursive: true})
  }
})

describe('generateProject (integration)', () => {
  it('plans and applies a small fixture template through the real Bun.Glob reader', async () => {
    // Fixture: one plain file, one placeholder file, one -keep file, and a
    // -keep dir containing a regular file.
    writeFileSync(join(sourceDir, 'README.md'), 'static content')
    writeFileSync(join(sourceDir, 'package.json'), '{"name":"{{NAME}}"}')
    writeFileSync(join(sourceDir, '.gitignore-keep'), 'node_modules\n')
    mkdirSync(join(sourceDir, '.vscode-keep'), {recursive: true})
    writeFileSync(
      join(sourceDir, '.vscode-keep', 'settings.json'),
      '{"editor.tabSize":2}'
    )

    const realReader = {
      list: (dir: string) => listFilesRecursive(dir),
      read: async (path: string) =>
        new Uint8Array(await Bun.file(path).arrayBuffer()),
    }

    const plan = await planTemplate({
      sources: [sourceDir],
      targetDir,
      replacements: {'{{NAME}}': 'my-app'},
      reader: realReader,
    })

    await applyPlan(plan)

    const writtenFiles = listFilesRecursive(targetDir)
      .map(p => p.replace(`${targetDir}${sep}`, ''))
      .sort()

    expect(writtenFiles).toEqual([
      '.gitignore',
      join('.vscode', 'settings.json'),
      'README.md',
      'package.json',
    ])

    expect(await Bun.file(join(targetDir, 'README.md')).text()).toBe(
      'static content'
    )
    expect(await Bun.file(join(targetDir, 'package.json')).text()).toBe(
      '{"name":"my-app"}'
    )
    expect(await Bun.file(join(targetDir, '.gitignore')).text()).toBe(
      'node_modules\n'
    )
    expect(
      await Bun.file(join(targetDir, '.vscode', 'settings.json')).text()
    ).toBe('{"editor.tabSize":2}')
  })

  it('copies a real binary asset byte-for-byte', async () => {
    // Regression: text-decoding binary files in planTemplate corrupted assets
    // like forbidden.webm. Round-trip the actual template asset through
    // planTemplate + applyPlan and assert SHA-256 equality + byte length.
    const fixture = resolve(
      import.meta.dir,
      '..',
      'src',
      'projects',
      'fullstack',
      'src',
      'server',
      'assets',
      'forbidden.webm'
    )

    const realReader = {
      list: (dir: string) => listFilesRecursive(dir),
      read: async (path: string) =>
        new Uint8Array(await Bun.file(path).arrayBuffer()),
    }

    const sourceWebm = join(sourceDir, 'forbidden.webm')
    const sourceBytes = new Uint8Array(await Bun.file(fixture).arrayBuffer())
    writeFileSync(sourceWebm, sourceBytes)

    const plan = await planTemplate({
      sources: [sourceDir],
      targetDir,
      // Pass realistic replacements; the binary must not be touched.
      replacements: {'{{PROJECT_NAME}}': 'my-app'},
      reader: realReader,
    })

    await applyPlan(plan)

    const writtenBytes = new Uint8Array(
      await Bun.file(join(targetDir, 'forbidden.webm')).arrayBuffer()
    )

    expect(writtenBytes.byteLength).toBe(sourceBytes.byteLength)
    expect(createHash('sha256').update(writtenBytes).digest('hex')).toBe(
      createHash('sha256').update(sourceBytes).digest('hex')
    )
  })
})
