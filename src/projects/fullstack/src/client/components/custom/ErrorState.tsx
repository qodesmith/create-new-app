import type {ReactNode} from 'react'

export function ErrorState({
  title,
  content,
  actions,
}: {
  title: string
  content?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mx-auto w-md pt-20 text-center">
      {/* CIRCLE EXCLAMATION */}
      <div className="relative inline-block rounded-full border-3 p-4 text-red-500">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-2xl">
          !
        </span>
      </div>

      <h2 className="py-3 font-bold text-lg">{title}</h2>

      {content && <div className="pb-3 text-zinc-400">{content}</div>}

      {actions && <div className="pb-3">{actions}</div>}
    </div>
  )
}
