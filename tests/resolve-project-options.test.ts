import type {CliOptions} from '../src/cli/options-parser'
import type {Prompter} from '../src/cli/resolveProjectOptions'
import type {ProjectType} from '../src/types'

import {describe, expect, it, mock} from 'bun:test'

import {resolveProjectOptions} from '../src/cli/resolveProjectOptions'

/**
 * Build a scripted Prompter whose methods return the supplied answers and
 * record their calls so each test can assert which prompts ran.
 */
function makePrompter(answers: {
  name?: string
  type?: ProjectType
}): Prompter & {
  promptName: ReturnType<typeof mock>
  promptType: ReturnType<typeof mock>
} {
  const promptName = mock(async (_initial?: string) => answers.name ?? 'unused')
  const promptType = mock(
    async (_initial?: ProjectType) => answers.type ?? 'fullstack'
  )
  return {promptName, promptType}
}

const baseCliOptions: CliOptions = {
  help: false,
  version: false,
  yes: false,
}

describe('resolveProjectOptions (--yes path)', () => {
  it('returns options when name and type are provided and valid', async () => {
    const prompter = makePrompter({})
    const result = await resolveProjectOptions(
      {...baseCliOptions, yes: true, name: 'my-app', type: 'fullstack'},
      prompter
    )
    expect(result).toEqual({name: 'my-app', type: 'fullstack'})
    expect(prompter.promptName).not.toHaveBeenCalled()
    expect(prompter.promptType).not.toHaveBeenCalled()
  })

  it('defaults type to fullstack when only name is provided', async () => {
    const prompter = makePrompter({})
    const result = await resolveProjectOptions(
      {...baseCliOptions, yes: true, name: 'my-app'},
      prompter
    )
    expect(result).toEqual({name: 'my-app', type: 'fullstack'})
  })
})

describe('resolveProjectOptions (interactive path)', () => {
  it('skips the name prompt when name is on argv and valid', async () => {
    const prompter = makePrompter({type: 'client-only'})
    const result = await resolveProjectOptions(
      {...baseCliOptions, name: 'my-app'},
      prompter
    )
    expect(result).toEqual({name: 'my-app', type: 'client-only'})
    expect(prompter.promptName).not.toHaveBeenCalled()
    expect(prompter.promptType).toHaveBeenCalledTimes(1)
  })

  it('skips the type prompt when type is on argv and valid', async () => {
    const prompter = makePrompter({name: 'my-app'})
    const result = await resolveProjectOptions(
      {...baseCliOptions, type: 'fullstack'},
      prompter
    )
    expect(result).toEqual({name: 'my-app', type: 'fullstack'})
    expect(prompter.promptName).toHaveBeenCalledTimes(1)
    expect(prompter.promptType).not.toHaveBeenCalled()
  })

  it('skips both prompts when both are on argv and valid', async () => {
    const prompter = makePrompter({})
    const result = await resolveProjectOptions(
      {...baseCliOptions, name: 'my-app', type: 'client-only'},
      prompter
    )
    expect(result).toEqual({name: 'my-app', type: 'client-only'})
    expect(prompter.promptName).not.toHaveBeenCalled()
    expect(prompter.promptType).not.toHaveBeenCalled()
  })

  it('prompts for both when neither is on argv', async () => {
    const prompter = makePrompter({name: 'prompted-name', type: 'client-only'})
    const result = await resolveProjectOptions(baseCliOptions, prompter)
    expect(result).toEqual({name: 'prompted-name', type: 'client-only'})
    expect(prompter.promptName).toHaveBeenCalledTimes(1)
    expect(prompter.promptType).toHaveBeenCalledTimes(1)
  })

  it('prompts for name with the invalid value pre-filled when argv name is invalid', async () => {
    const prompter = makePrompter({name: 'corrected-name', type: 'fullstack'})
    const result = await resolveProjectOptions(
      {...baseCliOptions, name: 'BAD-NAME', type: 'fullstack'},
      prompter
    )
    expect(result.name).toBe('corrected-name')
    expect(prompter.promptName).toHaveBeenCalledWith('BAD-NAME')
    expect(prompter.promptType).not.toHaveBeenCalled()
  })

  it('prompts for type when argv type is not a valid ProjectType', async () => {
    const prompter = makePrompter({type: 'fullstack'})
    const result = await resolveProjectOptions(
      // The CliOptions type is `ProjectType | undefined`, but at runtime an
      // arbitrary --type value can flow through. The cast simulates that.
      {...baseCliOptions, name: 'my-app', type: 'nonsense' as ProjectType},
      prompter
    )
    expect(result).toEqual({name: 'my-app', type: 'fullstack'})
    expect(prompter.promptName).not.toHaveBeenCalled()
    expect(prompter.promptType).toHaveBeenCalledWith('nonsense')
  })
})
