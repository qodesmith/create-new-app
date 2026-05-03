export type ProjectType = 'fullstack' | 'client-only' | 'library' | 'vanilla'

export type ProjectOptions = {
  name: string
  type: ProjectType
}
