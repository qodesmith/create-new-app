import {defineConfig} from 'drizzle-kit'

// biome-ignore lint/style/noDefaultExport: Drizzle expects a default export
export default defineConfig({
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'data.db',
  },
})
