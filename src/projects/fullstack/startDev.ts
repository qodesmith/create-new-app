// biome-ignore-all lint/suspicious/noConsole: it's ok here

import type {Subprocess} from 'bun'

import {spawn} from 'bun'
import {existsSync, rmSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import open from 'open'
import colors from 'picocolors'

import {localhost} from './src/server/constants'

if (!existsSync(path.join(process.cwd(), 'node_modules'))) {
  console.log(`First run ${colors.cyan('bun install')} to install dependencies`)
  process.exit()
}

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
    './src/client/routeTree.gen.ts'
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
 */
async function checkLocalhost(): Promise<void> {
  return fetch(localhost)
    .then(res => (res.ok ? undefined : checkLocalhost()))
    .catch(checkLocalhost)
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
const serverPath = path.resolve(
  import.meta.dirname,
  './src/server/bunServer.ts'
)
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

/**
 * A final "cleanup" function that:
 * - Removes the TanStack temporary folder
 * - Kills all subprocess
 * - Kills the parent process
 * - Kills the current process.
 */
function killAllTheThings() {
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
