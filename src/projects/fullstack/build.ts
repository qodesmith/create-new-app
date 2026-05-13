import type {StaticAsset} from './src/server/hono/staticAssetsFromBuildRoutes'

import {build} from 'bun'
import {readdirSync, rmSync} from 'node:fs'
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
const buildAssets = await build({
  entrypoints: ['./src/server/bunServer.ts'],
  target: 'bun',
  outdir,
  plugins: [bunPluginTailwind],
  minify: true,
  splitting: true,
  sourcemap: 'linked', // Ensure production errors trace back to unminified code.
  define: {'process.env.NODE_ENV': JSON.stringify('production')},

  /**
   * Sharp is a C++ image processing library with platform-specific native
   * addons (.node files). Bun's bundler can't inline native addons, so bundling
   * sharp would produce broken imports. Marking it external keeps the
   * require/import as-is, letting Bun resolve it from node_modules at runtime
   * where the correct prebuilt binary is available.
   */
  external: ['sharp'],
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
const newHtml = indexHtml
  .replaceAll('src="./', 'src="/')
  .replaceAll('href="./', 'href="/')
await Bun.write(`${outdir}/index.html`, newHtml)

// Aggregate static assets that are not protected.
const assets = buildAssets.outputs.reduce<StaticAsset[]>((acc, output) => {
  const {base: fileName} = path.parse(output.path)

  // Avoid creating a Hono route for excluded assets - Bun already serves these.
  if (!excludedAssetsFromHonoServer.includes(fileName)) {
    acc.push({fileName, isProtected: false})
  }

  return acc
}, [])

/**
 * Assets found in this folder are referenced by explicit path in client code
 * (i.e. not imported as a string). These are protected from direct access by
 * the Hono server using a few tricks - i.e. the application can request the
 * asset but manually navigating to the same url will fail.
 */
const dirents = readdirSync('./src/server/assets', {
  recursive: true,
  withFileTypes: true,
})

for (const {name, parentPath} of dirents) {
  // Avoid creating a Hono route for excluded assets - Bun already serves these.
  if (excludedAssetsFromHonoServer.includes(name)) continue

  const file = Bun.file(path.resolve(parentPath, name))

  // Copy the protected asset to the destination folder.
  await Bun.write(path.resolve(outdir, name), file)

  // Aggregate static assets that are protected.
  assets.push({fileName: name, isProtected: true})
}

// Write the data to a file so we can create Hono routes for them later.
await Bun.write(`${outdir}/assets.json`, JSON.stringify(assets, null, 2))
