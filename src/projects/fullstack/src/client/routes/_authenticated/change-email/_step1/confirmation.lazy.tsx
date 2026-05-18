import {createLazyFileRoute} from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/change-email/_step1/confirmation'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {changeEmailConfirmed} = Route.useRouteContext()

  return (
    <div className="p-2 text-center">
      {changeEmailConfirmed ? (
        <>
          <p className="inline sm:block">
            Thank you for confirming your intent to change your email address.
          </p>
          <p className="inline pl-1.5 sm:block">
            An email is being sent to the new address to verify and complete the
            change.
          </p>
        </>
      ) : (
        <p>This change email confirmation has expired.</p>
      )}
    </div>
  )
}
