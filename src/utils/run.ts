import {$} from 'bun'
import process from 'node:process'

/**
 * Uses Bun's `$` shell to execute commands. It will log stderr to the console
 * and exit the process if the `exitCode` is not 0.
 */
export async function run(cmd: string, cwd: string) {
  const {stderr, exitCode} = await $`${{raw: cmd}}`.cwd(cwd).nothrow().quiet()

  if (exitCode !== 0) {
    // biome-ignore lint/suspicious/noConsole: this is intentional
    console.error(stderr.toString())
    process.exit(exitCode)
  }
}
