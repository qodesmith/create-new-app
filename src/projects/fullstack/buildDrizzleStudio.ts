import {build} from 'bun'
import process from 'node:process'

// Defined in the Dockerfile
if (process.env.IN_DOCKER_BUILD !== 'true') {
  throw new Error('buildDrizzleStudio.ts should only be run in a Docker build')
}

/**
 * This file is run during the Docker build.
 *
 * See drizzleStudio.ts for instructions on how to view drizzle studio in
 * production.
 */
await build({
  entrypoints: [
    // All database schemas should be added here.
    './src/server/db/schema/appSchema.ts',
    './src/server/db/schema/authSchema.ts',

    // Keep the Drizzle config last.
    './src/server/db/drizzle.config.ts',
  ],
  target: 'bun',
  outdir: '/app/drizzleStudio',
  splitting: false,
})
