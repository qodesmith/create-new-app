import type {SourceReader} from '../src/cli/generateProject'

import {describe, expect, it} from 'bun:test'

import {planTemplate, replacePlaceholders} from '../src/cli/generateProject'

/**
 * Build an in-memory SourceReader from a flat map of absolutePath → contents.
 * `list(dir)` returns every key under that dir prefix; `read(path)` returns
 * the recorded contents.
 */
function makeReader(files: Record<string, string>): SourceReader {
  return {
    list: dir =>
      Object.keys(files).filter(p => p === dir || p.startsWith(`${dir}/`)),
    read: async path => {
      if (!(path in files)) {
        throw new Error(`SourceReader: no file at ${path}`)
      }
      return files[path] as string
    },
  }
}

const TARGET = '/out'
const SRC = '/src'

describe('planTemplate', () => {
  it('writes a single plain file at its mirrored destination', async () => {
    const reader = makeReader({
      [`${SRC}/hello.txt`]: 'hi',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(plan).toEqual([{destPath: `${TARGET}/hello.txt`, contents: 'hi'}])
  })

  it('substitutes placeholders only when at least one matches', async () => {
    const reader = makeReader({
      [`${SRC}/templated.txt`]: 'hello {{NAME}}',
      [`${SRC}/plain.txt`]: 'no replacement here',
      [`${SRC}/unmatched.txt`]: 'has {{UNKNOWN}} only',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {'{{NAME}}': 'world'},
      reader,
    })

    const byPath = Object.fromEntries(plan.map(w => [w.destPath, w.contents]))
    expect(byPath[`${TARGET}/templated.txt`]).toBe('hello world')
    expect(byPath[`${TARGET}/plain.txt`]).toBe('no replacement here')
    // {{UNKNOWN}} doesn't match any replacement key, so the file isn't treated
    // as a template and contents pass through untouched.
    expect(byPath[`${TARGET}/unmatched.txt`]).toBe('has {{UNKNOWN}} only')
  })

  it('renames -keep files: name.ext-keep → name.ext', async () => {
    const reader = makeReader({
      [`${SRC}/.gitignore-keep`]: 'node_modules\n',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(plan).toEqual([
      {destPath: `${TARGET}/.gitignore`, contents: 'node_modules\n'},
    ])
  })

  it('renames -keep directories: .vscode-keep/ → .vscode/', async () => {
    const reader = makeReader({
      [`${SRC}/.vscode-keep/extensions.json`]: '{}',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(plan).toEqual([
      {destPath: `${TARGET}/.vscode/extensions.json`, contents: '{}'},
    ])
  })

  it('applies both renames when a -keep file lives inside a -keep dir', async () => {
    const reader = makeReader({
      [`${SRC}/.claude-keep/settings.json-keep`]: '{"x":1}',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(plan).toEqual([
      {destPath: `${TARGET}/.claude/settings.json`, contents: '{"x":1}'},
    ])
  })

  it('lets later source dirs win on destination-path conflict', async () => {
    const SrcA = '/srcA'
    const SrcB = '/srcB'
    const reader = makeReader({
      [`${SrcA}/conflict.txt`]: 'from A',
      [`${SrcB}/conflict.txt`]: 'from B',
    })

    const plan = await planTemplate({
      sources: [SrcA, SrcB],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(plan).toEqual([
      {destPath: `${TARGET}/conflict.txt`, contents: 'from B'},
    ])
  })

  it('returns an empty plan for an empty source dir', async () => {
    const reader = makeReader({})

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(plan).toEqual([])
  })

  it('substitutes inside placeholder-bearing files even when other files have no placeholders', async () => {
    const reader = makeReader({
      [`${SRC}/package.json`]: '{"name":"create-new-app-template-fullstack"}',
      [`${SRC}/README.md`]: 'No placeholders here.',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {
        'create-new-app-template-fullstack': 'my-app',
      },
      reader,
    })

    const byPath = Object.fromEntries(plan.map(w => [w.destPath, w.contents]))
    expect(byPath[`${TARGET}/package.json`]).toBe('{"name":"my-app"}')
    expect(byPath[`${TARGET}/README.md`]).toBe('No placeholders here.')
  })
})

describe('replacePlaceholders', () => {
  it('replaces a single placeholder using its literal key string', () => {
    const result = replacePlaceholders('Hello {{NAME}}!', {
      '{{NAME}}': 'World',
    })
    expect(result).toBe('Hello World!')
  })

  it('replaces multiple placeholders', () => {
    const result = replacePlaceholders('{{GREETING}} {{NAME}}!', {
      '{{GREETING}}': 'Hello',
      '{{NAME}}': 'World',
    })
    expect(result).toBe('Hello World!')
  })

  it('replaces all occurrences of the same placeholder', () => {
    const result = replacePlaceholders('{{X}} + {{X}} = 2{{X}}', {
      '{{X}}': '1',
    })
    expect(result).toBe('1 + 1 = 21')
  })

  it('leaves placeholders that are not in the replacements map untouched', () => {
    const result = replacePlaceholders('{{KNOWN}} {{UNKNOWN}}', {
      '{{KNOWN}}': 'yes',
    })
    expect(result).toBe('yes {{UNKNOWN}}')
  })
})
