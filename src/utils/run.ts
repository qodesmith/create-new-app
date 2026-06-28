import {$} from 'bun'

export class ShellCommandError extends Error {
  readonly cmd: string
  readonly cwd: string
  readonly exitCode: number
  readonly stderr: string

  constructor(args: {
    cmd: string
    cwd: string
    exitCode: number
    stderr: string
  }) {
    super(`Command "${args.cmd}" failed with exit code ${args.exitCode}`)
    this.name = 'ShellCommandError'
    this.cmd = args.cmd
    this.cwd = args.cwd
    this.exitCode = args.exitCode
    this.stderr = args.stderr
  }
}

/**
 * Runs a shell command via Bun's `$`. Throws ShellCommandError on non-zero
 * exit. The caller is responsible for surfacing the error to the user and
 * deciding whether to exit the process.
 */
export async function run(cmd: string, cwd: string): Promise<void> {
  const {stderr, exitCode} = await $`${{raw: cmd}}`.cwd(cwd).nothrow().quiet()

  if (exitCode !== 0) {
    throw new ShellCommandError({
      cmd,
      cwd,
      exitCode,
      stderr: stderr.toString(),
    })
  }
}
