#!/usr/bin/env node

import {spawn, spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
import process from 'node:process'

const bunCheck = spawnSync('bun', ['--version'], {stdio: 'ignore'})
if (bunCheck.error || bunCheck.status !== 0) {
  /**
   * process.platform reflects the Node runtime, not the kernel underneath -
   * exactly what we want here. Git Bash / MSYS use the Windows Node binary
   * and report 'win32', while WSL uses the Linux Node binary and reports
   * 'linux'. The bash one-liner works in WSL, so this branch correctly
   * routes only "real" Windows shells to the PowerShell installer. (The
   * 'os' module's release()/version() could detect WSL specifically, but
   * we don't need that distinction.)
   */
  const installCmd =
    process.platform === 'win32'
      ? 'powershell -c "irm bun.sh/install.ps1 | iex"'
      : 'curl -fsSL https://bun.sh/install | bash'

  process.stderr.write(
    [
      '',
      'create-new-app requires Bun to run.',
      '',
      'Install Bun: https://bun.sh',
      `  ${installCmd}`,
      '',
      'Then re-run the command.',
      '',
      '',
    ].join('\n')
  )
  process.exit(1)
}

const cliEntry = resolve(import.meta.dirname, '..', 'src', 'cli', 'index.ts')

const child = spawn('bun', [cliEntry, ...process.argv.slice(2)], {
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})
