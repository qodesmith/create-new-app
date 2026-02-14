/** biome-ignore-all lint/suspicious/noConsole: it's ok */
/**
 * NOTE:
 *
 * This file isn't meant to be run locally. It's only meant to be run manually
 * inside the Docker container created during the build. It should be copied to
 * the same directory as the schema files.
 */

const port = '4983'

console.log('Once the process is started, open another terminal and type:')
console.log(`fly proxy ${port}:${port} --app my-app`)
console.log('-'.repeat(80))

////////////
// STEP 1 //
////////////

// SSH into the fly machine & start drizzle studio:
// - fly ssh console --app my-app
// - cd drizzleStudio (you MUST be in this directory to proceed!)
// - bun drizzleStudio.ts

////////////
// STEP 2 //
////////////

// In another terminal tab, proxy the port and pick the machine:
// - fly proxy 4983:4983 --app my-app --select

////////////
// STEP 3 //
////////////

// Connect to drizzle studio in your browser:
// https://local.drizzle.studio/?host=localhost&port=4983

/**
 * NOTE:
 * `--host ::` is using IPv6 because that is what fly is using!!!
 * IPv4 would look like `--host 0.0.0.0`
 */
Bun.spawn(
  [
    'bunx',
    'drizzle-kit',
    'studio',
    '--config',
    '/app/drizzleStudio/drizzle.config.js',
    '--host',
    '::',
    '--port',
    port,
  ],

  /**
   * inherit - Shares stdio with the parent process
   * ignore  - Discards all output silently
   * pipe    - (default) Captures output in returned buffer (no display)
   */
  {stdio: ['inherit', 'inherit', 'inherit']}
)
