import type {KnipConfig} from 'knip'

// biome-ignore lint/style/noDefaultExport: Knip expects a default export
export default {
  entry: [
    /**
     * Any `.ts` files called from a package.json script are automatically
     * included here via Knip's Bun plugin (i.e. dev, dev:all, etc.).
     */
    'devServer.ts',
    'src/app.tsx',
    'src/routes/__root.tsx',
  ],

  // Files to care about within the dependency graph of entry files above.
  project: ['**/*.{ts,tsx,css,html}'],
  compilers: {
    css: (text: string) => {
      /**
       * Converts @import and @plugin directives into JS-style imports
       *
       * @(?:import|plugin) - Matches either @import or @plugin
       * \s+                - Matches one or more whitespace characters
       * ["']([^"']+)["']   - Captures the dependency name inside quotes
       */
      return [...text.matchAll(/@(?:import|plugin)\s+["']([^"']+)["']/g)]
        .map(([_, dep]) => `import "${dep}";`)
        .join('\n')
    },
  },
  ignore: [
    // Used to inform Bun about static file imports images, audio, & video.
    'src/bun-env.d.ts',
  ],
  ignoreBinaries: ['biome'],
  ignoreDependencies: ['@tanstack/router-cli'],
  ignoreIssues: {
    // Shadcn components may have multiple exports.
    'src/components/ui/**': ['exports'],
  },
  includeEntryExports: true,

  // Plugins - https://knip.dev/reference/plugins
  biome: true,
  bun: true,
  tailwind: true,
  'tanstack-router': true,
  typescript: true,
} satisfies KnipConfig
