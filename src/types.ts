export type ProjectType = 'fullstack' | 'client-only'

export type ProjectOptions = {
  name: string
  type: ProjectType
}
export type TemplateReplacements = Record<string, string>
