import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ensureDir,
  pathExists,
  isDirEmpty,
  replacePlaceholders,
} from '../src/utils/file-operations'

const TEST_DIR = join(import.meta.dir, '.test-tmp')

describe('file-operations', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true })
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
      mkdirSync(TEST_DIR, { recursive: true })
      ensureDir(TEST_DIR) // Should not throw
      expect(existsSync(TEST_DIR)).toBe(true)
    })
  })

  describe('pathExists', () => {
    it('returns true for existing path', () => {
      mkdirSync(TEST_DIR, { recursive: true })
      expect(pathExists(TEST_DIR)).toBe(true)
    })

    it('returns false for non-existing path', () => {
      expect(pathExists(join(TEST_DIR, 'nonexistent'))).toBe(false)
    })
  })

  describe('isDirEmpty', () => {
    it('returns true for empty directory', () => {
      mkdirSync(TEST_DIR, { recursive: true })
      expect(isDirEmpty(TEST_DIR)).toBe(true)
    })

    it('returns false for non-empty directory', () => {
      mkdirSync(TEST_DIR, { recursive: true })
      writeFileSync(join(TEST_DIR, 'file.txt'), 'content')
      expect(isDirEmpty(TEST_DIR)).toBe(false)
    })

    it('returns true for non-existing directory', () => {
      expect(isDirEmpty(join(TEST_DIR, 'nonexistent'))).toBe(true)
    })
  })

  describe('replacePlaceholders', () => {
    it('replaces single placeholder', () => {
      const result = replacePlaceholders('Hello {{NAME}}!', { NAME: 'World' })
      expect(result).toBe('Hello World!')
    })

    it('replaces multiple placeholders', () => {
      const result = replacePlaceholders(
        '{{GREETING}} {{NAME}}!',
        { GREETING: 'Hello', NAME: 'World' }
      )
      expect(result).toBe('Hello World!')
    })

    it('replaces same placeholder multiple times', () => {
      const result = replacePlaceholders(
        '{{X}} + {{X}} = 2{{X}}',
        { X: '1' }
      )
      expect(result).toBe('1 + 1 = 21')
    })

    it('leaves unmatched placeholders', () => {
      const result = replacePlaceholders('{{KNOWN}} {{UNKNOWN}}', { KNOWN: 'yes' })
      expect(result).toBe('yes {{UNKNOWN}}')
    })
  })
})
