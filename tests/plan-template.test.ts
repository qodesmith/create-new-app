import type {FileWrite, SourceReader} from '../src/cli/generateProject'

import {describe, expect, it} from 'bun:test'
import {join, sep} from 'node:path'

import {planTemplate, replacePlaceholders} from '../src/cli/generateProject'

/**
 * Build an in-memory SourceReader from a flat map of absolutePath → contents.
 * `list(dir)` returns every key under that dir prefix; `read(path)` returns
 * the recorded contents encoded as UTF-8 bytes (the production SourceReader
 * contract).
 */
function makeReader(files: Record<string, string | Uint8Array>): SourceReader {
  const encoder = new TextEncoder()
  return {
    list: dir =>
      Object.keys(files).filter(p => p === dir || p.startsWith(`${dir}${sep}`)),
    read: async path => {
      if (!(path in files)) {
        throw new Error(`SourceReader: no file at ${path}`)
      }
      const value = files[path]
      return typeof value === 'string'
        ? encoder.encode(value)
        : (value as Uint8Array)
    },
  }
}

const decoder = new TextDecoder()
function decodePlan(
  plan: FileWrite[]
): Array<{destPath: string; contents: string}> {
  return plan.map(({destPath, contents}) => ({
    destPath,
    contents: decoder.decode(contents),
  }))
}

const TARGET = `${sep}out`
const SRC = `${sep}src`

describe('planTemplate', () => {
  it('writes a single plain file at its mirrored destination', async () => {
    const reader = makeReader({
      [join(SRC, 'hello.txt')]: 'hi',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(decodePlan(plan)).toEqual([
      {destPath: join(TARGET, 'hello.txt'), contents: 'hi'},
    ])
  })

  it('substitutes placeholders only when at least one matches', async () => {
    const reader = makeReader({
      [join(SRC, 'templated.txt')]: 'hello {{NAME}}',
      [join(SRC, 'plain.txt')]: 'no replacement here',
      [join(SRC, 'unmatched.txt')]: 'has {{UNKNOWN}} only',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {'{{NAME}}': 'world'},
      reader,
    })

    const byPath = Object.fromEntries(
      decodePlan(plan).map(w => [w.destPath, w.contents])
    )
    expect(byPath[join(TARGET, 'templated.txt')]).toBe('hello world')
    expect(byPath[join(TARGET, 'plain.txt')]).toBe('no replacement here')
    // {{UNKNOWN}} doesn't match any replacement key, so the file isn't treated
    // as a template and contents pass through untouched.
    expect(byPath[join(TARGET, 'unmatched.txt')]).toBe('has {{UNKNOWN}} only')
  })

  it('renames -keep files: name.ext-keep → name.ext', async () => {
    const reader = makeReader({
      [join(SRC, '.gitignore-keep')]: 'node_modules\n',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(decodePlan(plan)).toEqual([
      {destPath: join(TARGET, '.gitignore'), contents: 'node_modules\n'},
    ])
  })

  it('renames -keep directories: .vscode-keep/ → .vscode/', async () => {
    const reader = makeReader({
      [join(SRC, '.vscode-keep', 'extensions.json')]: '{}',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(decodePlan(plan)).toEqual([
      {destPath: join(TARGET, '.vscode', 'extensions.json'), contents: '{}'},
    ])
  })

  it('applies both renames when a -keep file lives inside a -keep dir', async () => {
    const reader = makeReader({
      [join(SRC, '.claude-keep', 'settings.json-keep')]: '{"x":1}',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(decodePlan(plan)).toEqual([
      {destPath: join(TARGET, '.claude', 'settings.json'), contents: '{"x":1}'},
    ])
  })

  it('lets later source dirs win on destination-path conflict', async () => {
    const SrcA = `${sep}srcA`
    const SrcB = `${sep}srcB`
    const reader = makeReader({
      [join(SrcA, 'conflict.txt')]: 'from A',
      [join(SrcB, 'conflict.txt')]: 'from B',
    })

    const plan = await planTemplate({
      sources: [SrcA, SrcB],
      targetDir: TARGET,
      replacements: {},
      reader,
    })

    expect(decodePlan(plan)).toEqual([
      {destPath: join(TARGET, 'conflict.txt'), contents: 'from B'},
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
      [join(SRC, 'package.json')]: '{"name":"create-new-app-template-fullstack"}',
      [join(SRC, 'README.md')]: 'No placeholders here.',
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {
        'create-new-app-template-fullstack': 'my-app',
      },
      reader,
    })

    const byPath = Object.fromEntries(
      decodePlan(plan).map(w => [w.destPath, w.contents])
    )
    expect(byPath[join(TARGET, 'package.json')]).toBe('{"name":"my-app"}')
    expect(byPath[join(TARGET, 'README.md')]).toBe('No placeholders here.')
  })

  it('passes binary bytes through unchanged (no UTF-8 round trip)', async () => {
    // Build a Uint8Array that is NOT valid UTF-8: includes 0x00, 0xFF, and a
    // lone continuation byte (0x80). A naive text round-trip mangles these.
    const binary = new Uint8Array([
      0x00, 0xff, 0x80, 0x1a, 0x45, 0xdf, 0xa3, 0xff, 0xfe, 0x00, 0x10, 0x20,
    ])
    const reader = makeReader({
      [join(SRC, 'asset.bin')]: binary,
    })

    const plan = await planTemplate({
      sources: [SRC],
      targetDir: TARGET,
      replacements: {'{{NAME}}': 'world'},
      reader,
    })

    expect(plan).toHaveLength(1)
    const written = plan[0]
    expect(written?.destPath).toBe(join(TARGET, 'asset.bin'))
    expect(Array.from(written?.contents ?? [])).toEqual(Array.from(binary))
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
