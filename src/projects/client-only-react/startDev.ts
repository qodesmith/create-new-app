// biome-ignore-all lint/suspicious/noConsole: it's ok here

import type {Subprocess} from 'bun'

import {serve, sleep, spawn} from 'bun'
import {existsSync, rmSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import open from 'open'
import colors from 'picocolors'

if (!existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log(`First run ${colors.cyan('bun install')} to install dependencies`)
  process.exit(1)
}

/**
 * Bun's server will throw an `EADDRINUSE` error if the port is in use. Use this
 * to ensure an available port by auto-incrementing the port value.
 */
async function genDevServerPort(initialPort: number | string) {
  const immediatelyStopConnections = true
  const maxDevPort = 65_535
  let port = +initialPort

  while (port <= maxDevPort) {
    try {
      const server = serve({port, routes: {'/': () => new Response()}})
      await server.stop(immediatelyStopConnections)
      return port
    } catch {
      port++
    }
  }
}

const initialPort = process.env.PORT

if (!initialPort) {
  throw new Error('process.env.PORT is undefined')
}

const resolvedPort = await genDevServerPort(initialPort)

if (resolvedPort !== +initialPort) {
  process.env.PORT = String(resolvedPort)
  console.log(
    colors.yellow(`Port ${initialPort} in use, using ${resolvedPort}`)
  )
}

// ALL_CONNECTIONS is set in the `dev:all` package.json script.
const is0000 = process.env.ALL_CONNECTIONS === 'true'
const localhost = `http://${is0000 ? '0.0.0.0' : 'localhost'}:${resolvedPort}`

/**
 * An object with functions that prepend stdout and stderr sub processes with
 * colored names, helping us to distinguish the output.
 */
const stdoutPrefixNameFxns = {
  server: () => colors.bold(colors.magenta('[server]')),
  routes: () => colors.bold(colors.blue('[routes]')),
}

/**
 * Removes clear-screen ANSI codes from a string.
 */
function cleanAnsiCodes(text: string): string {
  // Regular expression to match common clear-screen ANSI escape codes:
  // \x1b[2J - Erase screen
  // \x1b[H  - Cursor home
  // \x1b[3J - Erase saved lines
  // biome-ignore lint/suspicious/noControlCharactersInRegex: it's ok here
  const ansiEscapeCodesRegex = /\x1b\[2J|\x1b\[H|\x1b\[3J/g

  return text.replace(ansiEscapeCodesRegex, '')
}

/**
 * Returns a promise that resolves when the `routeTree.gen.ts` file is created.
 */
async function waitForRouteTree() {
  const routeTreePath = path.resolve(
    import.meta.dirname,
    './src/routeTree.gen.ts'
  )

  return new Promise<void>(resolve => {
    const interval = setInterval(() => {
      if (existsSync(routeTreePath)) {
        clearInterval(interval)
        void resolve()
      }
    }, 250)
  })
}

/**
 * Returns a promise that resolves when the dev server is running on localhost.
 * Use a for-loop to avoid a stack overflow.
 */
async function checkLocalhost(): Promise<void> {
  const maxAttempts = 50
  const delayMs = 200

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(localhost)
      if (res.ok) return
    } catch {
      // Server not ready yet.
    }

    await sleep(delayMs)
  }

  throw new Error(
    `The dev server failed to start after ${(maxAttempts * delayMs) / 1000}s`
  )
}

let hasLoggedProcessIds = false
const stdoutLines: string[] = []

/**
 * Reads a single stream (stdout OR stderr) from a subprocess, prepends a
 * colored prefix label, and writes it to the main process stdout. Buffers
 * output until process ids have been logged.
 */
async function handleStd(
  subProcess: Subprocess<'ignore', 'pipe', 'pipe'>,
  stdType: 'stdout' | 'stderr',
  stdoutPrefixName: keyof typeof stdoutPrefixNameFxns
) {
  const nameFxn = stdoutPrefixNameFxns[stdoutPrefixName]

  for await (const chunk of subProcess[stdType]) {
    const text = cleanAnsiCodes(new TextDecoder().decode(chunk))
    let line = `${nameFxn()} ${text}`

    if (!line.endsWith('\n')) {
      line += '\n'
    }

    if (text.length) {
      if (hasLoggedProcessIds) {
        // Regular piping.
        process.stdout.write(line)
      } else {
        /**
         * Store content being written to the console from subprocesses so we
         * can write it to the console AFTER logging the process ids.
         */
        stdoutLines.push(line)
      }
    }
  }
}

/**
 * Convenience wrapper that calls `handleStd` for both stdout and stderr of a
 * subprocess in parallel.
 */
async function pipeConsoleOutput(
  subProcess: Subprocess<'ignore', 'pipe', 'pipe'>,
  stdoutPrefixName: keyof typeof stdoutPrefixNameFxns
) {
  return Promise.all([
    handleStd(subProcess, 'stdout', stdoutPrefixName),
    handleStd(subProcess, 'stderr', stdoutPrefixName),
  ])
}

const tanstackTmpPath = path.resolve(import.meta.dirname, './.tanstack')
const serverPath = path.resolve(import.meta.dirname, './bunServer.ts')
const spawnOptions = {
  stdout: 'pipe',
  stderr: 'pipe',
  // biome-ignore lint/style/useNamingConvention: env var
  env: {FORCE_COLOR: '1', ...process.env},
  onExit: killAllTheThings,
} satisfies Parameters<typeof spawn>[1]

// Store all subprocesses so we have access to kill them.
const subprocesses: Partial<
  Record<'watchRoutesProc' | 'serverProc', Subprocess<'ignore', 'pipe', 'pipe'>>
> = {}

let killed = false

/**
 * A final "cleanup" function that:
 * - Removes the TanStack temporary folder
 * - Kills all subprocess
 * - Kills the parent process
 * - Kills the current process.
 */
function killAllTheThings() {
  if (killed) return
  killed = true

  // Remove the temp TanStack files when the process exits.
  rmSync(tanstackTmpPath, {recursive: true, force: true})

  // Kill all the subprocesses.
  Object.values(subprocesses).forEach(subproc => {
    subproc.kill()
  })

  // Kill the parent process (i.e. `bun run dev`, the package.json script)
  process.kill(process.ppid, 'SIGTERM')

  // Kill this process.
  process.exit()
}

process.on('SIGINT', () => {
  // Kill all processes when the user force-quits (i.e. CTRL + C) the process.
  killAllTheThings()
})

process.on('SIGTERM', () => {
  // Kill all processes when the user quits the process.
  killAllTheThings()
})

process.on('exit', () => {
  // Kill all processes when the main one exits.
  killAllTheThings()
})

/**
 * This sub process will create the `routeTree.gen.ts` file and watch for
 * changes to route files.
 */
const watchRoutesProc = spawn(['bun', 'tsr', 'watch'], spawnOptions)
subprocesses.watchRoutesProc = watchRoutesProc
void pipeConsoleOutput(watchRoutesProc, 'routes')

// Wait until the `routeTree.gen.ts` file exists before proceeding.
await waitForRouteTree()

// This sub process starts the dev server.
const serverProc = spawn(['bun', '--hot', serverPath], spawnOptions)
subprocesses.serverProc = serverProc
void pipeConsoleOutput(serverProc, 'server')

// Open the site in a browser once localhost is ready.
void checkLocalhost().then(() => open(localhost))

// For debug purposes, you can log all process ids associated with this script.
// console.table([
//   {pid: process.ppid, 'Process Name': 'parent process (bun run dev)'},
//   {pid: process.pid, 'Process Name': 'current process (startDev.ts)'},
//   ...Object.entries(subprocesses).map(([name, subproc]) => {
//     return {pid: subproc.pid, 'Process Name': name}
//   }),
// ])

hasLoggedProcessIds = true
process.stdout.write(stdoutLines.join(''))
