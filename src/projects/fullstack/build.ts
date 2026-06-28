import type {StaticAsset} from './src/server/hono/staticAssetsFromBuildRoutes'

import {$, build, Glob} from 'bun'
import {rmSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import bunPluginTailwind from './bunPluginTailwind'

const inDockerBuild = process.env.IN_DOCKER_BUILD === 'true' // Defined in the Dockerfile
const excludedAssetsFromHonoServer: string[] = [
  'bunServer.js',
  'index.html',
].flatMap(name => [name, `${name}.map`])

if (!inDockerBuild) {
  rmSync('dist', {recursive: true, force: true})
}

const outdir = inDockerBuild ? '/dist' : 'dist'

/**
 * This will build both the server and client sides of the application. All
 * dependencies will get built and placed in a single directory.
 */
const bunBuildAssets = await build({
  entrypoints: ['./src/server/bunServer.ts'],
  target: 'bun',
  outdir,
  plugins: [bunPluginTailwind],
  minify: true,
  splitting: true,
  sourcemap: 'linked', // Ensure production errors trace back to unminified code.
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
})

/**
 * This will create a cliTools.js file that can be run by SSH'ing into the
 * machine and executing manually.
 */
await build({
  entrypoints: ['./src/server/db/cliTools.ts'],
  target: 'bun',
  outdir: `${outdir}/tools`,
  splitting: false,
  sourcemap: 'linked',
})

/**
 * By NOT specifying `publicPath: '/'` in the build process above, asset urls in
 * the index.html file will be relative, such as `./asset.js`. In addition,
 * bunServer.js imports of those assets will also be relative.
 *
 * We want to keep the imports relative for bunServer.js but not index.html, so
 * we manually change those imports to be absolute in index.html.
 */
const indexHtml = await Bun.file(`${outdir}/index.html`).text()
const newHtml = new HTMLRewriter()
  .on('[src]', {
    element(el) {
      const src = el.getAttribute('src')
      if (src?.startsWith('./')) el.setAttribute('src', `/${src.slice(2)}`)
    },
  })
  .on('[href]', {
    element(el) {
      const href = el.getAttribute('href')
      if (href?.startsWith('./')) el.setAttribute('href', `/${href.slice(2)}`)
    },
  })
  .transform(indexHtml)
await Bun.write(`${outdir}/index.html`, newHtml)

const staticAssets = bunBuildAssets.outputs.reduce<StaticAsset[]>(
  (acc, output) => {
    const fileName = path.basename(output.path)

    // Avoid creating a Hono route for excluded assets - Bun already serves these.
    if (!excludedAssetsFromHonoServer.includes(fileName)) {
      acc.push({relativePath: fileName, isProtected: false})
    }

    return acc
  },
  []
)

/**
 * Assets found in this folder are referenced by explicit path in client code
 * (i.e. not imported as a string). These are protected from direct access by
 * the Hono server using a few tricks - i.e. the application can request the
 * asset but manually navigating to the same url will fail.
 *
 * Folder structure under assets-protected is mirrored into the output at
 * `<outdir>/assets/...` and served by Hono at `/assets/...`.
 */
const protectedAssetsRoot = path.resolve('./src/server/assets-protected')

const protectedAssetPathsSet = new Set(
  new Glob('./src/server/assets-protected/**/*').scanSync({
    absolute: true,
    dot: true,
    onlyFiles: true,
  })
)

const gitIgnoredAssetsSet = await (async () => {
  try {
    const protectedAssetPaths = Array.from(protectedAssetPathsSet).join(' ')
    const gitRes =
      await $`git check-ignore ${{raw: protectedAssetPaths}}`.text()
    return new Set(gitRes.split('\n').filter(Boolean))
  } catch {
    return new Set<string>()
  }
})()

const protectedAssetsToProcess =
  protectedAssetPathsSet.difference(gitIgnoredAssetsSet)

/**
 * Copy protected assets under <outdir>/assets in parallel, bounded to 64
 * in-flight writes to avoid exhausting file descriptors.
 *
 * IMPORTANT: `.values()` returns a SINGLE stateful iterator object that all 64
 * workers below share. Each `for...of` advances this one iterator via
 * `.next()`, so every path is handed to exactly one worker.
 *
 * Contrast: iterating the Set directly (`for (const p of protectedAssetsToProcess)`)
 * would call `Set[Symbol.iterator]()` per worker, creating 64 independent
 * iterators - and every worker would process every file 64 times.
 */
const protectedAssetsIterator = protectedAssetsToProcess.values()

/**
 * 64 worker loops, NOT 64 copies of the same loop. Each worker pulls the next
 * path from the shared `protectedAssetsIterator` whenever its previous
 * `Bun.write` resolves, giving a sliding window of up to 64 concurrent writes
 * (not batches of 64 - fast workers never wait for slow ones). When the
 * iterator is exhausted, each worker's `for...of` exits naturally.
 *
 * JS is single-threaded, so `iterator.next()` and `staticAssets.push` are
 * atomic between awaits - no races possible.
 *
 * 64 is an arbitrary cap on simultaneous I/O writers - tune it as needed. It
 * sits well under the standard file-descriptor soft limits (macOS: 256,
 * Linux: typically 1024), leaving plenty of headroom for the rest of the
 * process.
 */
const protectedAssetWorkers = Array.from({length: 64}, async () => {
  for (const protectedAssetPath of protectedAssetsIterator) {
    const relativePath = path.relative(protectedAssetsRoot, protectedAssetPath)

    await Bun.write(
      path.resolve(outdir, 'assets', relativePath),
      Bun.file(protectedAssetPath)
    )

    staticAssets.push({relativePath, isProtected: true})
  }
})

await Promise.all(protectedAssetWorkers)

// Write the data to a file so we can create Hono routes for them later.
await Bun.write(`${outdir}/assets.json`, JSON.stringify(staticAssets, null, 2))
