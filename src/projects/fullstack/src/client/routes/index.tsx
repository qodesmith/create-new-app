import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <section>
      <h1>{{PROJECT_NAME}}</h1>
      <p className="text-sm italic">Brought to you by Create New App</p>
    </section>
  )
}
