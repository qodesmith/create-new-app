import {build} from 'bun'
import {rmSync} from 'node:fs'

import bunPluginTailwind from './bunPluginTailwind'

rmSync('dist', {recursive: true, force: true})

/**
 * This will build the dev server and client together. Bun discovers client
 * assets by traversing the dependency graph from bunServer.ts → index.html.
 */
await build({
  entrypoints: ['./bunServer.ts'],
  target: 'bun',
  outdir: './dist',
  plugins: [bunPluginTailwind],
  minify: true,
  splitting: true,
  sourcemap: 'linked', // Ensure production errors trace back to unminified code.
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
})

/**
 * By NOT specifying `publicPath: '/'` in the build process above, asset urls in
 * the index.html file will be relative, such as `./asset.js`. We want them to
 * be absolute so we manually change those imports.
 */
const indexHtml = await Bun.file('./dist/index.html').text()
const newHtml = indexHtml
  .replaceAll('src="./', 'src="/')
  .replaceAll('href="./', 'href="/')

await Bun.write('./dist/index.html', newHtml)
