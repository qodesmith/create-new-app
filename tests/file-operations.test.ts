import {afterEach, beforeEach, describe, expect, it} from 'bun:test'
import {existsSync, mkdirSync, rmSync} from 'node:fs'
import {join} from 'node:path'

import {
  ensureDir,
  pathExists,
  replacePlaceholders,
} from '../src/utils/file-operations'

const TEST_DIR = join(import.meta.dir, '.test-tmp')

describe('file-operations', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, {recursive: true})
    }
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, {recursive: true})
    }
  })

  describe('ensureDir', () => {
    it('creates directory if not exists', () => {
      const dir = join(TEST_DIR, 'new-dir')
      expect(existsSync(dir)).toBe(false)
      ensureDir(dir)
      expect(existsSync(dir)).toBe(true)
    })

    it('creates nested directories', () => {
      const dir = join(TEST_DIR, 'a', 'b', 'c')
      ensureDir(dir)
      expect(existsSync(dir)).toBe(true)
    })

    it('does nothing if directory exists', () => {
      mkdirSync(TEST_DIR, {recursive: true})
      ensureDir(TEST_DIR) // Should not throw
      expect(existsSync(TEST_DIR)).toBe(true)
    })
  })

  describe('pathExists', () => {
    it('returns true for existing path', () => {
      mkdirSync(TEST_DIR, {recursive: true})
      expect(pathExists(TEST_DIR)).toBe(true)
    })

    it('returns false for non-existing path', () => {
      expect(pathExists(join(TEST_DIR, 'nonexistent'))).toBe(false)
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
})
