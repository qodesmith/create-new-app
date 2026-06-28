import type {BunPlugin} from 'bun'

import {watch as fsWatch} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {compile, optimize} from '@tailwindcss/node'
import {Scanner} from '@tailwindcss/oxide'

/**
 * Fast skip for CSS files that don't use Tailwind. Anything containing one of
 * these directives goes through the Tailwind compiler; everything else is
 * returned untouched so Bun's native CSS loader handles it.
 */
const TAILWIND_DIRECTIVE =
  /@import\s+["']tailwindcss["']|@theme|@apply|@tailwind\b/

/**
 * File extensions the Tailwind scanner reads candidates from. Used to filter
 * the dev-mode source watcher so we only invalidate the CSS when a file that
 * could contain class names actually changes.
 */
const SCAN_EXTENSIONS = /\.(?:tsx?|jsx?|html|md|mdx|svelte|vue|astro)$/

/**
 * Paths the source watcher should ignore. `dist` and `.tanstack` are written
 * by our own build/dev tooling, and watching `node_modules` would flood us
 * with irrelevant events.
 */
const IGNORED_PATH =
  /(?:^|\/)(?:node_modules|\.git|dist|\.tanstack|\.cache)(?:\/|$)/

/**
 * Bun plugin that replaces `bun-plugin-tailwind` with a direct binding to the
 * official Tailwind v4 node packages. Because this plugin uses the
 * `tailwindcss` package from the project's own dependencies (not a bundled
 * copy), new utilities ship the same day Tailwind releases them.
 */
function bunPluginTailwind(): BunPlugin {
  const minify = process.env.NODE_ENV === 'production'
  const isDev = process.env.NODE_ENV !== 'production'

  /**
   * Bun's plugin API has no `watchFiles` equivalent (esbuild does), so the
   * bundler only re-runs `onLoad` when the CSS file itself changes. That means
   * adding a new utility class in a `.tsx` after dev-server startup never
   * re-runs the Tailwind scanner, and the new class is missing from the CSS.
   *
   * Workaround: track every CSS file we compile, watch the project for source
   * changes, and rewrite the CSS file's contents (bytes-identical) whenever a
   * scannable source file changes. The rewrite triggers a real FS modify event
   * (mtime-only `utimes` doesn't fire macOS FSEvents), so Bun's HMR re-invokes
   * `onLoad`, which re-runs the Tailwind scanner and picks up the new class.
   */
  const compiledCssFiles = new Set<string>()
  /**
   * Cache the original on-disk source per CSS file so we rewrite the exact
   * bytes the user has on disk. This keeps git status clean even if the
   * rewrite races with an unrelated edit.
   */
  const cssSourceCache = new Map<string, string>()
  let watcherStarted = false
  let touchTimer: ReturnType<typeof setTimeout> | null = null

  async function rewriteCompiledCss() {
    await Promise.all(
      Array.from(compiledCssFiles).map(async cssPath => {
        const cached = cssSourceCache.get(cssPath)
        const source = cached ?? (await Bun.file(cssPath).text())
        await Bun.write(cssPath, source)
      })
    )
  }

  function ensureSourceWatcher() {
    if (watcherStarted || !isDev) return
    watcherStarted = true

    fsWatch(
      process.cwd(),
      {recursive: true},
      (_event, filename: string | null) => {
        if (!filename) return
        if (IGNORED_PATH.test(filename)) return
        if (!SCAN_EXTENSIONS.test(filename)) return

        // Debounce: editors often emit multiple events per save.
        if (touchTimer) clearTimeout(touchTimer)
        touchTimer = setTimeout(() => {
          void rewriteCompiledCss()
        }, 25)
      }
    )
  }

  return {
    name: 'bun-plugin-tailwind',
    setup(build) {
      ensureSourceWatcher()

      build.onLoad({filter: /\.css$/}, async ({path: filePath}) => {
        const source = await Bun.file(filePath).text()
        if (!TAILWIND_DIRECTIVE.test(source)) return

        if (isDev) {
          compiledCssFiles.add(filePath)
          cssSourceCache.set(filePath, source)
        }

        const base = path.dirname(filePath)
        const compiler = await compile(source, {
          from: filePath,
          base,
          shouldRewriteUrls: true,
          onDependency: () => {},
        })

        /**
         * Mirrors @tailwindcss/vite: the scanner needs both the compiler's
         * auto-detection root and any explicit `@source` directives. Passing
         * only `compiler.sources` yields an empty set, so generated CSS would
         * drop every utility that isn't in a @source file.
         */
        const rootSources = (() => {
          if (compiler.root === 'none') return []
          if (compiler.root === null) {
            return [{base: process.cwd(), pattern: '**/*', negated: false}]
          }
          return [{...compiler.root, negated: false}]
        })()
        const sources = rootSources.concat(compiler.sources)

        const candidates = new Scanner({sources}).scan()
        let css = compiler.build(candidates)
        if (minify) css = optimize(css, {minify: true}).code

        return {contents: css, loader: 'css'}
      })
    },
  }
}

// biome-ignore lint/style/noDefaultExport: Bun expects a default export
export default bunPluginTailwind()
