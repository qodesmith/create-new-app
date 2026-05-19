import {createLazyFileRoute} from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/change-email/_step2/verification'
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <p className="p-2 text-center">
      This change email verification has expired.
    </p>
  )
}
