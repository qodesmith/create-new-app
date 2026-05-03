import {describe, expect, it} from 'bun:test'

import type {SourceReader} from '../src/cli/generateProject'

import {planTemplate} from '../src/cli/generateProject'

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

    expect(plan).toEqual([
      {destPath: `${TARGET}/hello.txt`, contents: 'hi'},
    ])
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
    const SRC_A = '/srcA'
    const SRC_B = '/srcB'
    const reader = makeReader({
      [`${SRC_A}/conflict.txt`]: 'from A',
      [`${SRC_B}/conflict.txt`]: 'from B',
    })

    const plan = await planTemplate({
      sources: [SRC_A, SRC_B],
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
